import { TRACKER_STAGES, TASK_FLAGS, PRIORITIES, parseRef, daysBetween, sortTasks, prKey, prInfo, mergePrs, reorder } from "./lib.js";
import { t, getLanguage } from "./i18n.js";
import { el, icon, iconButton, scrollToItem, dragHandle } from "./ui.js";

const SORTS = ["priority", "eta", "manual"];
const STATE_TONE = { open: "green", draft: "muted", merged: "purple" };
const FLAG_LABEL = { "": "statusNone" };
const PRIORITY_LABEL = { "": "priorityNone" };

let ctx;
let movedId = null;
let refreshing = false;
let addingPrFor = null;
const prErrors = new Map();

export function initTracker(context) {
  ctx = context;
  document.querySelector("#trackerView").append(
    el("div", { class: "tracker-bar" }),
    ...TRACKER_STAGES.map(laneShell),
  );
}

function laneShell(stage) {
  return el("section", { class: "lane", "data-stage": stage, "aria-labelledby": `tlane-${stage}` }, [
    el("div", { class: "lane-head" }, [
      el("h2", { id: `tlane-${stage}`, class: "lane-title", "data-i18n": stage, textContent: t(stage) }),
      el("span", { class: "lane-count" }),
      el("span", { class: "lane-tools" }),
      el("button", { type: "button", class: "btn-text", onclick: () => addTask(stage) }, [
        icon("plus"),
        el("span", { "data-i18n": "addTask", textContent: t("addTask") }),
      ]),
    ]),
    el("div", { class: "rows" }),
  ]);
}

function addTask(stage) {
  const task = { id: ctx.uid(), ref: "", repo: ctx.defaultRepo(), title: "", stage, flag: "", priority: "", eta: "", note: "", updated: ctx.today() };
  ctx.state.tracker.push(task);
  ctx.save();
  ctx.render();
  scrollToItem(task.id);
  document.querySelector(`[data-id="${task.id}"] .tape-input`)?.focus({ preventScroll: true });
}

function update(task, field, value, { touch = false, move = false } = {}) {
  task[field] = value;
  if (touch) task.updated = ctx.today();
  if (move) {
    const list = ctx.state.tracker;
    list.splice(list.indexOf(task), 1);
    list.push(task);
  }
  movedId = task.id;
  ctx.save();
  ctx.render();
  scrollToItem(task.id);
  setTimeout(() => {
    movedId = null;
  }, 800);
}

const laneTasks = (stage) => sortTasks(ctx.state.tracker.filter((task) => task.stage === stage), ctx.state.trackerSort);

// Freezes the order on screen first, so switching to manual sorting moves nothing else.
function dropTask(task, stage, beforeId) {
  const shown = TRACKER_STAGES.flatMap(laneTasks);
  ctx.state.tracker = reorder(shown, task, shown.find((x) => x.id === beforeId));
  ctx.state.trackerSort = "manual";
  if (task.stage !== stage) {
    task.stage = stage;
    task.updated = ctx.today();
  }
  movedId = task.id;
  ctx.save();
  ctx.render();
  setTimeout(() => {
    movedId = null;
  }, 800);
}

function stepTask(task, dir) {
  const lane = laneTasks(task.stage);
  const j = lane.indexOf(task) + dir;
  if (j < 0 || j >= lane.length) return;
  dropTask(task, task.stage, (dir < 0 ? lane[j] : lane[j + 1])?.id ?? null);
}

export async function refreshTracker() {
  if (refreshing) return;
  refreshing = true;
  ctx.render();
  await Promise.allSettled(ctx.state.tracker.filter((task) => task.ref?.trim()).map((task) => ctx.commitRef("tracker", task)));
  refreshing = false;
  ctx.render();
}

function ago(iso) {
  return new Intl.RelativeTimeFormat(getLanguage(), { numeric: "auto" }).format(-daysBetween(iso, ctx.today()), "day");
}

function pill(task, field, values, labelKey, label, onchange) {
  const select = el(
    "select",
    {
      class: `pill-select${task[field] ? " is-set" : ""}${task[field] === "blocked" ? " is-blocked" : ""}`,
      "aria-label": t(labelKey),
      "data-focus-key": `${task.id}:${field}`,
      onchange: () => onchange(select.value),
    },
    values.map((v) => el("option", { value: v, textContent: t(label[v] ?? v) })),
  );
  select.value = task[field] ?? "";
  return select;
}

