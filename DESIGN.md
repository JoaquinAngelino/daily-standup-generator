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
  tape-grey: "#5f6670"
  tape-black: "#15171a"
  on-yellow: "#1b1500"
  on-tape: "#ffffff"
  red-text: "#ad281c"
  green-text: "#17703f"
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
    fontSize: "19px"
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
    fontFamily: "Barlow Condensed, Barlow, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "0.08em"
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
  none: "0px"
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
    backgroundColor: "{colors.tape-green}"
    textColor: "{colors.on-tape}"
    typography: "{typography.stage}"
    rounded: "{rounded.none}"
    padding: "0 12px"
    height: "32px"
  tape-stage-in-progress:
    backgroundColor: "{colors.tape-yellow}"
    textColor: "{colors.on-yellow}"
    typography: "{typography.stage}"
    rounded: "{rounded.none}"
    padding: "0 12px"
    height: "32px"
  tape-stage-upcoming:
    backgroundColor: "{colors.tape-blue}"
    textColor: "{colors.on-tape}"
    typography: "{typography.stage}"
    rounded: "{rounded.none}"
    padding: "0 12px"
    height: "32px"
  tape-stage-pr-review:
    backgroundColor: "{colors.tape-red}"
    textColor: "{colors.on-tape}"
    typography: "{typography.stage}"
    rounded: "{rounded.none}"
    padding: "0 12px"
    height: "32px"
  number-tape:
    typography: "{typography.number}"
    rounded: "{rounded.none}"
    padding: "0 8px"
    width: "132px"
    height: "40px"
  number-tape-error:
    backgroundColor: "{colors.tape-red}"
    textColor: "{colors.on-tape}"
  generate-tape:
    backgroundColor: "{colors.tape-black}"
    textColor: "{colors.on-tape}"
    typography: "{typography.generate}"
    rounded: "{rounded.none}"
    width: "100%"
    height: "56px"
  mark:
    textColor: "{colors.on-tape}"
    typography: "{typography.mark}"
    rounded: "{rounded.none}"
    padding: "0 7px"
    height: "22px"
  mark-pending:
    backgroundColor: "{colors.tape-yellow}"
    textColor: "{colors.on-yellow}"
  mark-grey:
    backgroundColor: "{colors.tape-grey}"
  button:
    backgroundColor: "{colors.field}"
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.none}"
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
    rounded: "{rounded.none}"
    size: "32px"
  input:
    backgroundColor: "{colors.field}"
    textColor: "{colors.ink}"
    typography: "{typography.control}"
    rounded: "{rounded.none}"
    padding: "0 9px"
    height: "36px"
  input-compact:
    height: "30px"
  swatch:
    width: "22px"
    height: "12px"
---

# Design System: Daily Standup Generator

## Overview

**Creative North Star: "Label Tape"**

Every item wears a printed label whose tape colour is its stage. The surface is a cool grey work bench; on it sit strips of label-maker vinyl rendered flat at full saturation, with no gloss, emboss or bevel imitation. Moving an item on reprints its number tape in the next stage's colour with one short feed-and-press. The issue number is the headline of each row; the fetched title sits beside it in plain Barlow.

The system is quiet everywhere except the tape. Neutrals are cool greys, edges are 1px hairlines, and corners are square throughout. Rows in a lane are separated by one hairline each; there are no cards and no nesting. Colour belongs to the stage family. Any other colour in the build is a text-safe or semantic version of a stage hue.

Light and dark are both first-class and follow `prefers-color-scheme`. In dark, the ground drops to near-black graphite and the tape hues keep their saturation. The black action tape gains a 1px rule edge so it still reads against the dark panel.

**Key Characteristics:**
- Flat, full-saturation stage tapes: green Completed, yellow In Progress, blue Upcoming, red PR Review, near-black for the primary action.
- Barlow Condensed on tape faces and counts; Barlow for everything else; monospace only for the Markdown output.
- No radius anywhere; 1px hairline rules and tape edges are the only boundaries.
- State shows on the tape itself: a failed fetch strikes the tape red, and a reported Completed item turns into a spent outline.
- Dense but airy work column beside a docked output panel; a single column on small screens.

## Colors

A cool grey bench under four saturated vinyl hues and one near-black, with nothing else allowed to compete.

### Primary
- **Bench Black Tape** (tape-black): the Generate standup tape, the single primary action. In dark it becomes `#0b0c0e` with a `#4a505a` inset edge.

### Secondary (stage tapes)
- **Completed Green** (tape-green): the Completed stage head and number tapes, the move-to-Completed swatch, and Merged/Approved review marks. Dark: `#1f9253`.
- **In Progress Yellow** (tape-yellow): the In Progress stage tapes, the move-to-In Progress swatch, the Pending review mark, and text selection. It always takes **Carbon on Yellow** (on-yellow) text, never white. It is unchanged in dark.
- **Upcoming Blue** (tape-blue): the Upcoming stage tapes. Dark: `#2b6bd3`.
- **PR Review Red** (tape-red): the PR Review stage tapes, the Changes Requested mark, and a number tape whose fetch failed. Dark: `#d8402f`.
- **Spent Grey Tape** (tape-grey): Draft/Closed review marks only. Dark: `#59606a`.

