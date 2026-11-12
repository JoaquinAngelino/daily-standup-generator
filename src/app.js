import {
  ISSUE_SECTIONS,
  SECTION_TITLES,
  NEXT_STAGE,
  advanceRow,
  parseRepoList,
  parseRef,
  formatDate,
  formatRange,
  reviewStatus,
  findIssueRef,
  node,
  issueNode,
  toMarkdown,
  markdownToHtml,
  markdownToSlackText,
  TRACKER_STATUSES,
  STANDUP_LANE,
  taskToRow,
  sameRef,
} from "./lib.js";
import { createClient, GitHubError } from "./github.js";
import { t, setLanguage, getLanguage, applyTranslations } from "./i18n.js";
import { TONE, $, reducedMotion, el, icon, iconButton, scrollToItem } from "./ui.js";
import { initTracker, renderTracker } from "./tracker.js";

const STATE_KEY = "dsg.state.v1";
const TOKEN_KEY = "dsg.token";
const LANG_KEY = "dsg.lang";
const SECTIONS = [...ISSUE_SECTIONS, "prs"];

function getStorage(kind) {
  try {
    const s = window[kind];
    s.getItem("");
    return s;
  } catch {
    return null;
  }
}
const local = getStorage("localStorage");
const session = getStorage("sessionStorage");

