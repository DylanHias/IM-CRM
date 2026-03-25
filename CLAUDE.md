# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Package Manager

Use **pnpm** — do not use npm or yarn:
```bash
pnpm install
pnpm dev / pnpm tauri dev / pnpm tauri build / pnpm lint
```

## TypeScript

- Strict mode is on — no `any`, no `!` assertions without justification
- All internal imports use `@/` alias (maps to `src/`)
- Union literals over enums: `type ActivityType = 'meeting' | 'visit' | 'call' | 'note'`
- `interface` for extendable object shapes; `type` for unions/intersections

## Naming

| Entity | Convention |
|---|---|
| Components, Types | PascalCase |
| Functions, hooks, files (non-component) | camelCase |
| Constants | SCREAMING_SNAKE_CASE |
| Component files | `PascalCase.tsx` |
| Store / util / type files | `camelCase.ts` |

## Components

- `'use client'` at top of all client components
- Named exports only — no default exports
- Props typed inline (`interface Props` or `type Props`)
- UI primitives: `React.forwardRef` + `displayName`
- Variants: CVA (`class-variance-authority`)
- Conditional classes: `cn()` (`clsx` + `tailwind-merge`)
- Styling: Tailwind for utilities; styled-components only for complex interactive layouts

## HTML / JSX Correctness

- **Never nest interactive elements**: `<button>` inside `<a>` or `<a>` inside `<button>` is invalid HTML. Use the `asChild` prop (Radix Slot) on `<Button>` to render it as an `<a>` instead: `<Button asChild><a href="...">...</a></Button>`
- **Always clean imports**: Remove unused imports before committing. Run `pnpm next build` to catch unused variables via TypeScript strict mode.
- **Remove unused props**: If a component prop is no longer referenced in the implementation, remove it from the interface and all call sites.
- **Avoid redundant type narrowing**: TypeScript strict mode catches comparisons that can never be true (e.g., checking `x !== 'foo'` when `x` is already narrowed to `'bar' | 'baz'`). Don't add unnecessary guard clauses.
- **No redundant template literals**: Use `event.provider` not `` `${event.provider}` ``.

## State (Zustand)

- Type every store with an explicit interface
- Use `partialize` to control what is persisted to localStorage
- Derived/computed values belong as getter functions inside the store
- Parallel async loads: `Promise.all([...])`

## Dev Server

- **Do not** clear the `.next` cache unless the dev server is actually broken (stale cache 404s, build errors). Clearing it slows down restarts.
- Kill any existing dev server processes before starting a new one to avoid port conflicts
- **After every code change session**: kill stale node processes on ports 3000–3004 before starting a fresh dev server. Use: `netstat -ano | grep LISTENING | grep -E ":300[0-4] " | awk '{print $5}' | sort -u | xargs -I{} taskkill //PID {} //F`

## Frontend Validation (Playwright MCP)

- **Ask the user before launching Playwright** — do not auto-validate without permission
- When approved, validate visually using the Playwright MCP:
  1. Navigate to the affected page with `browser_navigate`
  2. Take a screenshot with `browser_take_screenshot` to confirm the change
  3. **Always** call `browser_close` after validation to terminate the browser instance
- Playwright runs in headless mode — no visible Chrome window

## Testing (TDD)

- **Test-driven development**: write tests FIRST, then implement the feature to make them pass
- **Only run affected tests**: `pnpm vitest run <path-to-test-file(s)>` — never the full suite
- **Test infrastructure**: Vitest + @testing-library/react + jsdom
- **Test location**: `__tests__/` directories co-located with source (e.g. `src/store/__tests__/`)
- **Test data**: use factories from `src/__tests__/mocks/factories.ts`
- **Mocks**: Tauri, MSAL, next/navigation are globally mocked in `src/__tests__/setup.ts`
- **What to test**:
  - New utility functions → unit tests
  - Store changes → store unit tests
  - New/modified hooks → integration tests with `renderHook`
  - New/modified components → functional tests with `@testing-library/react`
  - Bug fixes → regression test reproducing the bug
- **CI pipeline**: `test.yml` runs affected tests on PRs (`--changed origin/main`), full suite on push to main

## Git Workflow

- **Commit after every completed change** — each logical unit of work gets its own commit
- **Push to remote** after committing — always run `git push` after a successful commit

## Versioning

- **Single source of truth**: `package.json` — only ever bump the version here
- `pnpm sync-version` automatically propagates `package.json` version to `tauri.conf.json` and `Cargo.toml` (runs automatically via `beforeDevCommand`/`beforeBuildCommand`)
- **Never manually edit** the version in `tauri.conf.json` or `Cargo.toml`
- **After every change session**, evaluate what kind of semver bump is needed:
  - **Patch** (0.x.Y): bug fixes, typos, minor tweaks
  - **Minor** (0.X.0): new features, new UI sections, new capabilities
  - **Major** (X.0.0): breaking changes, major redesigns
- Bump the version in `package.json` as part of the final commit, then run `pnpm sync-version`
- **Write a changelog**: create `.changelog/v{version}.md` with a bullet list explaining what changed as if talking to someone with zero tech knowledge. Describe what the user will *see* or *experience*, not what was done in code. No technical terms — no "component", "regex", "CSS", "database", "API", "migration", "refactor", etc. Think "explain it like I'm five".
- **Releases are manual**: the GitHub Actions workflow only runs via `workflow_dispatch`, not on every push. Push freely — releases are triggered manually when ready

## Tauri / Async

- Guard all Tauri API calls with `isTauriApp()` (`src/lib/utils/offlineUtils.ts`)
- DB access uses singleton init pattern (`src/lib/db/client.ts`)
- `async/await` only — no `.then()` chains
- Async inside `useEffect`: `const load = async () => { ... }; load();`
