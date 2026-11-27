// Synced data is a plain snapshot of the state; merges compare each side with the last synced snapshot.
const LANES = ["completed", "inProgress", "upcoming", "prs"];
const TRANSIENT = ["fetching"];

export const EMPTY = Object.freeze({ repos: [], output: "", trackerSort: "priority", rows: [], tracker: [] });

const clone = (value) => JSON.parse(JSON.stringify(value));
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
export const sameData = same;

function strip(item) {
  const copy = { ...item };
  TRANSIENT.forEach((key) => delete copy[key]);
  return copy;
}

export function snapshot(state) {
  return clone({
    repos: state.repos,
    output: state.output,
    trackerSort: state.trackerSort,
    rows: LANES.flatMap((lane) => state.sections[lane].map((row) => ({ ...strip(row), lane }))),
    tracker: state.tracker.map(strip),
  });
}

export const hasContent = (data) => !same(normalize(data), EMPTY);

export function normalize(data) {
  const items = (list) => (Array.isArray(list) ? list.filter((x) => x && typeof x === "object" && typeof x.id === "string") : []);
  return {
    repos: Array.isArray(data?.repos) ? data.repos.filter((r) => typeof r === "string") : [],
    output: typeof data?.output === "string" ? data.output : "",
    trackerSort: typeof data?.trackerSort === "string" ? data.trackerSort : EMPTY.trackerSort,
    rows: items(data?.rows).filter((row) => LANES.includes(row.lane)),
    tracker: items(data?.tracker),
  };
}

// Writes `data` into the live state, keeping each row's object so open editors stay bound to it.
export function applySnapshot(state, data) {
  const fresh = clone(data);
  const live = new Map([...Object.values(state.sections).flat(), ...state.tracker].map((obj) => [obj.id, obj]));
  const adopt = (item) => {
    const obj = live.get(item.id);
    if (!obj) return item;
    for (const key of Object.keys(obj)) if (!(key in item) && !TRANSIENT.includes(key)) delete obj[key];
    return Object.assign(obj, item);
  };
  state.repos = fresh.repos;
  state.output = fresh.output;
  state.trackerSort = fresh.trackerSort;
  for (const lane of LANES) {
    state.sections[lane] = fresh.rows.filter((row) => row.lane === lane).map(({ lane: _, ...row }) => adopt(row));
  }
  state.tracker = fresh.tracker.map(adopt);
}

const pick = (base, local, remote) => (same(local, base) ? remote : local);

function mergeItem(base, local, remote) {
  const out = {};
  for (const key of new Set([...Object.keys(local), ...Object.keys(remote)])) {
    const value = pick(base[key], local[key], remote[key]);
    if (value !== undefined) out[key] = value;
  }
  return out;
}

// Order follows whichever side reordered the items both had; the other side's new items keep their neighbour.
function mergeOrder(base, local, remote, keep) {
  const ids = (list) => list.map((x) => x.id);
  const shared = (list, other) => ids(list).filter((id) => other.some((x) => x.id === id));
  const localMoved = !same(shared(local, base), shared(base, local));
  const [primary, secondary] = localMoved ? [ids(local), ids(remote)] : [ids(remote), ids(local)];
  const order = primary.filter((id) => keep.has(id));
  secondary.forEach((id, i) => {
    if (!keep.has(id) || order.includes(id)) return;
    const before = secondary.slice(0, i).reverse().find((prev) => order.includes(prev));
    order.splice(before ? order.indexOf(before) + 1 : 0, 0, id);
  });
  return order;
}

function mergeList(base, local, remote) {
  const byId = (list) => new Map(list.map((x) => [x.id, x]));
  const [b, l, r] = [byId(base), byId(local), byId(remote)];
  const out = new Map();
  for (const id of new Set([...l.keys(), ...r.keys()])) {
    const [bi, li, ri] = [b.get(id), l.get(id), r.get(id)];
    if (li && ri) out.set(id, mergeItem(bi ?? {}, li, ri));
    // Deleted on one side: gone, unless the other side changed it since.
    else if (li && (!bi || !same(li, bi))) out.set(id, li);
    else if (ri && (!bi || !same(ri, bi))) out.set(id, ri);
  }
  return mergeOrder(base, local, remote, out).map((id) => out.get(id));
}

// The last change wins per field of each item; edits to an item the other side deleted bring it back.
export function merge3(base, local, remote) {
  const [b, l, r] = [normalize(base ?? EMPTY), normalize(local), normalize(remote)];
  return {
    repos: pick(b.repos, l.repos, r.repos),
    output: pick(b.output, l.output, r.output),
    trackerSort: pick(b.trackerSort, l.trackerSort, r.trackerSort),
    rows: mergeList(b.rows, l.rows, r.rows),
    tracker: mergeList(b.tracker, l.tracker, r.tracker),
  };
}
