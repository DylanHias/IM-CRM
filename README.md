# Ingram CRM

A local-first desktop CRM built for Ingram Micro. Replaces the cluttered existing tooling with a streamlined interface for managing customers, logging activities, and tracking follow-ups — all with offline support.

## Tech Stack

- **Framework**: Next.js 14 + React 18 + TypeScript (strict)
- **Desktop**: Tauri v2 (SQLite for local storage, auto-updater)
- **UI**: Radix UI, Tailwind CSS, Framer Motion, CVA
- **State**: Zustand (persisted to localStorage)
- **Auth**: Azure MSAL (Microsoft Entra ID)
- **Integrations**: Dynamics 365, Xvantage CLS, Power Automate

## Features

| Feature | Description |
|---|---|
| **Customer Management** | View and filter customers synced from D365 with BCN, ARR, language, and cloud status |
| **Activity Logging** | Log meetings, visits, calls, and notes against customers |
| **Follow-Up Tracking** | Create tasks with due dates, track overdue/upcoming/completed |
| **Revenue Overview** | Sortable/filterable customer table with Excel export |
| **Contact Management** | Linked contacts with priority contact resolution |
| **Trainings** | Track and manage training records linked to customers |
| **Timeline** | Unified chronological view of all activities per customer |
| **Sync** | Pull customer and training data from D365 and third-party APIs |
| **Offline-First** | Full functionality offline via local SQLite, syncs when connected |

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [pnpm](https://pnpm.io/)
- [Rust](https://www.rust-lang.org/tools/install) (for Tauri)

### Install

```bash
pnpm install
```

### Development

```bash
# Web only
pnpm dev

# Desktop app (Tauri)
pnpm tauri dev
```

### Build

```bash
# Production desktop build
pnpm tauri build
```

### Lint

```bash
pnpm lint
```

## Project Structure

```
src/
├── app/                 Routes (customers, followups, revenue-overview, sync, login)
├── components/          React components organized by feature
│   ├── ui/              Radix-based design system primitives
│   ├── customers/       Customer list, detail, filters
│   ├── activities/      Activity forms and timeline
│   ├── followups/       Follow-up cards, filters
│   ├── contacts/        Contact management
│   ├── trainings/       Training forms and lists
│   ├── timeline/        Unified activity timeline
│   ├── sync/            Sync panel UI
│   └── layout/          AppShell, AuthGuard, navigation
├── store/               Zustand stores (customer, activity, followUp, sync, auth, ui)
├── hooks/               Custom React hooks (data fetching, auth, online status, app updater)
├── lib/
│   ├── auth/            Azure MSAL configuration
│   ├── db/              SQLite queries and migrations (Tauri)
│   ├── sync/            D365, training, and Power Automate adapters
│   ├── mock/            Mock data for offline development
│   └── utils/           Offline detection, date helpers, country utils
└── types/               Shared TypeScript types
```

## Versioning

Version is managed in `package.json` (single source of truth). Run `pnpm sync-version` to propagate to `tauri.conf.json` and `Cargo.toml`. Desktop updates are distributed via GitHub Releases (manual `workflow_dispatch`).
