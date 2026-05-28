# Sync

Ingram Micro CRM syncs your data with Microsoft Dynamics 365 so your local data stays up to date with the company CRM.

## How Sync Works

Sync is a two-way process:

- **Pull** — Downloads customer, contact, and opportunity data from D365 into the app, plus ARR (Annual Recurring Revenue) from the Power BI dashboard
- **Push** — Uploads your locally created or updated activities, follow-ups, and opportunities to D365

## Automatic Sync

By default, the app syncs automatically in the background at regular intervals. From **Settings > Sync** you can configure:

- **Pause auto-sync** — Temporarily stop every background sync without losing your interval values
- **Auto-sync on launch** — Sync immediately when the app starts
- **Sync on window focus** — Refresh when you return to the app (debounced to once every 5 minutes)
- **Sync interval** — How often a full background sync runs (5–120 minutes)
- **Pending push interval** — How often pending local changes are pushed to D365 (5–120 minutes)
- **Power BI refresh interval** — How often Power BI revenue and insights refresh on their own (30–720 minutes)
- **Show sync toasts** — Whether to display notifications when a sync completes or fails
- Quick-preset buttons next to each interval let you set common values with one click. Values typed outside the allowed range are clamped automatically and shown to you instead of being silently dropped.

## Sync Scope

You can choose which parts of a sync actually run. Toggle each in **Settings > Sync > Sync scope**:

- **Customers & activities (Dynamics 365)** — Pull customers, contacts, activities, opportunities, and follow-ups
- **Revenue & insights (Power BI)** — Pull ARR totals, insights, and ARR movement snapshots
- **Push pending changes** — Send your local edits back to Dynamics 365

Turning a scope off skips that part of every automatic sync; manual buttons honour your choices too.

## Sync History Retention

Sync history is automatically cleaned up on app start. Choose how long to keep entries in **Settings > Sync > History** (7–365 days, default 90).

## Manual Sync

To trigger a sync manually:

1. Go to the **Sync** page from the sidebar
2. Click **Run Full Sync**

The button shows a loading spinner while syncing. It's disabled when you're offline.

## Sync Status

The Sync page shows:

- **Last sync time** — When the most recent successful sync happened
- **Pending activities** — How many activities are waiting to be pushed to D365
- **Pending follow-ups** — How many follow-ups are waiting to be pushed
- **Pending opportunities** — How many opportunity changes are waiting to be pushed
- **Online/Offline status** — Whether the app can reach D365

## Pending Queue

The Sync page includes a **Pending Queue** table showing each item waiting to be synced — its type, name, and the action (create, update, or delete). The table is paginated so you can browse through a large backlog. Once an item syncs successfully, it's removed from the queue.

## Sync History

A table at the bottom of the Sync page shows your recent sync runs, including:

- **Type** — What was synced (D365 pull, push activities, push follow-ups)
- **Status** — Running, Success, Partial, or Error
- **Start time** — When the sync started
- **Records pulled/pushed** — How many records were transferred
- **Error details** — If something went wrong, what happened

## Pending Items

Items waiting to sync show a small **"Pending sync"** badge in their respective lists (Activities, Follow-Ups). If a previous sync failed, you'll see an **error badge** instead. These items will retry on the next sync.

## Sidebar Badge

The **Sync** link in the sidebar shows an orange badge with the number of pending items, so you always know if data is waiting to be synced.

## Working Offline

You can use the app fully offline. All data is stored locally, and any changes you make are queued for sync. When you reconnect to the internet, the app will sync automatically (if auto-sync is enabled) or you can trigger it manually.
