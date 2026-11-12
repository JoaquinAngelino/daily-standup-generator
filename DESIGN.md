---
name: Daily Standup Generator
description: Yesterday's standup, laid out by stage on label-maker tape, edited and regenerated each morning.
colors:
  ground: "#e8eaed"
  panel: "#f6f7f8"
  field: "#ffffff"
  ink: "#15171a"
  muted: "#565d67"
  rule: "#c7ccd3"
  tape-blue: "#1f5fc4"
  tape-yellow: "#f2c014"
  tape-green: "#1d8a4e"
  tape-red: "#d2392b"
  tape-black: "#15171a"
  on-yellow: "#1b1500"
  on-tape: "#ffffff"
  red-text: "#ad281c"
  green-text: "#146538"
  yellow-text: "#7a5b00"
  blue-text: "#1a4f9f"
  tint-green: "#1d8a4e24"
  tint-yellow: "#f2c01424"
  tint-blue: "#1f5fc424"
  tint-red: "#d2392b24"
  tint-muted: "#565d671f"
typography:
  generate:
    fontFamily: "Barlow Condensed, Barlow, system-ui, sans-serif"
    fontSize: "26px"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "0.06em"
  number:
    fontFamily: "Barlow Condensed, Barlow, system-ui, sans-serif"
    fontSize: "24px"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "0.05em"
  stage:
    fontFamily: "Barlow Condensed, Barlow, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "0.06em"
  count:
    fontFamily: "Barlow Condensed, Barlow, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "0.04em"
    fontFeature: "tnum"
  mark:
    fontFamily: "Barlow, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 500
    lineHeight: 1
  title:
    fontFamily: "Barlow, system-ui, sans-serif"
    fontSize: "18px"
    fontWeight: 600
    lineHeight: 1.2
  item-title:
    fontFamily: "Barlow, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 500
    lineHeight: 1.35
  body:
    fontFamily: "Barlow, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.5
  control:
    fontFamily: "Barlow, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.3
    fontFeature: "tnum"
  button:
    fontFamily: "Barlow, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 600
    lineHeight: 1
  small:
    fontFamily: "Barlow, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.45
  field-label:
    fontFamily: "Barlow, system-ui, sans-serif"
    fontSize: "11px"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "0.08em"
  mono:
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.65
rounded:
  control: "6px"
  tape: "8px"
  pill: "11px"
  full: "50%"
spacing:
  tight: "6px"
  sm: "8px"
  md: "12px"
  row: "14px"
  lg: "16px"
  panel: "20px"
  xl: "24px"
  gutter: "32px"
  lane: "40px"
components:
  tape-stage-completed:
    backgroundColor: "{colors.tint-green}"
    textColor: "{colors.green-text}"
    typography: "{typography.stage}"
    rounded: "{rounded.tape}"
    padding: "0 12px"
    height: "30px"
  tape-stage-in-progress:
    backgroundColor: "{colors.tint-yellow}"
    textColor: "{colors.yellow-text}"
    typography: "{typography.stage}"
    rounded: "{rounded.tape}"
    padding: "0 12px"
    height: "30px"
  tape-stage-upcoming:
    backgroundColor: "{colors.tint-blue}"
    textColor: "{colors.blue-text}"
    typography: "{typography.stage}"
    rounded: "{rounded.tape}"
    padding: "0 12px"
    height: "30px"
  tape-stage-pr-review:
    backgroundColor: "{colors.tint-red}"
    textColor: "{colors.red-text}"
    typography: "{typography.stage}"
    rounded: "{rounded.tape}"
    padding: "0 12px"
    height: "30px"
  number-tape:
    typography: "{typography.number}"
    rounded: "{rounded.tape}"
    padding: "0 8px"
    width: "132px"
    height: "40px"
  number-tape-error:
    backgroundColor: "{colors.tint-red}"
    textColor: "{colors.red-text}"
  generate-tape:
    backgroundColor: "{colors.tape-black}"
    textColor: "{colors.on-tape}"
    typography: "{typography.generate}"
    rounded: "{rounded.tape}"
    width: "100%"
    height: "56px"
  mark:
    backgroundColor: "{colors.tint-muted}"
    textColor: "{colors.muted}"
    typography: "{typography.mark}"
    rounded: "{rounded.pill}"
    padding: "0 9px"
    height: "22px"
  button:
    backgroundColor: "{colors.field}"
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.control}"
    padding: "0 12px"
    height: "36px"
  button-hover:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.ground}"
  button-text:
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    padding: "6px 0"
  icon-button:
    textColor: "{colors.muted}"
    rounded: "{rounded.control}"
    size: "32px"
  input:
    backgroundColor: "{colors.field}"
    textColor: "{colors.ink}"
    typography: "{typography.control}"
    rounded: "{rounded.control}"
    padding: "0 9px"
    height: "36px"
  input-compact:
    height: "30px"
  banner:
    textColor: "{colors.red-text}"
    rounded: "{rounded.control}"
    padding: "10px 12px"
  swatch:
    rounded: "{rounded.full}"
    size: "8px"
