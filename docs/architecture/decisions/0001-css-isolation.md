# ADR 0001: CSS isolation — `hz:` prefix + `@layer horizon`

- Status: Accepted
- Date: 2026-11-01
- Resolves: open question Q8 (`06-open-questions.md`)

## Context

horizon-ui ships one precompiled stylesheet, `dist/styles.css` (`import '@cialdnb/horizon-ui/styles.css'`). Consumers do not run Tailwind. The first consumers are MUI v5 / Emotion apps built on x-core Legacy DS, which sets `html { font-size: 14px }` and uses `CssBaseline`. Some consumers also carry their own utility CSS (Tailwind v3, legacy utility classes). The stylesheet must:

- not change anything outside horizon-ui's own DOM (no global preflight, no `:root` variables);
- not be broken by consumer class names that match ours;
- let consumers order it against their own styles (`@layer horizon`);
- keep Horizon sizes correct on a 14px root.

Two isolation options were proposed:

- **A. Prefix.** Tailwind v4 `prefix(hz)`; source classes are `hz:flex`, `hz:tablet:px-6`; everything wrapped in `@layer horizon`.
- **B. Scope.** Unprefixed classes (`flex`, `px-4`); utilities nested under `.hz-root` (`.hz-root .px-4`) inside `@layer horizon`.

## Spike

Throwaway harness (scratchpad, not in the repo): Tailwind 4.3.3 compiled through `@tailwindcss/node` + `@tailwindcss/oxide`; a React 18 + `@mui/material` 5 page with `createTheme({ typography: { htmlFontSize: 14 } })`, `CssBaseline`, `html { font-size: 14px }`, an MUI `Button` and `Typography`, plus unlayered consumer utility CSS `.px-4 { padding: 0 1rem } .rounded-lg { border-radius: .5rem } .flex { display: flex }`. The same button style was compiled both ways:

- A: `hz:inline-flex hz:items-center hz:h-10 hz:px-4 hz:rounded-lg hz:bg-primary hz:text-primary-foreground hz:text-body-default hz:tablet:px-6 hz:shadow-md hz:focus-visible:ring-2 hz:focus-visible:ring-ring`
- B: the same classes unprefixed, nested under `.hz-root`.

Computed styles were read with Playwright (Chromium headless shell) at 375px and 800px for: no horizon CSS, variant A, variant B.

### Evidence

| Element / property | none | A (prefix) | B (scope) |
|---|---|---|---|
| MUI `Button` (font-size, padding, radius, bg, line-height, font-family) | 14px, 16px, 4px, rgb(25,118,210), 24.5px, Roboto | identical | identical |
| MUI `Typography` body1, `body` styles | 16px / Roboto | identical | identical |
| MUI `Button` rendered inside `.hz-root` | as above | identical | identical |
| Consumer `.px-4 .rounded-lg` element outside `.hz-root` | 14px / 7px | identical | identical |
| Horizon button `padding-left` @375 / @800 | n/a | **16px / 24px** | **14px / 14px** (consumer `.px-4` wins, `tablet:px-6` lost) |
| Horizon button `border-radius` | n/a | **20px** | **7px** (consumer `.rounded-lg` wins) |
| Horizon button `font-size` / `line-height` with rem type tokens | n/a | 14px / 17.5px | 14px / 17.5px |
| Same, after switching type tokens to px (final build) | n/a | **16px / 20px** | n/a |
| `@property --tw-ring-offset-width` declared inside `@layer horizon` | n/a | registered (`0px`) | registered (`0px`) |
| Add unlayered consumer `button { border-radius: 0 }` | n/a | horizon radius 0px | horizon radius 7px |

Findings:

