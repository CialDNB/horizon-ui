# horizon-ui Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up `@cialdnb/horizon-ui` (shadcn + Tailwind v4, Horizon tokens), prove it coexists with MUI/x-core, port the first component batches, and ship a hosted authenticated MCP server deployed on each release.

**Architecture:** Single npm package built with Vite library mode (ESM, `preserveModules`) that ships precompiled, scoped CSS (`dist/styles.css`) so consumers need no Tailwind. Tokens are copied from x-core, converted to CSS variables per brand. A second artifact, a Node HTTP MCP server with a build-time manifest, is containerised and deployed via a new `horizon-ui-deployment` helmfile repo.

**Tech Stack:** TypeScript 5 (strict), React >=18 (peer), Tailwind CSS v4, Radix UI, class-variance-authority, clsx, tailwind-merge, Vite, Storybook 9 (`@storybook/react-vite`), Vitest (+ browser mode, Testing Library, vitest-axe), Playwright, react-docgen-typescript, `@modelcontextprotocol/sdk`, Docker, helmfile.

**Spec:** `docs/architecture/01-overview.md` through `07-mcp-server.md` (approved 2026-11-01; open-question resolutions in `06-open-questions.md`).

## Global Constraints

- Package name `@cialdnb/horizon-ui`; GitHub Packages registry; versions start `0.x`, `1.0.0` after first consumer integration.
- Horizon DS only. No Legacy DS. No MUI/Emotion dependency anywhere (a test asserts no `@mui` or `@emotion` import in `src/`).
- Consumers must not need Tailwind. No global preflight/reset. Classes prefixed `hz:`; all output in `@layer horizon`; reset scoped to `.hz-root`.
- Tokens: spacing base 4px; borderRadius `none 0, xs 4, sm 8, md 16, lg 20, xl 40, full 100`; motion durations `instant 0, fast 100, normal 200, slow 300, slower 500`; easings `standard cubic-bezier(0.2, 0, 0, 1)`, `enter cubic-bezier(0, 0, 0.2, 1)`, `exit cubic-bezier(0.4, 0, 1, 1)`, `spring cubic-bezier(0.34, 1.56, 0.64, 1)`; never animate width/height/top/left; respect `prefers-reduced-motion`.
- Brands `cial` (default), `dnb`, `il` via `data-brand`; IL uses cial typography. Direction via `dir="rtl"`; logical properties only (`ms-*`, `ps-*`, `start-*`).
- Components use semantic tokens only, never primitives.
- Every component: `React.forwardRef`, `displayName`, props extend native element props + `DnbBase` (`data-did?: string`); folder `Name.tsx`, `Name.stories.tsx`, `Name.test.tsx`, `index.ts`; export added to `src/components/index.ts`.
- No `console.log` in source. Prettier: 4-space, single quotes, es5 trailing commas, semicolons.
- Published component APIs never break; add a variant instead.
- Direct dependencies need a bundle-size justification in the PR description.
- MCP: read-only; Streamable HTTP; bearer-token auth in one middleware; `/healthz` is the only unauthenticated route; latest version only; port 3939.
- Git: commit only when the user explicitly says so, and never add a `Co-Authored-By` trailer (user memory rules; they override default attribution). PRs target `development`, Conventional Commit titles, JIRA ref and Figma link.
- CI gates required to merge: `tsc --noEmit` zero errors, `eslint` zero errors, `vitest run`, `vite build`, token-drift check, bundle-size budget, public-API snapshot.
- Versioned x-core components: port only the highest-numbered version of each family, under the plain name (`ButtonV2` -> `Button`, `DialogV2` -> `Dialog`, `SelectV2` -> `Select`, ...). Lower versions are never ported and get status `superseded` in `component-map.md`. Exception rule: if the highest version is a different component rather than an evolution (verified case: `DrawerV3` is a content side panel, `DrawerV2` is the navigation menu), they are mapped as two components, each from its own latest source, and the decision is recorded in the map.

## Responsive Standard (applies to every component)

Breakpoints are x-core's, unchanged: `mobile` 0 (base, mobile-first), `tablet` 768px, `laptop` 1280px, `desktop` 1920px. Tailwind variants `tablet:`, `laptop:`, `desktop:` (with the `hz:` prefix per the isolation ADR); no default `sm/md/lg/xl`.

Every component must be deliberately designed and verified at all four breakpoints, not merely not-broken:
- Each component has a documented per-breakpoint spec in its story (`Responsive` story with a table of what changes at mobile / tablet / laptop / desktop: size, density, layout, content visibility, interaction pattern). "Identical at all four" is a valid answer only when written down and justified.
- Mobile touch targets at least 44x44px for interactive elements; hover-only behaviour has a touch/keyboard equivalent.
- Overlays adapt by breakpoint: Dialog and Drawer become full-screen or bottom-sheet on mobile; Popover/DropdownMenu/Select become sheets on mobile where content would overflow.
- Typography and spacing step through the type scale and 4px spacing scale by breakpoint, never ad-hoc pixel values.
- No horizontal overflow at 320px width; long text, RTL and 200% zoom (reflow) supported.
- Tables, navigation, pagination, tabs and app bar define an explicit small-screen pattern (card list / scroll with affordance / collapse to menu).
- Tests run at four viewports: mobile 375x812, tablet 768x1024, laptop 1280x800, desktop 1920x1080.

## Quality Bar (applies to every task; a task is not done until it holds)

