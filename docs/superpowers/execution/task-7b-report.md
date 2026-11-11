# Task 7b report: unlayered CSS build for legacy hosts

Status: DONE_WITH_CONCERNS. Commit `b88af35 feat(styles): unlayered build for legacy hosts` on `feat/foundation` (no push, no Co-Authored-By).

## Decisions

- `buildStylesCss(extraCandidates, { layered = true })`. The unlayered file is the lowered layered output passed through a new exported `flattenLayers()`. Flattening after Lightning CSS means the two files contain exactly the same lowered rules; only the wrappers differ.
- `flattenLayers` orders layer contents by **declaration order**, not text position. The real Tailwind raw output declares `@layer properties; @layer theme, base, components, utilities;` but writes the `utilities` block first, then `theme`, `base`, `properties`. Flattening by text position would put the `.hz-root` reset after the utilities. Lightning already reorders the layered output by declaration, but the flattener does not rely on that. It also merges repeated blocks of one layer at their first position, flattens nested layers recursively, puts a scope's non-layer statements (`@property`, `@keyframes`) after its layers (where the cascade ranks them), and ignores braces and semicolons inside strings and comments.
- Resulting unlayered order, checked against the real output: `@supports` properties fallback, theme vars (`.hz-root`, `[data-brand]`), the `.hz-root` base (including reduced motion), then utilities in Tailwind's own order (variants after base utilities, then hover media, focus, focus-visible, active, aria, tablet/laptop/desktop media in min-width order, inactive, arbitrary), then `@property` and `@keyframes`.
- Specificity replaces the layer. The base stays at (0,1,0), or (0,1,1) only on pseudo-elements, so utilities, which come later, still win. A test enforces this.
- Button class changes, with no visual change:
  - added `hz:focus-visible:outline-ring` (0,2,0) and kept `hz:outline-ring`. Without the unconditional class the ring colour transitioned in from `currentColor` over 100ms, because Tailwind's `transition` includes `outline-color`. The `ComputedStyles` story caught that, so the class stays.
  - added `hz:focus:outline-none` (0,2,0): no Bootstrap ring on mouse focus. The `focus-visible:` utilities sort after it.
  - `hz:aria-busy:cursor-progress` became `hz:aria-busy:not-disabled:cursor-progress` (0,3,0).
- Harness: `?build=unlayered`, `?order=horizon-first` (the default is the reboot first), and asChild `<a>` Buttons (`hz-link-*`). The measurement helper now waits for `el.getAnimations()` to finish. Without that, the `outline-color` values were transition midpoints and the results were flaky.

## Measurements (Chromium, six variants keyboard-focused plus the loading button, 18 properties)

| | no reboot (both builds) | layered + reboot | unlayered, reboot first | unlayered, horizon first |
|---|---|---|---|---|
| radius | 20px | 0px | 20px | 20px |
| font-size / line-height (md) | 14 / 20px | 16 / 24px | 14 / 20px | 14 / 20px |
| keyboard focus outline | 2px solid rgb(0,80,240), offset 2px | 5px auto -webkit-focus-ring-color (rgb(0,95,204)) | 2px solid ring | 2px solid ring |
| mouse focus outline | none | auto | none | none |
| loading cursor | progress | pointer | progress | progress |
| all other measured properties | Horizon | Horizon | Horizon | Horizon |

- Unlayered build: none of the 18 properties change with the reboot, in either load order. Without the reboot it renders identically to the layered build.
- MUI Button, Typography and body: unchanged by both builds at the 16px and 14px roots.
- Plain-element probes: unchanged by both builds at both roots, with no reboot, reboot first, and horizon first.
- Before the Button fix, the first unlayered build lost `outlineColor` on all 7 buttons in both orders, and the loading cursor (progress to pointer) when horizon loaded first. That matches the specificity analysis: (0,1,1) beats (0,1,0), and (0,2,0) ties then goes by order.

## TDD evidence

- RED vitest: 7 failed / 18 passed (all 4 `flattenLayers` tests, `'vite build emits the unlayered stylesheet'`, `'unlayered build contains no @layer'`, forced-utilities). The rule-set, order and no-preflight tests passed vacuously at that point because the option was still ignored.
- RED specificity guard: `'unlayered build: Button state utilities out-rank Bootstrap reboot pseudo-class rules'` failed on `.hz\:outline-ring`.
- RED coexistence: the two unlayered-plus-reboot tests failed with `outlineColor` on all 7 buttons, plus `cursor` on the loading button in the horizon-first order. The layered test was updated to the truth, which adds `outlineColor`.
- Mutation: removing `hz:focus:outline-none` failed both unlayered order tests ("true false auto"). Reverted.
- GREEN: vitest 116 passed (11 files). test:coexistence 27 passed, 1 skipped (Dialog, pending Task 11). typecheck, lint, build (`dist/styles.css` 34.4 kB, `dist/styles.unlayered.css` 30.1 kB, no `@layer`) and build-storybook all clean.

