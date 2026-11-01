# 04 — Storybook and Testing

## Storybook: keep (recommended)

shadcn gives you source files, not documentation. Storybook remains the component catalog, a11y checker, brand/RTL switcher and visual-test host. Reasons to keep over alternatives (Ladle, custom docs site): 150+ existing stories to port, team familiarity, mature addon ecosystem, and its Vitest addon turns stories into tests.

- Storybook 10, framework `@storybook/react-vite` (shares Vite config with the build; no Webpack/CRA as in x-core).
- Toolbar globals: brand (cial/dnb/il), direction (ltr/rtl). Implemented as `data-brand` / `dir` on the story root via a decorator — trivial with CSS variables.
- Addons: `a11y`, `docs` (autodocs from TS types), `vitest`, `themes` not needed.
- Static build deployed as today's x-core Storybook is (builder to match existing hosting).

## Test layers

| Layer | Tool | Scope |
|---|---|---|
| 1. Token / build | Vitest | tokens.css covers every token key; public exports snapshot; no MUI import anywhere |
| 2. Component behaviour | Storybook stories + `play` functions run via Vitest addon (browser mode) | interaction flows, computed styles of key states, brand + RTL variants |
| 3. Unit & a11y | Vitest + Testing Library + `vitest-axe` | required for interactive components: role, accessible name, keyboard, focus |
| 4. Visual regression | Playwright screenshots of stories (or Chromatic if budget allows — open question) | replaces "manual review + designer approval" with a diff gate |

This replaces Cypress component tests; Cypress is not carried over (Vitest browser mode covers it, single runner).

## Responsive verification

Storybook viewports and Playwright projects mirror the breakpoint tokens: mobile 375x812, tablet 768x1024, laptop 1280x800, desktop 1920x1080. Every component ships a `Responsive` story documenting its behaviour per breakpoint. Visual tests run each viewport; assertions cover no horizontal overflow and 44px mobile touch targets.

## Playwright browsers

Story tests run in Vitest browser mode on Playwright Chromium. Every machine, including CI, must run `npx playwright install chromium` before `vitest run`; Task 15 wires this into CI.

## CI gates (all required to merge)

`tsc --noEmit` (zero errors), `tsc --noEmit -p coexistence`, `eslint` (zero errors), `vitest run`, `npm run test:coexistence` (Playwright MUI/Bootstrap coexistence harness, needs `npx playwright install chromium`), `vite build`, token-drift check. Task 15 wires the coexistence gates into CI; they are required, not optional.

## Rules carried from x-core

- `console.log` forbidden in source.
- Prettier: 4-space, single quotes, es5 trailing commas, semicolons (lint-staged).
- PRs target `development`; Conventional Commit titles; JIRA ref + Figma link.
- Never break a published component API; add a versioned variant.