function read(store, key) {
  try {
    return store?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

function write(store, key, value) {
  try {
    if (value == null) store?.removeItem(key);
    else store?.setItem(key, value);
  } catch {
    /* storage full or blocked: the app still works for this visit */
  }
}

function todayIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const uid = () => Math.random().toString(36).slice(2, 10);
const defaultRepo = () => state.repos[0] ?? "";

const ROW_FACTORIES = {
  completed: () => ({ id: uid(), ref: "", repo: defaultRepo(), etaFrom: "", etaTo: "", subtasks: [] }),
  inProgress: () => ({ id: uid(), ref: "", repo: defaultRepo(), eta: "", subtasks: [] }),
  upcoming: () => ({ id: uid(), ref: "", repo: defaultRepo(), eta: "", subtasks: [] }),
  prs: () => ({ id: uid(), ref: "", repo: defaultRepo() }),
};

const SUBTASK_FACTORIES = {
  completed: () => ({ id: uid(), desc: "", etaFrom: "", etaTo: "" }),
  inProgress: () => ({ id: uid(), desc: "", eta: "" }),
  upcoming: () => ({ id: uid(), desc: "", eta: "" }),
};

function loadState() {
  let saved = {};
  try {
    saved = JSON.parse(read(local, STATE_KEY) ?? "{}") ?? {};
  } catch {
    saved = {};
  }
  const sections = {};
  for (const key of SECTIONS) {
    const rows = saved.sections?.[key];
    sections[key] = Array.isArray(rows) ? rows.filter((r) => r && typeof r === "object") : [];
    sections[key].forEach((r) => delete r.fetching);
  }
  const tracker = Array.isArray(saved.tracker) ? saved.tracker.filter((r) => r && typeof r === "object") : [];
  tracker.forEach((r) => {
    delete r.fetching;
    if (!TRACKER_STATUSES.includes(r.status)) r.status = "todo";
  });
  return {
    repos: Array.isArray(saved.repos) ? saved.repos : [],
    output: typeof saved.output === "string" ? saved.output : "",
    sections,
    tracker,
  };
}

const state = loadState();
const rowErrors = new Map();
const statuses = new Map();
let bannerText = null;
let pressedId = null;

function save() {
  write(local, STATE_KEY, JSON.stringify(state));
}

function getToken() {
  return read(session, TOKEN_KEY) || read(local, TOKEN_KEY) || "";
}

const isSpent = (row) => Boolean(row.reportedOn) && row.reportedOn < todayIso();

function field(obj, key, labelKey, { type = "text", options, placeholder, className = "", hideLabel = false, onCommit } = {}) {
  let control;
  const focusKey = `${obj.id}:${key}`;
  if (options) {
    control = el(
      "select",
      {
        "data-focus-key": focusKey,
        onchange: () => {
          obj[key] = control.value;
          save();
          onCommit?.();
        },
      },
      options.map(([value, label]) => el("option", { value, textContent: label })),
    );
    control.value = obj[key] ?? "";
  } else {
    control = el("input", {
      type,
      value: obj[key] ?? "",
      placeholder,
      spellcheck: false,
      "data-focus-key": focusKey,
      oninput: () => {
        obj[key] = control.value;
        save();
      },
    });
  }
  return el("label", { class: `field ${className}` }, [
    el("span", { class: hideLabel ? "sr-only" : "field-label", textContent: t(labelKey) }),
    control,
  ]);
}

function dateInput(obj, key, labelKey) {
  const input = el("input", {
    type: "date",
    value: obj[key] ?? "",
    class: obj[key] ? null : "is-empty",
    "aria-label": t(labelKey),
    "data-focus-key": `${obj.id}:${key}`,
    oninput: () => {
      obj[key] = input.value;
      input.classList.toggle("is-empty", !input.value);
      save();
    },
    onclick: () => {
      try {
        input.showPicker?.();
      } catch {
        /* picker unavailable: typing still works */
      }
    },
  });
  return input;
}

function metaGroup(labelKey, controls) {
  return el("span", { class: "meta-group" }, [el("span", { class: "meta-label", textContent: t(labelKey) }), ...controls]);
}

function metaFields(key, obj) {
  if (key === "prs") return [];
  if (key === "completed") {
    return [
      metaGroup("eta", [
        dateInput(obj, "etaFrom", "etaFrom"),
        el("span", { class: "meta-sep" }, [icon("arrow")]),
        dateInput(obj, "etaTo", "etaTo"),
      ]),
    ];
  }
  return [metaGroup("eta", [dateInput(obj, "eta", "eta")])];
}

function repoSelect(key, row) {
  if (!row.repo) row.repo = defaultRepo();
  const repos = [...state.repos];
  if (row.repo && !repos.includes(row.repo)) repos.push(row.repo);
  if (repos.length < 2) return null;
  const select = el(
    "select",
    {
      class: "repo-select",
      "aria-label": t("repo"),
      "data-focus-key": `${row.id}:repo`,
      onchange: () => {
        row.repo = select.value;
        save();
        commitRef(key, row);
      },
    },
    repos.map((r) => el("option", { value: r, textContent: r })),
  );
  select.value = row.repo;
  return select;
}

function removeItem(list, item) {
  list.splice(list.indexOf(item), 1);
  rowErrors.delete(item.id);
  save();
  render();
}

function moveRow(from, row) {
  const to = NEXT_STAGE[from];
  const list = state.sections[from];
  list.splice(list.indexOf(row), 1);
  const moved = advanceRow(row, to);
  state.sections[to].push(moved);
  pressedId = moved.id;
  save();
  render();
  scrollToItem(moved.id);
  setTimeout(() => {
    pressedId = null;
  }, 800);
}

function addRow(key) {
  const row = ROW_FACTORIES[key]();
  state.sections[key].push(row);
  save();
  render();
  const input = document.querySelector(`[data-id="${row.id}"] .tape-input`);
  input?.scrollIntoView({ block: "nearest", behavior: reducedMotion() ? "auto" : "smooth" });
  input?.focus({ preventScroll: true });
}

function titleState(key, row) {
  const error = rowErrors.get(row.id);
  if (error) return { text: error(), cls: "item-title is-error" };
  if (row.title) return { text: row.title, cls: row.fetching ? "item-title is-loading" : "item-title" };
  if (row.fetching) return { text: t("fetching"), cls: "item-title is-muted" };
  if (!row.ref?.trim()) return { text: t(key === "prs" ? "titleEmptyPr" : "titleEmpty"), cls: "item-title is-muted" };
  return { text: getToken() ? "" : t("titleNoToken"), cls: "item-title is-muted" };
}

function formatDay(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat(getLanguage(), { weekday: "short", day: "numeric", month: "short" }).format(new Date(y, m - 1, d));
}

function renderSubtasks(key, row) {
  return el(
    "div",
    { class: "subtasks" },
    row.subtasks.map((sub) =>
      el("div", { class: "subtask", "data-id": sub.id }, [
        field(sub, "desc", "description", { placeholder: t("description"), className: "f-desc", hideLabel: true }),
        ...metaFields(key, sub),
        iconButton("x", t("remove"), () => removeItem(row.subtasks, sub)),
      ]),
    ),
  );
}

function addSubtaskButton(key, row) {
  return el("button", {
    type: "button",
    class: "btn-text btn-small",
    onclick: () => {
      const sub = SUBTASK_FACTORIES[key]();
      row.subtasks.push(sub);
      save();
      render();
      document.querySelector(`[data-id="${sub.id}"] input`)?.focus();
    },
  }, [icon("plus"), el("span", { textContent: t("subtask") })]);
}

function renderRow(key, row) {
  const isPr = key === "prs";
  if (!isPr) row.subtasks ??= [];
  const spent = isSpent(row);
  const classes = ["item", rowErrors.has(row.id) && "is-error", spent && "is-spent", row.id === pressedId && "is-pressed"]
    .filter(Boolean)
    .join(" ");

  const tapeInput = el("input", {
    class: "tape-input",
    value: row.ref ?? "",
    placeholder: "#",
    autocomplete: "off",
    spellcheck: false,
    "aria-label": t(isPr ? "pr" : "issue"),
    "data-focus-key": `${row.id}:ref`,
    oninput: (e) => {
      row.ref = e.target.value;
      save();
    },
    onchange: () => commitRef(key, row),
    onkeydown: (e) => {
      if (e.key !== "Enter") return;
      e.preventDefault();
      const isLast = state.sections[key].at(-1) === row;
      e.target.blur();
      if (isLast && row.ref.trim()) addRow(key);
    },
  });

  const title = titleState(key, row);
  const next = NEXT_STAGE[key];
  const actions = [];
  if (next) {
    actions.push(
      el("button", { type: "button", class: "btn", onclick: () => moveRow(key, row) }, [
        el("span", { class: `swatch swatch--${TONE[next]}`, "aria-hidden": "true" }),
        el("span", { textContent: t("moveTo", { stage: t(next) }) }),
      ]),
    );
  }
  if (key === "completed") {
    actions.push(el("button", { type: "button", class: "btn", textContent: t("clear"), onclick: () => removeItem(state.sections[key], row) }));
  }
  const removeX = key === "completed" ? null : iconButton("x", t("remove"), () => removeItem(state.sections[key], row));
  const status = isPr && row.status && !rowErrors.has(row.id)
    ? el("span", { class: "mark", textContent: row.status })
    : null;

  const meta = [...metaFields(key, row), isPr ? null : addSubtaskButton(key, row)].filter(Boolean);

  return el("article", { class: classes, "data-id": row.id }, [
    el("div", { class: "item-main" }, [
      el("label", { class: "tape item-tape" }, [tapeInput]),
      el("div", { class: "item-body" }, [
        el("p", { class: "item-headline" }, [el("span", { class: title.cls, textContent: title.text }), status]),
        spent ? el("p", { class: "item-note", textContent: t("reportedOn", { date: formatDay(row.reportedOn) }) }) : null,
        repoSelect(key, row),
      ]),
      actions.length ? el("div", { class: "item-actions" }, actions) : null,
      removeX ? el("div", { class: "item-x" }, [removeX]) : null,
      meta.length ? el("div", { class: "item-meta" }, meta) : null,
    ]),
    isPr ? null : renderSubtasks(key, row),
  ]);
}

function renderLane(key) {
  const lane = $(`[data-section="${key}"]`);
  const rows = state.sections[key];
  const one = key === "prs" ? "countPr" : "countIssue";
  const many = key === "prs" ? "countPrs" : "countIssues";
  lane.querySelector(".lane-count").textContent = rows.length ? t(rows.length === 1 ? one : many, { count: rows.length }) : "";

  const tools = lane.querySelector(".lane-tools");
  tools.replaceChildren();
  const spentCount = key === "completed" ? rows.filter(isSpent).length : 0;
  if (spentCount) {
    tools.append(
      el("button", {
        type: "button",
        class: "btn",
        textContent: t("clearReported", { count: spentCount }),
        onclick: () => {
          state.sections.completed = state.sections.completed.filter((r) => !isSpent(r));
          save();
          render();
        },
      }),
    );
  }

  const list = lane.querySelector(".rows");
  list.replaceChildren(
    ...(rows.length
      ? rows.map((row) => renderRow(key, row))
      : [el("p", { class: "lane-empty", textContent: t(key === "prs" ? "emptyPrs" : "emptyIssues") })]),
  );
}

function render() {
  const active = document.activeElement;
  const focusKey = active?.dataset?.focusKey;
  let selection = null;
  try {
    if (focusKey && active.selectionStart != null) selection = [active.selectionStart, active.selectionEnd];
  } catch {
    selection = null;
  }

  SECTIONS.forEach(renderLane);
  renderTracker();

  if (focusKey) {
    const target = document.querySelector(`[data-focus-key="${focusKey}"]`);
    if (target && target !== document.activeElement) {
      target.focus({ preventScroll: true });
      try {
        if (selection) target.setSelectionRange(...selection);
      } catch {
        /* not a text control */
      }
    }
  }
}

function setStatus(sel, text, tone = "") {
  statuses.set(sel, { text, tone });
  paintStatus(sel);
}

function paintStatus(sel) {
  const { text, tone } = statuses.get(sel);
  const target = $(sel);
  target.textContent = text();
  target.dataset.tone = tone;
}

function setBanner(text) {
  bannerText = text;
  const banner = $("#banner");
  banner.hidden = !text;
  banner.textContent = text ? text() : "";
}

function describeError(err, ref = "") {
  if (!(err instanceof GitHubError)) return err.message;
  switch (err.status) {
    case 0: return t("errNetwork");
    case 401: return t("errUnauthorized");
    case 404: return t("errNotFound", { ref });
    case 429: return t("errRateLimited");
    default: return t("errApi", { message: err.message });
  }
}

// Issues may appear once across the standup issue lanes, PRs once in PR Review, tasks once in the tracker.
function duplicatePlace(key, row, earlierOnly = false) {
  const pools = key === "tracker"
    ? TRACKER_STATUSES.map((s) => [s, state.tracker.filter((task) => task.status === s)])
    : (key === "prs" ? ["prs"] : ISSUE_SECTIONS).map((k) => [k, state.sections[k]]);
  for (const [place, list] of pools) {
    for (const other of list) {
      if (other === row) {
        if (earlierOnly) return null;
      } else if (sameRef(other, row)) return place;
    }
  }
  return null;
}

const duplicateError = (row, place) => () => t("errDuplicate", { ref: row.ref.trim(), place: t(place) });

async function commitRef(key, row) {
  const raw = (row.ref ?? "").trim();
  const ref = parseRef(raw, row.repo);
  rowErrors.delete(row.id);
  delete row.reportedOn;
  if (!raw) {
    row.title = "";
    delete row.status;
  }
  if (ref) {
    row.ref = String(ref.number);
    row.repo = ref.repo;
  }
  save();
  if (!raw) return render();
  if (!ref) {
    rowErrors.set(row.id, () => t("errBadRef"));
    return render();
  }
  const place = duplicatePlace(key, row);
  if (place) {
    rowErrors.set(row.id, duplicateError(row, place));
    return render();
  }
  const token = getToken();
  if (!token) return render();

  row.fetching = true;
  render();
  try {
    const client = createClient(token);
    const item = key === "prs" ? await client.pull(ref) : await client.issue(ref);
    if (row.ref === String(ref.number) && row.repo === ref.repo) {
      row.title = item.title;
      if (key === "prs") row.status = reviewStatus(item);
    }
  } catch (err) {
    row.title = "";
    delete row.status;
    rowErrors.set(row.id, () => describeError(err, raw));
  } finally {
    delete row.fetching;
    save();
    render();
  }
}

function detailNodes(key, obj) {
  if (key === "completed") {
    return [node("ETA", formatRange(obj.etaFrom, obj.etaTo))];
  }
  return [node("ETA", formatDate(obj.eta))];
}

function subtaskNodes(key, row) {
  return (row.subtasks ?? [])
    .map((sub) => ({ desc: (sub.desc ?? "").trim(), details: detailNodes(key, sub) }))
    .filter(({ desc, details }) => desc || details.some((d) => d.value))
    .map(({ desc, details }) => node("Subtask description", desc || "—", details));
}

async function buildPrItem(row, ref, client, loadIssue) {
  const pr = await client.pull(ref);
  row.title = pr.title;
  row.status = reviewStatus(pr);
  let issue = pr.closingIssuesReferences?.nodes?.[0];
  if (!issue) {
    const issueRef = findIssueRef(pr, ref.repo);
    if (issueRef) issue = await loadIssue(issueRef).catch(() => null);
  }
  return node("PR", `[${pr.number}](${pr.url}) — ${pr.title}`, [
    issue ? issueNode(issue) : null,
    node("Status", reviewStatus(pr)),
  ]);
}

async function buildItem(key, row, client, loadIssue) {
  const ref = parseRef(row.ref, row.repo);
  if (!ref) throw new Error(t("errBadRef"));
  if (key === "prs") return buildPrItem(row, ref, client, loadIssue);
  const issue = await loadIssue(ref);
  row.title = issue.title;
  return issueNode(issue, [...detailNodes(key, row), ...subtaskNodes(key, row)]);
}

function setBusy(busy) {
  const button = $("#generate");
  button.disabled = busy;
  button.classList.toggle("is-busy", busy);
  button.textContent = t(busy ? "generating" : "generate");
  $("#standupView").setAttribute("aria-busy", String(busy));
}

async function generate() {
  rowErrors.clear();
  setBanner(null);
  const token = getToken();
  if (!token) {
    setBanner(() => t("errNoToken"));
    setSettingsOpen(true);
    $("#token").focus();
    render();
    return;
  }

  const client = createClient(token);
  const issueCache = new Map();
  const loadIssue = (ref) => {
    const cacheKey = `${ref.repo}#${ref.number}`.toLowerCase();
    if (!issueCache.has(cacheKey)) issueCache.set(cacheKey, client.issue(ref));
    return issueCache.get(cacheKey);
  };

  setBusy(true);
  const jobs = [];
  for (const key of SECTIONS) {
    for (const row of state.sections[key]) {
      if (!row.ref?.trim()) continue;
      const place = duplicatePlace(key, row, true);
      if (place) rowErrors.set(row.id, duplicateError(row, place));
      else jobs.push({ key, row, result: buildItem(key, row, client, loadIssue) });
    }
  }
  const results = await Promise.allSettled(jobs.map((job) => job.result));
  setBusy(false);

  const blocks = SECTIONS.map((key) => ({ title: SECTION_TITLES[key], items: [] }));
  let unauthorized = false;
  const today = todayIso();
  results.forEach((res, i) => {
    const { key, row } = jobs[i];
    if (res.status === "fulfilled") {
      blocks[SECTIONS.indexOf(key)].items.push(res.value);
      if (key === "completed") row.reportedOn ??= today;
    } else {
      unauthorized ||= res.reason?.status === 401;
      rowErrors.set(row.id, () => describeError(res.reason, row.ref.trim()));
    }
  });

  const markdown = toMarkdown(blocks);
  $("#output").value = markdown;
  state.output = markdown;
  save();
  render();

  if (unauthorized) setBanner(() => t("errUnauthorized"));
  else if (rowErrors.size) {
    const count = rowErrors.size;
    setBanner(() => t("errSummary", { count }));
  }
}

// GitHub gets plain Markdown only: with HTML on the clipboard its editor may convert the paste.
function flashCopied(sel) {
  const button = $(sel);
  if (button.classList.contains("is-copied")) return;
  button.style.width = `${button.offsetWidth}px`;
  button.classList.add("is-copied");
  button.replaceChildren(icon("check"));
  setTimeout(() => {
    button.classList.remove("is-copied");
    button.style.width = "";
    button.textContent = t(button.dataset.i18n);
  }, 300);
}

async function copyOutput(target) {
  const markdown = $("#output").value.trim();
  if (!markdown) return;
  try {
    if (target === "slack" && window.ClipboardItem && navigator.clipboard?.write) {
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/plain": new Blob([markdownToSlackText(markdown)], { type: "text/plain" }),
          "text/html": new Blob([markdownToHtml(markdown)], { type: "text/html" }),
        }),
      ]);
    } else {
      await navigator.clipboard.writeText(target === "slack" ? markdownToSlackText(markdown) : markdown);
    }
    setStatus("#copyStatus", () => t(target === "slack" ? "copiedSlack" : "copiedGithub"), "ok");
    flashCopied(target === "slack" ? "#copySlack" : "#copyGithub");
  } catch {
    setStatus("#copyStatus", () => t("copyFailed"), "error");
  }
}

