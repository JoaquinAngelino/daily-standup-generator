import { TRACKER_STATUSES, STANDUP_LANE, parseRef, daysBetween } from "./lib.js";
import { t, getLanguage } from "./i18n.js";
import { el, icon, iconButton, scrollToItem } from "./ui.js";

let ctx;
let movedId = null;

export function initTracker(context) {
  ctx = context;
  document.querySelector("#trackerView").append(...TRACKER_STATUSES.map(laneShell));
}

function laneShell(status) {
  return el("section", { class: "lane", "data-status": status, "aria-labelledby": `lane-${status}` }, [
    el("div", { class: "lane-head" }, [
      el("h2", { id: `lane-${status}`, class: "lane-title", "data-i18n": status, textContent: t(status) }),
      el("span", { class: "lane-count" }),
      el("span", { class: "lane-tools" }),
      el("button", { type: "button", class: "btn-text", onclick: () => addTask(status) }, [
        icon("plus"),
        el("span", { "data-i18n": "addTask", textContent: t("addTask") }),
      ]),
    ]),
    el("div", { class: "rows" }),
  ]);
}

function addTask(status) {
  const task = { id: ctx.uid(), ref: "", repo: ctx.defaultRepo(), title: "", note: "", status, updated: ctx.today() };
  ctx.state.tracker.push(task);
  ctx.save();
  ctx.render();
  scrollToItem(task.id);
  document.querySelector(`[data-id="${task.id}"] .tape-input`)?.focus({ preventScroll: true });
}

function moveTask(task, status) {
  const list = ctx.state.tracker;
  list.splice(list.indexOf(task), 1);
  list.push(task);
  task.status = status;
  task.updated = ctx.today();
  movedId = task.id;
  ctx.save();
  ctx.render();
  scrollToItem(task.id);
  setTimeout(() => {
    movedId = null;
  }, 800);
}

function ago(iso) {
  return new Intl.RelativeTimeFormat(getLanguage(), { numeric: "auto" }).format(-daysBetween(iso, ctx.today()), "day");
}

function statusSelect(task) {
  const select = el(
    "select",
    {
      class: "pill-select",
      "aria-label": t("status"),
      "data-focus-key": `${task.id}:status`,
      onchange: () => moveTask(task, select.value),
    },
    TRACKER_STATUSES.map((s) => el("option", { value: s, textContent: t(s) })),
  );
  select.value = task.status;
  return select;
}

function standupControl(task) {
  if (!parseRef(task.ref, task.repo) || ctx.hasError(task.id)) return null;
  if (ctx.inStandup(task)) {
    return el("span", { class: "mark" }, [icon("check"), el("span", { textContent: t("inStandup") })]);
  }
  const lane = t(STANDUP_LANE[task.status]);
  return el("button", { type: "button", class: "btn-text btn-small", title: lane, onclick: () => ctx.addToStandup(task) }, [
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
  const note = el("input", {
    class: "note-input",
    value: task.note ?? "",
    placeholder: t("note"),
    "aria-label": t("note"),
    spellcheck: false,
    "data-focus-key": `${task.id}:note`,
    oninput: () => {
      task.note = note.value;
      ctx.save();
    },
  });
  const standup = standupControl(task);

  return el("article", { class: classes, "data-id": task.id }, [
    el("div", { class: "item-main" }, [
      el("label", { class: "tape item-tape" }, [tapeInput]),
      el("div", { class: "item-body" }, [
        titleControl(task),
        el("div", { class: "item-pills" }, [statusSelect(task), ctx.repoSelect("tracker", task)]),
      ]),
      standup ? el("div", { class: "item-actions" }, [standup]) : null,
      el("div", { class: "item-x" }, [iconButton("x", t("remove"), () => ctx.removeItem(ctx.state.tracker, task))]),
      el("div", { class: "item-meta" }, [
        note,
        task.updated ? el("span", { class: "meta-label", textContent: t("updated", { when: ago(task.updated) }) }) : null,
      ]),
    ]),
  ]);
}

export function renderTracker() {
  for (const status of TRACKER_STATUSES) {
    const lane = document.querySelector(`[data-status="${status}"]`);
    const tasks = ctx.state.tracker.filter((task) => task.status === status);
    const count = tasks.length;
    lane.querySelector(".lane-count").textContent = count ? t(count === 1 ? "countTask" : "countTasks", { count }) : "";

    const tools = lane.querySelector(".lane-tools");
    tools.replaceChildren();
    if (status === "done" && count) {
      tools.append(
        el("button", {
          type: "button",
          class: "btn",
          textContent: t("clearDone", { count }),
          onclick: () => {
            ctx.state.tracker = ctx.state.tracker.filter((task) => task.status !== "done");
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