Production-grade code and architecture:
- TypeScript `strict` plus `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitOverride`; no `any`, no non-null assertions, no `@ts-ignore` (`@ts-expect-error` only in type tests).
- Layering enforced by lint (`eslint-plugin-import` / `eslint-plugin-boundaries`): `tokens` and `lib` import nothing from components; components import only `tokens`, `lib`, `provider`, `primitives`, or other components via their `index.ts`; no deep imports across component folders; named exports only (no default exports in `src/`).
- Public API is explicit: everything exported from `src/index.ts` is intentional; an API snapshot test fails on accidental additions/removals.
- `eslint-plugin-jsx-a11y` strict; components are accessible by construction (role, name, keyboard, focus-visible, reduced motion) and verified by `vitest-axe` and Storybook a11y with `test: 'error'`.
- Composition over configuration: small, single-purpose components; compound components (`Dialog.Header`...) where shadcn does it; variants through cva, no boolean-prop explosions; no duplicated logic (extract at 3+ uses).
- Every public prop and component carries a TSDoc comment (feeds Storybook autodocs and the MCP manifest). Comments elsewhere only where the why is non-obvious.
- Bundle budget: each component's built entry stays under a size limit set in Task 15 (`size-limit`), tree-shaking verified by a test that imports one component and asserts others are absent from the bundle.

Design quality (this is UI work; use the Impeccable skill, as the workspace instructions require):
- Every component and story is designed against the Figma/Horizon DS, not shadcn defaults: spacing on the 4px scale, token-only colour, radius per the radius rule, motion from motion tokens, type from the type scale.
- Definition of done for each UI task includes: `/impeccable audit` clean, `/impeccable polish` pass, `/impeccable adapt` pass for the four breakpoints, states covered (hover, focus-visible, active, disabled, loading, error, empty where relevant, long text, RTL, all three brands), a `Responsive` story per the Responsive Standard, and visual baselines at all four breakpoints reviewed by the user.
- `/impeccable craft` is used when building each new component or page-level story from scratch; `/impeccable harden` for edge/empty/error states on forms and overlays.

## Review Focus

1. Consumer renders a component without `HorizonProvider`, or passes an unknown `brand`: falls back to `cial`, no crash, no unstyled output.
2. CSS variable name collisions: shadcn's `--primary`, `--background`, `--border` clash with consumer CSS. Variables must be scoped to `.hz-root`/portal container, never `:root`.
3. Overlay (Dialog/Popover/Select/Tooltip) opened outside any provider: portal must still resolve to a styled container (dev warning, not silent unstyled content).
4. MCP requests with missing, malformed, wrong-scheme, or wrong token: 401, no tool output, constant-time comparison; server refuses to start with zero configured tokens or a missing manifest.
5. MCP tools given unknown component name, empty search query, or unknown theme section: structured error/empty result, never a thrown crash.
6. Layouts at exact breakpoint edges (767/768, 1279/1280, 1919/1920px), at 320px width and at 200% zoom: variants flip exactly at the edge, no horizontal overflow, no clipped content, touch targets stay 44px at mobile.

---

## Phase A — Foundation

### Task 1: Repository scaffold

**Files:**
- Create: `package.json`, `tsconfig.json`, `vite.config.ts`, `vitest.config.ts`, `eslint.config.js`, `.prettierrc`, `.npmrc`, `.gitignore`, `.lintstagedrc`, `src/index.ts`, `src/components/index.ts`, `src/types/DnbBase.ts`
- Test: `src/__tests__/package.test.ts`

**Interfaces:**
- Produces: `DnbBase` (`export interface DnbBase { 'data-did'?: string }`) in `src/types/DnbBase.ts`; scripts `build`, `typecheck`, `lint`, `test`, `storybook`, `build:tokens`, `build:mcp-manifest`; `exports` map entries `.`, `./styles.css`, `./tokens`, `./package.json`.