## Files changed

- `scripts/build-styles.ts`
- `scripts/__tests__/build-styles.test.ts`
- `src/__tests__/styles.test.ts`
- `vite.config.ts`
- `scripts/vitest-global-setup.ts`
- `package.json` (exports)
- `src/components/Button/Button.tsx`
- `coexistence/{main.tsx,env.d.ts,vite.config.ts,tests/coexistence.spec.ts}`
- ADR 0001: new "Two builds" section covering the build mechanism, cascade order, Button changes, measurement table, a still-overridden section, load order, consumer overrides, the `!important` note and the new-component rule. Mitigation marked decided; `@layer legacy` wrapping is now optional.
- `docs/architecture/03-packaging-and-distribution.md`
- `docs/architecture/05-migration-and-coexistence.md`
- `README.md` (consumer wiring)
- Plan: Task 7b inserted after Task 7; Global Constraints amended.

## Concerns

1. **Still overridden in both builds: `Button asChild` + `<a href>` on hover.** Bootstrap's `a:hover { color: #0056b3; text-decoration: underline }` (0,1,1) beats the variants' plain colour and `no-underline` utilities (0,1,0).
   - Measured with the unlayered build: at rest every link variant keeps Horizon's styles. On hover, all variants are underlined, and primary, tertiary, destructive and link turn `rgb(0,86,179)`. Primary becomes dark text on a dark fill, which is unreadable. Secondary and ghost keep their colour.
   - Layered build: even at rest, `a { color; background-color: transparent }` wins, so link Buttons lose their fill.
   - Not fixed, because it needs hover colour and decoration on every variant. On touch devices Bootstrap's unguarded `a:hover` applies but Horizon's `hover:` (inside `@media (hover: hover)`) does not, so this is a Button/Link design decision.
   - Recorded in the ADR and in doc 05. The harness test `known limit: reboot a:hover restyles Button asChild links` asserts the current behaviour and should be inverted when this is fixed.
2. Unlayered `!important` semantics differ from layered ones: only the reduced-motion rule and `[hidden]` are affected, and this is documented. Consumer overrides with the unlayered build work by specificity and order; `@layer` cannot lift consumer CSS above it.
3. The exact `-webkit-focus-ring-color` value depends on the platform, so tests assert that the colour changed, not its value.
4. Future components that render `a`, `input`, `select`, `table` or headings, or that rely on `:focus`/`:hover`, need harness checks against both builds. State styles that must survive the reboot need state variants.

# Fix report (controller ruling on concern 1: asChild anchors vs reboot a:hover)

Status: DONE. Commit `fix(Button): keep anchor colour and decoration against legacy a:hover` (see git log; on top of b88af35).

## Cause (verified)
Reboot `a:hover { color: #0056b3; text-decoration: underline }` (0,1,1) beats rest-state `hz:text-*` / `hz:no-underline` (0,1,0). `a:hover` also matches while pressed (active). On devices without hover media, Horizon's `hover:` utilities (inside `@media (hover: hover)`) do not exist at all, so sticky touch hover took Bootstrap's colour and underline on all six variants. The reboot has no `a:focus`, `a:active` or `a:visited` rule.

## Fix (Button.tsx, src/styles/index.css; no visual change for native <button>)
- Shared base: `hz:hover:no-underline hz:touch-hover:no-underline`.
- primary: `hover:text-primary-foreground`, `touch-hover:text-primary-foreground`.
- secondary: `touch-hover:text-primary`; its existing hover colour stays.
- tertiary: `hover:text-primary`, `touch-hover:text-primary`; `hover:underline` stays.
- destructive: `hover:text-destructive-foreground`, `touch-hover:text-destructive-foreground`.
- ghost: `touch-hover:text-foreground`.
- link: `hover:text-primary hover:underline`, `touch-hover:text-primary touch-hover:underline`; `hover:decoration-2` stays.
- tailwind-merge resolves the shared `no-underline` against the tertiary and link underline classes.
- New custom variant `touch-hover` = `@media not all and (hover: hover) { &:hover }`. It re-asserts the rest look for sticky touch hover.
- Specificity: all of these rules are (0,2,0) and beat (0,1,1). `inactive:` (0,3,0) still wins for disabled links.
- Residual: `a:not([href]):hover` (0,2,1) applies only to anchors without `href`, which are not links. Documented.

