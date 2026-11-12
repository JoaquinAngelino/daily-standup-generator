# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primarily one developer (the repo owner) on the rhuang projects (`juristium-clone`, `jdivorce-ui`), writing their own standup update every working morning. Teammates may use it occasionally; it is not a public product.

## Product Purpose

Turns a short list of GitHub issue and PR numbers into the team's standup update, with titles, links, ETAs and PR review status filled in from GitHub. Success: the morning standup is ready to paste in a minute or two, and every link, title and status in it is correct.

## Positioning

The user types numbers and dates; GitHub supplies everything else (titles, links, linked issues, review state). The list survives from one day to the next, so each morning is an edit of yesterday's standup rather than a fresh entry.

## Operating Context

- Used each workday morning, just before standup, in a desktop browser.
- Output is pasted into Slack (rich text) or GitHub (Markdown); both are first-class.
- Items move across days: Upcoming, then In Progress, then Completed, then dropped. PRs under review come and go.
- Current pain points (2026-11): entering items each morning takes too long, carrying items over between sections is manual, and the layout reads as a clunky form.

## Capabilities and Constraints

- Sections: Completed (ETA range, subtasks), In Progress and Upcoming (ETA, subtasks), PR Review (PR plus repo).
- Tracker tab (`#tracker`): a longer-lived list of issues, PRs or free-text tasks in three sections (Not started, In progress, Done).
  - Each task shows its GitHub state (open, draft, closed or merged), its assignees and, for issues, the PRs that close, are connected to or mention it, with their states. This is refreshed from GitHub the first time the tab opens, or on demand.
  - Each task can have a status (Blocked, Waiting for review, Waiting for info, On hold), a priority, an ETA and a short note.
  - Lanes sort by priority, by ETA, or in the order added.
  - A task can be added to the matching standup lane (PRs go to PR Review), and each issue or PR may be tracked only once.
- References accepted as `123`, `owner/repo#123`, or a GitHub issue/PR URL; repos are configured in the app, the first being the default.
- The output format is a team convention and must not change: `### Section` headings; `- **GitHub Issue:** [n](url) — title`; nested `**ETA:**`, `**Subtask description:**`; PR items with `**GitHub Issue:**` and `**Status:**`.
- Static site on GitHub Pages: plain HTML, CSS and JavaScript modules, no build step, no backend. All state (rows, settings, token) lives in the browser and survives restarts.
- Read-only GitHub access through a user-supplied token (REST for issues, GraphQL for PRs).
- UI languages: English and Spanish. Generated standup text is always English.

## Product Principles

- Each morning is an edit of yesterday, never a re-entry.
- Type numbers, not facts: anything GitHub knows is fetched, never typed.
- The pasted text is a contract with the team; the interface can change freely, the output format cannot.
- One bad item never blocks the standup: failures are reported per item and the rest still generates.
