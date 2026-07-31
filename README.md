# Ingram Micro CRM

A local-first desktop CRM for Ingram Micro Belux account managers. It replaces the day-to-day parts of Dynamics 365 with a focused, fast interface for managing customers, contacts, activities, follow-ups, and opportunities — and keeps everything in sync with D365 in the background.

Everything lives in a local SQLite database, so the app is instant and fully usable offline. Changes you make are pushed to D365 the moment you make them, or queued until you're back online.

**Windows desktop app** · Tauri v2 + Next.js 14 · Azure AD sign-in · auto-updating via GitHub Releases

---

## Why it exists

D365's web UI is a general-purpose CRM: every screen carries fields, tabs, and ribbons that a Belux account manager never touches, every interaction is a round-trip to the server, and it is unusable on a train or in a customer's parking lot. This app keeps the same system of record — D365 stays the source of truth — but puts a purpose-built client in front of it:

| Problem with the D365 UI | What this app does |
|---|---|
| Slow, network-bound, unusable offline | Local SQLite; every read is local, sync happens in the background |
| Dozens of irrelevant fields per form | Forms carry only the fields Belux account managers actually fill in |
| Revenue lives in a separate Power BI report | ARR and net-sales data are pulled into the same database and shown next to the account |
| No personal overview of "what needs me today" | Dashboard, Next-7-Days strip, stale-deal panel, health scores |
| Finding anything takes several clicks | Command palette, global search, keyboard shortcuts on every page |

---

## Features

### Dashboard
Your landing screen. A Belgium map with a dot per city (sized by customer count, click to filter the customer list), four metric cards (total activities, opportunities, open pipeline value, customers owned) each with a 7-day delta, your 15 most recent activities and opportunity updates, a stale-opportunities panel, and a **Next 7 Days** strip of follow-ups due per day. A **Search everything** bar queries customers, contacts, opportunities, activities, and follow-ups at once, and **Quick add** jumps straight into a new activity, follow-up, or opportunity.

### Customers
Full customer list with search (name, account number, BCN, city, email, industry), sorting, and a filter panel covering status, owner, industry, segment, country, inactivity, health tier, and bookmarked favorites. Filters combine and show as removable badges.

Each account gets an automatic **health score** (0–100) computed locally from recency of contact (40%), open pipeline (30%), and activity frequency over 90 days (30%), bucketed into Healthy / At risk / Critical and recomputed after every activity, opportunity, and sync.

The detail page has Overview, Activities, Contacts, Follow-Ups, and Opportunities tabs, plus a Cloud & Services Contacts card for assigning Customer Success Manager, AWS Owner, Azure Owner, and Inside Sales Owner from the Cloud Belux team — written straight back to D365.

### Activities
Log meetings, visits, calls, and notes, optionally linked to a contact. Meetings, visits, and calls appear on a **drag-and-drop kanban board** (Open / Completed / Rejected / Expired) with auto-collapsing empty columns; notes sit in a separate list. Date-range filtering, inline edit and delete, and per-item sync badges.

### Contacts
Per-customer contact management with job title, contact type, cloud-contact flag, country, email, phone, mobile, and internal notes. One contact per account can be starred as primary. Contacts sync both directions — pulled on every sync, pushed (including deletes) as you edit.

### Follow-Ups
Tasks with due dates, viewable per customer or globally as Overdue / Upcoming / Completed (paginated). An overdue count badge sits on the sidebar link, and launch-time alerts for overdue and due-today items are configurable, including how many days ahead you want to be reminded.

### Opportunities
Deals with stage, auto-filled probability, status, sell type, primary vendor, estimated revenue, expiration date, customer need, and related contact. Global list with search, sort, and filters by company, stage, status, and expiration — all remembered between sessions. Deals open too long without an update are flagged stale (threshold configurable).

### Timeline
One chronological feed of every activity, follow-up, and opportunity across all accounts, filterable by subject or customer name.

### Revenue Overview
ARR table per customer with contact details, cloud flag, and language. Search, filter by cloud status / language / ARR range, sort, a column picker, pagination, and **Excel export** that respects your active filters and visible columns.

### Insights & Analytics
**Insights** — ARR trend, net sales by vendor, activity metrics, KPI cards, and top customers, scoped by BENELUX / BE / NL / LU and a 6–24 month window.

**Analytics** — four panels: *Personal* (your activity volume, follow-up completion time, open pipeline, win rate, with period-over-period deltas), *Pipeline* (stage funnel, probability-weighted forecast by month, expiring soon, average deal size by sell type and vendor), *Customers* (inactivity buckets, contact coverage, cloud adoption, ARR distribution, ARR by industry/segment/country, top 10 by ARR), and *Activity* (type mix vs. team, call direction, day-of-week patterns, most active customers). Team figures are aggregate-only — no individual names.

### Sync
Two-way sync with Dynamics 365 plus Power BI. Configurable auto-sync on launch, on window focus (debounced), and on interval; separate intervals for full sync, pending-change push, and Power BI refresh; a pause switch; and a **sync scope** toggle so you can run only the parts you want. The Sync page shows last-sync time, pending counts per entity, online status, a paginated pending queue, and a sync-history table with per-run record counts and error details. History is auto-pruned on a configurable retention window.