function stateMark(kind, state, text) {
  const tone = state === "closed" ? (kind === "pr" ? "red" : "purple") : STATE_TONE[state] ?? "muted";
  return [el("span", { class: `swatch swatch--${tone}`, "aria-hidden": "true" }), el("span", { textContent: text })];
}

function peopleText(item) {
  if (item.reviewers) {
    if (!item.reviewers.length) return t("noReviewer");
    return t("reviewLabel", { list: item.reviewers.map((r) => `@${r.login} (${t(`review_${r.state}`)})`).join(", ") });
  }
  if (item.assignees?.length) return item.assignees.map((login) => `@${login}`).join(", ");
  return item.author ? t("byAuthor", { login: item.author }) : t("unassigned");
}

function githubLine(task) {
  if (!task.state || task.fetching || ctx.hasError(task.id)) return null;
  const stateText = t(`state_${task.state}`);
  return el("p", { class: "gh-line" }, [
    el("span", { class: "mark" }, stateMark(task.kind, task.state, task.kind === "pr" ? `PR · ${stateText}` : stateText)),
    el("span", { class: "gh-people", textContent: peopleText(task) }),
  ]);
}

function prRow(task, pr) {
  const where = pr.repo && pr.repo.toLowerCase() !== task.repo?.toLowerCase() ? pr.repo.split("/")[1] : "PR ";
  const label = `${where}#${pr.number}`;
  return el("div", { class: "pr-row" }, [
    el("a", { class: "mark mark-link", href: pr.url, target: "_blank", rel: "noopener" },
      stateMark("pr", pr.state, pr.state ? `${label} · ${t(`state_${pr.state}`)}` : label)),
    el("span", { class: "pr-title", textContent: pr.title ?? "", title: pr.title ?? "" }),
    pr.state ? el("span", { class: "gh-people", textContent: peopleText(pr) }) : null,
    iconButton("x", t("remove"), () => removePr(task, pr)),
  ]);
}

function removePr(task, pr) {
  const key = prKey(pr);
  task.prs = (task.prs ?? []).filter((p) => prKey(p) !== key);
  task.addedPrs = (task.addedPrs ?? []).filter((r) => prKey(r) !== key);
  task.hiddenPrs = [...new Set([...(task.hiddenPrs ?? []), key])];
  ctx.save();
  ctx.render();
}

async function addPr(task, value) {
  const ref = parseRef(value, task.repo);
  if (!ref) {
    prErrors.set(task.id, () => t("errBadRef"));
    return ctx.render();
  }
  const key = prKey(ref);
  addingPrFor = null;
  prErrors.delete(task.id);
  task.hiddenPrs = (task.hiddenPrs ?? []).filter((k) => k !== key);
  if (!(task.addedPrs ?? []).some((r) => prKey(r) === key)) task.addedPrs = [...(task.addedPrs ?? []), ref];
  const placeholder = { ...ref, url: `https://github.com/${ref.repo}/pull/${ref.number}`, state: "", title: "" };
  if (!(task.prs ?? []).some((p) => prKey(p) === key)) task.prs = [...(task.prs ?? []), placeholder];
  ctx.save();
  ctx.render();

  const client = ctx.client();
  if (!client) return;
  try {
    const node = await client.item(ref);
    if (node.__typename !== "PullRequest") throw new Error(t("errNotPr", { ref: `#${ref.number}` }));
    task.prs = mergePrs(task.prs.filter((p) => prKey(p) !== key), [prInfo(node, ref.repo)]);
  } catch (err) {
    task.prs = task.prs.filter((p) => prKey(p) !== key);
    task.addedPrs = task.addedPrs.filter((r) => prKey(r) !== key);
    prErrors.set(task.id, () => ctx.describeError(err, `#${ref.number}`));
  }
  ctx.save();
  ctx.render();
}

function openPrInput(task) {
  addingPrFor = task.id;
  prErrors.delete(task.id);
  ctx.render();
  document.querySelector(`[data-id="${task.id}"] .pr-input`)?.focus();
}

