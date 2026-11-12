import { test } from "node:test";
import assert from "node:assert/strict";
import {
  parseRepoList,
  parseRef,
  formatRange,
  reviewStatus,
  findIssueRef,
  node,
  issueNode,
  toMarkdown,
  markdownToHtml,
  markdownToSlackText,
  advanceRow,
  taskToRow,
  sameRef,
  daysBetween,
  migrateTask,
  sortTasks,
  trackerInfo,
  mergePrs,
} from "../src/lib.js";

test("advanceRow maps ETAs onto the next stage and drops stage-only state", () => {
  const upcoming = { id: "a", ref: "5", repo: "o/r", title: "T", eta: "2026-11-14", reportedOn: "x", subtasks: [{ id: "s", desc: "d", eta: "2026-11-13" }] };
  assert.deepEqual(advanceRow(upcoming, "inProgress"), {
    id: "a", ref: "5", repo: "o/r", title: "T", eta: "2026-11-14", subtasks: [{ id: "s", desc: "d", eta: "2026-11-13" }],
  });
  assert.deepEqual(advanceRow(upcoming, "completed"), {
    id: "a", ref: "5", repo: "o/r", title: "T", etaFrom: "", etaTo: "2026-11-14",
    subtasks: [{ id: "s", desc: "d", etaFrom: "", etaTo: "2026-11-13" }],
  });
});

test("parseRepoList keeps valid unique owner/repo entries", () => {
  assert.deepEqual(parseRepoList("a/b\n a/b, c/d.e\nnot-a-repo"), ["a/b", "c/d.e"]);
});

test("parseRef accepts number, #number, owner/repo#number and URLs", () => {
  assert.deepEqual(parseRef("12", "o/r"), { repo: "o/r", number: 12 });
  assert.deepEqual(parseRef("#12", "o/r"), { repo: "o/r", number: 12 });
  assert.deepEqual(parseRef("x/y#7", "o/r"), { repo: "x/y", number: 7 });
  assert.deepEqual(parseRef("https://github.com/x/y/pull/9/files", "o/r"), { repo: "x/y", number: 9 });
  assert.deepEqual(parseRef("x/y12", "o/r"), null);
  assert.equal(parseRef("12", ""), null);
  assert.equal(parseRef("  ", "o/r"), null);
});

test("formatRange", () => {
  assert.equal(formatRange("2026-11-03", "2026-11-05"), "11-03 -> 11-05");
  assert.equal(formatRange("", "2026-11-05"), "11-05");
});

test("reviewStatus uses PR state, then latest opinionated reviews", () => {
  const reviews = (...states) => ({ nodes: states.map((state) => ({ state })) });
  assert.equal(reviewStatus({ state: "MERGED", latestOpinionatedReviews: reviews("CHANGES_REQUESTED") }), "Merged");
  assert.equal(reviewStatus({ state: "OPEN", isDraft: true }), "Draft");
  assert.equal(reviewStatus({ state: "OPEN", latestOpinionatedReviews: reviews("APPROVED", "CHANGES_REQUESTED") }), "Changes Requested");
  assert.equal(reviewStatus({ state: "OPEN", latestOpinionatedReviews: reviews("APPROVED") }), "Approved");
  assert.equal(reviewStatus({ state: "OPEN", latestOpinionatedReviews: reviews() }), "Pending");
});

test("findIssueRef prefers closing keywords and keeps the PR repo", () => {
  assert.deepEqual(findIssueRef({ title: "Fix (#3)", body: "See #1. Closes #42" }, "o/r"), { repo: "o/r", number: 42 });
  assert.deepEqual(findIssueRef({ title: "x", body: "fixes other/repo#5" }, "o/r"), { repo: "other/repo", number: 5 });
  assert.deepEqual(findIssueRef({ title: "Feature (#3)", body: "" }, "o/r"), { repo: "o/r", number: 3 });
  assert.deepEqual(findIssueRef({ title: "x", body: "https://github.com/a/b/issues/8" }, "o/r"), { repo: "a/b", number: 8 });
  assert.deepEqual(findIssueRef({ title: "x", body: "related to #11" }, "o/r"), { repo: "o/r", number: 11 });
  assert.equal(findIssueRef({ title: "x", body: "color &#35;fff" }, "o/r"), null);
});

