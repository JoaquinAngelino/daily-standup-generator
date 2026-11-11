---
version: 1
slug: "index-html"
primary_target: "index.html"
related_targets: []
---

# Surface brief: standup workspace (index.html)

## Scope and mode
The single app screen: settings, four stage lanes, Generate, output with Copy for Slack / Copy for GitHub. Mode: Operate.

## Task
Each workday morning the owner opens the page, carries yesterday's items forward (move per item to the next stage, clear reported Completed items), adds new numbers, generates, and pastes into Slack or GitHub. Pain today: entry is slow, carry-over is manual, layout reads as a clunky form. Avoid: too dense, decorative.

## Must stay
Every feature and the output format (PRODUCT.md). EN/ES. Light and dark.

## Direction contract
THESIS: Each item wears a printed label whose tape colour is its stage, and moving it on reprints the label; refuses the category's grey form of stacked boxes and the kanban-card board.

OWN-WORLD: Label-maker vinyl rendered flat at full saturation on a cool grey work surface (no CSS gloss or emboss imitation): blue Upcoming, yellow In Progress, green Completed, red PR Review, near-black for the primary action in both themes (dark theme adds a 1px rule edge). Tape face Barlow Condensed caps, crisp, used only for issue numbers, counts, stage heads, review-state marks and the Generate tape; body Barlow. No radius anywhere; edges are 1px rules or tape edges. Rows split by single hairlines, never nested cards. Nothing else carries colour.

STORY: The owner sees yesterday's standup already laid out by stage, reads each row by its number, moves finished work along, adds today's numbers, generates and copies in under two minutes.

FIRST VIEWPORT: Top bar: name, today's date, Settings, language. Left work column: four lanes in stage order (Completed, In Progress, Upcoming, PR Review), each opened by its stage tape with count and add action in the head; rows lead with the number on stage tape (display size), the title beside it, one compact meta line of inline values (repo, ETA range), one-line subtasks, a move button naming the next stage by its tape swatch; PR rows carry their review state as a soft tinted chip. Right docked panel: Output heading with both copy buttons on its line, the Markdown, and the black Generate tape anchored at its foot. Mobile: one column, output after lanes.

FORM: Label Tape, candidate 6 of 7 on the ordered list; seed key 691d7d05. Signature move: moving an item reprints its number tape in the next stage colour with one short press animation. Raises: number as headline; one hairline row system; no radius, states as marks; full-strength palette; state marked on the tape itself (failed fetch strikes the tape red, reported Completed shows spent); progress named by the next tape's colour.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