function prList(task) {
  if (task.kind === "pr" || !parseRef(task.ref, task.repo) || ctx.hasError(task.id)) return null;
  const error = prErrors.get(task.id);
  const add = addingPrFor === task.id
    ? el("input", {
      class: "pr-input",
      placeholder: t("prRef"),
      "aria-label": t("prRef"),
      spellcheck: false,
      autocomplete: "off",
      "data-focus-key": `${task.id}:addPr`,
      onkeydown: (e) => {
        if (e.key === "Escape") {
          addingPrFor = null;
          ctx.render();
        } else if (e.key === "Enter") {
          e.preventDefault();
          addPr(task, e.target.value);
        }
      },
    })
    : el("button", { type: "button", class: "btn-text btn-small", onclick: () => openPrInput(task) }, [
      icon("plus"),
      el("span", { textContent: t("addPr") }),
    ]);
  return el("div", { class: "pr-list" }, [
    ...(task.prs ?? []).map((pr) => prRow(task, pr)),
    el("div", { class: "pr-foot" }, [add, error ? el("span", { class: "status", "data-tone": "error", textContent: error() }) : null]),
  ]);
}

function standupControl(task) {
  if (!parseRef(task.ref, task.repo) || ctx.hasError(task.id)) return null;
  if (ctx.inStandup(task)) {
    return el("span", { class: "mark" }, [icon("check"), el("span", { textContent: t("inStandup") })]);
  }
  return el("button", { type: "button", class: "btn-text btn-small", onclick: () => ctx.addToStandup(task) }, [
    icon("plus"),
    el("span", { textContent: t("addToStandup") }),
  ]);
}

function titleControl(task) {
  if (task.ref?.trim() || task.fetching) {
    const title = ctx.titleState("tracker", task);
    return el("p", { class: "item-headline" }, [el("span", { class: title.cls, textContent: title.text })]);
  }
  const input = el("textarea", {
    class: "title-input",
    rows: 1,
    value: task.title ?? "",
    placeholder: t("taskTitle"),
    "aria-label": t("taskTitle"),
    "data-focus-key": `${task.id}:title`,
    oninput: () => {
      task.title = input.value.replace(/\n/g, " ");
      ctx.save();
    },
    onkeydown: (e) => {
      if (e.key !== "Enter") return;
      e.preventDefault();
      input.blur();
    },
  });
  return input;
}

function etaChip(task) {
  const input = el("input", {
    type: "date",
    class: "eta-picker",
    value: task.eta ?? "",
    "aria-label": t("eta"),
    "data-focus-key": `${task.id}:eta`,
    onchange: () => {
      task.eta = input.value;
      ctx.save();
      ctx.render();
    },
    onclick: () => {
      try {
        input.showPicker?.();
      } catch {
        /* picker unavailable: typing still works */
      }
    },
  });
  if (!task.eta) {
    return el("label", { class: "eta-chip is-empty" }, [icon("calendar"), el("span", { textContent: t("setEta") }), input]);
  }
  const days = daysBetween(ctx.today(), task.eta);
  const open = task.stage !== "done";
  const tone = open && days < 0 ? " is-late" : open && days <= 1 ? " is-soon" : "";
  const [y, m, d] = task.eta.split("-").map(Number);
  const date = new Intl.DateTimeFormat(getLanguage(), { month: "short", day: "numeric" }).format(new Date(y, m - 1, d));
  const when = new Intl.RelativeTimeFormat(getLanguage(), { numeric: "auto" }).format(days, "day");
  return el("label", { class: `eta-chip${tone}` }, [
    icon("calendar"),
    el("span", { class: "eta-label", textContent: t("eta") }),
    el("span", { class: "eta-date", textContent: date }),
    open ? el("span", { class: "eta-rel", textContent: when }) : null,
    input,
  ]);
}

function noteField(task) {
  const input = el("textarea", {
    class: "note-input",
    rows: 1,
    value: task.note ?? "",
    placeholder: t("note"),
    "aria-label": t("noteLabel"),
    spellcheck: false,
    "data-focus-key": `${task.id}:note`,
    oninput: () => {
      task.note = input.value;
      box.classList.toggle("has-text", Boolean(input.value.trim()));
      ctx.save();
    },
  });
  const box = el("label", { class: `item-note-box${task.note?.trim() ? " has-text" : ""}` }, [
    el("span", { class: "note-label", textContent: t("noteLabel") }),
    input,
  ]);
  return box;
}

