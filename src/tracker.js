import { TRACKER_STAGES, TASK_FLAGS, PRIORITIES, parseRef, daysBetween, sortTasks } from "./lib.js";
import { t, getLanguage } from "./i18n.js";
import { el, icon, iconButton, scrollToItem } from "./ui.js";

const SORTS = ["priority", "eta", "manual"];
const STATE_TONE = { open: "green", draft: "muted", merged: "purple" };
const FLAG_LABEL = { "": "statusNone" };
const PRIORITY_LABEL = { "": "priorityNone" };

let ctx;
let movedId = null;
let refreshing = false;

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
  const tone = state === "closed" ? (kind === "pr" ? "red" : "purple") : STATE_TONE[state];
  return [el("span", { class: `swatch swatch--${tone}`, "aria-hidden": "true" }), el("span", { textContent: text })];
}

function githubLine(task) {
  if (!task.state || task.fetching || ctx.hasError(task.id)) return null;
  const stateText = t(`state_${task.state}`);
  const people = task.assignees?.length ? task.assignees.map((login) => `@${login}`).join(", ") : t("unassigned");
  return el("p", { class: "gh-line" }, [
    el("span", { class: "mark" }, stateMark(task.kind, task.state, task.kind === "pr" ? `PR · ${stateText}` : stateText)),
    el("span", { class: "gh-people", textContent: people }),
    ...(task.prs ?? []).map((pr) =>
      el("a", { class: "mark mark-link", href: pr.url, target: "_blank", rel: "noopener" }, stateMark("pr", pr.state, `PR #${pr.number} · ${t(`state_${pr.state}`)}`)),
    ),
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

function textInput(task, field, labelKey, className) {
  const input = el("input", {
    class: className,
    value: task[field] ?? "",
    placeholder: t(labelKey),
    "aria-label": t(labelKey),
    spellcheck: false,
    "data-focus-key": `${task.id}:${field}`,
    oninput: () => {
      task[field] = input.value;
      ctx.save();
    },
  });
  return input;
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
  const eta = ctx.dateInput(task, "eta", "eta");
  if (task.eta && task.stage !== "done" && task.eta < ctx.today()) eta.classList.add("is-overdue");
  const standup = standupControl(task);

  return el("article", { class: classes, "data-id": task.id }, [
    el("div", { class: "item-main" }, [
      el("label", { class: "tape item-tape" }, [tapeInput]),
      el("div", { class: "item-body" }, [
        titleControl(task),
        githubLine(task),
        el("div", { class: "item-pills" }, [
          pill(task, "stage", TRACKER_STAGES, "stage", {}, (v) => update(task, "stage", v, { touch: true, move: true })),
          pill(task, "flag", TASK_FLAGS, "status", FLAG_LABEL, (v) => update(task, "flag", v, { touch: true })),
          pill(task, "priority", PRIORITIES, "priority", PRIORITY_LABEL, (v) => update(task, "priority", v)),
          ctx.repoSelect("tracker", task),
        ]),
      ]),
      standup ? el("div", { class: "item-actions" }, [standup]) : null,
      el("div", { class: "item-x" }, [iconButton("x", t("remove"), () => ctx.removeItem(ctx.state.tracker, task))]),
      el("div", { class: "item-meta" }, [
        ctx.metaGroup("eta", [eta]),
        textInput(task, "note", "note", "note-input"),
        task.updated ? el("span", { class: "meta-label", textContent: t("updated", { when: ago(task.updated) }) }) : null,
      ]),
    ]),
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
    const tasks = sortTasks(ctx.state.tracker.filter((task) => task.stage === stage), ctx.state.trackerSort);
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