### Tertiary (text-safe stage tints)
- **Ink Red** (red-text): error titles, error status lines and the 1px-outlined error banner. Dark: `#ff8f82`.
- **Ink Green** (green-text): the success status line and the outline and numerals of a spent Completed tape. Dark: `#6fd39b`.

### Neutral
- **Cool Bench** (ground): page ground. Dark: `#16181b`.
- **Panel Grey** (panel): top bar, settings drawer and the output panel. Dark: `#1d2024`.
- **Field White** (field): inputs, selects and outline buttons. Dark: `#24282d`.
- **Ink** (ink): body text, button strokes, focus rings and checkbox accent. Dark: `#eceef1`.
- **Slate Muted** (muted): secondary text, counts, meta labels, placeholders, hints, the select chevron and the input hover stroke. Dark: `#a3aab4`.
- **Hairline** (rule): every 1px divider and input stroke. Dark: `#363b43`.

### Named Rules
**The Tape Is The Stage Rule.** Each saturated hue means one stage: green Completed, yellow In Progress, blue Upcoming, red PR Review. Review-state marks reuse the same mapping (green merged/approved, yellow pending, red changes requested, grey draft/closed). Never use a stage hue as decoration.

**The Dark Ink On Yellow Rule.** Yellow tape always carries on-yellow text. White text is reserved for blue, green, red, grey and black tape.

## Typography

**Display Font:** Barlow Condensed 600/700 (with Barlow, system-ui)
**Body Font:** Barlow 400/500/600 (with system-ui)
**Label/Mono Font:** ui-monospace stack, only in the Markdown output

All faces are self-hosted woff2 under the OFL.

**Character:** Barlow Condensed in tracked caps reads as embossed label-maker type. Barlow, its own sibling, keeps the working text plain and close in proportion.

### Hierarchy
- **Generate** (700, 26px, 1, 0.06em, uppercase): the Generate standup tape only.
- **Number** (700, 24px, 0.05em, uppercase): the issue or PR number typed directly on its tape and centred.
- **Stage** (700, 19px, 1, 0.06em, uppercase): lane-opening stage tapes.
- **Count** (600, 17px, 1, 0.04em, tabular numerals, sentence case, muted): the item count beside a stage tape.
- **Mark** (700, 14px, 1, 0.08em, uppercase): PR review-state marks.
- **Title** (600, 18px, 1.2): the app name and the Output heading.
- **Item title** (500, 16px, 1.35): the fetched issue or PR title, wrapping anywhere. Placeholder, fetching and error titles drop to 14px.
- **Body** (400, 15px, 1.5): base text.
- **Control** (400, 14px, 1.3, tabular numerals): inputs and selects. In row meta and subtasks they use 13.5px.
- **Button** (600, 14px, 1): outline and text buttons. Small text buttons use 13px and muted.
- **Small** (400, 13px, 1.45): hints, status lines, notes, repo select and meta labels (meta labels at 500).
- **Field label** (600, 11px, 1, 0.08em, uppercase, muted): only for a label bound to a settings input.
- **Mono** (13px, 1.65): the editable Markdown output.

### Named Rules
**The Condensed Belongs To Tape Rule.** Barlow Condensed appears only on tape faces (stage heads, numbers, marks, Generate) and on lane counts. Headings, titles, buttons and controls stay in Barlow.

## Layout

Two columns on desktop. The work column is flexible (content max 1040px, padding 28px 32px 72px, lanes 40px apart). The output panel is docked right at `clamp(360px, 32vw, 480px)`, sticky and full height, with its head, its Markdown, and the Generate tape anchored at its foot. The top bar and settings drawer sit on panel grey above the work column, with 32px side gutters. Settings lay out as auto-fit columns with a minimum of 280px.

The four lanes appear in a fixed order: Completed, In Progress, Upcoming, PR Review. A lane head holds the stage tape, the count, lane tools pushed right, and the add action. Each row is a grid: the number tape (132px) spans two rows on the left, then the title block, the actions, and a remove control, with one compact meta line below. Subtasks are indented 148px to align under the title, and each starts with a 12px muted dash.

The rhythm is built on 6, 8, 10, 12, 14, 16, 20, 24, 32 and 40px. Rows have 14px vertical padding. The panel's internal padding is 20px.

At 960px or below, the layout becomes one column, the output follows the lanes, and the Markdown keeps a minimum height of 320px. At 640px or below, gutters drop to 16px, the number tape narrows to 104px and sits on the first row, actions and meta wrap to full-width rows beneath it, and the subtask indent goes to zero.

### Named Rules
**The One Hairline Rule.** Rows are separated by a single 1px rule, and each lane's list opens with one rule on top. Never box a row or nest a card inside a lane.

## Elevation & Depth

The system is flat. There are no drop shadows, no offset shadows and no blur. The panel and the ground differ by tone alone, and borders are 1px hairlines. The only box-shadows are 1px inset edges that act as tape edges: the dark-theme black tape's rule edge, and the outline of a spent Completed tape.

