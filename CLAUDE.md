# CLAUDE.md

## Commands

```bash
pnpm install          # dependencies (never npm/yarn)
pnpm dev              # next dev
pnpm tauri dev        # tauri dev
pnpm tauri build      # production build
pnpm lint             # eslint
pnpm vitest run <path> # run affected tests only
pnpm sync-version     # propagate package.json version → tauri.conf.json + Cargo.toml (auto-runs on dev/build)
```

## TypeScript & Naming

- Strict mode — no `any`, no `!` without justification
- Imports: `@/` alias (maps to `src/`)
- Union literals over enums; `interface` for objects, `type` for unions/intersections
- PascalCase: components, types, component files (`.tsx`) | camelCase: functions, hooks, other files (`.ts`) | SCREAMING_SNAKE_CASE: constants

## Components & JSX

- `'use client'` at top of client components; named exports only
- Props: inline `interface Props` or `type Props`
- UI primitives: `React.forwardRef` + `displayName`; variants via CVA; classes via `cn()` (clsx + twMerge)
- Styling: Tailwind utilities; styled-components only for complex interactive layouts
- Never nest interactive elements — use `asChild` (Radix Slot) instead
- No unused imports/props, no redundant type narrowing, no redundant template literals

## State (Zustand)

- Explicit interface per store; `partialize` for persistence; derived values as getter functions
- Parallel async: `Promise.all([...])`

## Dev Server

- Don't clear `.next` cache unless actually broken
- Kill stale processes on ports 3000–3004 before starting: `netstat -ano | grep LISTENING | grep -E ":300[0-4] " | awk '{print $5}' | sort -u | xargs -I{} taskkill //PID {} //F`

## Playwright Validation

- **Ask before launching** — never auto-validate
- Flow: `browser_navigate` → `browser_take_screenshot` → `browser_close` (always close)

## Testing (TDD)

- Write tests FIRST, then implement
- Only run affected tests — never full suite
- Stack: Vitest + @testing-library/react + jsdom
- Location: `__tests__/` co-located with source; factories in `src/__tests__/mocks/factories.ts`
- Global mocks (Tauri, MSAL, next/navigation): `src/__tests__/setup.ts`
- What to test: utils → unit | stores → unit | hooks → `renderHook` | components → RTL | bug fixes → regression test
- CI: affected tests on PRs, full suite on push to main

## Git & Versioning

- Test before pushing; commit each logical unit; push after commit
- **Every commit** must include: version bump in `package.json`, `pnpm sync-version`, and a `.changelog/v{version}.md` entry
- Semver: patch = fixes, minor = features, major = breaking
- Changelog: `.changelog/v{version}.md` — plain language, zero tech terms, explain what the user sees
- Releases: manual via `workflow_dispatch`

## Error Handling & Logging

- Never silent `catch` — always `console.error('[tag] description:', err)`
- Tags: `[auth]` `[db]` `[seed]` `[audit]` `[sync]` `[admin]` `[msal]` `[settings]` `[login]` `[activity]` `[contact]` `[followup]` `[opportunity]` `[invoice]` `[customer]` `[updater]` `[changelog]` `[data]`
- Exception: intentional silences with a comment explaining why
- Interceptor: `src/lib/logCapture.ts` (side-effect import in `providers.tsx`)

## Tauri / Async

- Guard Tauri APIs with `isTauriApp()` (`src/lib/utils/offlineUtils.ts`)
- DB: singleton init (`src/lib/db/client.ts`); `async/await` only
- Async in `useEffect`: `const load = async () => { ... }; load();`

## Subagents

- Use for parallel/isolated tasks; work inline for simple/sequential ones

## Self-Improvement

- When in doubt, research first (docs, codebase, web) — don't guess
- Persist learnings to memory and/or CLAUDE.md
