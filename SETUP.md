# Ingram Micro CRM — Setup Guide

## Prerequisites

Before running this project, install the following:

### 1. Node.js (v18 or v20 LTS)
Download from: https://nodejs.org/en/download

### 2. Rust + Cargo
```
# Windows (run in PowerShell):
winget install --id Rustlang.Rust.MSVC -e
# Or download from: https://rustup.rs/
```

### 3. Tauri prerequisites for Windows
```
# In PowerShell (as Admin):
winget install --id Microsoft.VisualStudio.2022.BuildTools -e
# Then install: Desktop development with C++
```

After installing, restart your terminal.

---

## First-Time Setup

```bash
# 1. Install Node dependencies
npm install

# 2. Configure environment
# Edit .env.local with your Azure AD credentials:
# NEXT_PUBLIC_AZURE_CLIENT_ID=your-client-id
# NEXT_PUBLIC_AZURE_TENANT_ID=your-tenant-id

# 3. Generate Tauri app icons (optional for dev)
# npm run tauri icon path/to/your/icon.png

# 4. Run in dev mode (opens Tauri desktop window)
npm run tauri dev
```

---

## Development

```bash
# Run Next.js dev server only (browser, no Tauri)
npm run dev
# Open http://localhost:3000

# Run full Tauri desktop app
npm run tauri dev

# Build production desktop installer
npm run tauri build
```

---

## Azure App Registration

To configure Microsoft login:

1. Go to **Azure Portal → App Registrations → New Registration**
2. Name: `Ingram CRM`
3. Supported account types: **Single tenant** (your organization)
4. Redirect URI:
   - Platform: **Single-page application (SPA)**
   - URI: `tauri://localhost`
   - Add also: `http://localhost:3000` (for browser dev)
5. After creating, copy:
   - **Application (client) ID** → `NEXT_PUBLIC_AZURE_CLIENT_ID`
   - **Directory (tenant) ID** → `NEXT_PUBLIC_AZURE_TENANT_ID`
6. API Permissions: Add `User.Read` (Microsoft Graph)

---

## Mock Data

The app ships with mock data for 25 customers, 28+ contacts, 25+ activities, 30+ trainings, and 19+ follow-ups.

Mock data is active when `NEXT_PUBLIC_USE_MOCK_DATA=true` in `.env.local` (default).

When running in the browser (`npm run dev`), mock data is used directly without SQLite.
When running in Tauri (`npm run tauri dev`), mock data is seeded into SQLite on first run.

---

## Project Structure

```
src/
├── app/              # Next.js App Router pages
├── components/       # React components
│   ├── ui/           # shadcn/ui primitives
│   ├── layout/       # Shell, Sidebar, TopBar
│   ├── customers/    # Customer components
│   ├── activities/   # Activity components
│   ├── contacts/     # Contact components
│   ├── trainings/    # Training components
│   ├── followups/    # Follow-up components
│   ├── timeline/     # Unified timeline
│   └── sync/         # Sync status components
├── lib/
│   ├── auth/         # MSAL configuration
│   ├── db/           # SQLite client + queries
│   ├── mock/         # Mock data
│   ├── sync/         # Sync adapters + service
│   └── utils/        # Utilities
├── store/            # Zustand stores
├── hooks/            # Custom React hooks
├── types/            # TypeScript interfaces
└── styles/           # CSS + styled-components theme
src-tauri/            # Rust/Tauri desktop shell
```

---

## Connecting Real APIs

When D365 and training API credentials are available:

1. **Dynamics 365**: Update `src/lib/sync/d365Adapter.ts`
   - Uncomment `RealD365Adapter` class
   - Set `NEXT_PUBLIC_D365_BASE_URL` in `.env.local`
   - Change `getD365Adapter()` to return `new RealD365Adapter()`

2. **Training API**: Update `src/lib/sync/trainingAdapter.ts`
   - Same pattern as above
   - Set `NEXT_PUBLIC_TRAINING_API_URL` in `.env.local`

3. Set `NEXT_PUBLIC_USE_MOCK_DATA=false` to disable mock seeding
