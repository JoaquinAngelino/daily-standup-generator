export const ISSUE_SECTIONS = ["completed", "inProgress", "upcoming"];

export const SECTION_TITLES = {
  completed: "Completed",
  inProgress: "In Progress",
  upcoming: "Upcoming",
  prs: "PR Review",
};

export const NEXT_STAGE = { upcoming: "inProgress", inProgress: "completed" };

// Carries an item into the next stage, mapping its single ETA onto that stage's fields.
export function advanceRow(row, to) {
  const subtasks = (row.subtasks ?? []).map((s) =>
    to === "completed"
      ? { id: s.id, desc: s.desc ?? "", etaFrom: "", etaTo: s.eta ?? "" }
      : { id: s.id, desc: s.desc ?? "", eta: s.eta ?? "" },
  );
  const base = { id: row.id, ref: row.ref ?? "", repo: row.repo ?? "", title: row.title ?? "", subtasks };
  return to === "completed"
    ? { ...base, etaFrom: "", etaTo: row.eta ?? "" }
    : { ...base, eta: row.eta ?? "" };
}

export const TRACKER_STAGES = ["notStarted", "inProgress", "done"];
export const TASK_FLAGS = ["", "blocked", "waitingReview", "waitingInfo", "onHold"];
export const PRIORITIES = ["", "high", "medium", "low"];

const LEGACY_STATUS = {
  todo: ["notStarted", ""],
  doing: ["inProgress", ""],
  review: ["inProgress", "waitingReview"],
  blocked: ["inProgress", "blocked"],
  done: ["done", ""],
};

// Tasks saved before stages existed carry one `status` that mixed stage and flag.
export function migrateTask(task) {
  if (TRACKER_STAGES.includes(task.stage)) return task;
  const [stage, flag] = LEGACY_STATUS[task.status] ?? ["notStarted", ""];
  const { status, ...rest } = task;
  return { ...rest, stage, flag: rest.flag ?? flag };
}

export const standupLane = (task) =>
  task.kind === "pr" ? "prs" : { notStarted: "upcoming", inProgress: "inProgress", done: "completed" }[task.stage];

export function taskToRow(task, id) {
  const lane = standupLane(task);
  const base = { id, ref: task.ref ?? "", repo: task.repo ?? "", title: task.title ?? "" };
  if (lane === "prs") return base;
  return lane === "completed"
    ? { ...base, subtasks: [], etaFrom: "", etaTo: task.eta ?? "" }
    : { ...base, subtasks: [], eta: task.eta ?? "" };
}

const PRIORITY_RANK = { high: 0, medium: 1, low: 2 };

export function sortTasks(tasks, by) {
  if (by !== "priority" && by !== "eta") return tasks;
  const rank = (task) => PRIORITY_RANK[task.priority] ?? 3;
  const eta = (task) => task.eta || "9999";
  const byEta = (a, b) => eta(a).localeCompare(eta(b));
  const byRank = (a, b) => rank(a) - rank(b);
  return [...tasks].sort(by === "eta" ? (a, b) => byEta(a, b) || byRank(a, b) : (a, b) => byRank(a, b) || byEta(a, b));
}

export function itemState(node) {
  if (node.state === "MERGED") return "merged";
  if (node.state === "CLOSED") return "closed";
  return node.isDraft ? "draft" : "open";
}

const PR_ORDER = { open: 0, draft: 0, merged: 1, closed: 2 };

// Closing links, manual Development links and PRs that mention the issue; open ones first.
function linkedPrs(node) {
  const candidates = [
    ...(node.closedByPullRequestsReferences?.nodes ?? []),
    ...(node.timelineItems?.nodes ?? []).map((event) => event.source ?? event.subject),
  ];
  const prs = new Map();
  for (const pr of candidates) {
    if (!pr?.number || !pr.url) continue;
    const repo = pr.repository?.nameWithOwner ?? "";
    prs.set(`${repo}#${pr.number}`.toLowerCase(), { number: pr.number, url: pr.url, repo, state: itemState(pr) });
  }
  return [...prs.values()].sort((a, b) => PR_ORDER[a.state] - PR_ORDER[b.state]);
}

// `node` is the issueOrPullRequest shape requested in github.js.
export function trackerInfo(node) {
  const kind = node.__typename === "PullRequest" ? "pr" : "issue";
  return {
    kind,
    title: node.title,
    state: itemState(node),
    assignees: (node.assignees?.nodes ?? []).map((a) => a.login),
    prs: kind === "issue" ? linkedPrs(node) : [],
  };
}

export function sameRef(a, b) {
  const x = parseRef(a.ref, a.repo);
  const y = parseRef(b.ref, b.repo);
  return Boolean(x && y) && x.number === y.number && x.repo.toLowerCase() === y.repo.toLowerCase();
}

export function daysBetween(fromIso, toIso) {
  return Math.round((Date.parse(toIso) - Date.parse(fromIso)) / 86_400_000);
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

// Slack pastes this plain text over the HTML; it converts Markdown links itself, so they stay as is.
export function markdownToSlackText(md) {
  return String(md)
    .split("\n")
    .map((line) => {
      const heading = /^#{1,6}\s+(.*)$/.exec(line);
      return (heading ? `**${heading[1]}**` : line)
        .replace(/\*\*(.+?)\*\*/g, "*$1*")
        .replace(/^(\s*)[-*]\s+/, "$1• ");
    })
    .join("\n");
}