const issue = { number: 7, title: "Login <fails>", url: "https://github.com/o/r/issues/7" };

test("toMarkdown renders sections, nesting and skips empty values", () => {
  const md = toMarkdown([
    {
      title: "Completed",
      items: [
        issueNode(issue, [
          node("ETA", "11-03 -> 11-05"),
          node("Notes", ""),
          node("Subtask description", "API", [node("ETA", "11-04")]),
        ]),
      ],
    },
    { title: "Upcoming", items: [] },
    { title: "PR Review", items: [node("PR", "[9](https://github.com/o/r/pull/9) — Fix", [node("Status", "Approved")])] },
  ]);
  assert.equal(
    md,
    [
      "### Completed",
      "- **GitHub Issue:** [7](https://github.com/o/r/issues/7) — Login <fails>",
      "    - **ETA:** 11-03 -> 11-05",
      "    - **Subtask description:** API",
      "        - **ETA:** 11-04",
      "",
      "### PR Review",
      "- **PR:** [9](https://github.com/o/r/pull/9) — Fix",
      "    - **Status:** Approved",
    ].join("\n"),
  );
});

test("markdownToHtml nests lists, escapes text and links only http(s)", () => {
  const html = markdownToHtml(
    "### Done\n- **Issue:** [7](https://x.io/7) — a <b>\n    - **ETA:** 1\n        - deep\n- next [js](javascript:alert(1))\nplain",
  );
  assert.equal(
    html,
    '<div><u><b>Done</b></u></div>' +
      '<ul><li><b>Issue:</b> <a href="https://x.io/7">7</a> — a &lt;b&gt;' +
      "<ul><li><b>ETA:</b> 1<ul><li>deep</li></ul></li></ul>" +
      "</li><li>next [js](javascript:alert(1))</li></ul>" +
      "<div>plain</div>",
  );
});

test("markdownToHtml handles 2-space indents from manual edits", () => {
  assert.equal(markdownToHtml("- a\n  - b\n- c"), "<ul><li>a<ul><li>b</li></ul></li><li>c</li></ul>");
});

test("markdownToHtml keeps one break between sections", () => {
  assert.equal(
    markdownToHtml("### A\n- x\n\n\n### B\n- y"),
    "<div><u><b>A</b></u></div><ul><li>x</li></ul><br><div><u><b>B</b></u></div><ul><li>y</li></ul>",
  );
});

test("markdownToSlackText converts to Slack syntax", () => {
  assert.equal(
    markdownToSlackText("### Completed\n- **GitHub Issue:** [7](https://x.io/7) — a\n    - **ETA:** 1"),
    "*Completed*\n• *GitHub Issue:* [7](https://x.io/7) — a\n    • *ETA:* 1",
  );
});

test("taskToRow builds a standup row for the lane the task maps to", () => {
  const task = { id: "t", ref: "5", repo: "o/r", title: "T", note: "n", stage: "inProgress", eta: "2026-11-20" };
  assert.deepEqual(taskToRow(task, "a"), { id: "a", ref: "5", repo: "o/r", title: "T", subtasks: [], eta: "2026-11-20" });
  assert.deepEqual(taskToRow({ ...task, stage: "done" }, "a"), {
    id: "a", ref: "5", repo: "o/r", title: "T", subtasks: [], etaFrom: "", etaTo: "2026-11-20",
  });
  assert.deepEqual(taskToRow({ ...task, kind: "pr" }, "a"), { id: "a", ref: "5", repo: "o/r", title: "T" });
});

