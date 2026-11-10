export const ISSUE_SECTIONS = ["completed", "inProgress", "upcoming"];

export const SECTION_TITLES = {
  completed: "Completed",
  inProgress: "In Progress",
  upcoming: "Upcoming",
  prs: "PR Review",
};

export const PROJECTED_STATUSES = ["", "Pending merge", "Pending code review", "Merged"];

export const NEXT_STAGE = { upcoming: "inProgress", inProgress: "completed" };

// Carries an item into the next stage, mapping its single ETA onto that stage's fields.
export function advanceRow(row, to) {
  const subtasks = (row.subtasks ?? []).map((s) =>
    to === "completed"
      ? { id: s.id, desc: s.desc ?? "", etaFrom: "", etaTo: s.eta ?? "", projDate: "", projStatus: "" }
      : { id: s.id, desc: s.desc ?? "", eta: s.eta ?? "" },
  );
  const base = { id: row.id, ref: row.ref ?? "", repo: row.repo ?? "", title: row.title ?? "", subtasks };
  return to === "completed"
    ? { ...base, etaFrom: "", etaTo: row.eta ?? "", projDate: "", projStatus: "" }
    : { ...base, eta: row.eta ?? "" };
}

const NAME = "[\\w.-]+";
const REPO_RE = new RegExp(`^${NAME}/${NAME}$`);
const URL_RE = new RegExp(`github\\.com/(${NAME}/${NAME})/(?:issues|pull)/(\\d+)`);
const SHORT_RE = new RegExp(`^(?:(${NAME}/${NAME})#|#)?(\\d+)$`);

export function parseRepoList(text) {
  const repos = String(text ?? "")
    .split(/[\s,]+/)
    .map((s) => s.trim())
    .filter((s) => REPO_RE.test(s));
  return [...new Set(repos)];
}

export function parseRef(input, fallbackRepo) {
  const value = String(input ?? "").trim();
  if (!value) return null;
  const url = URL_RE.exec(value);
  if (url) return { repo: url[1], number: Number(url[2]) };
  const short = SHORT_RE.exec(value);
  if (!short) return null;
  const repo = short[1] || fallbackRepo;
  return repo ? { repo, number: Number(short[2]) } : null;
}

export function formatDate(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || "");
  return m ? `${m[2]}-${m[3]}` : iso || "";
}

export function formatRange(from, to) {
  const a = formatDate(from);
  const b = formatDate(to);
  return a && b ? `${a} -> ${b}` : a || b;
}

export function formatProjected(date, status) {
  return [formatDate(date), status].filter(Boolean).join(" ");
}

// `pr` is the GraphQL PullRequest shape requested in github.js.
export function reviewStatus(pr) {
  if (pr.state === "MERGED") return "Merged";
  if (pr.state === "CLOSED") return "Closed";
  if (pr.isDraft) return "Draft";
  const states = (pr.latestOpinionatedReviews?.nodes ?? []).map((r) => r.state);
  if (states.includes("CHANGES_REQUESTED")) return "Changes Requested";
  if (states.includes("APPROVED")) return "Approved";
  return "Pending";
}

const CLOSING_RE = new RegExp(
  `\\b(?:close[sd]?|fix(?:e[sd])?|resolve[sd]?):?\\s+(?:https://github\\.com/(${NAME}/${NAME})/issues/|(${NAME}/${NAME})?#)(\\d+)`,
  "i",
);

// Fallback for PRs whose closing issue GitHub did not link.
export function findIssueRef(pr, prRepo) {
  const body = pr.body || "";
  const closing = CLOSING_RE.exec(body);
  if (closing) return { repo: closing[1] || closing[2] || prRepo, number: Number(closing[3]) };
  const title = /\(#(\d+)\)/.exec(pr.title || "");
  if (title) return { repo: prRepo, number: Number(title[1]) };
  const url = new RegExp(`github\\.com/(${NAME}/${NAME})/issues/(\\d+)`).exec(body);
  if (url) return { repo: url[1], number: Number(url[2]) };
  const hash = /(?:^|[^\w&/])#(\d+)\b/.exec(body);
  if (hash) return { repo: prRepo, number: Number(hash[1]) };
  return null;
}

export function node(label, value, children = []) {
  return { label, value, children: children.filter((c) => c && c.value) };
}

export function issueNode(issue, children = []) {
  return node("GitHub Issue", `[${issue.number}](${issue.url}) — ${issue.title}`, children);
}

function renderNode(n, depth) {
  return [
    `${"    ".repeat(depth)}- **${n.label}:** ${n.value}`,
    ...n.children.flatMap((c) => renderNode(c, depth + 1)),
  ];
}

export function toMarkdown(blocks) {
  return blocks
    .filter((b) => b.items.length)
    .map((b) => [`### ${b.title}`, ...b.items.flatMap((i) => renderNode(i, 0))].join("\n"))
    .join("\n\n");
}

export function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function inlineHtml(text) {
  return escapeHtml(text)
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2">$1</a>')
    .replace(/\*\*(.+?)\*\*/g, "<b>$1</b>");
}

// Renders the subset of Markdown the generator emits, so edits made in the textarea survive copy.
export function markdownToHtml(md) {
  const out = [];
  const indents = [];
  const closeTo = (indent) => {
    while (indents.length && indent < indents.at(-1)) {
      out.push("</li></ul>");
      indents.pop();
    }
  };
  for (const raw of String(md).split("\n")) {
    const line = raw.replace(/\s+$/, "");
    const item = /^(\s*)[-*]\s+(.*)$/.exec(line);
    if (item) {
      const indent = item[1].replace(/\t/g, "    ").length;
      if (!indents.length || indent > indents.at(-1)) {
        out.push("<ul><li>");
        indents.push(indent);
      } else {
        closeTo(indent);
        if (indents.length) out.push("</li><li>");
        else {
          out.push("<ul><li>");
          indents.push(indent);
        }
      }
      out.push(inlineHtml(item[2]));
      continue;
    }
    closeTo(-1);
    const heading = /^#{1,6}\s+(.*)$/.exec(line);
    if (heading) out.push(`<div><u><b>${inlineHtml(heading[1])}</b></u></div>`);
    else if (line) out.push(`<div>${inlineHtml(line)}</div>`);
    else if (out.length && out.at(-1) !== "<br>") out.push("<br>");
  }
  closeTo(-1);
  return out.join("");
}

// Plain-text fallback in Slack's syntax, used when the browser cannot put HTML on the clipboard.
export function markdownToSlackText(md) {
  return String(md)
    .split("\n")
    .map((line) => {
      const heading = /^#{1,6}\s+(.*)$/.exec(line);
      return (heading ? `**${heading[1]}**` : line)
        .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, "$1 ($2)")
        .replace(/\*\*(.+?)\*\*/g, "*$1*")
        .replace(/^(\s*)[-*]\s+/, "$1• ");
    })
    .join("\n");
}