function renderTask(task) {
  const classes = ["item", ctx.hasError(task.id) && "is-error", task.id === movedId && "is-pressed"].filter(Boolean).join(" ");
  const tapeInput = el("input", {
    class: "tape-input",
    value: task.ref ?? "",
    placeholder: "#",
    autocomplete: "off",
    spellcheck: false,
    "aria-label": t("taskRef"),
    "data-focus-key": `${task.id}:ref`,
    oninput: (e) => {
      task.ref = e.target.value;
      ctx.save();
    },
    onchange: () => ctx.commitRef("tracker", task),
    onkeydown: (e) => {
      if (e.key !== "Enter") return;
      e.preventDefault();
      e.target.blur();
    },
  });
  const standup = standupControl(task);

  return el("article", { class: classes, "data-id": task.id }, [
    dragHandle(t("dragHandle"), {
      lanes: () => [...document.querySelectorAll("#trackerView .lane")],
      onDrop: (lane, beforeId) => dropTask(task, lane.dataset.stage, beforeId),
      step: (dir) => stepTask(task, dir),
      focusKey: `${task.id}:drag`,
    }),
    el("div", { class: "item-main" }, [
      el("label", { class: "tape item-tape" }, [tapeInput]),
      el("div", { class: "item-body" }, [
        titleControl(task),
        githubLine(task),
      ]),
      standup ? el("div", { class: "item-actions" }, [standup]) : null,
      el("div", { class: "item-x" }, [iconButton("x", t("remove"), () => ctx.removeItem(ctx.state.tracker, task))]),
      el("div", { class: "item-meta" }, [
        el("span", { class: "item-pills" }, [
          pill(task, "stage", TRACKER_STAGES, "stage", {}, (v) => update(task, "stage", v, { touch: true, move: true })),
          pill(task, "flag", TASK_FLAGS, "status", FLAG_LABEL, (v) => update(task, "flag", v, { touch: true })),
          pill(task, "priority", PRIORITIES, "priority", PRIORITY_LABEL, (v) => update(task, "priority", v)),
          ctx.repoSelect("tracker", task),
        ]),
        etaChip(task),
        task.updated ? el("span", { class: "meta-label", textContent: t("updated", { when: ago(task.updated) }) }) : null,
      ]),
      noteField(task),
    ]),
    prList(task),
  ]);
}

function renderBar() {
  const sort = el(
    "select",
    {
      class: "pill-select is-set",
      "aria-label": t("sortBy"),
      "data-focus-key": "tracker:sort",
      onchange: () => {
        ctx.state.trackerSort = sort.value;
        ctx.save();
        ctx.render();
      },
    },
    SORTS.map((s) => el("option", { value: s, textContent: t(`sort_${s}`) })),
  );
  sort.value = ctx.state.trackerSort;
  document.querySelector(".tracker-bar").replaceChildren(
    el("span", { class: "meta-group" }, [el("span", { class: "meta-label", textContent: t("sortBy") }), sort]),
    el("button", {
      type: "button",
      class: "btn-text btn-small",
      disabled: refreshing,
      textContent: t(refreshing ? "refreshing" : "refresh"),
      onclick: refreshTracker,
    }),
  );
}

export function renderTracker() {
  renderBar();
  for (const stage of TRACKER_STAGES) {
    const lane = document.querySelector(`[data-stage="${stage}"]`);
    const tasks = laneTasks(stage);
    const count = tasks.length;
    lane.querySelector(".lane-count").textContent = count ? t(count === 1 ? "countTask" : "countTasks", { count }) : "";

    const tools = lane.querySelector(".lane-tools");
    tools.replaceChildren();
    if (stage === "done" && count) {
      tools.append(
        el("button", {
          type: "button",
          class: "btn",
          textContent: t("clearDone", { count }),
          onclick: () => {
            ctx.state.tracker = ctx.state.tracker.filter((task) => task.stage !== "done");
            ctx.save();
            ctx.render();
          },
        }),
      );
    }

    lane.querySelector(".rows").replaceChildren(
      ...(count ? tasks.map(renderTask) : [el("p", { class: "lane-empty", textContent: t("emptyTasks") })]),
    );
  }
}
