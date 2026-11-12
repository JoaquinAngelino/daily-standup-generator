const SVG_NS = "http://www.w3.org/2000/svg";
const ICONS = {
  x: "M4 4l8 8M12 4l-8 8",
  plus: "M8 3v10M3 8h10",
  arrow: "M3 8h10M9 4l4 4-4 4",
  check: "M3 8.5l3.5 3.5L13 4.5",
  grip: "M6 3.5h0M10 3.5h0M6 8h0M10 8h0M6 12.5h0M10 12.5h0",
};

export const TONE = { completed: "green", inProgress: "yellow", upcoming: "blue", prs: "purple" };

export const $ = (sel) => document.querySelector(sel);
export const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function el(tag, props = {}, children = []) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (v == null || v === false) continue;
    if (k === "class") e.className = v;
    else if (k.startsWith("on")) e.addEventListener(k.slice(2), v);
    else if (k in e) e[k] = v;
    else e.setAttribute(k, v);
  }
  e.append(...children.filter(Boolean));
  return e;
}

export function icon(name) {
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("viewBox", "0 0 16 16");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("class", "icon");
  const path = document.createElementNS(SVG_NS, "path");
  path.setAttribute("d", ICONS[name]);
  svg.append(path);
  return svg;
}

export function iconButton(name, label, onclick) {
  return el("button", { type: "button", class: "icon-btn", title: label, "aria-label": label, onclick }, [icon(name)]);
}

export function scrollToItem(id) {
  document.querySelector(`[data-id="${id}"]`)?.scrollIntoView({ block: "nearest", behavior: reducedMotion() ? "auto" : "smooth" });
}

const EDGE = 80;

// Pointer-driven so it also works on touch screens, where HTML5 drag-and-drop mostly does not.
function startDrag(event, { lanes, onDrop }) {
  if (event.button !== 0) return;
  event.preventDefault();
  const handle = event.currentTarget;
  const article = handle.closest(".item");
  const start = { x: event.clientX, y: event.clientY };
  let moved = false;
  handle.setPointerCapture(event.pointerId);
  article.classList.add("is-dragging");
  const marker = el("div", { class: "drop-marker", "aria-hidden": "true" });
  document.body.append(marker);
  let pointer = { x: event.clientX, y: event.clientY };
  let target = null;
  let frame = 0;

  const locate = () => {
    const lane = lanes().find((l) => {
      const r = l.getBoundingClientRect();
      return pointer.y >= r.top && pointer.y <= r.bottom && pointer.x >= r.left && pointer.x <= r.right;
    });
    if (!lane) return;
    const rows = lane.querySelector(".rows");
    const items = [...rows.children].filter((node) => node.classList.contains("item") && node !== article);
    const before = items.find((node) => {
      const r = node.getBoundingClientRect();
      return pointer.y < r.top + r.height / 2;
    });
    const box = rows.getBoundingClientRect();
    const y = before ? before.getBoundingClientRect().top : items.length ? items.at(-1).getBoundingClientRect().bottom : box.top + 8;
    marker.style.cssText = `top:${y - 1}px;left:${box.left}px;width:${box.width}px`;
    target = { lane, beforeId: before?.dataset.id ?? null };
  };

  const tick = () => {
    const depth = Math.max(EDGE - pointer.y, pointer.y - (window.innerHeight - EDGE), 0);
    const step = Math.sign(pointer.y - window.innerHeight / 2) * Math.ceil((depth / EDGE) * 10);
    if (step) {
      window.scrollBy(0, step);
      locate();
    }
    frame = requestAnimationFrame(tick);
  };

  const finish = (drop) => {
    cancelAnimationFrame(frame);
    handle.removeEventListener("pointermove", move);
    handle.removeEventListener("pointerup", up);
    handle.removeEventListener("pointercancel", cancel);
    window.removeEventListener("keydown", escape);
    marker.remove();
    article.classList.remove("is-dragging");
    if (drop && moved && target) onDrop(target.lane, target.beforeId);
  };
  const move = (e) => {
    pointer = { x: e.clientX, y: e.clientY };
    moved ||= Math.hypot(pointer.x - start.x, pointer.y - start.y) > 4;
    locate();
  };
  const up = () => finish(true);
  const cancel = () => finish(false);
  const escape = (e) => {
    if (e.key === "Escape") finish(false);
  };

  handle.addEventListener("pointermove", move);
  handle.addEventListener("pointerup", up);
  handle.addEventListener("pointercancel", cancel);
  window.addEventListener("keydown", escape);
  locate();
  frame = requestAnimationFrame(tick);
}

// `step(-1 | 1)` moves the item one place for keyboard users.
export function dragHandle(label, { lanes, onDrop, step, focusKey }) {
  return el(
    "button",
    {
      type: "button",
      class: "drag-handle",
      title: label,
      "aria-label": label,
      "data-focus-key": focusKey,
      onpointerdown: (e) => startDrag(e, { lanes, onDrop }),
      onkeydown: (e) => {
        if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
        e.preventDefault();
        step(e.key === "ArrowUp" ? -1 : 1);
      },
    },
    [icon("grip")],
  );
}
