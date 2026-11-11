# Task 4 report: HorizonProvider and cn

Status: DONE_WITH_CONCERNS

## TDD
- RED: wrote `src/lib/cn.test.ts` and `src/provider/HorizonProvider.test.tsx` first; `vitest run src/lib src/provider` failed, 2 files failed, no tests ran (modules `./cn`, `./HorizonProvider` unresolvable).
- GREEN: after implementation, full suite `vitest run`: 8 files, 57 tests passed; `tsc --noEmit` and `eslint .` clean. One intermediate failure (a stray fallback root left by first-render behaviour) was caught by my own test and fixed (see decisions).

## Files
- New: src/lib/cn.ts, src/lib/cn.test.ts, src/provider/{HorizonProvider.tsx,portal-context.ts,index.ts,HorizonProvider.test.tsx}, src/test-setup.ts
- Changed: src/index.ts (exports HorizonProvider, usePortalContainer, cn, type HorizonProviderProps), src/__tests__/architecture.test.ts (API snapshot intentionally updated: HorizonProvider, cn, usePortalContainer), vitest.config.ts (setupFiles), package.json/lock.

## cn contract
extendTailwindMerge({prefix:'hz'}); type-scale roles derived from `typography.typeScale` keys in the font-size group; shadow/radius/breakpoint (minus mobile)/ease/font-weight (extraBold -> extra-bold) derived from tokens; extra `duration` group from motion tokens. All five ADR-required assertions plus all 11 roles, variants, clsx inputs and unprefixed passthrough are tested.

## Decisions
- Unknown brand -> `cial`; any dir other than 'rtl' -> ltr (always a valid attribute).
- Context is `undefined` (no provider) / `null` (provider, wrapper not attached) / element. During the provider's first render `usePortalContainer` returns a detached placeholder div (no warn, no stray node on body); real wrapper from the next render. Documented in TSDoc.
- Outside a provider: one reusable `.hz-root` (data-brand=cial, dir=ltr, data-hz-portal-root) on body; console.warn once per page. `resetFallbackPortalRoot()` exported from portal-context.ts only (not from provider/index.ts or src/index.ts).
- Props type uses `Omit<HTMLAttributes, 'dir'>` so the narrower dir type applies.

## Dependencies (bundle-size justification)
- clsx (~0.3 kB min+gz, zero deps): class joining. tailwind-merge (~7 kB min+gz plus config; tree-shakeable ESM, zero deps): required by ADR for conflict resolution; used by every component via cn.
- devDependencies: @testing-library/react, /dom, /jest-dom, /user-event (test only).

## Concerns
- `usePortalContainer` returns HTMLElement and touches `document`, so calling it during SSR render throws; overlay components should call it from client-only paths. Signature fixed by brief.
- Provider re-renders once after mount (state holds wrapper element); inherent to the ref+context approach.
- Fallback warn-once is module-global per page (by design).

## Fix round (controller ruling): nullable portal container, stable ref
- `usePortalContainer(): HTMLElement | null`. Inside provider: null on first render, wrapper after mount. Outside provider: shared fallback `.hz-root` + one warn. No `document`: null, never throws. `pendingRoot` removed; TSDoc rewritten to this contract (overlay wrappers render Portal only when non-null). Pure resolver `resolvePortalContainer` exported from portal-context.ts (not public) for the SSR test.
- HorizonProvider ref callback is now stable (forwarded ref held in a ref); caveat: a changed inline ref callback is invoked on attach/detach only, not re-invoked on identity change.
- Tests added: first-render null then wrapper; never detached; null without document; portal consumer keeps state; no extra provider commits with inline ref (one per parent render). Duplicate import merged. Added `portal-context.test-d.ts`.
- Result: vitest 8 files / 62 tests pass, typecheck and lint clean; API snapshot unchanged.

## Fix round 2: re-sync forwarded ref on identity change
- setRef stays stable and assigns the synced forwarded ref on attach/detach (parent mount effects see it populated). A useLayoutEffect on [forwardedRef] nulls the previously synced ref, records the new one and assigns the current node. No ref writes during render; the earlier "no null calls" test was replaced.
- Tests: inline callback swap A(null) then B(node) once per swap with one commit per parent render; object ref swap; undefined->ref; ref->undefined cleared; ref populated before parent mount effect; unmount calls ref(null).
- Result: vitest 8 files / 66 tests pass, typecheck and lint clean.
