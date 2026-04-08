# Kanban Card Redesign — Contact Name in Header

## Problem

The contact name on activity kanban cards is rendered as a `Badge variant="secondary"` pill below the description. This looks like a button, draws too much visual attention for secondary info, and clashes with the card's overall aesthetic.

## Design

Move the contact name into the header row, inline with the type badge, separated by a dot. Color the contact name to match the activity type (softened tint).

### Card layout (top to bottom)

1. **Header row** — icon circle, type badge, optional dot + contact name (activity-tinted)
2. **Subject** — semibold, wraps naturally (no clamp)
3. **Description** — muted, clamped to 2 lines
4. **Footer** (pinned to bottom) — creator name left, date right

### Contact name behavior

- Present: `Icon · Type Badge · Contact Name` — contact color matches activity type
- Absent: `Icon · Type Badge` — no filler, no fallback

### Contact name colors (by type)

- Call: `text-activity-call` (softened green)
- Meeting: `text-activity-meeting` (softened purple)
- Visit: `text-activity-visit` (softened cyan)
- Note: `text-activity-note` (softened amber)

### Footer pinning

Card uses `flex flex-col` layout. Footer uses `mt-auto` to pin to the bottom regardless of content height.

## Scope

- **Changed:** `src/components/activities/ActivityKanbanCard.tsx`
- **Unchanged:** `ActivityItem.tsx` (list view already uses inline dot pattern), `ActivityKanbanBoard.tsx`, kanban base components

## Out of scope

- Activity detail popup (noted as future feature)
- List view changes
- Subject line clamping