test("migrateTask splits the old status into stage and flag", () => {
  assert.deepEqual(migrateTask({ id: "t", status: "blocked" }), { id: "t", stage: "inProgress", flag: "blocked" });
  assert.deepEqual(migrateTask({ id: "t", status: "todo" }), { id: "t", stage: "notStarted", flag: "" });
  const current = { id: "t", stage: "done", flag: "" };
  assert.equal(migrateTask(current), current);
});

test("sortTasks orders by priority then ETA, or ETA then priority, empties last", () => {
  const a = { id: "a", priority: "low", eta: "2026-11-12" };
  const b = { id: "b", priority: "high", eta: "" };
  const c = { id: "c", priority: "", eta: "2026-11-11" };
  const d = { id: "d", priority: "high", eta: "2026-11-15" };
  const ids = (list) => list.map((x) => x.id).join("");
  assert.equal(ids(sortTasks([a, b, c, d], "priority")), "dbac");
  assert.equal(ids(sortTasks([a, b, c, d], "eta")), "cadb");
  assert.equal(ids(sortTasks([a, b, c, d], "manual")), "abcd");
});

test("trackerInfo reads state, people and related PRs, deduped and open first", () => {
  const pr = (number, state, repo, extra = {}) => ({ number, url: `${repo}/${number}`, state, title: `P${number}`, repository: { nameWithOwner: repo }, author: { login: "joe" }, ...extra });
  assert.deepEqual(
    trackerInfo({
      __typename: "Issue", title: "T", state: "OPEN",
      assignees: { nodes: [{ login: "ana" }] },
      closedByPullRequestsReferences: { nodes: [pr(8, "MERGED", "o/r")] },
      timelineItems: {
        nodes: [
          { source: {} },
          { source: pr(8, "MERGED", "o/r") },
          { source: pr(8, "CLOSED", "o/other") },
          { subject: pr(9, "OPEN", "o/r", { isDraft: true, assignees: { nodes: [{ login: "leo" }] } }) },
        ],
      },
    }),
    {
      kind: "issue", title: "T", state: "open", assignees: ["ana"], author: "",
      prs: [
        { number: 9, url: "o/r/9", repo: "o/r", title: "P9", state: "draft", assignees: ["leo"], author: "joe" },
        { number: 8, url: "o/r/8", repo: "o/r", title: "P8", state: "merged", assignees: [], author: "joe" },
        { number: 8, url: "o/other/8", repo: "o/other", title: "P8", state: "closed", assignees: [], author: "joe" },
      ],
    },
  );
  assert.deepEqual(
    trackerInfo({ __typename: "PullRequest", title: "P", state: "CLOSED", isDraft: false, author: { login: "joe" }, assignees: { nodes: [] } }),
    { kind: "pr", title: "P", state: "closed", assignees: [], author: "joe", prs: [] },
  );
});

test("mergePrs adds manual PRs and drops hidden ones", () => {
  const a = { repo: "o/r", number: 1, state: "merged" };
  const b = { repo: "O/R", number: 2, state: "open" };
  const c = { repo: "o/r", number: 3, state: "" };
  assert.deepEqual(mergePrs([a, b], [c], ["o/r#2"]), [a, c]);
});

test("sameRef matches number and repo, ignoring repo case and ref form", () => {
  assert.equal(sameRef({ ref: "5", repo: "O/R" }, { ref: "#5", repo: "o/r" }), true);
  assert.equal(sameRef({ ref: "5", repo: "o/r" }, { ref: "x/y#5", repo: "o/r" }), false);
  assert.equal(sameRef({ ref: "", repo: "o/r" }, { ref: "", repo: "o/r" }), false);
});

test("daysBetween counts calendar days", () => {
  assert.equal(daysBetween("2026-10-30", "2026-11-02"), 3);
  assert.equal(daysBetween("2026-11-11", "2026-11-11"), 0);
});
