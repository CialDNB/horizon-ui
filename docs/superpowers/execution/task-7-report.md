# Task 7 report: coexistence harness

Status: DONE_WITH_CONCERNS. Commit: see `git log` ("test: coexistence harness with MUI").

## What was built
- `coexistence/{index.html,main.tsx,vite.config.ts,tsconfig.json,env.d.ts}`, `coexistence/tests/coexistence.spec.ts`, `playwright.config.ts`.
- `npm run test:coexistence` = `playwright test`. Playwright `webServer` runs `vite --config coexistence/vite.config.ts`; that config awaits a programmatic `vite build` of the library into a fresh dir under `node_modules/.cache/horizon-ui-coexistence/dist-*` (never `dist/`, no race with `npm run build`), then serves the harness with aliases to that build and its `styles.css` (injected as a `<style>` via `?raw`; `?styles=0` omits it).
- devDependencies only: `@mui/material@^5.18`, `@emotion/react`, `@emotion/styled`, `@playwright/test@1.64.1`. package.test.ts still green (harness is outside `src/` and the dts include).
- `typecheck` now also runs `tsc -p coexistence`.
- Docs: ADR 0001 (new verification section, measurements, known limit + consumer guidance), 05-migration-and-coexistence.md (verified guarantees), README (needs `npx playwright install chromium`). component-map.md untouched.

## Tests (6; 5 pass, 1 fixme)
Leakage (computed styles equal with/without styles.css), 14px vs 16px Button (101.53x36 both), rtl/ltr isolation, 320px overflow, breakpoints 767/768, 1279/1280, 1919/1920 (probe `hz:text-micro hz:tablet:text-caption hz:laptop:text-body-default hz:desktop:text-heading-xl`; 4 distinct computed font-sizes).
Dialog stacking: `test.fixme` with TODO(Task 11), explicitly skipped (shows as "1 skipped"), not silently passing.

## RED evidence (deliberate mutations, all reverted)
- Unlayered `html{font-size:16px}` in index.css + outer `@layer horizon` wrap removed: leakage test FAILED (MUI button 14px->16px, line-height 24.5->28, typography 24->27.43px, body 16->18.29). Same rule with wrap kept: PASS (layer guarantee).
- Button `hz:px-5` -> `hz:px-[1.5rem]`: 14/16 test FAILED (width delta 6, expected <=1).
- `hz:border-e-transparent` -> `hz:border-r-transparent`: rtl test FAILED.
- `--breakpoint-tablet` 768->800: breakpoint test FAILED.
- 400px wide element: overflow test FAILED (416 > 320).
- A layered `button{font-size:40px}` or `body{line-height:3}` does not change MUI (MUI class selectors are unlayered and more specific); noted in the ADR, which is why root-level leakage was the mutation used.
Initial first-run RED (before the harness existed) was the missing page; GREEN on first implementation, then mutations.

## Findings
No leakage found; no change to base.css/layer order. Known limit recorded: consumer unlayered global rules beat horizon layers; guidance is `@layer legacy, horizon;` or scoping away from `.hz-root`.

## Gate run before commit
vitest 104 passed (11 files); test:coexistence 5 passed, 1 skipped; typecheck, lint, build clean.

## Concerns
- Vite caches modules under node_modules by path; first harness version served stale JS. Fixed with a unique build dir per start and a fresh `cacheDir` (documented in vite.config.ts).
- x-core does not set `html { font-size: 14px }` itself (only `htmlFontSize: 14` in the MUI theme); the harness sets it in index.html, as the ADR spike did.
- Vite prints a native-config-loader warning from the root vite.config.ts (extensionless import); pre-existing, harmless.
- Dialog stacking test remains pending Task 11.
- npm audit reports advisories from new dev deps (not triaged).

# Fix report (review round 1)

Confirmed in customer360: `client/package.json` has bootstrap 4.4.1; `client/src/projectx-core/css/index.scss` imports `bootstrap/scss/bootstrap` unlayered, then `* { box-sizing: border-box }` and `html, body { width/height 100%; margin 0; font-family }`; no html font-size. Root stays 16px, MUI htmlFontSize 14.

Changes
1. Leakage test runs at 16px (customer360) and 14px (stress); baseline asserts button font-size equals the root px, not a hardcoded 14px. Harness no longer sets html 14px.
2. New plain-element test (button, h1, a, input, table/td, p, ul/li, body; 16 props) with vs without styles.css at both roots. RED: bare `button{font-size:40px}` + `*{box-sizing}` + `body{margin:0}` in base.css failed both (13.33px -> 40px); reverted.
3. Real `bootstrap-reboot.css` from `bootstrap@4.4.1` as a devDependency (exact consumer rules, no drift), loaded unlayered via `?reboot=1` with `* {box-sizing:border-box}`. Measured on all 6 Button variants (keyboard focused): reboot overrides exactly border-radius 20px->0, font-size 14->16px, line-height 20->24px, focus outline 2px solid -> 5px auto (reboot `button:focus`). Unchanged: background, color, cursor, padding, margin, box-sizing, font-family, weight, text-transform, box-shadow, display. Encoded in `known limit: unlayered Bootstrap reboot overrides horizon Button` (asserts today's behaviour, commented; invert on mitigation). No library change.
4. rtl test: provider carries its own dir (no wrapper dir), asserts `.hz-root` dir, adds MUI-in-rtl-area plus Horizon-ltr-in-rtl-area and removal checks both ways.
5. vite.config: cacheDir moved under the wiped cacheRoot (no tmp leak); Dialog fixme comment fixed.
6. Docs: ADR (customer360 facts, measured table, 3 mitigation options with trade-offs: consumer `@layer legacy` wrapping, `!important` in layer, unlayered utilities; states `@layer legacy, horizon;` alone does not fix bare unlayered Bootstrap and that wrapping is real work), doc 05, doc 04 and README say test:coexistence and `tsc -p coexistence` must be CI gates (Task 15).

Gates: test:coexistence run twice, 10 passed + 1 skipped each; vitest 104 passed; typecheck, lint, build clean.
Concern for the controller: Button radius/typography/focus ring are broken inside customer360 as-is until a mitigation is chosen. The same applies to future input/link/table components.
