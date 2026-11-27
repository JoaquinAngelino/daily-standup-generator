import { test } from "node:test";
import assert from "node:assert/strict";
import { EMPTY, merge3, snapshot, applySnapshot } from "../src/merge.js";

const data = (over = {}) => ({ ...EMPTY, ...over });
const ids = (list) => list.map((x) => x.id);

test("snapshot flattens lanes and drops transient fields; applySnapshot restores them", () => {
  const row = { id: "a", ref: "1", fetching: true };
  const state = {
    repos: ["o/r"],
    output: "x",
    trackerSort: "eta",
    trackerFilter: "work",
    sections: { completed: [], inProgress: [row], upcoming: [], prs: [] },
    tracker: [{ id: "t", title: "T" }],
  };
  const snap = snapshot(state);
  assert.deepEqual(snap.rows, [{ id: "a", ref: "1", lane: "inProgress" }]);
  assert.equal("trackerFilter" in snap, false);

  snap.rows[0].lane = "completed";
  snap.rows[0].title = "Moved";
  applySnapshot(state, snap);
  assert.deepEqual(state.sections.inProgress, []);
  assert.equal(state.sections.completed[0], row, "keeps the live object");
  assert.deepEqual(row, { id: "a", ref: "1", fetching: true, title: "Moved" });
  assert.equal(state.trackerFilter, "work");
});

test("merge3 takes each side's changes per field", () => {
  const base = data({ output: "o", tracker: [{ id: "t", title: "T", note: "" }] });
  const local = data({ output: "mine", tracker: [{ id: "t", title: "T", note: "n" }] });
  const remote = data({ output: "o", tracker: [{ id: "t", title: "T2", note: "" }] });
  const out = merge3(base, local, remote);
  assert.equal(out.output, "mine");
  assert.deepEqual(out.tracker, [{ id: "t", title: "T2", note: "n" }]);
});

test("merge3 drops deletions unless the other side edited the item", () => {
  const base = data({ tracker: [{ id: "a", n: 1 }, { id: "b", n: 1 }] });
  const local = data({ tracker: [{ id: "b", n: 1 }] });
  const remote = data({ tracker: [{ id: "a", n: 1 }, { id: "b", n: 2 }] });
  assert.deepEqual(merge3(base, local, remote).tracker, [{ id: "b", n: 2 }]);

  const edited = data({ tracker: [{ id: "a", n: 9 }, { id: "b", n: 1 }] });
  assert.deepEqual(ids(merge3(base, local, edited).tracker), ["a", "b"]);
});

test("merge3 keeps both sides' additions and the side that reordered", () => {
  const base = data({ tracker: [{ id: "a" }, { id: "b" }, { id: "c" }] });
  const local = data({ tracker: [{ id: "c" }, { id: "a" }, { id: "b" }] });
  const remote = data({ tracker: [{ id: "a" }, { id: "x" }, { id: "b" }, { id: "c" }] });
  assert.deepEqual(ids(merge3(base, local, remote).tracker), ["c", "a", "x", "b"]);
});

test("merge3 moves a row between lanes and drops fields the move removed", () => {
  const base = data({ rows: [{ id: "a", lane: "upcoming", eta: "2026-01-01", reportedOn: "x" }] });
  const local = data({ rows: [{ id: "a", lane: "inProgress", eta: "2026-01-01" }] });
  assert.deepEqual(merge3(base, local, base).rows, [{ id: "a", lane: "inProgress", eta: "2026-01-01" }]);
});

test("merge3 with nothing synced yet keeps both devices' data", () => {
  const local = data({ tracker: [{ id: "l" }] });
  const remote = data({ repos: ["o/r"], output: "remote", tracker: [{ id: "r" }] });
  const out = merge3(null, local, remote);
  assert.deepEqual(out.repos, ["o/r"]);
  assert.equal(out.output, "remote");
  assert.deepEqual(ids(out.tracker).sort(), ["l", "r"]);
});
