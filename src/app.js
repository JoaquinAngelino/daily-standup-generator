import {
  ISSUE_SECTIONS,
  SECTION_TITLES,
  PROJECTED_STATUSES,
  parseRepoList,
  parseRef,
  formatDate,
  formatRange,
  formatProjected,
  reviewStatus,
  findIssueRef,
  node,
  issueNode,
  toMarkdown,
  markdownToHtml,
  markdownToSlackText,
} from "./lib.js";
import { createClient, GitHubError } from "./github.js";
import { t, setLanguage, applyTranslations } from "./i18n.js";

const STATE_KEY = "dsg.state.v1";
const TOKEN_KEY = "dsg.token";
const LANG_KEY = "dsg.lang";
const SECTIONS = [...ISSUE_SECTIONS, "prs"];

const $ = (sel) => document.querySelector(sel);

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

const uid = () => Math.random().toString(36).slice(2, 10);
const defaultRepo = () => state.repos[0] ?? "";

const ROW_FACTORIES = {
  completed: () => ({ id: uid(), ref: "", repo: defaultRepo(), etaFrom: "", etaTo: "", projDate: "", projStatus: "", subtasks: [] }),
  inProgress: () => ({ id: uid(), ref: "", repo: defaultRepo(), eta: "", subtasks: [] }),
  upcoming: () => ({ id: uid(), ref: "", repo: defaultRepo(), eta: "", subtasks: [] }),
  prs: () => ({ id: uid(), ref: "", repo: defaultRepo() }),
};

const SUBTASK_FACTORIES = {
  completed: () => ({ id: uid(), desc: "", etaFrom: "", etaTo: "", projDate: "", projStatus: "" }),
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
    sections[key] = Array.isArray(rows) ? rows : [];
  }
  return {
    repos: Array.isArray(saved.repos) ? saved.repos : [],
    output: typeof saved.output === "string" ? saved.output : "",
    sections,
  };
}

const state = loadState();
const rowErrors = new Map();
const statuses = new Map();
let bannerText = null;

function save() {
  write(local, STATE_KEY, JSON.stringify(state));
}

function getToken() {
  return read(session, TOKEN_KEY) || read(local, TOKEN_KEY) || "";
}

function el(tag, props = {}, children = []) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (v == null) continue;
    if (k === "class") e.className = v;
    else if (k.startsWith("on")) e.addEventListener(k.slice(2), v);
    else if (k in e) e[k] = v;
    else e.setAttribute(k, v);
  }
  e.append(...children.filter(Boolean));
  return e;
}

function field(obj, key, labelKey, { type = "text", options, placeholder, className = "" } = {}) {
  let control;
  if (options) {
    control = el(
      "select",
      { onchange: () => { obj[key] = control.value; save(); } },
      options.map(([value, label]) => el("option", { value, textContent: label })),
    );
    control.value = obj[key] ?? "";
  } else {
    control = el("input", {
      type,
      value: obj[key] ?? "",
      placeholder,
      spellcheck: false,
      oninput: () => { obj[key] = control.value; save(); },
    });
  }
  return el("label", { class: `field ${className}${type === "date" ? " f-date" : ""}` }, [el("span", { textContent: t(labelKey) }), control]);
}

function repoField(row) {
  if (!row.repo) row.repo = defaultRepo();
  const repos = [...state.repos];
  if (row.repo && !repos.includes(row.repo)) repos.push(row.repo);
  if (!repos.length) repos.push("");
  return field(row, "repo", "repo", { options: repos.map((r) => [r, r || "—"]), className: "f-repo" });
}

function dateFields(key, obj) {
  if (key === "prs") return [];
  if (key === "completed") {
    return [
      field(obj, "etaFrom", "etaFrom", { type: "date" }),
      field(obj, "etaTo", "etaTo", { type: "date" }),
      field(obj, "projDate", "projected", { type: "date" }),
      field(obj, "projStatus", "projectedStatus", { options: PROJECTED_STATUSES.map((s) => [s, s || "—"]) }),
    ];
  }
  return [field(obj, "eta", "eta", { type: "date" })];
}

function removeButton(list, item) {
  return el("button", {
    type: "button",
    class: "icon-btn",
    title: t("remove"),
    "aria-label": t("remove"),
    textContent: "×",
    onclick: () => {
      list.splice(list.indexOf(item), 1);
      rowErrors.delete(item.id);
      save();
      render();
    },
  });
}