### Iris — built-in AI assistant
A local, offline assistant for the app. Ollama ships as a bundled sidecar binary, so no data leaves the machine and no API key is needed. Iris answers "how do I…" questions grounded in the in-app help docs, and reads your CRM data through five tools (`get_account_overview`, `search_customers`, `search_contacts`, `search_opportunities`, `get_revenue`) executed against local SQLite. Responses stream token-by-token, including mid-stream tool calls. A hard scope rule keeps it to the CRM and its data.

### Admin panel
Restricted to admins: usage analytics and reports, user management, data management, a live **database explorer** (arbitrary queries over local SQLite), Power BI schema viewer and dataset discovery, and revenue-sync administration with cache export/import so colleagues without direct Power BI dataset permissions can still receive revenue data.

### Personalization & navigation
Command palette (`Ctrl+K`), fully remappable keyboard shortcuts with conflict detection, light/dark/system theme with optional auto-switch by time of day, six accent presets or a custom hex, high-contrast mode, three density levels, font size and family, per-table row density, reduce-motion, drag-to-reorder sidebar with per-tab visibility, default landing tab, and recent-customers quick links.

### Small things that matter
A guided first-run walkthrough, an in-app help center rendered from the same Markdown Iris reads, a changelog dialog on update, self-updating via signed GitHub Releases, autostart on login, offline/online toasts, and a couple of easter eggs (a birthday greeting, cobwebs on very stale deals).

---

## Tech stack

| Layer | Choice |
|---|---|
| Shell | Tauri v2 (Rust) — NSIS installer, custom window chrome, signed auto-updater |
| Frontend | Next.js 14 (App Router, `output: 'export'`) + React 18 + TypeScript strict |
| Storage | SQLite via `tauri-plugin-sql` (WAL, tuned pragmas) |
| State | Zustand (17 stores, `partialize`d persistence) |
| UI | Radix UI primitives, Tailwind CSS, CVA variants, Framer Motion, Recharts, dnd-kit, cmdk, Tiptap |
| Auth | Azure AD / Microsoft Entra ID — MSAL in the browser, native loopback OAuth in the desktop app |
| Integrations | Dynamics 365 Web API, Power BI REST (DAX `executeQueries`), Microsoft Graph |
| AI | Ollama sidecar running `qwen2.5:3b-instruct-q4_K_M` locally |
| Tests | Vitest + Testing Library + jsdom (54 suites, run on PR and push) |

---

## Architecture

```
┌────────────────────────── Tauri window ──────────────────────────┐
│  Next.js static export (React, Zustand, Radix)                   │
│      │ reads/writes                       │ invoke()             │
│      ▼                                    ▼                      │
│  SQLite (crm.db)                    Rust commands                │
│   20 tables, 53 migrations           • loopback OAuth server     │
│      ▲                               • Ollama proxy + streaming  │
│      │ sync                          • xlsx export (native)      │
└──────┼───────────────────────────────────────┬──────────────────┘
       │                                       │
   ┌───┴────────────┬──────────────┐      ┌────┴────────────┐
   │ Dynamics 365   │  Power BI    │      │ Ollama sidecar  │
   │ Web API        │  DAX queries │      │ localhost:11434 │
   └────────────────┴──────────────┘      └─────────────────┘
```

**Local-first.** Every screen reads local SQLite; nothing in the UI blocks on the network. The database self-heals on start: a forward-only migration chain (currently v53) runs, then a column-backfill pass re-adds anything a historically-swallowed `ALTER TABLE` may have missed, so fresh installs and long-lived ones converge on the same schema.

**Pull.** A watermarked delta sync fetches customers, contacts, activities, follow-ups, opportunities, option sets, lookup tables, and team users from D365 in chunks, then recomputes derived fields (last-activity dates, cloud status, health scores) locally. Power BI ARR and insights are pulled through DAX `executeQueries` and stored in the same database — the UI never calls Power BI directly.

**Push.** Two paths, one queue. When you're online, a create/update/delete is pushed to D365 immediately (`directPushService`) and marked synced. When it fails or you're offline, the row keeps a `pending` status and drains on the next sync; deletes go into a dedicated `pending_deletes` table so they survive the local row disappearing. Bulk upserts from a pull are guarded so they can't clobber a pending local edit.

**Auth.** In the desktop app, MSAL's redirect and popup flows don't work inside the WebView, so Rust spins up a `tiny_http` server on an ephemeral loopback port, the system browser handles sign-in, and the authorization code comes back over that port. Because AAD v2 allows multi-resource consent at `/authorize` but only single-resource at `/token`, the app consents to D365 + Power BI + Graph up front, exchanges the code for a Graph token, and uses the refresh token to mint per-resource tokens on demand.

**AI.** Ollama is bundled as an `externalBin` sidecar and downloaded at build time by `scripts/download-ollama.mjs`. Chat requests go through Rust rather than the Tauri HTTP plugin (which hit resource-ID errors on Windows), and streaming uses a Tauri Channel passed from JS — no listener-registration race. Tool calls are forwarded mid-stream so the frontend can execute them against SQLite and continue the conversation.