### Shadow Vocabulary
- **Tape edge** (`box-shadow: inset 0 0 0 1px var(--black-edge)`): the black tape in dark. It is transparent in light.
- **Spent outline** (`box-shadow: inset 0 0 0 1px currentColor`): a reported Completed number tape, with the fill removed.

### Named Rules
**The Flat Vinyl Rule.** Tape is flat colour. Never add gloss, gradients, emboss or lifting shadows.

## Shapes

Every corner is square: 0px radius on tapes, buttons, inputs, selects, banners and swatches. Form is made by rectangles of flat colour and 1px strokes. Icons are 16px stroked SVG paths (1.75 stroke, square caps), drawn as x, plus and arrow. The select chevron uses the same stroke.

### Named Rules
**The No Radius Rule.** Radius is zero everywhere. Edges are hairlines or the edges of the tape.

## Components

### Tape (signature)
Flat vinyl strips in tracked condensed caps.
- **Stage tape:** a minimum height of 32px with 12px side padding, used as the lane `h2`, in the stage colour.
- **Number tape:** 132x40px (104px on mobile) in the lane's stage colour. It is an editable input with a centred 24px number, a placeholder at 55% opacity, and a 2px ink focus outline offset by 2px on the tape.
- **Reprint:** when an item moves, its new tape feeds in from the left with a `clip-path` wipe over 420ms. A 260ms press to 0.94 scale follows, both on `cubic-bezier(0.16, 1, 0.3, 1)`. Both are removed under reduced motion.
- **Error:** the tape turns red and the number is struck through with a 2px line.
- **Spent:** the fill is removed, and the tape shows a 1px green-text inset outline with green-text numerals. The title goes muted, and a "Reported" note follows.

### Generate tape
The black tape fills the full width at 56px height and 26px type. On press, it scales to 0.985 over 120ms. While busy, a 3px currentColor feed bar sweeps across its bottom edge every 900ms, and the cursor shows progress. It is the only filled button.

### Buttons
- **Shape:** square (0px), 36px high, 12px side padding.
- **Outline:** field background, 1px ink stroke, ink 600 text. Used for Settings, Copy for Slack, Copy for GitHub, Move to, Clear and Clear reported.
- **Hover / expanded:** fully inverted (ink fill, ground text) over 120ms. Settings also stays inverted while open.
- **Move:** an outline button that names the next stage and leads with a 22x12px swatch in that stage's tape colour.
- **Text button:** no box. A 1px underline fades in on hover at a 4px offset. The small variant (13px) starts muted and goes to ink on hover, and can lead with a 14px plus icon.
- **Icon button:** a 32px square, muted, with no visible border until hover (rule stroke, ink icon).

### Marks
A PR review state shows as a small tape beside the title: 22px high, 7px padding, 14px condensed caps. The colour follows The Tape Is The Stage Rule, but green and red marks use the deeper Mark Green `#17703f` and Mark Red `#b52e22` in both themes, so white 14px caps keep 4.5:1. A mark is hidden while the row is in error.

### Inputs / Fields
- **Style:** field background, 1px rule stroke, 0px radius, 36px high (30px in row meta and subtasks), tabular numerals.
- **Hover:** the stroke darkens to muted.
- **Focus:** a global 2px ink outline, offset by 2px. The output textarea uses a -2px offset.
- **Select:** a custom stroked chevron, sized to its content in rows.
- **Repo select:** a ghost control (transparent stroke and fill, muted 13px) that shows its stroke only on hover.
- **Date:** 108px wide. An empty date is muted. The picker indicator stays hidden until hover or focus.

### Navigation
A top bar on panel grey with the app name (Title), today's date in muted, then the Settings outline button and the language select pushed right. A single hairline sits below it. Settings opens a drawer beneath on the same panel grey.

### Output panel
A panel-grey column with a left hairline. The head holds the Output heading and the two copy buttons. Below it come the editable mono Markdown, then the foot with a hint and the Generate tape. Errors appear as a 1px red-text outlined banner, never filled.

## Do's and Don'ts

### Do:
- **Do** give every item its number on a tape in its stage colour, and show state on that tape (red with strike-through for failure, outline for spent).
- **Do** keep the stage mapping fixed: green Completed, yellow In Progress, blue Upcoming, red PR Review, near-black for the single primary action.
- **Do** put on-yellow text on yellow tape and white text on every other tape.
- **Do** separate rows with one 1px hairline, and separate surfaces by tone (ground vs panel).
- **Do** name a move by the next stage, with a swatch of that stage's tape.
- **Do** keep the reprint motion short (420ms feed plus 260ms press), and drop it under reduced motion.

### Don't:
- **Don't** round any corner; radius is 0px.
- **Don't** add gloss, gradients, emboss or drop/offset shadows to tape. Only the 1px inset tape edge is allowed.
- **Don't** wrap rows in cards or nest bordered boxes inside a lane.
- **Don't** use Barlow Condensed outside tape faces and lane counts.
- **Don't** introduce a hue outside the stage family. Status and error colour comes from the red-text and green-text tints.
- **Don't** add a second filled action next to the Generate tape.