## Tests (harness, real reboot)
- `unlayered build: Bootstrap reboot does not restyle Button asChild links`. Covers 6 variants x rest, hover, keyboard focus, active and visited, compared with the same page without the reboot, in both load orders.
- `unlayered build on a touch device (no hover media)`. Uses isMobile/hasTouch, asserts `(hover: hover)` is false, and puts `:hover` on each link with a pointer move. Playwright's tap leaves no sticky :hover, which I verified, so the test simulates it.
- `layered build (known limit): reboot anchor rules restyle Button asChild links`. Asserts exactly: at rest `rgb(0, 123, 255)`, transparent background and no decoration; on hover `rgb(0, 86, 179)` with underline; radius 20px and font-size 14px are kept.
- The old `known limit: reboot a:hover ...` group was replaced.
- The animation wait now tolerates cancelled transitions (`finished` rejects with AbortError).
- Visited: computed styles never expose `:visited` colours, so this check reads the link after it has been followed. Documented in the ADR.

## TDD
- RED, desktop: both orders failed. Changed values on hover and active:
  - primary and destructive: colour to rgb(0,86,179), plus underline;
  - tertiary and link: colour to rgb(0,86,179);
  - secondary and ghost: underline.
- RED, touch: both orders failed. All six variants took the Bootstrap colour on hover, and every variant except link was also underlined.
- GREEN: vitest 116 passed (11 files). test:coexistence 30 passed, 1 skipped. typecheck, lint, build and build-storybook clean.

## Docs
- ADR 0001: the "still overridden" section is replaced by "fixed for the unlayered build", with the cause, the fix, the measurements and the remaining layered limit.
- Doc 05: the bullet now says the issue is fixed for the unlayered build and remains for the layered build.
- Plan: Task 7b Step 2b added.

## Remaining concerns
- The layered build's anchor and Button overrides by the reboot cannot be fixed without `!important`. That is by design; legacy hosts use the unlayered build.
- Future link-like components (Link, menu items) need the same hover and touch-hover treatment.

# Fix report (Task 7b review)

Status: DONE. Commit `fix(styles): namespace keyframes, centralise anchor guard` (see git log, on top of 45be251).

1. (Important) Keyframes namespaced.
   - New `namespaceKeyframes()` in `scripts/build-styles.ts`. It runs on the compiled output after the `--hz-tw-` rename and before Lightning, so both builds get it.
   - It renames every `@keyframes X` that is not already `hz-` to `hz-X`, and every matching identifier in `animation` / `animation-name` values. Real output: `.hz\:animate-spin { animation: 1s linear infinite hz-spin }` (Lightning reorders the shorthand) and `@keyframes hz-spin`.
   - Tests in `styles.test.ts`, for both builds: every `@keyframes` name starts with `hz-`; the `animate-spin` rule references `hz-spin` and not `spin`; with forced ping/pulse/bounce, every definition and every non-keyword animation identifier is `hz-*`.
   - Harness, both builds: a conflicting host `@keyframes spin` is added after horizon CSS; the spinner's running CSSAnimation is `hz-spin` with `rotate(360deg)` keyframes and no opacity.
   - RED before the implementation: 5 vitest failures. A mutation that disabled the rename failed both harness tests (`spin` instead of `hz-spin`).
2. (Minor) Consumer overrides of hover colour are documented in two places:
   - ADR "Consumer overrides": `className="hz:text-..."` applies at rest only; also pass `hz:hover:text-...` and `hz:touch-hover:text-...`.
   - Button component TSDoc: same guidance, with an example.
3. (Minor) New `src/primitives/anchorGuard.ts` (with `index.ts`): `anchorGuard(rest, { hover, underline, hoverUnderline })`.
   - Class names are complete string literals in lookup maps, so the Tailwind scanner still compiles them.
   - Button uses it for all six variants; the shared base `hover:/touch-hover:no-underline` moved into the helper.
   - The class sets Button produces after `cn()` are identical for every variant x size (diffed before and after).
   - `anchorGuard.test.ts` covers the default, a distinct hover colour, the underline modes, and the exact per-variant strings.
   - No eslint change was needed; anchorGuard is not in the public API.
4. (Minor) The variant regex in the order test now includes `touch-hover` and `focus` (`focus-visible` comes first in the alternation).
5. (Minor) The README snippet is split into two code blocks.
6. (Minor) The ADR now says "across layers, earlier layers' `!important` beats later layers' `!important`". Verified against CSS Cascade 5: for important declarations the layer order is reversed, and layered important beats unlayered important.

Verification: vitest 125 passed (12 files); test:coexistence 32 passed, 1 skipped; typecheck, lint, build (both dist files contain `@keyframes hz-spin`) and build-storybook clean.