---

# Design System: Daily Standup Generator

## Overview

**Creative North Star: "Label Tape"**

Each lane opens with a printed label whose tape colour is its stage; the items inside carry neutral number tapes, since the lane already names their state. The surface is a cool grey work bench; on it sit strips of label-maker tape rendered as soft, flat tints of the stage hue with the type printed in that hue's deep, text-safe tone, with no gloss, emboss or bevel imitation. Moving an item on reprints its number tape in the next lane with one short feed-and-press. The issue number is the headline of each row; the fetched title sits beside it in plain Barlow.

The system is quiet everywhere except the tape. Neutrals are cool greys, edges are 1px hairlines, tapes have gently rounded corners and controls slightly tighter ones. Rows in a lane are separated by one hairline each; there are no cards and no nesting. Colour belongs to the stage family and identifies the section. Any other colour in the build is a text-safe or semantic version of a stage hue.

Light and dark are both first-class and follow `prefers-color-scheme`. In dark, the ground drops to near-black graphite, the tints rise from 14% to 20% of the hue, and the text-safe tones turn light. The solid black action tape gains a 1px rule edge so it still reads against the dark panel.

**Key Characteristics:**
- Each lane is a rounded card (12px) washed in its stage hue at 4% with a 30% hue border and divider, titled in the hue's deep tone: green Completed, yellow In Progress, blue Upcoming, purple PR Review. The primary action alone is a solid near-black tape with white text.
- Barlow Condensed on tape faces and counts; Barlow for everything else; monospace only for the Markdown output.
- Two radii: 8px on tapes, 6px on controls; 1px hairline rules and tape edges are the only boundaries.
- State shows on the tape itself: a failed fetch strikes the tape red, and a reported Completed item turns into a spent outline.
- Dense but airy work column beside a docked output panel; a single column on small screens.

## Colors

A cool grey bench under four soft stage tints, each printed in its own deep tone, and one solid near-black, with nothing else allowed to compete.

### Primary
- **Bench Black Tape** (tape-black): the Generate standup tape, the single primary action and the only solid-filled tape. It carries **Tape White** (on-tape) text. In dark it becomes `#0b0c0e` with a `#4a505a` inset edge.

### Secondary (stage hues)
Stage hues are never laid down solid. A tape is the hue mixed into transparency (`color-mix(in srgb, hue var(--tint), transparent)`), 14% in light and 20% in dark; the tint-* tokens record the light result.
- **Completed Green** (tape-green, tint-green): the Completed lane card and title, and the move-to-Completed swatch. Dark: `#1f9253`.
- **In Progress Yellow** (tape-yellow, tint-yellow): the In Progress lane card and title, the move-to-In Progress swatch, and text selection. It is unchanged in dark.
- **Upcoming Blue** (tape-blue, tint-blue): the Upcoming lane card and title. Dark: `#2b6bd3`.
- **PR Review Purple** (purple `#8250df`, text `#6639ba`): the PR Review lane card and title. Dark: `#9a6ff0`, text `#c4a5f5`. Purple follows GitHub's pull-request colour and keeps red free for errors.
- **Error Red** (tape-red, tint-red): a number tape whose fetch failed. Dark: `#d8402f`.

### Tertiary (text-safe stage tones)
- **Ink Green** (green-text): Completed tape text, the success status line, and the outline and numerals of a spent Completed tape. Dark: `#6fd39b`.
- **Ink Amber** (yellow-text): In Progress tape text. Dark: `#f0cd5a`.
- **Ink Blue** (blue-text): Upcoming tape text. Dark: `#93b8f3`.
- **Ink Red** (red-text): PR Review and error tape text, error titles, error status lines and the 1px-outlined error banner. Dark: `#ff8f82`.
- **Carbon on Yellow** (on-yellow): text selection only, on solid yellow. It is never tape text.
- **Tape White** (on-tape): Generate tape text only.