1. **Scope collides; prefix does not.** Layered styles always lose to unlayered styles, whatever the specificity. Under B, any unlayered consumer class with the same name as one of our utilities (`.px-4`, `.rounded-lg`, `.flex`) overrides ours, including inside `.hz-root`. Under A, no consumer class can be named `hz:px-4` by accident.
2. **Neither option touches MUI.** MUI/Emotion styles and `CssBaseline` computed values were identical with and without horizon CSS in both variants. The only `body` difference in the final build check was `height` (the horizon button became taller), which is layout, not a style leak.
3. **rem is the real 14px-root hazard, for both options.** `1rem` resolves against `html`, so `.hz-root { font-size: 16px }` cannot fix it. Type tokens are now emitted in px (see Decision).
4. **Tailwind v4 prefix works with everything we need.** `prefix(hz)` applies to `@theme` custom breakpoints (`hz:tablet:px-6` → `@media (width >= 768px)`), to `@utility` classes (`@utility text-body-default` → `.hz\:text-body-default`), to opacity modifiers (`hz:bg-primary/50`) and to state variants (`hz:hover:`, `hz:focus-visible:`). Resetting `--breakpoint-*` removes `hz:md:` etc. completely.
5. **Tailwind internals are not prefixed.** `--tw-*` custom properties and their `@property` registrations keep the `--tw-` name, and Tailwind emits an `@property` fallback rule on `*, ::before, ::after, ::backdrop`. `@property` inside `@layer` works in Chromium (registered initial value observed), so it stays inside `@layer horizon`; the `*` fallback is rewritten to `.hz-root`-scoped selectors at build time.
6. **No-preflight build shape verified on real output.** Importing only `tailwindcss/theme.css` and `tailwindcss/utilities.css` (never `preflight.css`) emits no element selectors. `@theme inline` emits no `:root, :host { ... }` block; utilities reference values directly.
7. **Unlayered consumer element rules beat us under either option** (`button { border-radius: 0 }` → horizon radius 0). This is inherent to `@layer` and is a consumer-facing consequence, not a reason to choose B.

## Decision

**Option A: Tailwind v4 `prefix(hz)` + everything in one `@layer horizon`, reset scoped to `.hz-root`.**

Build shape (`src/styles/index.css`, compiled by `scripts/build-styles.ts`, emitted by the `horizon-styles` Vite plugin as `dist/styles.css`):

```css
@layer theme, base, components, utilities;
@import 'tailwindcss/theme.css' layer(theme) prefix(hz) theme(inline);
@import 'tailwindcss/utilities.css' layer(utilities) source(none);
@source '../';               /* plus @source not for tests/stories */
@import './theme.css';                 /* generated @theme inline */
@import './tokens.css' layer(theme);   /* generated .hz-root variables */
@import './base.css' layer(base);      /* hand-written .hz-root reset */
@import './typography.css';            /* generated @utility type scale */
```

The build then: scans `src` with the oxide scanner, re-scopes Tailwind's `@property` fallback selector to `.hz-root`, wraps the whole output in `@layer horizon { ... }` (Tailwind's layers become `horizon.properties`, `horizon.theme`, `horizon.base`, `horizon.components`, `horizon.utilities`), lowers it with Lightning CSS, and re-adds Tailwind's MIT banner (the only content outside the layer; a comment).

Related decisions made in this task:

- **`@theme inline`, not `@theme`.** Colours map to the scoped semantic vars (`--color-primary: var(--primary)` → `bg-primary` is `background-color: var(--primary)`), so a nested `[data-brand]` subtree re-resolves them. A non-inline theme would emit `--hz-color-primary: var(--primary)` on `:root` (Review Focus 2) and freeze the brand at the declaring element.
- **Namespaces we own are reset** (`--breakpoint-*`, `--color-*`, `--radius-*`, `--shadow-*`, `--ease-*`, `--font-*`, `--font-weight-*`, `--text-*`), then filled from tokens. Components can only reach semantic colours, the 4px spacing scale, Horizon radius/shadow/easing, and the type-scale utilities. `text-sm`, `bg-red-500`, `md:` do not exist.
- **Breakpoints** from `src/tokens/breakpoints.ts` (`mobile 0, tablet 768, laptop 1280, desktop 1920`) in px. `mobile` is the unprefixed mobile-first base and is not emitted as a variant (a `width >= 0` variant is meaningless).
- **Type sizes in px.** `scripts/build-tokens.ts` converts the rem tokens (authored for a 16px root) to px when emitting `--font-size-*`, `--line-height-*` and `--text-*-size/-line-height`. The 11 `@utility text-<role>` classes read those vars, so brand-specific typography can still override them, and are safelisted at every breakpoint (`@source inline`) so they ship precompiled. Spacing (`4px`) and radius are px already.
- **Durations** have no Tailwind theme namespace. Use the numeric utilities that match the tokens (`hz:duration-100/200/300/500`) or `hz:duration-(--duration-fast)`; the default transition is `normal` (200ms) with the `standard` easing.

