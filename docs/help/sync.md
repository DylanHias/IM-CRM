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

Open the **Sync** page from your account menu (click your name at the bottom of the sidebar), or click the **pending** label in the title bar. At the top right:

- **Run full sync** — pulls everything from Dynamics 365 and Power BI and sends your changes. It shows a spinner while it runs.
- **Push pending** — only sends the changes that are waiting, without pulling anything. It's greyed out when nothing is waiting.

Both buttons are disabled while you're offline, and a notice at the top says so.

## Sync Status

A row of figures at the top of the Sync page shows:

- **Last sync** — how long ago Dynamics 365 last synced, with the exact time
- **Auto-sync** — how often the background sync runs, or **Paused** if you paused it in Settings
- **Pending changes** — how many changes are waiting, and what kind they are
- **Last 24 hours** — the share of sync runs that went fully well, with the number of errors and partial runs

## Waiting to Sync

On the left, **Waiting to sync** lists every change that hasn't reached Dynamics 365 yet, grouped into activities, follow-ups and opportunities. Click one to open its customer. Once an item syncs, it disappears from the list. When the list is empty it says **Nothing waiting**.

## Sync History

On the right, **History** shows your recent sync runs in a table, 20 per page:

- **Status** — Running, Success, Partial, or Error
- **Type** — What was synced (Dynamics 365, Power BI, or a push of activities, follow-ups or opportunities), with the error underneath if something went wrong
- **When** — When the sync started
- **Pulled / Pushed** — How many records were transferred

## Pending Items

Items waiting to sync show a small **"Pending sync"** badge in their respective lists (Activities, Follow-Ups). If a previous sync failed, you'll see an **error badge** instead. These items will retry on the next sync.

## Pending Label

When changes are waiting to sync, an orange **pending** label appears in the title bar next to **Online**, with the number of waiting changes. Hover over it to see what kind of changes they are, and click it to open the Sync page. While a sync runs it shows **Syncing…**, and it disappears once everything has been sent.

## Working Offline

You can use the app fully offline. All data is stored locally, and any changes you make are queued for sync. When you reconnect to the internet, the app will sync automatically (if auto-sync is enabled) or you can trigger it manually.