async function checkToken() {
  const token = getToken();
  const input = $("#token");
  if (token) input.dataset.i18nPlaceholder = "tokenSavedPlaceholder";
  else delete input.dataset.i18nPlaceholder;
  input.placeholder = token ? t("tokenSavedPlaceholder") : "";
  if (!token) return setStatus("#tokenStatus", () => t("tokenNone"));
  setStatus("#tokenStatus", () => t("tokenChecking"));
  try {
    const user = await createClient(token).viewer();
    setStatus("#tokenStatus", () => t("tokenOk", { login: user.login }), "ok");
  } catch (err) {
    setStatus("#tokenStatus", () => describeError(err), "error");
  }
}

function storeToken(value) {
  const remember = $("#remember").checked;
  write(remember ? local : session, TOKEN_KEY, value);
  write(remember ? session : local, TOKEN_KEY, null);
}

function saveToken() {
  const input = $("#token");
  const value = input.value.trim();
  if (!value) return;
  storeToken(value);
  input.value = "";
  checkToken();
  render();
}

function changeRemember() {
  const token = getToken();
  if (token) storeToken(token);
}

function forgetToken() {
  write(local, TOKEN_KEY, null);
  write(session, TOKEN_KEY, null);
  checkToken();
  render();
}

function updateRepos() {
  state.repos = parseRepoList($("#repos").value);
  save();
}