**Exports.** Excel files are written natively with `rust_xlsxwriter` and saved through the Tauri dialog plugin; the browser build falls back to a blob download.

---

## Notable decisions

- **Static export, not a Next.js server.** Tauri serves the frontend from disk; nothing needs a Node runtime at rest. Consequence: no `node:` imports anywhere in the bundle, and integrations (including Ollama) talk over plain `fetch`/IPC.
- **SQLite as the source of truth for the UI, D365 as the system of record.** No component ever calls D365 or Power BI to render — one sync path in, everything else reads local.
- **Direct push + pending queue instead of a pure queue.** An account manager expects a note logged in front of a customer to be in D365 before they leave the room; the queue exists for the offline case, not as the default path.
- **Health score computed locally.** It's a UI signal, not a D365 field — deriving it locally keeps it instant and avoids polluting the shared CRM schema.
- **Local LLM, no cloud.** Customer data cannot leave the machine, which rules out hosted models. The model must be tool-capable *and* a strong instruction-follower at small size — `llama3.2:1b` fabricated UI and ignored scope, so Iris runs `qwen2.5:3b`.
- **Version lives in `package.json` only.** `pnpm sync-version` propagates it to `tauri.conf.json` and `Cargo.toml` so the three can't drift.

---

## Getting started

### Prerequisites

- [Node.js](https://nodejs.org/) 18+ (CI builds on 24)
- [pnpm](https://pnpm.io/) 10
- [Rust](https://rustup.rs/) + MSVC Build Tools ("Desktop development with C++") — for Tauri

See [`SETUP.md`](SETUP.md) for the full Windows setup, including Azure AD configuration in `.env.local`.

### Commands

```bash
pnpm install           # dependencies (never npm/yarn)

pnpm dev               # Next.js only, in the browser (mock/limited mode)
pnpm tauri dev         # full desktop app
pnpm tauri build       # production installer (NSIS)

pnpm lint              # eslint
pnpm test              # vitest
pnpm vitest run <path> # affected tests only

pnpm sync-version      # package.json version → tauri.conf.json + Cargo.toml
pnpm powerbi:gen-schema # regenerate the Power BI schema snapshot
```

---

## Project structure

```
src/
├── app/                      Routes: dashboard, customers, activities, followups,
│                             opportunities, timeline, revenue-overview, insights,
│                             analytics, sync, settings, help, admin, debug, login
├── components/
│   ├── ui/                   Radix-based design-system primitives (forwardRef + CVA)
│   ├── layout/               AppShell, Sidebar, TitleBar, CommandPalette, AuthGuard,
│   │                         ShortcutsGuide, ChangelogDialog, ProfileModal
│   ├── customers/ activities/ contacts/ followups/ opportunities/ timeline/
│   ├── dashboard/ today/ insights/ analytics/ revenue/ sync/ settings/
│   ├── ai-chat/              Iris chat widget
│   ├── admin/                Admin panel tabs (incl. DatabaseExplorer, PowerBI tools)
│   ├── walkthrough/          First-run guided tour
│   └── easterEggs/
├── store/                    17 Zustand stores
├── hooks/                    Data, auth, sync, connectivity, updater hooks
├── lib/
│   ├── auth/                 MSAL config, native loopback OAuth, Graph, admin config
│   ├── db/                   SQLite client, migrations, per-entity query modules
│   ├── sync/                 D365 adapter, direct push, sync service, option sets
│   ├── integrations/powerbi/ DAX client, ARR/insights services, schema tooling
│   ├── ai/                   Ollama service, tools, system prompt, help ranking
│   ├── customers/            Health score
│   ├── revenue/ geo/ today/ shortcuts/ utils/
│   └── mock/                 Mock data for browser-only development
└── types/

src-tauri/
├── src/lib.rs                Tauri commands: OAuth, Ollama proxy/stream, xlsx export
├── src/oauth.rs              Loopback OAuth server
├── binaries/                 Bundled Ollama sidecar
└── tauri.conf.json           Window, CSP, bundle, updater config

docs/
├── help/                     User-facing help docs (also fed to Iris)
├── d365-schema.md            Verified D365 field/navigation-property names
└── powerbi-schema/
```

---

## Testing

Vitest + Testing Library + jsdom, tests co-located in `__tests__/` folders, factories in `src/__tests__/mocks/factories.ts`, global mocks (Tauri, MSAL, `next/navigation`, `localStorage`) in `src/__tests__/setup.ts`. CI runs affected tests on PRs and the full suite on push to `main`.

## Versioning & releases

`package.json` is the single source of truth for the version; `pnpm sync-version` propagates it to `tauri.conf.json` and `Cargo.toml` (it runs automatically on dev and build). Every version gets a plain-language entry in `.changelog/v{version}.md`, which the release workflow assembles into the GitHub Release notes. Releases are built on `windows-latest` via manual `workflow_dispatch`, signed, and published to GitHub Releases — the desktop app's updater points at `latest.json` there and offers the update in-app.
