# Sync

IM-CRM syncs your data with Microsoft Dynamics 365 so your local data stays up to date with the company CRM.

## How Sync Works

Sync is a two-way process:

- **Pull** — Downloads customer, contact, and opportunity data from D365 into the app
- **Push** — Uploads your locally created activities and follow-ups to D365

## Automatic Sync

By default, the app syncs automatically in the background at regular intervals. You can configure:

- **Auto-sync on launch** — Whether to sync immediately when the app starts (in **Settings > Sync**)
- **Sync interval** — How often background sync runs, from every 5 to 120 minutes (in **Settings > Sync**)

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
- **Online/Offline status** — Whether the app can reach D365

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