function commitRepos() {
  updateRepos();
  render();
  setStatus(
    "#reposStatus",
    () => (state.repos.length ? t("reposSaved", { count: state.repos.length }) : t("reposEmpty")),
    state.repos.length ? "ok" : "error",
  );
}

const inStandup = (task) => ISSUE_SECTIONS.some((key) => state.sections[key].some((row) => sameRef(row, task)));

function addToStandup(task) {
  const lane = STANDUP_LANE[task.status];
  const row = taskToRow(task, uid());
  state.sections[lane].push(row);
  pressedId = row.id;
  save();
  render();
  setTimeout(() => {
    pressedId = null;
  }, 800);
}

function applyView() {
  const tracker = location.hash === "#tracker";
  document.body.dataset.view = tracker ? "tracker" : "standup";
  $("#standupView").hidden = tracker;
  $(".output").hidden = tracker;
  $("#trackerView").hidden = !tracker;
  document.querySelectorAll(".tab").forEach((tab) => {
    if (tab.getAttribute("href") === (tracker ? "#tracker" : "#standup")) tab.setAttribute("aria-current", "page");
    else tab.removeAttribute("aria-current");
  });
}

function setSettingsOpen(open) {
  $("#settings").hidden = !open;
  $("#settingsToggle").setAttribute("aria-expanded", String(open));
}

