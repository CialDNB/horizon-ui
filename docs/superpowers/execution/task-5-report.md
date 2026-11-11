# Task 5 report: Storybook 9 harness

Status: DONE_WITH_CONCERNS. Commit: see `git log -1` on feat/foundation ("chore(storybook): Storybook 9 harness with brand and RTL toolbar").

## Version compatibility
- Storybook 9.1.21 (latest v9) `@storybook/react-vite` and `@storybook/builder-vite` peer `vite: ^5 || ^6 || ^7`. Repo has Vite 8.3.5. Plain `npm i` fails with ERESOLVE. Storybook 10 (latest 10.6.5) supports Vite 8 but the spec says Storybook 9, so v10 was not adopted.
- Resolution: documented npm `overrides` in package.json forcing `vite: ^8.3.5` for `@storybook/react-vite` and `@storybook/builder-vite` (the `$vite` reference form failed: "Unable to resolve reference"). Repo Vite/Vitest NOT downgraded (Vite 8.3.5, Vitest 4.1.12).
- `@storybook/addon-vitest@9.1.21` needs `@vitest/browser-playwright ^4` (installed 4.1.12) and `@vitest/browser ^4`. `storybook` 9 bundles `@vitest/mocker@3.2.4` (deduped to vite 8).
- Runtime result: dev-time story tests, `build-storybook` all work on Vite 8 with the override. Risk: unsupported by Storybook 9 peer range; a build warning about 500 kB chunks only.

## TDD
- RED: `npx vitest run --project storybook` before `.storybook/` existed: `SB_CORE-SERVER_0006 (MainFileMissingError): No configuration files have been found in your configDir`.
- Intermediate failure found by real run: Spacing story crashed (namespace vs map), fixed.
- GREEN: storybook project 1 file / 5 tests pass (Colors play asserting non-empty, non-transparent computed background-color per semantic key; Radius; Spacing; TypeScale; ResponsiveSpec example with play asserting table + rowheaders).
- a11y gate proven: temporary story with unnamed button failed with `button-name` violation (file removed).
- Full: `npx vitest run` 9 files / 71 tests pass (8 unit + storybook project). `tsc --noEmit`, `eslint .`, prettier clean. `npm run build` and `npm run build-storybook` succeed; storybook-static contains `@layer horizon` and `.hz-root` CSS.

## Design
- vitest.config.ts now uses `test.projects`: `unit` (previous config, jsdom, globalSetup) and `storybook` (storybookTest plugin, Playwright chromium headless, `.storybook/vitest.setup.ts` applying a11y + preview annotations).
- `.storybook/main.ts`: stories `src/**/*.stories.(ts|tsx)`, addons a11y/docs/vitest, `viteFinal` adds virtual module `virtual:horizon-styles.css` returning `buildStylesCss()`: the real prefixed, layered CSS. Preview imports it. (Declared in `src/vite-env-virtual.d.ts`.)
- `.storybook/preview.tsx`: globals `brand` (cial/dnb/il) and `direction` (ltr/rtl), decorator wraps in `HorizonProvider` with background token; `parameters.a11y.test = 'error'`; viewports mobile 375x812, tablet 768x1024, laptop 1280x800, desktop 1920x1080; `tags: ['autodocs']`.
- `src/stories/ResponsiveSpec.tsx`: props `{ spec: Record<'mobile'|'tablet'|'laptop'|'desktop', {size, density, layout, contentVisibility, interaction, note?}>, caption? }`, renders a captioned table with column/row headers. TSDoc on everything. Story-only; uses inline styles (stories are excluded from the Tailwind scan).
- Excluded `src/stories` and the virtual d.ts from vite-plugin-dts and added `@source not '../stories'` in `src/styles/index.css` (so story code never affects shipped CSS or types). src/index.ts unchanged, API snapshot test passes. tsconfig now includes `.storybook`.
- ESLint: stories already get the `no-restricted-exports`/ts-comment relaxations; `src/stories` and `.storybook` match no boundaries element so no new rule needed.

## Files
package.json, package-lock.json, tsconfig.json, vitest.config.ts, vite.config.ts, src/styles/index.css, .storybook/{main.ts,preview.tsx,vitest.setup.ts}, src/stories/{Tokens.stories.tsx,ResponsiveSpec.tsx}, src/vite-env-virtual.d.ts.

## Concerns
1. Storybook 9 does not officially support Vite 8 (override used); decide whether to move to Storybook 10 (supports Vite 8) later.
2. `npm audit` reports 27 vulnerabilities in the new dev dependency tree (not triaged).
3. Story tests use headless-shell chromium; `npx playwright install chromium` is required on fresh machines/CI.
4. Brief said stories-in-ResponsiveSpec "per-component Responsive stories": ResponsiveSpec is not re-exported from a package path; later tasks import it relatively from `src/stories/ResponsiveSpec`, which lies outside boundaries elements (lint-allowed).

## Fix round (review follow-up)
- Moved to Storybook 10.6.5 (storybook, react-vite, addon-a11y, addon-docs, addon-vitest); removed npm `overrides`; @vitest/browser and browser-playwright stay at 4.1.12 (satisfy addon peers). Needed `npm rm` then install (plain upgrade hit ERESOLVE against stale v9 entries). main.ts/preview.tsx/vitest.setup.ts worked unchanged on v10.
- "Storybook 9" updated to 10 in README, 01-overview, 04-storybook-and-testing, plan file.
- `engines.node >=20.19`; README Development section (playwright install); note in 04 that CI must run `npx playwright install chromium` (Task 15).
- ResponsiveSpec play now asserts 5 rows, 7 column headers (Breakpoint + six fields), row headers mobile/tablet/laptop/desktop.
- eslint: new `storybook` boundaries element (src/stories/**, .storybook/**); it may import tokens/lib/provider/primitives/types/components/root; no other element may import it (verified: lib importing stories errors). `.storybook` files now linted and get the default-export relaxation.
- `npm audit --omit=dev`: 0 vulnerabilities. HMR limitation documented as comment in .storybook/main.ts.
- Verification: vitest run 9 files/71 tests pass, build-storybook ok, typecheck and lint clean. a11y re-proved on v10: temp story with unlabeled button failed with `button-name`; temp file removed.