### Neutral
- **Cool Bench** (ground): page ground. Dark: `#16181b`.
- **Panel Grey** (panel): top bar, settings drawer and the output panel. Dark: `#1d2024`.
- **Field White** (field): inputs, selects and outline buttons. Dark: `#24282d`.
- **Ink** (ink): body text, button strokes, focus rings and checkbox accent. Dark: `#eceef1`.
- **Slate Muted** (muted, tint-muted): secondary text, counts, meta labels, placeholders, hints, the select chevron, the input hover stroke, and review marks (muted text on muted at 12%). Dark: `#a3aab4`.
- **Hairline** (rule): every 1px divider and input stroke. Dark: `#363b43`.

### Named Rules
**The Tape Is The Stage Rule.** Each stage hue identifies one section and nothing else: green Completed, yellow In Progress, blue Upcoming, purple PR Review. It appears as that section's tape tint, its text-safe tone on that tint, and the swatch of a move into that stage. Review-state marks carry no stage colour. The only other uses are semantic: red-text for errors and failed fetches, green-text for success and the spent outline. Never use a stage hue as decoration.

**The Tone On Tint Rule.** A tinted tape always carries its own section's text-safe tone (green-text, yellow-text, blue-text, red-text), never white or on-yellow. White belongs only to the solid Generate tape; on-yellow only to text selection.

## Typography

**Display Font:** Barlow Condensed 600/700 (with Barlow, system-ui)
**Body Font:** Barlow 400/500/600 (with system-ui)
**Label/Mono Font:** ui-monospace stack, only in the Markdown output

All faces are self-hosted woff2 under the OFL.

**Character:** Barlow Condensed in tracked caps reads as embossed label-maker type. Barlow, its own sibling, keeps the working text plain and close in proportion.

### Hierarchy
- **Generate** (700, 26px, 1, 0.06em, uppercase): the Generate standup tape only.
- **Number** (700, 24px, 0.05em, uppercase): the issue or PR number typed directly on its tape and centred.
- **Stage** (700, 19px, 1, 0.06em, uppercase): the lane title, in the stage's text tone.
- **Count** (600, 17px, 1, 0.04em, tabular numerals, sentence case, muted): the item count beside the lane title.
- **Mark** (Barlow 500, 13px, 1, sentence case): PR review-state chips.
- **Title** (600, 18px, 1.2): the app name and the Output heading.
- **Item title** (500, 16px, 1.35): the fetched issue or PR title, wrapping anywhere. Placeholder, fetching and error titles drop to 14px.
- **Body** (400, 15px, 1.5): base text.
- **Control** (400, 14px, 1.3, tabular numerals): inputs and selects. In row meta and subtasks they use 13.5px.
- **Button** (600, 14px, 1): outline and text buttons. Small text buttons use 13px and muted.
- **Small** (400, 13px, 1.45): hints, status lines, notes, repo select and meta labels (meta labels at 500).
- **Field label** (600, 11px, 1, 0.08em, uppercase, muted): only for a label bound to a settings input.
- **Mono** (13px, 1.65): the editable Markdown output.

### Named Rules
**The Condensed Belongs To Tape Rule.** Barlow Condensed appears only on tape faces (numbers, Generate), lane titles and on lane counts. Headings, titles, buttons and controls stay in Barlow.

## Layout

Two columns on desktop. The work column is flexible (content max 1040px, padding 28px 32px 72px, lanes 40px apart). The output panel is docked right at `clamp(360px, 32vw, 480px)`, sticky and full height, with its head, its Markdown, and the Generate tape anchored at its foot. The top bar and settings drawer sit on panel grey above the work column, with 32px side gutters. Settings lay out as auto-fit columns with a minimum of 280px.

The four lanes appear in a fixed order: Completed, In Progress, Upcoming, PR Review. Each lane is a tinted card (18px padding, 12px on mobile; lanes 28px apart). Its head holds the stage title, the count, lane tools pushed right, and the add action. Each row is a grid: the number tape (132px) spans two rows on the left, then the title block, the actions, and a remove control, with one compact meta line below. Subtasks are indented 148px to align under the title, and each starts with a 12px muted dash.

The rhythm is built on 6, 8, 10, 12, 14, 16, 20, 24, 32 and 40px. Rows have 14px vertical padding. The panel's internal padding is 20px.

At 960px or below, the layout becomes one column, the output follows the lanes, and the Markdown keeps a minimum height of 320px. At 640px or below, gutters drop to 16px, the number tape narrows to 104px and sits on the first row, actions and meta wrap to full-width rows beneath it, and the subtask indent goes to zero.