function renderSubtasks(key, row) {
  row.subtasks ??= [];
  return el("div", { class: "subtasks" }, [
    ...row.subtasks.map((sub) =>
      el("div", { class: "subtask", "data-id": sub.id }, [
        field(sub, "desc", "subtask", { placeholder: t("description"), className: "f-desc" }),
        ...dateFields(key, sub),
        removeButton(row.subtasks, sub),
      ]),
    ),
    el("button", {
      type: "button",
      class: "link-btn",
      textContent: t("addSubtask"),
      onclick: () => {
        const sub = SUBTASK_FACTORIES[key]();
        row.subtasks.push(sub);
        save();
        render();
        focusItem(sub.id);
      },
    }),
  ]);
}

function renderRow(key, row) {
  const isPr = key === "prs";
  const error = rowErrors.get(row.id);
  return el("article", { class: error ? "card has-error" : "card", "data-id": row.id }, [
    el("div", { class: "card-fields" }, [
      field(row, "ref", isPr ? "pr" : "issue", { placeholder: t("refPlaceholder"), className: "f-ref" }),
      repoField(row),
      ...dateFields(key, row),
      removeButton(state.sections[key], row),
    ]),
    isPr ? null : renderSubtasks(key, row),
    error ? el("p", { class: "row-error", textContent: error() }) : null,
  ]);
}

function render() {
  for (const key of SECTIONS) {
    const list = $(`[data-section="${key}"] .rows`);
    list.replaceChildren(...state.sections[key].map((row) => renderRow(key, row)));
  }
}

function focusItem(id) {
  document.querySelector(`[data-id="${id}"] input`)?.focus();
}

function addRow(key) {
  const row = ROW_FACTORIES[key]();
  state.sections[key].push(row);
  save();
  render();
  focusItem(row.id);
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

function detailNodes(key, obj) {
  if (key === "completed") {
    return [
      node("ETA", formatRange(obj.etaFrom, obj.etaTo)),
      node("Projected Overall Feature Delivery (Alpha)", formatProjected(obj.projDate, obj.projStatus)),
    ];
  }
  return [node("ETA", formatDate(obj.eta))];
}

function subtaskNodes(key, row) {
  return (row.subtasks ?? [])
    .map((sub) => ({ desc: sub.desc.trim(), details: detailNodes(key, sub) }))
    .filter(({ desc, details }) => desc || details.some((d) => d.value))
    .map(({ desc, details }) => node("Subtask description", desc || "—", details));
}

async function buildPrItem(ref, client, loadIssue) {
  const pr = await client.pull(ref);
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
  if (key === "prs") return buildPrItem(ref, client, loadIssue);
  const issue = await loadIssue(ref);
  return issueNode(issue, [...detailNodes(key, row), ...subtaskNodes(key, row)]);
}

function setBusy(busy) {
  const button = $("#generate");
  button.disabled = busy;
  button.textContent = t(busy ? "generating" : "generate");
  $("main").setAttribute("aria-busy", String(busy));
}

async function generate() {
  rowErrors.clear();
  setBanner(null);
  const token = getToken();
  if (!token) {
    setBanner(() => t("errNoToken"));
    $("#settings").open = true;
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
      if (row.ref?.trim()) jobs.push({ key, row, result: buildItem(key, row, client, loadIssue) });
    }
  }
  const results = await Promise.allSettled(jobs.map((job) => job.result));
  setBusy(false);

  const blocks = SECTIONS.map((key) => ({ title: SECTION_TITLES[key], items: [] }));
  let unauthorized = false;
  results.forEach((res, i) => {
    const { key, row } = jobs[i];
    if (res.status === "fulfilled") {
      blocks[SECTIONS.indexOf(key)].items.push(res.value);
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
}

function changeRemember() {
  const token = getToken();
  if (token) storeToken(token);
}

function forgetToken() {
  write(local, TOKEN_KEY, null);
  write(session, TOKEN_KEY, null);
  checkToken();
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

function changeLanguage(lang) {
  write(local, LANG_KEY, setLanguage(lang));
  applyTranslations();
  render();
  statuses.forEach((_, sel) => paintStatus(sel));
  setBanner(bannerText);
}

function init() {
  const lang = setLanguage(read(local, LANG_KEY) || (navigator.language?.startsWith("es") ? "es" : "en"));
  $("#language").value = lang;

  for (const key of SECTIONS) {
    if (!state.sections[key].length) state.sections[key].push(ROW_FACTORIES[key]());
  }
  $("#repos").value = state.repos.join("\n");
  $("#remember").checked = !read(session, TOKEN_KEY);
  $("#output").value = state.output;
  $("#settings").open = !getToken() || !state.repos.length;

  $("#language").addEventListener("change", (e) => changeLanguage(e.target.value));
  $("#token").addEventListener("change", saveToken);
  $("#token").addEventListener("keydown", (e) => { if (e.key === "Enter") saveToken(); });
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
    section.querySelector("[data-add]").addEventListener("click", () => addRow(section.dataset.section));
  });

  applyTranslations();
  render();
  checkToken();
}

init();