- [ ] **Step 1: In `/Users/simonmor/dnb/horizon-ui` run `git init`; create `package.json` (name `@cialdnb/horizon-ui`, version `0.0.1`, `type: module`, `sideEffects: ["**/*.css"]`, `publishConfig.registry` = x-core's GitHub Packages registry, copied from `x-core/package.json`/`.npmrc`)**
- [ ] **Step 2: Write failing test `package.test.ts`** with tests `'has no mui or emotion dependency'` (assert none of `@mui/*`, `@emotion/*` in dependencies/peerDependencies) and `'src never imports mui or emotion'` (recursive read of `src/**/*.{ts,tsx}`, regex `/@mui|@emotion/` has zero matches).
- [ ] **Step 3: Run `npx vitest run src/__tests__/package.test.ts`; expected FAIL (no config yet)**
- [ ] **Step 4: Create configs.** Vite lib mode entry `src/index.ts`, ESM, `preserveModules: true`, `vite-plugin-dts`, externals `react`, `react-dom`, `react/jsx-runtime`. tsconfig strict. ESLint + Prettier per Global Constraints; `lint-staged` runs prettier + eslint.
- [ ] **Step 4a: Add the Quality Bar tooling now: strict tsconfig flags, `eslint-plugin-jsx-a11y`, `eslint-plugin-boundaries` with the layering rules, `no-default-export` for `src/`, and `src/__tests__/architecture.test.ts` with tests `'tokens and lib import no components'`, `'no deep imports across component folders'`, `'src has no default exports'`, `'public API matches snapshot'` (`Object.keys` of `src/index.ts` exports)**
- [ ] **Step 5: Run `npm install`, then `npm run typecheck && npm run build && npx vitest run`; expected: all PASS, `dist/index.js` and `dist/index.d.ts` exist**
- [ ] **Step 6: Commit (only after user approval)** `chore: scaffold horizon-ui`

### Task 2: Token port and CSS generation

**Files:**
- Create: `src/tokens/{colors,typography,spacing,borderRadius,borders,shadows,motion,iconography,index}.ts` (copied from `x-core/src/theme/tokens/`), `src/tokens/brands/{cial,dnb,il}.ts` (semantic color maps derived from `x-core/src/theme/horizon/palette-*.ts`, MUI imports removed), `scripts/build-tokens.ts`, `src/styles/tokens.css` (generated)
- Test: `scripts/__tests__/build-tokens.test.ts`

**Interfaces:**
- Produces: `buildTokensCss(): string` in `scripts/build-tokens.ts`; `brands: Record<'cial'|'dnb'|'il', SemanticPalette>` and `type SemanticPalette = Record<SemanticKey, string>` in `src/tokens/brands/index.ts` where `SemanticKey` includes `background, foreground, primary, primary-foreground, secondary, secondary-foreground, muted, muted-foreground, accent, accent-foreground, destructive, destructive-foreground, success, warning, info, border, input, ring`.
- Consumes: Task 1 scripts config.

- [ ] **Step 1: Write failing tests** in `build-tokens.test.ts`:
  - `'emits every primitive color key'`: for each `blue[n]`, css contains `--hz-blue-${n}: ${value}`.
  - `'emits radius scale'`: css contains `--radius-lg: 20px` and `--radius-full: 100px`.
  - `'emits motion tokens'`: contains `--duration-slow: 300ms` and `--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1)`.
  - `'scopes brand variables under .hz-root, never :root'`: css has `.hz-root[data-brand='dnb']` rule and no `:root` rule containing `--primary`.
  - `'cial is the default brand'`: `.hz-root` base block has the cial `--primary`.
  - `'il typography equals cial typography'`.
- [ ] **Step 2: Run `npx vitest run scripts/__tests__/build-tokens.test.ts`; expected FAIL**
- [ ] **Step 3: Copy token files; strip MUI imports; build brand semantic maps from the x-core Horizon palettes (map `primary.main` -> `primary`, etc.; record any palette key with no semantic home in `docs/migration/token-gaps.md`)**
- [ ] **Step 4: Implement `buildTokensCss()`** emitting primitives under `.hz-root`, cial semantic vars on `.hz-root`, dnb/il overrides on `.hz-root[data-brand='…']`; `npm run build:tokens` writes `src/styles/tokens.css`.
- [ ] **Step 5: Run tests; expected PASS. Add drift check test `'committed tokens.css matches generator output'`.**
- [ ] **Step 6: Commit (only after user approval)** `feat(tokens): port Horizon tokens to CSS variables`

### Task 3: Tailwind theme, scoped base, and prefix/scope spike (Q8)

**Files:**
- Create: `src/styles/{index.css,theme.css,base.css,typography.css}`, `docs/architecture/decisions/0001-css-isolation.md`
- Modify: `vite.config.ts` (emit `dist/styles.css`)
- Test: `src/__tests__/styles.test.ts`

**Interfaces:**
- Consumes: `tokens.css` from Task 2.
- Produces: `dist/styles.css`; `@utility` classes `text-display-xl`, `text-heading-md`, `text-body-default` (all 11 `typeScale` roles from `tokens/typography.ts`, bundling size/line-height/weight/family); Tailwind color utilities `bg-primary`, `text-foreground`, etc.

- [ ] **Step 1: Spike (throwaway, 1 hour max): compile the same Button style twice, once with `@import 'tailwindcss' prefix(hz)`, once nested under `.hz-root`. Load each next to a MUI v5 page (14px html font-size) and compare. Record the winner and evidence in `0001-css-isolation.md`. Default is prefix + layer unless the spike shows authoring friction or collisions.**
- [ ] **Step 2: Write failing tests** in `styles.test.ts` against built `dist/styles.css`:
  - `'contains no global preflight'`: no selector `html`, `body`, `*`, `::before`, `::after`, `button`, `h1` at top level outside `.hz-root`.
  - `'all rules are inside @layer horizon'`.
  - `'utilities carry hz prefix'` (decision-dependent; assert per the ADR).
  - `'defines all 11 typography utilities'`.
  - `'no :root variable declarations'` (Review Focus 2).
  - `'reduced motion media query present'`.
  - `'defines tablet, laptop, desktop breakpoints at 768, 1280, 1920px and no sm/md/lg/xl'` (breakpoint tokens added to `src/tokens/breakpoints.ts` as `{ mobile: 0, tablet: 768, laptop: 1280, desktop: 1920 }`, emitted as `--breakpoint-*` in `@theme`).
- [ ] **Step 3: Run `npm run build && npx vitest run src/__tests__/styles.test.ts`; expected FAIL**
- [ ] **Step 4: Write `theme.css` (`@theme` mapping `--color-primary: var(--primary)` etc., `--spacing: 4px`, radius, shadow, duration, ease, font families) and `base.css` (`.hz-root` reset: box-sizing, `font-size: 16px`, line-height, border-color, form element normalisation; focus ring using `--ring`). Wrap everything in `@layer horizon`. Per ADR, configure prefix or scope.**
- [ ] **Step 5: Run build and tests; expected PASS**
- [ ] **Step 6: Commit (only after user approval)** `feat(styles): scoped Tailwind theme and base`

### Task 4: HorizonProvider and utilities

**Files:**
- Create: `src/provider/HorizonProvider.tsx`, `src/provider/portal-context.ts`, `src/lib/cn.ts`, `src/provider/index.ts`
- Test: `src/provider/HorizonProvider.test.tsx`, `src/lib/cn.test.ts`

**Interfaces:**
- Produces: `HorizonProvider` (`React.forwardRef<HTMLDivElement, HorizonProviderProps>`, `HorizonProviderProps = { brand?: 'cial'|'dnb'|'il'; dir?: 'ltr'|'rtl'; children: ReactNode } & React.HTMLAttributes<HTMLDivElement> & DnbBase`); `usePortalContainer(): HTMLElement`; `cn(...inputs: ClassValue[]): string` (clsx + tailwind-merge aware of the prefix).
- Consumes: `DnbBase`.

- [ ] **Step 1: Write failing tests:**
  - `'renders wrapper with hz-root, data-brand and dir'`
  - `'defaults to cial and ltr'`
  - `'unknown brand falls back to cial'` (Review Focus 1; cast invalid value)
  - `'usePortalContainer returns the provider element inside provider'`
  - `'usePortalContainer outside provider returns a lazily created hz-root portal root on document.body and warns once'` (Review Focus 3; assert `console.warn` called once, container has class `hz-root`)
  - `'cn merges conflicting prefixed utilities'`
- [ ] **Step 2: Run; expected FAIL**
- [ ] **Step 3: Implement per signatures. Fallback portal root is created once and reused; warning uses `console.warn` (allowed for actionable developer warnings).**
- [ ] **Step 4: Run; expected PASS**
- [ ] **Step 5: Commit (only after user approval)** `feat(provider): HorizonProvider and cn`

### Task 5: Storybook 9 harness

**Files:**
- Create: `.storybook/{main.ts,preview.tsx}`, `src/stories/Tokens.stories.tsx`
- Modify: `package.json` scripts (`storybook`, `build-storybook`), `vitest.config.ts` (Storybook Vitest addon project)

**Interfaces:**
- Consumes: `HorizonProvider` (Task 4), `dist`-independent `src/styles/index.css`.
- Produces: decorator applying `HorizonProvider` with toolbar globals `brand` (cial/dnb/il) and `direction` (ltr/rtl); a11y addon enabled globally with `test: 'error'`; Storybook viewports `mobile` 375x812, `tablet` 768x1024, `laptop` 1280x800, `desktop` 1920x1080 (matching the breakpoint tokens); helper `ResponsiveSpec` story component rendering the per-breakpoint spec table used by every component's `Responsive` story.

- [ ] **Step 1: Write `Tokens.stories.tsx` (colour swatches per semantic key, radius scale, spacing scale, type scale) with a `play` function asserting each semantic swatch has a non-empty computed `background-color`.**
- [ ] **Step 2: Run `npx vitest run --project storybook`; expected FAIL (no config)**
- [ ] **Step 3: Configure Storybook (`@storybook/react-vite`, addons `a11y`, `docs`, `vitest`), preview imports `src/styles/index.css`, decorator wraps stories.**
- [ ] **Step 4: Run `npx vitest run --project storybook` and `npm run build-storybook`; expected PASS, `storybook-static/` exists**
- [ ] **Step 5: Commit (only after user approval)** `chore(storybook): Storybook 9 harness with brand and RTL toolbar`

### Task 6: Button vertical slice

**Files:**
- Create: `src/components/Button/{Button.tsx,Button.stories.tsx,Button.test.tsx,index.ts}`
- Modify: `src/components/index.ts`, `src/index.ts`

**Interfaces:**
- Consumes: `cn`, `DnbBase`, theme utilities.
- Produces: `Button` (`React.forwardRef<HTMLButtonElement, ButtonProps>`), `ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & DnbBase & { variant?: 'primary'|'secondary'|'tertiary'|'destructive'|'ghost'|'link'; size?: 'sm'|'md'|'lg'; loading?: boolean; asChild?: boolean }`, `buttonVariants` (cva). Port variant names and sizes from x-core `Button`/`ButtonV2` (builder reads `x-core/src/components/ButtonV2` and the Figma link for exact sizes; record deviations in `docs/migration/component-map.md`). Radius is `lg` (20px), per token rule for interactive elements.

- [ ] **Step 0: Design pass before code: run `/impeccable craft` for Button against the Figma link and Horizon DS (all variants, sizes, states, three brands, RTL). The approved look is the acceptance target for the stories; finish the task with `/impeccable audit` and `polish`.**
- [ ] **Step 1: Write failing tests in `Button.test.tsx`:** `'has role button and accessible name from children'`, `'is keyboard activatable with Enter and Space'`, `'disabled button is not focusable and does not fire onClick'`, `'loading sets aria-busy and blocks onClick'`, `'forwards ref and data-did'`, `'asChild renders the child element with button styles'`, `'displayName is Button'`, and at the four viewports `'is at least 44px tall at mobile for every size'`, `'full-width prop fills the container at mobile'`.
- [ ] **Step 2: Run `npx vitest run src/components/Button`; expected FAIL**
- [ ] **Step 3: Implement `Button` with Radix `Slot` for `asChild`, cva variants. Stories: all variants x sizes, disabled, loading, with icon, RTL, and a `Responsive` story using `ResponsiveSpec` that documents the Button's behaviour at mobile / tablet / laptop / desktop.**
- [ ] **Step 4: Run vitest (unit + storybook project) and `npm run build`; expected PASS; `dist/components/Button/Button.js` exists**
- [ ] **Step 5: Commit (only after user approval)** `feat(Button): add Button`

### Task 7: Coexistence harness (anti-goal gate)

**Files:**
- Create: `coexistence/{index.html,main.tsx,vite.config.ts}`, `coexistence/tests/coexistence.spec.ts` (Playwright), `playwright.config.ts`
- Modify: `package.json` (`test:coexistence`; dev-dependencies only: `@mui/material`, `@emotion/react`, `@emotion/styled` in this harness, never in `src/`)

**Interfaces:**
- Consumes: built `dist` and `dist/styles.css`; a MUI v5 theme with `htmlFontSize: 14` mirroring x-core Legacy.

- [ ] **Step 1: Write failing Playwright tests:**
  - `'importing horizon styles does not change MUI Button computed styles'`: capture computed `font-size`, `padding`, `border-radius`, `background-color`, `font-family`, `line-height` of an MUI `Button` and an MUI `Typography` and `body` with and without `styles.css` loaded; assert deep equality.
  - `'horizon Button renders identically at html font-size 14px and 16px'`: bounding box width/height equal within 1px.
  - `'no horizontal overflow at 320px for the harness page'` and `'breakpoint variants switch exactly at 768, 1280 and 1920px'` (resize viewport to 767/768, 1279/1280, 1919/1920 and assert a probe element's computed style flips).
  - `'horizon Dialog and MUI Dialog stack in intended order'`: horizon overlay above MUI modal (z-index scale from Task 11) and both clickable.
  - `'horizon inside dir=rtl subtree and MUI in ltr do not affect each other'`.
- [ ] **Step 2: Run `npm run test:coexistence`; expected FAIL**
- [ ] **Step 3: Build the harness page rendering MUI and horizon components side by side; fix any leakage found by adjusting `base.css`/layer ordering (document in the ADR).**
- [ ] **Step 4: Run; expected PASS**
- [ ] **Step 5: Commit (only after user approval)** `test: coexistence harness with MUI`

---

## Phase B — Component library

### Task 8: Icons and illustrations port

**Files:**
- Create: `scripts/port-icons.ts`, `src/icons/**`, `src/illustrations/**`, `src/icons/index.ts`, `src/illustrations/index.ts`
- Modify: `src/index.ts` (export namespaces `icons`, `illustrations`)
- Test: `src/icons/icons.test.tsx`

**Interfaces:**
- Produces: each icon as `React.forwardRef<SVGSVGElement, IconProps>` where `IconProps = React.SVGProps<SVGSVGElement> & DnbBase & { size?: number | string }`; default `aria-hidden="true"` unless `aria-label`/`title` supplied; `currentColor` fill; directional icons carry `rtl:-scale-x-100`. `scripts/port-icons.ts` reads x-core's `src/icons` (MUI `SvgIcon` wrappers), extracts SVG paths, emits plain components.

- [ ] **Step 1: Write failing tests:** `'every exported icon renders an svg'` (iterate namespace), `'icons are aria-hidden by default'`, `'icon with aria-label exposes role img'`, `'size prop sets width and height'`, `'directional icons mirror under rtl'`, `'no mui import'`.
- [ ] **Step 2: Run; expected FAIL**
- [ ] **Step 3: Implement the port script and run it; commit generated files; list any icon that could not be converted in `docs/migration/component-map.md`.**
- [ ] **Step 4: Run tests and `npm run build`; expected PASS**
- [ ] **Step 5: Commit (only after user approval)** `feat(icons): port x-core icons and illustrations`

### Task 9: Component port template and migration map

**Files:**
- Create: `docs/migration/component-map.md`, `docs/migration/porting-checklist.md`, `scripts/usage-report.ts`

**Interfaces:**
- Produces: `component-map.md` table with columns `x-core component | horizon-ui component | status (todo/in-progress/done/superseded/no-equivalent) | API differences | customer360 import count`. `scripts/usage-report.ts <path-to-customer360-client>` prints import counts of each `@cialdnb/x-core` component, sorted descending, and groups version families (`Foo`, `FooV2`, `FooV3`) so only the highest version carries `todo`; lower versions are pre-filled `superseded`. Known families to pre-fill (verified in `x-core/src/components`): Accordion, AppBar, AppBarActions (V3), AppBarDropdown, AppBarHelp, AreaChart, BackdropLoader, Breadcrumbs, Button, Card, Checkbox, CountryInput, DatePicker, DateRangePicker, Dialog, EmailsField, FileDropUploader, Layout, MultipleBarChart, NotificationsDropdown, Pagination, Popover, ProductsDropdown, Radio, RatingBar, SearchBar, Select, Switch, Timeline, Tooltip; `Drawer` is the exception case (V2 = navigation menu, V3 = content side panel).

- [ ] **Step 1: Write failing test `scripts/__tests__/usage-report.test.ts`** over a fixture directory: `'counts named imports from @cialdnb/x-core'`, `'counts aliased and default-namespace imports'`, `'ignores other packages'`.
- [ ] **Step 2: Run; expected FAIL**
- [ ] **Step 3: Implement the script (TypeScript compiler API import walk). Run it on `/Users/simonmor/dnb/customer360/client`; populate the map with all x-core components and counts; reorder the batch lists in Tasks 10-13 by real counts (keep the group boundaries).**
- [ ] **Step 4: Write `porting-checklist.md` per component: a `Responsive` story with the per-breakpoint spec (mobile / tablet / laptop / desktop) and `/impeccable adapt` pass, 44px mobile touch targets, no overflow at 320px, shadcn source version noted in file header, native-prop API, variants via cva, tokens only, logical properties, `forwardRef`+`displayName`, stories (brand x RTL), unit tests (role, name, keyboard, focus), a11y story check, map row updated, export added.**
- [ ] **Step 5: Run tests; expected PASS**
- [ ] **Step 6: Commit (only after user approval)** `docs: migration map and usage report`

### Task 10: Batch 1 — Foundations

**Files:** one folder each under `src/components/`: `Typography`, `IconButton`, `Link`, `Badge`, `Chip`, `Avatar`, `Skeleton`, `Alert`. Tests and stories beside each.

**Interfaces:**
- Consumes: Task 6 Button conventions; Task 8 icons.
- Produces: `Typography` (`variant` keys = x-core slash notation from `tokens/typography.ts`, `as?: React.ElementType`); `IconButton` (`aria-label` required in its type); `Badge`/`Chip`/`Alert` with variants `info|success|warning|error|neutral`.

- [ ] **Step 1: For each component write failing tests per `porting-checklist.md`, including per-breakpoint assertions at the four viewports** (at minimum: `'renders with role X'`, `'IconButton without aria-label is a type error'` via `// @ts-expect-error` type test, `'Typography maps each variant to its text utility'`, `'Alert has role alert'`).
- [ ] **Step 2: Run `npx vitest run src/components`; expected FAIL**
- [ ] **Step 3: Implement each (shadcn base where one exists, else Radix/native). Update map rows.**
- [ ] **Step 4: Run vitest, storybook project, build; expected PASS**
- [ ] **Step 5: Commit per component group (only after user approval)** `feat(<Name>): add <Name>`

### Task 11: Batch 2 — Forms and overlays

**Files:** `src/components/{Input,Textarea,Select,Checkbox,RadioGroup,Switch,Label,FormField,Dialog,Drawer,Popover,Tooltip,DropdownMenu,Toast}/`, `src/lib/z-index.ts`, `src/tokens/zIndex.ts`
- Modify: `scripts/build-tokens.ts` (emit `--z-*`)

**Interfaces:**
- Sources are the latest versions only: `SelectV2`, `CheckboxV2`, `RadioV2` (-> `RadioGroup`), `SwitchV2`, `DialogV2`, `PopoverV2`, `TooltipV2`, `SearchBarV2`, `CountryInputV2`, `EmailsFieldV2`. `Drawer` is ported from `DrawerV3` (content side panel): props `{ title: string; content: ReactNode; actions?: ReactNode; open: boolean; onOpenChange(open: boolean): void; side?: 'start' | 'end'; width?: CSS width; keepMounted?: boolean } & DnbBase`, built on Radix Dialog; `direction` becomes logical `side`. customer360 uses `DrawerV3` today, so this is the migration target for those screens.
- Produces: `zIndex` token `{ dropdown: 1400, popover: 1450, tooltip: 1500, dialog: 1350, toast: 1600 }` placed above MUI's modal 1300 (builder confirms against Task 7's stacking test and adjusts); `FormField` composing `Label`, control and `description`/`error` text with correct `aria-describedby`/`aria-invalid`; all Radix portals use `usePortalContainer()`.

- [ ] **Step 1a: For each component run `/impeccable craft` first (design approved before code) and finish with `/impeccable audit`, `polish`, and `harden` for form/overlay edge, empty and error states.**
- [ ] **Step 1: Write failing tests:** `'Drawer opens from the inline-end side by default and mirrors under rtl'`, `'Drawer keepMounted retains content when closed'`, per control `'associates label via htmlFor/aria-labelledby'`, `'FormField sets aria-invalid and aria-describedby when error'`, `'Select is operable by keyboard (open, arrow, Enter)'`, `'Dialog traps focus and restores it on close'`, `'Dialog closes on Escape'`, `'Popover/Tooltip content is rendered inside an .hz-root container'` (Review Focus 3, with and without provider), `'Toast has role status and auto-dismisses'`, `'RTL: Select and DropdownMenu open toward the inline-end side'`, `'Dialog is full-screen at mobile and centered with max-width at tablet and up'`, `'Drawer is a full-width sheet at mobile and honors width at tablet and up'`, `'Select and DropdownMenu render as a bottom sheet at mobile'`, `'inputs are at least 44px tall at mobile and 16px font to prevent iOS zoom'`.
- [ ] **Step 2: Run; expected FAIL**
- [ ] **Step 3: Implement; extend Task 7 coexistence stacking test to every overlay and re-run it.**
- [ ] **Step 4: Run vitest, storybook project, `npm run test:coexistence`, build; expected PASS**
- [ ] **Step 5: Commit per group (only after user approval)**

### Task 12: Batch 3 — Navigation, layout, data display

**Files:** `src/components/{Tabs,Accordion,Breadcrumbs,Pagination,Card,Table,Drawer navigation (name: NavigationDrawer),AppBar}/`

**Interfaces:**
- `NavigationDrawer`: port the behaviour of x-core `DrawerV2` (items with `isExternal`, `highlighted`, collapsed hover popover showing highlighted item as plain text, top-level menu items), visuals redesigned per Figma (decided, Q10). `DrawerV2` is the navigation menu and is the latest version of that component (`DrawerV3` is a different component, ported in Task 11 as `Drawer`). Builder reads `x-core/src/components/DrawerV2` and the last DrawerV2 commits (`7a4fa9a8`, `1322c658`) for behaviours to preserve.
- Other families here port only their latest version: `AccordionV2`, `BreadcrumbsV2`, `PaginationV2`, `TabsV2`, `CardV2`, `TimelineV2`, `AppBarV2` (with `AppBarActionsV3`, `AppBarDropdownV2`, `AppBarHelpV2`), `LayoutV2`.

- [ ] **Step 1: Write failing tests:** `'Tabs arrow keys move focus and Home/End jump'`, `'Accordion toggles aria-expanded'`, `'Table renders caption, scope on headers'`, `'Pagination marks current page aria-current'`, `'NavigationDrawer: external item has rel noopener and opens new tab'`, `'NavigationDrawer: collapsed hover popover renders highlighted item as plain text'`, `'NavigationDrawer: collapsed state exposes accessible names for icon-only items'`, `'NavigationDrawer is an off-canvas overlay with a toggle at mobile, collapsible rail at tablet, expanded at laptop and desktop'`, `'Table switches to a stacked card list or scroll container with visible affordance at mobile'`, `'Tabs scroll horizontally with focus kept in view at mobile'`, `'Pagination collapses to previous/next with page indicator at mobile'`, `'AppBar collapses actions into a menu at mobile'`, `'Breadcrumbs truncate middle items at mobile'`.
- [ ] **Step 2: Run; expected FAIL**
- [ ] **Step 3: Implement; update map.**
- [ ] **Step 4: Run vitest, storybook, build; expected PASS**
- [ ] **Step 5: Commit per group (only after user approval)**

### Task 13: Batch 4 — Heavy components (deferred, one task per item when scheduled)

**Files:** none until scheduled.

- [ ] **Step 1: Using the usage report, decide with the user which of charts, date pickers, file dropzone, flow diagrams are still needed in customer360; add one task per item with replacement library choice (Recharts directly, react-day-picker, react-dropzone) following `porting-checklist.md`. Mark the rest `no-equivalent` in the map.**

---

## Phase C — Quality, CI, publish

### Task 14: Visual regression

**Files:**
- Create: `visual/visual.spec.ts`, `visual/__screenshots__/` (committed baselines)
- Modify: `playwright.config.ts`, `package.json` (`test:visual`)

- [ ] **Step 1: Write the failing spec:** iterate every story from Storybook's `index.json`, screenshot per brand (cial, dnb, il) x direction (ltr, rtl) x viewport (mobile 375x812, tablet 768x1024, laptop 1280x800, desktop 1920x1080) for components with stories tagged `visual`; `toHaveScreenshot` with `maxDiffPixelRatio: 0.001`. Add `'no element overflows the viewport horizontally'` and `'interactive elements are at least 44x44px at mobile'` assertions run on every visual story. To keep the matrix tractable, the full brand x direction grid runs at laptop only; mobile, tablet and desktop run cial/ltr plus rtl, with the full grid on the nightly job.
- [ ] **Step 2: Run `npm run test:visual` with no baselines; expected FAIL (missing snapshots)**
- [ ] **Step 3: Generate baselines with `--update-snapshots`, review visually with the user/designer, commit baselines.**
- [ ] **Step 4: Re-run; expected PASS**
- [ ] **Step 5: Commit (only after user approval)** `test: Playwright visual regression`

### Task 15: CI and npm publish

**Files:**
- Create: `.github/workflows/ci.yml`, `.github/workflows/release.yml`, `.github/pull_request_template.md`, `CONSTITUTION.md`

**Interfaces:**
- Adds `size-limit` config (per-component entry budgets, initial values measured from Button and set at +10%) and the tree-shaking test `'importing Button excludes Dialog from the bundle'`.
- `ci.yml` (on PR to `development`): install, `typecheck`, `lint`, `vitest run`, `build`, `size-limit`, `test:coexistence`, `test:visual`, `build-storybook`. `release.yml` (on tag `v*`): same gates, `npm publish` to GitHub Packages. Builder copies runner labels, auth and registry setup from `x-core/.github/workflows/*` and `x-core-deployment`.
- `CONSTITUTION.md`: port still-valid rules from `x-core/CONSTITUTION.md` (read it first; drop MUI/Emotion/Cypress rules, add the Global Constraints above).

- [ ] **Step 1: Write workflows; validate with `actionlint` (or `gh workflow` dry parse); expected no errors**
- [ ] **Step 2: Open a draft PR (only with user approval) and confirm every gate runs green on the runner**
- [ ] **Step 3: Cut `v0.1.0-rc.1` (with user approval); confirm package appears in GitHub Packages and installs in a scratch project: `npm i @cialdnb/horizon-ui@0.1.0-rc.1`, import `Button` and `styles.css`, build passes**
- [ ] **Step 4: Commit (only after user approval)** `ci: gates and release workflow`

---

## Phase D — Hosted MCP

### Task 16: Manifest generator

**Files:**
- Create: `scripts/mcp-manifest-lib.ts`, `scripts/build-mcp-manifest.ts`
- Test: `scripts/__tests__/mcp-manifest-lib.test.ts`
- Modify: `package.json` (`build:mcp-manifest`, wired into `postbuild`)

**Interfaces:**
- Produces `dist/mcp/manifest.json` shaped `{ version: string; components: ComponentInfo[]; tokens: TokenSections; migration: MigrationEntry[] }` with `ComponentInfo = { name: string; category: string; props: { name: string; type: string; required: boolean; description: string; defaultValue?: string }[]; examplePath: string }`, `MigrationEntry = { xCore: string; horizon: string | null; status: string; apiDifferences: string }`; also `dist/mcp/constitution.md` and `dist/mcp/examples/*.stories.tsx`. Props extracted with `react-docgen-typescript` (do not hand-roll an AST walk; x-core notes that failed on real components).

- [ ] **Step 1: Write failing tests:** `'extracts props inherited from native element types'` (Button has `onClick`, `disabled`), `'marks required props'` (IconButton `aria-label`), `'includes version from package.json'`, `'migration entries parsed from component-map.md'`, `'every exported component has an examplePath that exists'`.
- [ ] **Step 2: Run; expected FAIL**
- [ ] **Step 3: Implement using `react-docgen-typescript` with a props filter that keeps inherited native props but drops `node_modules` types except `React.*HTMLAttributes` members actually used.**
- [ ] **Step 4: Run tests and `npm run build`; expected PASS, manifest present**
- [ ] **Step 5: Commit (only after user approval)** `feat(mcp): manifest generator`

### Task 17: MCP HTTP server with bearer auth

**Files:**
- Create: `mcp/{server.ts,auth.ts,tools.ts,manifest-store.ts}`, `mcp/__tests__/{auth.test.ts,tools.test.ts,server.test.ts}`

**Interfaces:**
- Consumes: manifest JSON (Task 16).
- Produces: `loadManifest(path: string): Manifest` (throws if file missing/invalid); `createAuthMiddleware(tokens: readonly string[]): (req, res, next) => void` (throws at creation when `tokens` is empty); `createTools(manifest: Manifest): ToolDefinition[]` with tools `list_components({ category?: string })`, `get_component_info({ name: string })`, `get_component_example({ name: string })`, `search_components({ query: string })`, `get_theme_tokens({ section?: string })`, `get_constitution_section({ heading?: string })`, `get_migration_mapping({ xCoreName: string })`; `startServer(opts: { port: number; tokens: string[]; manifestPath: string }): Promise<http.Server>` serving Streamable HTTP at `POST /mcp` and `GET /healthz`. Tokens come from env `MCP_TOKENS` (comma-separated), port from `PORT` (default 3939).

- [ ] **Step 1: Write failing tests:**
  - auth: `'rejects missing Authorization header with 401'`, `'rejects non-Bearer scheme'`, `'rejects wrong token'`, `'accepts any configured token'`, `'uses constant-time compare'` (assert `crypto.timingSafeEqual` path via spy), `'creation throws with empty token list'`.
  - tools: `'get_component_info unknown name returns error result listing close matches'`, `'search_components empty query returns empty list, not error'`, `'get_theme_tokens unknown section returns error with valid sections'`, `'get_migration_mapping returns null horizon for no-equivalent entries'`, `'list_components filters by category'`.
  - server: `'GET /healthz returns 200 without a token'`, `'POST /mcp without token returns 401 and no tool output'`, `'POST /mcp tools/list with valid token lists 7 tools'`, `'startServer rejects when manifest missing'`.
- [ ] **Step 2: Run `node --test mcp/__tests__` (or vitest if configured); expected FAIL**
- [ ] **Step 3: Implement with `@modelcontextprotocol/sdk` Streamable HTTP transport (stateless mode). Locate x-core-mcp's HTTP wrapper source first (open question 16: ask the team/search ECR repo `cial/x-core-mcp` metadata); reuse it if found, otherwise write the wrapper here.**
- [ ] **Step 4: Run tests; expected PASS. Manually: `MCP_TOKENS=t1 node dist/mcp/server.js` then `curl -i localhost:3939/mcp` returns 401, `curl localhost:3939/healthz` returns 200.**
- [ ] **Step 5: Commit (only after user approval)** `feat(mcp): authenticated Streamable HTTP server`

### Task 18: MCP image and release pipeline

**Files:**
- Create: `Dockerfile.mcp`, `Dockerfile.storybook`, `.github/workflows/release-images.yml`
- Modify: `.github/workflows/release.yml`

**Interfaces:**
- Produces: ECR images `cial/horizon-ui-mcp:<version>` and `cial/horizon-ui-storybook:<version>` (account/region from org variables `AWS_ACCOUNT_ID`, `AWS_REGION` as in `x-core-deployment` README); after push, the workflow opens a PR in `CialDNB/horizon-ui-deployment` bumping the image tag (pattern from x-core's version bump PRs, e.g. `version-workflow.yml`).

- [ ] **Step 1: Write `Dockerfile.mcp`** (node:22-alpine, copies `dist/mcp`, installs only server runtime deps, `USER node`, `EXPOSE 3939`, `CMD ["node","server.js"]`).
- [ ] **Step 2: Verify locally: `docker build -f Dockerfile.mcp -t horizon-ui-mcp:test . && docker run --rm -e MCP_TOKENS=t1 -p 3939:3939 horizon-ui-mcp:test`; `curl localhost:3939/healthz` returns 200; container with no `MCP_TOKENS` exits non-zero**
- [ ] **Step 3: Write the workflow; dry-run on a tag in a fork or with `act` if available; otherwise verify on the first real rc tag (with user approval)**
- [ ] **Step 4: Commit (only after user approval)** `ci: build and publish MCP and Storybook images`

### Task 19: horizon-ui-deployment repo and MCP rollout

**Files (new repo `/Users/simonmor/dnb/horizon-ui-deployment`):**
- Create: `helmfile.yaml.gotmpl`, `repositories.yaml.gotmpl`, `environment/hdev/{values.yaml,horizon-ui-mcp.values.yaml.gotmpl,horizon-ui-storybook.values.yaml.gotmpl}`, `.github/workflows/{preview.yaml,deploy.yaml}`, `README.md`, `docs/mcp-tokens.md`

**Interfaces:**
- Copy structure from `x-core-deployment` (helmfile, `cial/kubedeploy` chart `1.2.*`, ARC runner, `CLUSTER_CA`/`SVCACC_TOKEN` environment secrets, `NAMESPACE_NAME` variable). `horizon-ui-mcp.values.yaml.gotmpl`: image `…/cial/horizon-ui-mcp`, port 3939, ingress host `{{ .Release.Name }}.{{ requiredEnv "ENVIRONMENT_NAME" }}.cial.tech`, env `MCP_TOKENS` from a k8s Secret (`secretKeyRef`), liveness/readiness probes `GET /healthz`, resources 100m/128Mi requests, 200m/256Mi limits, `networkPolicy.enabled: true`.
- `docs/mcp-tokens.md`: how tokens are issued (one per team), where stored (k8s Secret, created out-of-band, never in git), rotation (add new, deploy, remove old), revocation.

- [ ] **Step 1: Create the GitHub repo (with user approval), copy and adapt `x-core-deployment` files, set protected branch, `hdev` environment, secrets and variables per its README (user or platform team supplies secret values)**
- [ ] **Step 2: Create the `MCP_TOKENS` Secret in the cluster namespace (user or platform team)**
- [ ] **Step 3: Run `helmfile -e hdev diff` locally or via preview workflow; expected: renders the two releases with no template errors**
- [ ] **Step 4: Deploy from the protected branch (user approval); verify: `curl -i https://horizon-ui-mcp.hdev.cial.tech/healthz` returns 200; `curl -i -X POST https://horizon-ui-mcp.hdev.cial.tech/mcp` returns 401; with a valid token an MCP client lists 7 tools**
- [ ] **Step 5: Document consumer wiring in `horizon-ui/README.md`: `.mcp.json` entry `{ "mcpServers": { "horizon-ui": { "type": "http", "url": "https://horizon-ui-mcp.hdev.cial.tech/mcp", "headers": { "Authorization": "Bearer ${HORIZON_UI_MCP_TOKEN}" } } } }`**
- [ ] **Step 6: Commit (only after user approval)** `feat: initial hdev deployment`

### Task 20: First consumer integration pilot (customer360)

**Files:** in `customer360/client` (separate PR): `package.json`, one low-risk screen, `.mcp.json`

- [ ] **Step 1: Pick one low-risk screen with the user using the usage report; add `@cialdnb/horizon-ui` alongside x-core, wrap the screen subtree in `HorizonProvider`, import `@cialdnb/horizon-ui/styles.css`**
- [ ] **Step 2: Replace that screen's components using the MCP `get_migration_mapping`; run customer360's existing tests and a manual pass; confirm no visual change on untouched screens (compare against baseline screenshots)**
- [ ] **Step 3: Record friction in `docs/migration/pilot-notes.md`; fix horizon-ui gaps found; when satisfied, cut `1.0.0` (with user approval)**

---

## Self-Review

**Spec coverage:** 01 goals 1-7 -> Tasks 2-3 (tokens, Horizon only), 15 (npm), 7 (coexistence), 2-4 (brands/RTL), 3 (no CSS-in-JS), 16-19 (MCP). 02 -> Tasks 2-4. 03 layout/build/CSS/deps/publish -> Tasks 1, 3, 15, 18. 04 Storybook and test layers -> Tasks 5, 6, 10-12, 14, 15. 05 coexistence and port order -> Tasks 7, 9-13, 20. 06 decisions -> reflected (names, icons Task 8, IL typography Task 2, Playwright Task 14, DrawerV2 Task 12, MCP auth/deploy/versions Tasks 17-19, Q16 Task 17). 07 -> Tasks 16-19. Gap noted: bearer-token issuance process is documented (Task 19) but operating it is a human step.

**Type consistency:** `DnbBase` (Task 1), `cn`/`HorizonProvider`/`usePortalContainer` (Task 4), `zIndex` (Task 11), `Manifest` shapes (Task 16) consumed by `createTools` (Task 17), 7 tools counted consistently in Tasks 17 and 19.

**Proportion:** Tasks carry signatures, test names and assertions; bodies are left to the implementer.
