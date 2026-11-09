# ADR 0001: CSS isolation — `hz:` prefix + `@layer horizon` (and an unlayered build for legacy hosts)

- Status: Accepted
- Date: 2026-11-01
- Resolves: open question Q8 (`06-open-questions.md`)

## Context

horizon-ui ships one precompiled stylesheet, `dist/styles.css` (`import '@cialdnb/horizon-ui/styles.css'`). Consumers do not run Tailwind. The first consumers are MUI v5 / Emotion apps built on x-core Legacy DS (`htmlFontSize: 14` in the MUI theme, `CssBaseline`). customer360 sets no `html` font-size: its root stays at the browser default 16px, so MUI rem values render about 14% larger than the nominal 14px; a host that does set `html { font-size: 14px }` is the stress case. customer360 also imports Bootstrap 4.4.1 (full, including reboot) UNLAYERED plus `* { box-sizing: border-box }` and `html, body { width/height: 100%; margin: 0; font-family }` (`client/src/projectx-core/css/index.scss`). Some consumers also carry their own utility CSS (Tailwind v3, legacy utility classes). The stylesheet must:

- not change anything outside horizon-ui's own DOM (no global preflight, no `:root` variables);
- not be broken by consumer class names that match ours;
- let consumers order it against their own styles (`@layer horizon`);
- keep Horizon sizes correct on a 14px root (stress case) and on the default 16px root.

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
| Unlayered consumer (Tailwind v3 style) `*, ::before, ::after { --tw-ring-offset-width: 5px; --tw-ring-color: red; --tw-shadow: 0 0 0 9px lime }`, horizon `hz:ring-2 hz:ring-ring hz:shadow-1`, after the `--hz-tw-` rename (review follow-up) | n/a | ring 2px `rgb(0,80,240)`, offset 0, elevation-1 shadow; consumer values ignored | n/a |

Findings:

1. **Scope collides; prefix does not.** Layered styles always lose to unlayered styles, whatever the specificity. Under B, any unlayered consumer class with the same name as one of our utilities (`.px-4`, `.rounded-lg`, `.flex`) overrides ours, including inside `.hz-root`. Under A, no consumer class can be named `hz:px-4` by accident.
2. **Neither option touches MUI.** MUI/Emotion styles and `CssBaseline` computed values were identical with and without horizon CSS in both variants. The only `body` difference in the final build check was `height` (the horizon button became taller), which is layout, not a style leak.
3. **rem is the real 14px-root hazard, for both options.** `1rem` resolves against `html`, so `.hz-root { font-size: 16px }` cannot fix it. Type tokens are now emitted in px (see Decision).
4. **Tailwind v4 prefix works with everything we need.** `prefix(hz)` applies to `@theme` custom breakpoints (`hz:tablet:px-6` → `@media (width >= 768px)`), to `@utility` classes (`@utility text-body-default` → `.hz\:text-body-default`), to opacity modifiers (`hz:bg-primary/50`) and to state variants (`hz:hover:`, `hz:focus-visible:`). Resetting `--breakpoint-*` removes `hz:md:` etc. completely.
5. **Tailwind internals are not prefixed.** `--tw-*` custom properties and their `@property` registrations keep the `--tw-` name, and Tailwind emits an `@property` fallback rule on `*, ::before, ::after, ::backdrop`. That shared name is a collision source in the consumer -> horizon direction: a consumer Tailwind v3 sets `--tw-ring-color`, `--tw-ring-offset-width`, `--tw-shadow` etc. on `*` (unlayered, so it reaches and beats our elements), and a consumer Tailwind v4 of a different version registers the same names with its own unlayered `@property`, which beats our layered one. The build therefore renames every `--tw-` to `--hz-tw-` (definitions, references, `@property` registrations, the fallback rule); the re-run above shows consumer `--tw-*` values no longer reach horizon. `@property` inside `@layer` works in Chromium (registered initial value observed), so it stays inside `@layer horizon`; the `*` fallback is rewritten to `.hz-root`-scoped selectors at build time.
6. **No-preflight build shape verified on real output.** Importing only `tailwindcss/theme.css` and `tailwindcss/utilities.css` (never `preflight.css`) emits no element selectors. `@theme inline` emits no `:root, :host { ... }` block; utilities reference values directly.
7. **Unlayered consumer element rules beat us under either option** (`button { border-radius: 0 }` → horizon radius 0). This is inherent to `@layer` and is a consumer-facing consequence, not a reason to choose B.