function paintToday() {
  $("#today").textContent = new Intl.DateTimeFormat(getLanguage(), { weekday: "long", day: "numeric", month: "long" }).format(new Date());
}

function changeLanguage(lang) {
  write(local, LANG_KEY, setLanguage(lang));
  applyTranslations();
  paintToday();
  render();
  statuses.forEach((_, sel) => paintStatus(sel));
  setBanner(bannerText);
  if (!$("#generate").disabled) setBusy(false);
}

function init() {
  const lang = setLanguage(read(local, LANG_KEY) || (navigator.language?.startsWith("es") ? "es" : "en"));
  $("#language").value = lang;

  $("#repos").value = state.repos.join("\n");
  $("#remember").checked = !read(session, TOKEN_KEY);
  $("#output").value = state.output;
  setSettingsOpen(!getToken() || !state.repos.length);

  $("#settingsToggle").addEventListener("click", () => setSettingsOpen($("#settings").hidden));
  $("#language").addEventListener("change", (e) => changeLanguage(e.target.value));
  $("#token").addEventListener("change", saveToken);
  $("#token").addEventListener("keydown", (e) => {
    if (e.key === "Enter") saveToken();
  });
  $("#remember").addEventListener("change", changeRemember);
  $("#forgetToken").addEventListener("click", forgetToken);
  $("#repos").addEventListener("input", updateRepos);
  $("#repos").addEventListener("change", commitRepos);
  $("#generate").addEventListener("click", generate);
  $("#copySlack").addEventListener("click", () => copyOutput("slack"));
  $("#copyGithub").addEventListener("click", () => copyOutput("github"));
  $("#output").addEventListener("input", (e) => {
    state.output = e.target.value;
    save();
  });
  document.querySelectorAll("[data-section]").forEach((section) => {
    const button = section.querySelector("[data-add]");
    button.prepend(icon("plus"));
    button.addEventListener("click", () => addRow(section.dataset.section));
  });

  initTracker({
    state,
    save,
    render,
    uid,
    today: todayIso,
    defaultRepo,
    hasError: (id) => rowErrors.has(id),
    removeItem,
    commitRef,
    titleState,
    repoSelect,
    inStandup,
    addToStandup,
  });
  window.addEventListener("hashchange", applyView);
  applyView();

  applyTranslations();
  paintToday();
  render();
  checkToken();
}

init();
