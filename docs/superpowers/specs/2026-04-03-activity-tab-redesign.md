# Activity Tab Redesign — Collapsible Kanban + Date Filter

## Problem

The activity kanban board has 4 fixed-width columns (256px each) that overflow the available content area when combined with the 340px customer sidebar. Empty columns (Rejected, Expired) waste space. High-volume columns (Completed with 100+ items) are unmanageable without filtering.

## Solution

Two changes to the existing activity kanban:

### 1. Date Range Filter

- Add a filter bar above the kanban board inside `ActivitiesTabContent`
- Date range picker defaulting to "last 3 months" from today
- Filters activities by their `scheduledEnd` (or `actualEnd` for completed)
- Updates the tab header count to reflect filtered total (e.g. "Activities (12)" instead of "Activities (106)")
- Filter state is local component state — resets on navigation away

### 2. Collapsible Columns

- Columns with **0 activities** (post-filter) auto-collapse to a ~40px wide vertical strip
  - Shows: status icon + count badge (0) at the top, label text rotated vertically below
  - Click to expand (needed as drag-and-drop target)
  - Dragging a card over a collapsed column expands it automatically
- Columns with **1+ activities** stay expanded
  - Use `flex: 1` instead of fixed `w-64`
  - Minimum width: `min-w-[180px]`
- Remove `flex-shrink-0` from `KanbanBoardColumn` when used in activity context (keep the base component backward-compatible)

## Components Affected

| File | Change |
|------|--------|
| `src/components/activities/ActivitiesTabContent.tsx` | Add date filter bar, pass filtered activities down |
| `src/components/activities/ActivityKanbanBoard.tsx` | Accept filtered activities, add collapsible column logic, fluid widths |
| `src/components/kanban.tsx` | Allow column className override for collapsed state (no breaking changes to base component) |

## Drag-and-Drop Behavior

- All 4 columns remain valid drop targets regardless of collapsed/expanded state
- Dragging over a collapsed column expands it to reveal the drop zone
- Dropping into a newly-expanded column triggers the same `onStatusChange` as before
- No changes to `KanbanBoardProvider` or drag event handling

## Date Filter Details

- UI: Simple date range picker (from/to inputs or a preset dropdown)
- Presets: "Last 3 months" (default), "Last 6 months", "Last year", "All time"
- Filtering logic: compare activity date against range, applied before passing to `ActivityKanbanBoard`
- "All time" disables filtering (shows all activities, current behavior)

## Out of Scope

- Persisting filter across sessions
- Server-side filtering
- Changes to other tabs or the notes section
- Changes to the activity card design