## Verification in the repo (Task 7: coexistence harness)

The spike was throwaway; the same claims are now an automated gate: `npm run test:coexistence` (Playwright Test, `coexistence/`). It builds the real library and `styles.css` (`vite build` into a fresh directory under `node_modules/.cache`, never `dist/`), serves a page with a MUI v5 theme mirroring x-core Legacy (`htmlFontSize: 14` against the browser-default 16px root as in customer360, `CssBaseline`, Open Sans, primary `#0050F0`) next to `HorizonProvider` + `Button`, and measures in Chromium.

Measured (all green on the shipped CSS pipeline, so **no leakage was found and no change to `base.css` or the layer order was needed**):

| Check | Result |
|---|---|
| MUI `Button`, MUI `Typography` (h5) and `body`: `font-size`, `padding`, `border-radius`, `background-color`, `font-family`, `line-height`, page loaded without vs with `styles.css` | deep-equal at both roots: 16px (the real customer360 setup; MUI Button font-size 16px) and 14px (stress case; 14px), `rgb(0, 80, 240)` |
| Plain `button`, `h1`, `a`, `input`, `table`/`td`, `p`, `ul`/`li` outside `.hz-root` and `body` (margin, padding, font-*, line-height, colour, border-*, radius, box-sizing, display, list-style, text-decoration, background), without vs with `styles.css`, at both roots | identical (a bare `button { font-size: 40px }` or `* { box-sizing: border-box }` inside `base.css` fails it) |
| Horizon `Button` bounding box with `html` font-size 14px vs 16px | identical (101.53 x 36 px), tolerance 1px |
| Horizon in `dir="rtl"` (provider's own `dir`, no wrapper), Horizon ltr beside MUI and inside a rtl area, MUI in a rtl area | logical `border-inline-end` lands on the left edge in rtl, on the right in ltr; MUI `direction`, `text-align`, padding and position unchanged by removing the rtl subtree |
| Page width at 320px | `scrollWidth` equals `clientWidth` (no horizontal overflow) |
| `hz:tablet:` / `hz:laptop:` / `hz:desktop:` probe at 767/768, 1279/1280, 1919/1920px | computed `font-size` flips exactly at 768, 1280 and 1920 (4 distinct values) |
| Dialog stacking vs MUI modal (z-index 1300) | not yet testable: `test.fixme` until Task 11 (Dialog and the z-index scale) |

Tests were shown able to fail (deliberate mutations, each reverted): an unlayered `html { font-size: 16px }` in the stylesheet with the `@layer horizon` wrap removed changed MUI Button/Typography/body (14px -> 16px, 16px -> 18.29px) and failed the leakage test, while the same rule inside the layer did not (a layered rule loses to MUI's unlayered 14px root); a rem-based Button padding failed the 14px/16px test (6px width delta); a physical `border-r` instead of `border-e` failed the rtl test; moving the tablet breakpoint to 800px failed the breakpoint test; a 400px-wide element failed the 320px test.

### Known limit measured: unlayered Bootstrap 4.4.1 reboot restyles Horizon Button

The harness loads the real `bootstrap/dist/css/bootstrap-reboot.css` (4.4.1, a devDependency used only under `coexistence/`, so the rules are exactly what customer360 ships) unlayered, plus `* { box-sizing: border-box }`, and compares all six Horizon Button variants against the same page without it (focused with the keyboard so `:focus-visible` is included). Measured today:

| Property | without reboot | with reboot | cause |
|---|---|---|---|
| `border-radius` | 20px | **0px** | reboot `button { border-radius: 0 }` beats layered `hz:rounded-lg` |
| `font-size` | 14px | **16px** | reboot `button { font: inherit }` beats layered `text-label-md` (inherits `.hz-root` 16px) |
| `line-height` | 20px | **24px** | same |
| focus `outline-style` / `outline-width` | 2px solid | **auto** (5px) | reboot `button:focus { outline: 5px auto -webkit-focus-ring-color }` beats `hz:focus-visible:outline-2 outline-solid` |

Unchanged (so not overridden): background, colour, cursor, padding, margin, box-sizing, font-family, font-weight, text-transform, box-shadow, display. These are asserted by the test group `known limit: unlayered Bootstrap reboot overrides horizon Button`, which asserts today's measured behaviour, not desired behaviour; invert it when a mitigation lands. The same mechanism will affect any Horizon element that Bootstrap restyles by element selector (inputs, links, tables, headings), so each new component needs the same check.

Mitigation options (decided in Task 7b: option 3, shipped as a second build next to the layered one; see "Two builds" below):

1. **Consumer layers its legacy CSS.** customer360 wraps the Bootstrap import (and other global element CSS) in `@layer legacy { ... }` (in Sass: `@layer legacy { @include meta.load-css("bootstrap/scss/bootstrap"); }`) and declares `@layer legacy, horizon;` first. Declaring the order alone does nothing for bare unlayered Bootstrap: only CSS that is actually inside a layer ranks below `horizon`. No library change, and it fixes the whole class of problem, but it is real work for customer360 and it changes cascade precedence of Bootstrap against MUI/Emotion (unlayered) and the app's own unlayered CSS, so the whole app needs a visual regression pass.
2. **Library ships a small set of properties as `!important` inside the layer** (`hz:rounded-lg!`, `hz:text-label-md!`, outline) for elements Bootstrap resets. Important declarations in a layer beat unlayered normal ones, so no consumer change is needed. Costs: consumers and `className` overrides can no longer win with normal CSS, `tailwind-merge` conflict resolution must account for `!`, it must be repeated for every element-level conflict, and it hides the problem rather than isolating it.
3. **Drop the layer for utilities** (emit them unlayered). `.hz\:rounded-lg` (specificity 0,1,0) beats `button` (0,0,1) by specificity, with no consumer change. Costs: loses the ordering guarantee of `@layer horizon` (consumer layers can no longer be placed above it deliberately), and consumer element-plus-class rules (`button.btn`) win by specificity; the `.hz-root` reset would no longer be a low-priority base.

## Two builds: layered and unlayered (Task 7b, controller ruling)

The measurement above makes the layered build unusable as-is in customer360, and wrapping customer360's Bootstrap in a layer is an app-wide cascade change. The library therefore ships two stylesheets from the same pipeline (`buildStylesCss(extra, { layered })` in `scripts/build-styles.ts`, both emitted by the `horizon-styles` Vite plugin):

| Export | File | Shape | Use when |
|---|---|---|---|
| `@cialdnb/horizon-ui/styles.css` | `dist/styles.css` | everything in `@layer horizon` | Modern hosts: no unlayered global element CSS, or the host wraps it in a layer, and wants its own unlayered CSS to override horizon. |
| `@cialdnb/horizon-ui/styles.unlayered.css` | `dist/styles.unlayered.css` | the same rules, no `@layer` at all | Legacy hosts with unlayered global element CSS (Bootstrap reboot, `button { ... }`, `a { ... }`). customer360 uses this one. |

Import exactly one of them. Both keep every isolation invariant: no preflight, every selector is `.hz-root`-scoped or a `.hz\:` utility, no `:root`/`:host`/`html`/`*` custom-property declarations, `--tw-*` renamed `--hz-tw-*` with the `@property` fallback scoped to `.hz-root`, px type sizes, `hz:` prefix, `@property` registrations and the reduced-motion rule kept (asserted for both in `src/__tests__/styles.test.ts`). The reduced-motion rule's element selector is `.hz-root :where(:not([data-hz-motion='essential']))`, so it stays at (0,1,0) in the unlayered build and exempts loading indicators (see Consequences).

### How the unlayered file is made (cascade order)

The lowered layered stylesheet is passed through `flattenLayers()`, which removes every `@layer` block and statement and keeps the cascade the layers expressed:

- Layer contents are emitted in **layer order** (first declaration), not text position. This matters: Tailwind's raw output declares `@layer properties; @layer theme, base, components, utilities;` but writes the `utilities` block *before* `theme` and `base`. Flattening by text position would put the `.hz-root` reset after the utilities and let it win. (Lightning CSS already reorders the layered output by declaration; the flattener does not rely on that, see `scripts/__tests__/build-styles.test.ts`.)
- Repeated blocks of one layer join at its first position; nested layers (`horizon` > `theme`...) flatten recursively; non-layer statements of a scope (`@property`, `@keyframes`) follow its layers, where the cascade ranked them.
- Result: properties fallback, theme variables, `.hz-root` base, then utilities in Tailwind's own sort (unprefixed utilities, then variants: `hover` in `@media (hover: hover)`, `focus`, `focus-visible`, `active`, `aria-*`, `tablet:`/`laptop:`/`desktop:` media in min-width order, `inactive`, arbitrary). Tests assert the normalized rule list equals the layered build's (same rules, same order, only the wrapper gone), that no `.hz-root` rule follows a utility, and that every variant rule follows its base utility.

Without layers, rules compete by **specificity, then order**. Two consequences are guarded by tests:

- The reset must not out-rank utilities. Every theme/base rule that is not a pure variable declaration has specificity (0,1,0) (`.hz-root`, `.hz-root :where(...)`) or (0,1,1) where it targets a pseudo-element (`::placeholder`, `::file-selector-button`, `:before`/`:after`); utilities are (0,1,0) or more and come later, so they win as they did in the layer.
- Horizon beats Bootstrap's element selectors by specificity, not by order. `.hz\:rounded-lg` (0,1,0) > `button` (0,0,1). Bootstrap's **pseudo-class** rules are higher and need state utilities: `button:focus { outline: 1px dotted; outline: 5px auto -webkit-focus-ring-color }` is (0,1,1) and `[type="button"]:not(:disabled) { cursor: pointer }` is (0,2,0). A plain utility loses to the first; an `aria-busy:` utility (0,2,0) ties with the second and then depends on load order.

### Button changes (no visual change)

Measured on the first unlayered build, with the reboot loaded, Button lost: `outline-color` while keyboard-focused (`hz:outline-ring` (0,1,0) < `button:focus`; ring `rgb(0, 80, 240)` became `-webkit-focus-ring-color` `rgb(0, 95, 204)`), the 5px auto Bootstrap ring on mouse focus (Horizon shows none), and, only when horizon CSS loads before the reboot, the loading button's `progress` cursor (tie at (0,2,0), later reboot wins). Class changes in `Button.tsx`:

- `hz:focus-visible:outline-ring` (0,2,0) added; `hz:outline-ring` kept, so the outline colour is already the ring before focus and does not transition in (Tailwind's `transition` includes `outline-color`; dropping it made the ring fade from `currentColor` for 100ms and failed the `ComputedStyles` story).
- `hz:focus:outline-none` (0,2,0): no ring on mouse focus, as without the reboot; `focus-visible:` utilities sort after `focus:` and restore the 2px solid ring for keyboard focus.
- `hz:aria-busy:cursor-progress` -> `hz:aria-busy:not-disabled:cursor-progress` (0,3,0), mirroring the reboot selector's `:not(:disabled)` plus a class. A disabled + loading button still gets `not-allowed` from `inactive:` as before.

### Measured (coexistence harness, Chromium, all six variants keyboard-focused plus the loading button)

| Property | no reboot (both builds) | layered + reboot | unlayered + reboot, reboot loaded first | unlayered + reboot, horizon loaded first |
|---|---|---|---|---|
| `border-radius` | 20px | **0px** | 20px | 20px |
| `font-size` / `line-height` (`md`) | 14px / 20px | **16px / 24px** | 14px / 20px | 14px / 20px |
| keyboard focus outline | 2px solid `rgb(0, 80, 240)`, offset 2px | **5px auto `-webkit-focus-ring-color`** (`rgb(0, 95, 204)` in the harness Chromium) | 2px solid `rgb(0, 80, 240)` | 2px solid `rgb(0, 80, 240)` |
| mouse focus outline | none | **auto** | none | none |
| loading cursor | progress | **pointer** | progress | progress |
| background, colour, padding, margin, family, weight, box-sizing, shadow, display, cursor | Horizon | Horizon | Horizon | Horizon |

All 18 measured properties are identical with and without the reboot for the unlayered build in both load orders, and the unlayered build renders the Button identically to the layered build without the reboot. MUI Button/Typography/body and the plain-element probes (`button`, `h1`, `a`, `input`, `table`, `p`, `ul`, `body`) are unchanged by either build, at 16px and 14px roots, without the reboot and with it in both orders. The layered build's known-limit tests stay and assert the override (the truth for `styles.css`).

### `Button asChild` + `<a href>` against the reboot's anchor rules (fixed for the unlayered build)

Bootstrap's `a:hover { color: #0056b3; text-decoration: underline }` is (0,1,1), above the variants' plain text-colour and `no-underline` utilities (0,1,0). Measured on the first unlayered build with the reboot (both orders): at rest every link variant kept Horizon's look, but on hover (and while pressed, since `:hover` still matches) every variant was underlined and primary, tertiary, destructive and link turned `rgb(0, 86, 179)` (primary: dark text on the `primary-hover` fill, unreadable). With a device that has no hover media (touch: browsers leave `:hover` on a tapped element), all six variants took the Bootstrap colour and underline, because Horizon's `hover:` variant only exists inside `@media (hover: hover)`.

Fix (class level, no visual change for native `<button>`): every variant states its hover colour and decoration explicitly as `hover:` utilities (0,2,0) equal to the intended hover look (`primary`: `hover:text-primary-foreground`, `tertiary`: `hover:text-primary hover:underline`, `link`: `hover:text-primary hover:underline`, shared `hover:no-underline`, ...), and a new `touch-hover:` custom variant (`@media not all and (hover: hover) { &:hover }`, in `src/styles/index.css`) re-asserts the rest colour and decoration for sticky touch hover. The reboot has no `a:focus`, `a:active` or `a:visited` rule, so those states need no class; they are measured anyway. Computed styles never expose `:visited` colours (browser privacy), so the "visited" check reads the link after it has been followed.

Measured after the fix, unlayered build, real reboot, both load orders: all six asChild link variants keep colour, background, decoration line and thickness, radius and font-size at rest, hover, keyboard focus, active and visited (30 states), and on a touch-emulated device (`(hover: hover)` false) with `:hover` applied. Harness tests: `unlayered build: Bootstrap reboot does not restyle Button asChild links`, `unlayered build on a touch device (no hover media)`.

Remaining limits:

- **Layered build** (cannot be fixed inside the layer without `!important`): the reboot's unlayered `a { color: #007bff; background-color: transparent }` wins at rest (link Buttons lose their fill and colour; radius and type survive), and `a:hover` gives `rgb(0, 86, 179)` + underline on hover. Asserted exactly by `layered build (known limit): reboot anchor rules restyle Button asChild links`.
- `a:not([href]):hover` (0,2,1) in the reboot would still beat the (0,2,0) hover utilities, but only for an anchor **without** `href`, which is not a link and should not be used with `asChild`.

### Keyframes are namespaced (both builds)

`@keyframes` names are global and not affected by layers or prefixes: a host `@keyframes spin` and Tailwind's `spin` replace each other, whichever is defined last (with the recommended order, horizon's would replace the host's). `namespaceKeyframes()` in `scripts/build-styles.ts` renames every `@keyframes` definition and every `animation` / `animation-name` reference to `hz-<name>` (`hz:animate-spin` -> `animation: 1s linear infinite hz-spin`, Lightning CSS reorders the shorthand). Tests assert every keyframes name starts with `hz-` and the references follow (`spin`, `ping`, `pulse`, `bounce`), in both builds; the harness loads a conflicting host `@keyframes spin` after horizon CSS and checks the Button spinner still runs `hz-spin` with its rotation.

### Rules for the unlayered build

- **Load order:** load horizon CSS after the legacy CSS (the documented order). The tests pass in both orders today, but any future tie in specificity resolves in favour of whichever loads last.
- **Consumer overrides:** with `styles.unlayered.css`, consumer CSS wins by normal specificity and order: a consumer class rule of (0,1,0) placed after horizon, or anything more specific, overrides a utility. `@layer` cannot be used to put consumer CSS above horizon (layered consumer CSS always loses to unlayered horizon). `hz:`-prefixed class names cannot collide with consumer class names, so accidental overrides need a selector that targets horizon's DOM (`.my-page button`, (0,1,1), beats `.hz\:rounded-lg`). Prefer `className` on the component (merged by `cn()`) over global selectors. Hover colour: Button (and later anchor-capable components, via `anchorGuard()` in `src/primitives`) sets explicit `hz:hover:text-*` and `hz:touch-hover:text-*` classes so a host `a:hover` cannot restyle `asChild` links. `cn()` does not drop them for a plain `className="hz:text-..."` (different variant), so such an override applies at rest only; pass the same colour for the states too: `className="hz:text-foreground hz:hover:text-foreground hz:touch-hover:text-foreground"`.
- **`!important`:** across layers, earlier layers' `!important` beats later layers' `!important` (the cascade reverses layer order for important declarations, and layered important beats unlayered important); flattened, they compete by specificity and order. The only `!important` declarations are the reduced-motion rule and `[hidden]` in the base; no component uses `!` utilities. Against consumer `!important` rules, the layered build's reduced-motion rule always wins (layered important beats unlayered important); the unlayered one wins only by specificity/order.
- **New components** that render elements Bootstrap restyles by element or pseudo-class selector (`a`, `input`, `select`, `table`, headings, `:focus`, `:hover`) must add their elements to the harness and check both builds; state styles that must survive the reboot need a state variant, not a plain utility.

Note for harness authors: a layered `button { font-size: 40px }` inside horizon-ui would not change a MUI button (MUI's class selectors are unlayered and also more specific); leakage that matters is root-level (`html`/`:root` font-size, variables), which is why the root font-size case is the one measured.

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

The build then: scans `src` with the oxide scanner, re-scopes Tailwind's `@property` fallback selector to `.hz-root`, renames Tailwind's internal `--tw-*` variables to `--hz-tw-*`, wraps the whole output in `@layer horizon { ... }` (Tailwind's layers become `horizon.properties`, `horizon.theme`, `horizon.base`, `horizon.components`, `horizon.utilities`), lowers it with Lightning CSS, and re-adds Tailwind's MIT banner (the only content outside the layer; a comment). For `dist/styles.unlayered.css` the lowered output is then passed through `flattenLayers()` (see "Two builds").

Related decisions made in this task:

- **`@theme inline`, not `@theme`.** Colours map to the scoped semantic vars (`--color-primary: var(--primary)` → `bg-primary` is `background-color: var(--primary)`), so a nested `[data-brand]` subtree re-resolves them. A non-inline theme would emit `--hz-color-primary: var(--primary)` on `:root` (Review Focus 2) and freeze the brand at the declaring element.
- **Namespaces we own are reset** (`--breakpoint-*`, `--color-*`, `--radius-*`, `--shadow-*`, `--ease-*`, `--font-*`, `--font-weight-*`, `--text-*`), then filled from tokens. Components can only reach semantic colours, the 4px spacing scale, Horizon radius/shadow/easing, and the type-scale utilities. `text-sm`, `bg-red-500`, `md:` do not exist.
- **Breakpoints** from `src/tokens/breakpoints.ts` (`mobile 0, tablet 768, laptop 1280, desktop 1920`) in px. `mobile` is the unprefixed mobile-first base and is not emitted as a variant (a `width >= 0` variant is meaningless).
- **Type sizes in px.** `scripts/build-tokens.ts` converts the rem tokens (authored for a 16px root) to px when emitting `--font-size-*`, `--line-height-*` and `--text-*-size/-line-height`. The `@utility text-<role>` classes (11 at the time of this ADR, 14 since Task 6 added `label/*`) read those vars, so brand-specific typography can still override them, and are safelisted at every breakpoint (`@source inline`) so they ship precompiled. Spacing (`4px`) and radius are px already.
  - Cost: px ignores the user's browser default font-size setting (a user who sets 20px as default text size does not get larger horizon text). Browser zoom still scales px, so WCAG 1.4.4 (resize text to 200%) still passes; this is the same trade-off x-core Legacy makes with its fixed 14px root.
  - Deferred option (future opt-in, not built): emit sizes as `calc(var(--hz-rem) * N)` with `.hz-root { --hz-rem: 16px }`. A host on a 16px root could then set `--hz-rem: 1rem` to honour the user's preference again, and a 14px host keeps 16px.
- **Durations** are emitted into Tailwind's `--transition-duration-*` namespace (reset, then filled from `src/tokens/motion.ts`), so components write `hz:duration-fast`, `hz:duration-normal`, etc. (amended in Task 6). Numeric `hz:duration-100` still compiles but components should use the token names. The default transition is `normal` (200ms) with the `standard` easing.

## How authors write classes

- Always write the prefix first, then variants, then the utility: `hz:flex`, `hz:tablet:px-6`, `hz:hover:bg-primary/90`, `hz:focus-visible:ring-2`, `hz:rtl:rotate-180`, `hz:text-body-default`. (`tablet:hz:flex` is invalid in v4.)
- Arbitrary values keep the prefix: `hz:w-[320px]`, `hz:grid-cols-[1fr_auto]`.
- Classes must be complete string literals in source (scanner), as in any Tailwind project. Classes appearing only in `*.test.*`, `*.test-d.ts`, `*.stories.*` or `src/__tests__` are not compiled into `dist/styles.css`.
- Components never use `.hz-root` descendant selectors themselves; the provider (Task 4) puts `hz-root` (and `data-brand`, `dir`) on its wrapper and on the portal container.

## Contract for `cn()` (Task 4)

`cn(...inputs)` = `twMerge(clsx(inputs))` with tailwind-merge v3 configured as:

- `extendTailwindMerge({ prefix: 'hz', ... })`. tailwind-merge v3 understands the v4 `hz:` prefix form; un-prefixed classes are treated as non-Tailwind and passed through untouched.
- Register the type-scale utilities (`text-display-xl`, `text-display-lg`, `text-heading-xl`, `text-heading-lg`, `text-heading-md`, `text-heading-sm`, `text-body-lg`, `text-body-default`, `text-body-secondary`, `text-caption`, `text-micro`) in the **`font-size`** class group. Otherwise tailwind-merge treats them as text colours, and `cn('hz:text-body-default', 'hz:text-primary-foreground')` drops one of them. Derive the list from `typeScale` keys (`role.replace('/', '-')`) rather than hand-copying.
- Register the theme scales that differ from Tailwind's defaults: `shadow` → `['1','2','3','4']`, `radius` → `['none','xs','sm','md','lg','xl','full']`, `breakpoint` → `['tablet','laptop','desktop']`, `ease` → `['standard','enter','exit','spring']`, `font-weight` → `['light','regular','medium','semibold','bold','extra-bold']`.
- Required tests: `cn('hz:px-2', 'hz:px-4') === 'hz:px-4'`, `cn('hz:text-body-default', 'hz:text-heading-md') === 'hz:text-heading-md'`, `cn('hz:text-body-default', 'hz:text-primary')` keeps both, `cn('hz:shadow-1', 'hz:shadow-2') === 'hz:shadow-2'`, `cn('hz:rounded-lg', 'hz:rounded-xs') === 'hz:rounded-xs'`.

## Portals rendered by the host (MUI dialogs)

Scoping by `.hz-root` means a Horizon component rendered into a host portal (an MUI Dialog in `document.body`) is unstyled unless that portal content has its own `.hz-root`: wrap it in a `<HorizonProvider>` (it inherits brand and direction from the parent provider). Measured consequences without it and the snippet: `docs/architecture/05-migration-and-coexistence.md`, "Horizon controls inside MUI dialogs".

## Breakpoints follow the viewport, not the container (Task 12a note)

`tablet:`/`laptop:`/`desktop:` are viewport media queries (Responsive Standard). A component placed in a narrow container at a wide viewport (Pagination or a Table in a 320-400px Drawer at laptop width) gets its wide layout. Pagination's page list therefore wraps (`flex-wrap`, `min-w-0`) instead of overflowing; it does not collapse to the mobile form. Container-query collapse (`hz:@container` with `--container-*` tokens) is a future option and would be a deliberate deviation from the viewport-breakpoint standard; not implemented.

## Consequences

- No class collisions with consumer CSS or a consumer's own Tailwind (v3 or v4). MUI/Emotion pages are unaffected (measured).
- Hosts with unlayered global element CSS (customer360) import `styles.unlayered.css` instead (see "Two builds"); the rest of this bullet applies to `styles.css`. Consumers can place horizon anywhere in their layer order, e.g. `@layer mui, horizon;` Note that **unlayered consumer CSS always wins over horizon**: global element rules in a host app (`button { ... }`, `a { ... }`) will restyle horizon elements. Known limit and guidance for consumers: a host app's **unlayered global element rules** (`button { ... }`, `a { ... }`, `* { ... }`) beat any horizon layer and will restyle horizon elements; horizon-ui cannot prevent this. With `styles.css`, host apps can wrap such legacy global element CSS in a layer ordered before `horizon` (`@layer legacy, horizon;`), or scope it away from `.hz-root`; this is optional, since `styles.unlayered.css` covers hosts that cannot. Unlayered class rules of the host only affect horizon if they match horizon's DOM (our own classes are `hz:`-prefixed, so accidental collisions do not occur). Task 7 verified the other direction (horizon CSS does not alter MUI/CssBaseline output or plain elements). A consumer that chooses that route must actually wrap its legacy CSS in `@layer legacy`: the declaration `@layer legacy, horizon;` on its own does not help bare unlayered Bootstrap. customer360 does not take that route; it uses the unlayered build.
- Tailwind keyframes are renamed `hz-*` (definitions and references), so a host `@keyframes spin` cannot replace horizon's spinner animation or vice versa.
- Tailwind's internal variables are renamed `--tw-*` -> `--hz-tw-*`, so neither a consumer Tailwind v3 (which sets `--tw-*` on `*`, unlayered) nor a consumer Tailwind v4 of another version (own unlayered `@property --tw-*`) can change horizon rings, shadows, borders or transforms, and our registrations cannot affect theirs. `@property --hz-tw-*` registrations are still global by nature but use a horizon-only name. Only the `@supports` fallback (browsers without `@property`) declares them as values, and only inside `.hz-root`.
- Everything outside `.hz-root` is unstyled by our base; the provider and portal container must carry `hz-root` (Task 4, Review Focus 1 and 3).
- `prefers-reduced-motion: reduce` collapses animation/transition durations inside `.hz-root` with `!important`; inside a layer, important declarations beat unlayered normal ones, so this holds even against consumer styles on content rendered inside horizon.
- Exception (Task 10b): elements marked `data-hz-motion="essential"` are exempt from that kill switch, because their motion is the message (a frozen spinner reads as a hung page). They carry their own `hz:motion-reduce:` animation that is slowed or motionless, not stopped: Spinner turns once every 3s instead of 1s, and indeterminate Progress pulses its opacity instead of travelling. The attribute is internal to horizon-ui components, not a consumer API; consumers must not set it to opt their own content out of reduced motion.
- Builds depend on `@tailwindcss/node` and `@tailwindcss/oxide` (devDependencies, pinned to the same exact version as `tailwindcss`). The `@property` fallback rewrite matches Tailwind's exact selector text; `scripts/__tests__/build-styles.test.ts` forces ring/shadow utilities and asserts no `--tw-` survives, so a Tailwind upgrade that changes either fails CI. Upgrade `tailwindcss`, `@tailwindcss/node` and `@tailwindcss/oxide` together (same exact version) and re-run that test.
- Authors pay a small tax (`hz:` on every class). shadcn sources ported later need a mechanical prefixing pass.