The Tracker view (`#tracker`) hides the output panel and uses one column. A bar above the lanes holds "Sort by" (priority, ETA, or order added) and "Refresh from GitHub". There are three lane cards: Not started (blue), In progress (yellow) and Done (green). A task row uses the same grid as a standup row:
- **GitHub line under the title:** a state mark with a coloured dot (open green, draft muted, merged purple; closed is purple for an issue and red for a PR), and the muted @assignees, or "by @author" when nobody is assigned.
- **Pill row:** section, status, priority and repo. A Blocked status is red text on a red wash at 12%.
- **Actions:** "Add to standup", or the "In standup" mark.
- **PR list (issues only):** below the row, at the same indent as subtasks. It has one line per PR that closes, is connected to or mentions the issue, with open PRs first. Each line holds a state mark that links to the PR (a PR from another repo is labelled with that repo's name), the title on one line with an ellipsis, the muted people, and a remove ×. It ends with a "+ Add PR" text button that opens a 220px number-or-URL input. On phones each line is a grid: the mark, the people and the × on the first row, and the title below.
- **Meta line:** the ETA (red text when it is past and the task is not done), an inline note, and the muted "Updated …" date.

On phones, the title block of a tracker row drops below the tape and spans the full width.

### Named Rules
**The One Hairline Rule.** Rows are separated by a single 1px rule, and each lane's list opens with one rule on top. Never box a row or nest a card inside a lane.

## Elevation & Depth

The system is flat. There are no drop shadows, no offset shadows and no blur. The panel and the ground differ by tone alone, tapes are translucent tints on whatever surface they sit, and borders are 1px hairlines. The only box-shadows are 1px inset edges that act as tape edges: the dark-theme black tape's rule edge, and the outline of a spent Completed tape.

### Shadow Vocabulary
- **Tape edge** (`box-shadow: inset 0 0 0 1px var(--black-edge)`): the black tape in dark. It is transparent in light.
- **Spent outline** (`box-shadow: inset 0 0 0 1px var(--rule)`, muted numerals): a reported Completed number tape, with the fill removed.

### Named Rules
**The Flat Vinyl Rule.** Tape is flat colour: one even tint, or solid near-black for Generate. Never add gloss, gradients, emboss or lifting shadows.

## Shapes

Corners are gently rounded on two steps. Lane cards take 12px. Tapes take 8px (number tapes, the spent outline and Generate); controls take 6px (inputs, selects, textarea, outline buttons, icon buttons and the error banner). Review marks are 11px pills on a 22px height, and the move swatch is an 8px circle. Form is made by tinted shapes and 1px strokes. Icons are 16px stroked SVG paths (1.75 stroke, square caps), drawn as x, plus and arrow. The select chevron uses the same stroke.

### Named Rules
**The Two Radii Rule.** Tapes are 8px, controls are 6px. The mark pill and the round swatch are the only other shapes; never introduce a third corner size or a sharp-cornered tape or control.

## Components

### Tape (signature)
Soft tinted strips in tracked condensed caps, 8px corners, text in the section's text-safe tone.
- **Lane card:** the `.lane` section: background hue at 4%, 1px border and head divider at hue 30%, 12px radius. The `h2` is plain condensed text in the stage's text tone, no tape. Rows divide with the neutral hairline; the last row has none.
- **Number tape:** 132x40px (104px on mobile), a neutral muted tint at 9% with ink numerals; stage hue stays on the lane head. A failed fetch turns it red tint with red-text. It is an editable input with a centred 24px number, a placeholder at 55% opacity, and a 2px ink focus outline offset by 2px on the tape. Tint and text colour ease over 240ms.
- **Reprint:** when an item moves, its new tape feeds in from the left with a `clip-path` wipe over 420ms. A 260ms press to 0.94 scale follows, both on `cubic-bezier(0.16, 1, 0.3, 1)`. Both are removed under reduced motion.
- **Error:** the tape turns to the red tint with red-text, and the numerals are struck through with a 2px line.
- **Spent:** the tint is removed, and the tape shows a 1px green-text inset outline with green-text numerals, keeping its 8px corners. The title goes muted, and a "Reported" note follows.

### Generate tape
The solid near-black tape, with white text and 8px corners, fills the full width at 56px height and 26px type. On press, it scales to 0.985 over 120ms. While busy, a 3px currentColor feed bar sweeps across its bottom edge every 900ms, and the cursor shows progress. It is the only filled button.

### Buttons
- **Shape:** slightly rounded (6px), 36px high, 12px side padding.
- **Outline:** field background, 1px ink stroke, ink 600 text. Used for Settings, Copy for Slack, Copy for GitHub, Move to, Clear and Clear reported.
- **Hover / expanded:** fully inverted (ink fill, ground text) over 120ms. Settings also stays inverted while open.
- **Move:** an outline button that names the next stage and leads with an 8px circular swatch in that stage's hue.
- **Text button:** no box. A 1px underline fades in on hover at a 4px offset. The small variant (13px) starts muted and goes to ink on hover, and can lead with a 14px plus icon.
- **Icon button:** 32px, 6px corners, muted, with no visible border until hover (rule stroke, ink icon).

### Marks
A PR review state shows as a neutral chip beside the title: 22px high, 11px radius, 9px side padding, 13px Barlow 500 in sentence case, muted text on muted at 12%. Every state looks the same apart from its words; marks carry no stage colour and no dot. A mark is hidden while the row is in error. The tracker's "In standup" mark is the same chip with a 13px check icon before the words.

### Inputs / Fields
- **Style:** field background, 1px rule stroke, 6px radius, 36px high (30px in row meta and subtasks), tabular numerals.
- **Hover:** the stroke darkens to muted.
- **Focus:** a global 2px ink outline, offset by 2px. The output textarea uses a -2px offset.
- **Select:** a custom stroked chevron, sized to its content in rows.
- **Inline text (tracker):** a free-text task title (an auto-growing textarea at title size) and the task note are borderless and transparent. A rule stroke appears on hover; on focus there is a muted stroke on the field background. The text lines up with the titles above.
- **Repo and status selects:** a 24px pill (muted at 12%, 12px radius, muted 12.5px/500 text, chevron) whose size never changes; hover deepens the fill to 22% and the text to ink.
- **Select picker:** where `appearance: base-select` is supported, every select opens a styled list below it: field background, 1px rule stroke, 8px radius, soft shadow, 6px-radius options with a muted hover wash and a green-text checkmark. Other browsers keep the native list.
- **Date:** 108px wide. An empty date is muted. The picker indicator stays hidden until hover or focus.

### Navigation
A top bar on panel grey with the app name (Title), the view tabs, today's date in muted, then the Settings outline button and the language select pushed right. A single hairline sits below it. The view tabs (Standup, Tracker) are hash links in a segmented control: a muted-at-12% track with 3px padding and an 8px radius. The current tab (`aria-current="page"`) is a field-white segment with ink text and a 1px soft shadow, and the other tab is muted text. Settings opens a drawer beneath on the same panel grey.

### Output panel
A panel-grey column with a left hairline. The head holds the Output heading and the two copy buttons. Below it come the editable mono Markdown, then the foot with a hint and the Generate tape. Errors appear as a 1px red-text outlined banner with 6px corners, never filled.

## Do's and Don'ts

### Do:
- **Do** give every item its number on a tape in its stage tint, and show state on that tape (red tint with strike-through for failure, green-text outline for spent).
- **Do** keep the stage mapping fixed: green Completed, yellow In Progress, blue Upcoming, purple PR Review, solid near-black for the single primary action.
- **Do** print tinted tape in its own section's text-safe tone (green-text, yellow-text, blue-text, red-text); white text only on the Generate tape.
- **Do** use 8px corners on tapes and 6px on controls.
- **Do** separate rows with one 1px hairline, and separate surfaces by tone (ground vs panel).
- **Do** name a move by the next stage, led by an 8px circular swatch in that stage's hue.
- **Do** keep review marks neutral (muted text on muted at 12%).
- **Do** keep the reprint motion short (420ms feed plus 260ms press), and drop it under reduced motion.

### Don't:
- **Don't** fill a lane or tape with solid hue or put white or on-yellow text on a tint.
- **Don't** use square corners or a third radius on tapes and controls.
- **Don't** colour review marks by stage or state; colour identifies the section only.
- **Don't** add gloss, gradients, emboss or drop/offset shadows to tape. Only the 1px inset tape edge is allowed.
- **Don't** wrap rows in cards or nest bordered boxes inside a lane.
- **Don't** use Barlow Condensed outside tape faces and lane counts.
- **Don't** introduce a hue outside the stage family. Status and error colour comes from the red-text and green-text tones.
- **Don't** add a second filled action next to the Generate tape.