## How authors write classes

- Always write the prefix first, then variants, then the utility: `hz:flex`, `hz:tablet:px-6`, `hz:hover:bg-primary/90`, `hz:focus-visible:ring-2`, `hz:rtl:rotate-180`, `hz:text-body-default`. (`tablet:hz:flex` is invalid in v4.)
- Arbitrary values keep the prefix: `hz:w-[320px]`, `hz:duration-(--duration-fast)`.
- Classes must be complete string literals in source (scanner), as in any Tailwind project. Classes appearing only in `*.test.*`, `*.test-d.ts`, `*.stories.*` or `src/__tests__` are not compiled into `dist/styles.css`.
- Components never use `.hz-root` descendant selectors themselves; the provider (Task 4) puts `hz-root` (and `data-brand`, `dir`) on its wrapper and on the portal container.

## Contract for `cn()` (Task 4)

`cn(...inputs)` = `twMerge(clsx(inputs))` with tailwind-merge v3 configured as:

- `extendTailwindMerge({ prefix: 'hz', ... })`. tailwind-merge v3 understands the v4 `hz:` prefix form; un-prefixed classes are treated as non-Tailwind and passed through untouched.
- Register the 11 type-scale utilities (`text-display-xl`, `text-display-lg`, `text-heading-xl`, `text-heading-lg`, `text-heading-md`, `text-heading-sm`, `text-body-lg`, `text-body-default`, `text-body-secondary`, `text-caption`, `text-micro`) in the **`font-size`** class group. Otherwise tailwind-merge treats them as text colours, and `cn('hz:text-body-default', 'hz:text-primary-foreground')` drops one of them. Derive the list from `typeScale` keys (`role.replace('/', '-')`) rather than hand-copying.
- Register the theme scales that differ from Tailwind's defaults: `shadow` → `['1','2','3','4']`, `radius` → `['none','xs','sm','md','lg','xl','full']`, `breakpoint` → `['tablet','laptop','desktop']`, `ease` → `['standard','enter','exit','spring']`, `font-weight` → `['light','regular','medium','semibold','bold','extra-bold']`.
- Required test: `cn('hz:px-2', 'hz:px-4') === 'hz:px-4'`, `cn('hz:text-body-default', 'hz:text-heading-md') === 'hz:text-heading-md'`, and `cn('hz:text-body-default', 'hz:text-primary')` keeps both.

## Consequences

- No class collisions with consumer CSS or a consumer's own Tailwind (v3 or v4). MUI/Emotion pages are unaffected (measured).
- Consumers can place horizon anywhere in their layer order, e.g. `@layer mui, horizon;` Note that **unlayered consumer CSS always wins over horizon**: global element rules in a host app (`button { ... }`, `a { ... }`) will restyle horizon elements. Integration guidance (Task 7 / migration doc): host apps wrap legacy global element CSS in a layer ordered before `horizon`, or scope it away from `.hz-root`.
- `--tw-*` property registrations (`@property`) are global by nature. They are identical to the registrations a consumer Tailwind v4 makes; a consumer Tailwind v3 sets the same names on `*` and is unaffected. Only the `@supports` fallback (browsers without `@property`) declares them, and only inside `.hz-root`.
- Everything outside `.hz-root` is unstyled by our base; the provider and portal container must carry `hz-root` (Task 4, Review Focus 1 and 3).
- `prefers-reduced-motion: reduce` collapses animation/transition durations inside `.hz-root` with `!important`; inside a layer, important declarations beat unlayered normal ones, so this holds even against consumer styles on content rendered inside horizon.
- Builds depend on `@tailwindcss/node` and `@tailwindcss/oxide` (devDependencies, pinned to the same exact version as `tailwindcss`). The `@property` fallback rewrite matches Tailwind's exact selector text; `scripts/__tests__/build-styles.test.ts` forces ring/shadow utilities so a Tailwind upgrade that changes it fails CI.
- Authors pay a small tax (`hz:` on every class). shadcn sources ported later need a mechanical prefixing pass.
