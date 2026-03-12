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

## State (Zustand)

- Type every store with an explicit interface
- Use `partialize` to control what is persisted to localStorage
- Derived/computed values belong as getter functions inside the store
- Parallel async loads: `Promise.all([...])`

## Tauri / Async

- Guard all Tauri API calls with `isTauriApp()` (`src/lib/utils/offlineUtils.ts`)
- DB access uses singleton init pattern (`src/lib/db/client.ts`)
- `async/await` only — no `.then()` chains
- Async inside `useEffect`: `const load = async () => { ... }; load();`
