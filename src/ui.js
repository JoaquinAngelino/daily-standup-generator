const SVG_NS = "http://www.w3.org/2000/svg";
const ICONS = {
  x: "M4 4l8 8M12 4l-8 8",
  plus: "M8 3v10M3 8h10",
  arrow: "M3 8h10M9 4l4 4-4 4",
  check: "M3 8.5l3.5 3.5L13 4.5",
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
