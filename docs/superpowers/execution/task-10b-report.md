# Task 10b report: Spinner, Separator, Progress, Alert

Status: DONE_WITH_CONCERNS. Every gate is green. Several design decisions need user or design confirmation (see Concerns).
Branch feat/foundation, base 56ef3f6. Commits, one per component, no Co-Authored-By:

- 6e96b1e feat(Spinner): add Spinner. Also: the loading Button renders the shared Spinner, the base stylesheet exempts essential motion from reduced motion, and the styles tests were updated.
- faf2da7 feat(Separator): add Separator
- f781686 feat(Progress): add Progress. Also: `hz-progress-*` keyframes and their tests in both builds.
- 600e020 feat(Alert): add Alert
- 1fa396f test(styles): assert every class selector is hz-prefixed in both builds

Impeccable: no `PRODUCT.md` exists, so `/impeccable craft` stops at init, as it did in 10a. I applied its principles myself: one type family, the fixed type scale, restrained token-only colour, a state vocabulary, AA contrast computed, no em dashes in copy, no decorative motion, and essential motion kept but slowed. The user should run `/impeccable init`, then `audit` and `polish` on the four stories.

## Verification (final run, at 1fa396f)

| Gate | Result |
|---|---|
| `npx vitest run` (unit jsdom + storybook chromium, a11y `test: 'error'` on every story) | 33 files, 619 tests passed |
| `npm run test:coexistence` | 78 passed, 1 skipped (the existing Dialog `test.fixme`, Task 11) |
| `npm run typecheck` (incl. `*.test-d.ts` and coexistence) | clean |
| `npm run lint` | clean |
| `npm run build` | ok. Alert imports `@phosphor-icons/react/dist/csr/{Info,CheckCircle,Warning,WarningCircle,X}` as bare externals |
| `npm run build-storybook` | ok |
| `npx prettier --check src coexistence docs scripts` | clean |

## Spinner (from x-core `CircularProgress`, 48 x-core openings)

customer360 usage (grep, x-core imports only): 28 with no props; `size` 19 times (12, 14, 16 x4, 19 x3, 20 x3, 24 x3, 32, 40, and 14 via a constant x2); `sx` colour or position 9; `color="inherit"` 1; `color="primary"` 1; `thickness` 3; `variant="determinate"` 2 (PathProgress, a decorative two-ring chip).

Decisions:

- **Rendering.** A native `<span>` ring: `border-current` with `border-e-transparent`, so the open quarter is logical and mirrors in RTL. It uses `hz:animate-spin` (`hz-spin`, 1s linear). This is the ring the Button already drew, so Button now reuses it.
- **Sizes.** Steps instead of numbers: `xs` 12, `sm` 16, `md` 20, `lg` 24, `xl` 40px. The default is `xl` because that is x-core's default (40px, the 28 bare call sites). The stroke is 2px, and 3px at `xl` (`hz:border-3`).
- **Tones.** `primary` (default), `muted` (`muted-foreground`, which replaces `text.secondary`), and `inherit` (replaces `inherit` and white overrides).
- **Determinate.** `value` (0..100, clamped; NaN means indeterminate) renders an SVG ring: a `muted` track (25% `currentColor` for `inherit`) plus an arc using `pathLength=100`. It sets `aria-valuenow` (rounded), min 0 and max 100. PathProgress's two stacked rings become one Spinner.
- **Accessibility.** `role="progressbar"` named by `label` (default "Loading") or `aria-labelledby`. `aria-hidden="true"` makes it decorative (no role, no name); the Button uses this, since the Button already sets `aria-busy`.
- **Reduced motion: slow, not frozen.** `hz:motion-reduce:animate-[spin_3s_linear_infinite]`. The element is marked `data-hz-motion="essential"`, and `base.css` now reads `.hz-root :where(:not([data-hz-motion='essential']))`. The `:where` keeps the unlayered base selector at (0,1,0), which a styles test asserts. Before this change the scoped kill switch froze every spinner. Bootstrap and other hosts are unaffected because the rule stays scoped.
- **Dropped props:** `thickness`, `disableShrink`, `variant`, `sx`, `children`, numeric `size`.

Button reuse proof. I dumped every computed property of the three loading Buttons and their spinner, before and after. That covered both builds, with and without full Bootstrap, and normal and reduced motion (a temporary Playwright spec, not committed; dumps are in the scratchpad).
- **The Button element:** no differences at all.
- **The spinner span: only inert differences.**
  - `flex-shrink` changed 1 to 0, and `vertical-align` changed baseline to middle. Neither applies: the span is absolutely positioned, and abs-pos flex children do not flex and ignore vertical-align.
  - The new `data-*` attributes are present.
  - The bounding rect differs only through rotation (same centre).
- **The only behaviour change is intended:** under reduced motion it now spins at 3s infinite (before: 0.01ms, once).

The existing coexistence RTL spinner test (border colours by direction) and the hz-spin vs host `@keyframes spin` test still pass unchanged.

## Separator (from x-core `Divider`, 7 files / 12 openings by grep; the usage report counts 8)

- Usage: 5 with no props, `sx` spacing 2, a `blueGrey[200]` colour 3 (equals `border`), `alignSelf: stretch` 2. MUI's own Divider is used elsewhere with `orientation="vertical" flexItem`. No text dividers.
- It renders a `<div>` with `role="none"` (decorative, the default) or `role="separator"` + `aria-orientation` (`decorative={false}`). That matches the shadcn/Radix API without the Radix dependency.
- It is a 1px line in `bg-border`, with no margin. Horizontal uses `h-px w-full`, so it fills even a flex column with `align-items: center`. Vertical uses `w-px self-stretch`, so it fills a flex or grid row whatever the row's `align-items` (MUI `flexItem` is built in).
- Why not `<hr>`: as a RED mutation I rendered `<hr>` instead. The unlayered build with Bootstrap then showed `height: 24px -> 0px` on the vertical separator, plus `overflow` changes, from the reboot's `hr { height: 0; overflow: visible }`.
- Dropped props: `color`, `sx`, `variant` (fullWidth/inset/middle), `textAlign`/children, `light`, `absolute`, `component`.

## Progress (from x-core `LinearProgress`, 2 files)

- Usage: determinate with `color` neutral/primary 1, and indeterminate in a snackbar 1. A third call site uses MUI's own (`sx` radius 16, full width).
- **Props:** `value`/`max` (clamped; a non-positive max falls back to 100; no value means indeterminate). `variant` is primary/neutral/success/warning/error, using the `-strong` fills for tones. `size` is `sm` 4px or `md` 8px. `label` is a visible label that names the bar via `aria-labelledby`. `showValue` prints the rounded percentage with `aria-hidden`.
- **ARIA:** `aria-valuetext` and `aria-describedby` are routed to the bar. The type requires a name: `label`, `aria-label` or `aria-labelledby`, mutually exclusive.
- **Structure:** a wrapper div (ref, className, data-did) contains an optional label row and the track (`role="progressbar"`).
- **Determinate fill:** a full-width indicator translated by `--hz-progress-offset`, using `hz:ltr:-translate-x-(...)` and `hz:rtl:translate-x-(...)`. These physical-axis translate classes are direction-paired, because `translate` has no logical form. The fill grows from the inline start and moves with `duration.slow`/`easing.standard`.
- **Indeterminate:** a 40% segment at `start-0` runs the new `progress-indeterminate` keyframes over 1.5s, built as `hz-progress-indeterminate` in both builds. The direction comes from `--hz-progress-dir` (1, or -1 under RTL).
- **Reduced motion:** the full-width bar runs `hz-progress-pulse` (opacity 1 to 0.4 over 2s), with no movement.
- **Dropped props:** `buffer`, `query`, `valueBuffer`, `sx`, `children`.

## Alert (from x-core `Alert`)

Usage: 16 files, with 12 direct openings and 6 `styled(Alert)` wrappers.
- `color` 9; `severity` 5.
- `variant`: standard 6, inline 2, footer 1, and 1 set from a prop.
- `sx` 6, `AlertTitle` 1, `action` 1, custom `icon` 2, `icon={false}` 1, `role="status"` 1, `elevation` 1.
- No `onClose` on any x-core Alert.

Decisions:

- **Tones:** `variant` is info (default) / success / warning / error / neutral.
- **Colours:** the surface is `<tone>-subtle`. Text, icon and dismiss use `<tone>-strong`. `foreground` was rejected: D&B reaches only 3.96 to 4.34:1 on tone surfaces.
- **Roles:** warning and error get `role="alert"`; info, success and neutral get `role="status"`; a `role` prop overrides (`"none"` for static guidance).
- **Content:** `title` (a semibold `label/lg` div, not a heading), children (description, `body/default`), `icon` (ReactNode or `false`; the default is the tone's Phosphor icon, always `aria-hidden`), `action`, and `onDismiss` with `dismissLabel` ("Dismiss").
- **Layout:**
  - Icon, text column, and dismiss in a row.
  - At mobile the action stacks below the text (`flex-col`).
  - From `tablet` it sits inline at the end of the row (`tablet:flex-row`).
  - Padding is 12px at mobile and 16px from tablet. Radius is 16px. Long words break (`wrap-break-word`).
- **Dismiss button:**
  - 44x44 at mobile and on coarse pointers; 32x32 from tablet with a fine pointer.
  - Negative margins lay it out as 20px, so it never pushes the text; at mobile it sits flush in the corner.
  - Rounded-full; hover is a `current/12` state layer.
  - Focus is `outline-ring` with `focus:outline-none`, plus focus-visible outline classes that beat Bootstrap's `button:focus` in the unlayered build. A RED mutation without them showed exactly Bootstrap's `5px auto` ring.
- **Type:** 16px rather than x-core's 14px. The Horizon `body/secondary` role is 14/14 (line-height 1.0), which is too tight for wrapped prose. This needs design confirmation.
- **Not ported:** MUI `variant` standard, inline, outlined, filled and footer are folded into one look (footer has 1 call site), plus `elevation`, `closeText`, `slots` and `sx`.

## API differences

All are recorded in `docs/migration/component-map.md`: the generated rows (via `scripts/usage-map-curation.ts`, status `done`) and new sections with migration tables for Spinner, Separator, Progress and Alert.

New public API (the snapshot was updated intentionally, once per commit): `Alert`, `alertVariants`, `Progress`, `progressVariants`, `Separator`, `separatorVariants`, `Spinner`, `spinnerVariants`, and their types. There are no other additions.

## Reboot measurements (coexistence harness, `coexistence/tests/components.spec.ts`)

New probes measure each component without Bootstrap and with it: `bootstrap-reboot.css` and full `bootstrap.css`, both load orders, both builds.
- **Unlayered build:** zero property changes for all four components, in all four combinations.
  - The first run found a real bug: the determinate ring's `svg` took Bootstrap's `vertical-align: middle`. The svg now sets `hz:align-top` explicitly.
- **Layered build (known limit, asserted as measured):**
  - Spinner: only the ring svg changes, `verticalAlign: top -> middle`. It is `display: block`, so nothing moves.
  - Separator and Progress: no changes.
  - Alert:
    - The surface, icon, title and description are untouched.
    - The dismiss button loses its negative margins (`-6px -> 0`) and its round shape (`100px -> 0`), and shows Bootstrap's focus ring when focused.
    - The action Button shows its known ADR 0001 limit: radius 20 to 0, font 12 to 16, line height 16 to 20. The title and description narrow by the same width.
- **Reduced motion** (Playwright `reducedMotion: 'reduce'`, both builds, full Bootstrap loaded):
  - The Spinner and the Button's spinner run `hz-spin` at 3s, infinite, running.
  - The indeterminate Progress runs `hz-progress-pulse` at 2s, infinite, at full track width.
  - The Button element itself still has its transitions collapsed (`1e-05s`).
  - RED evidence: reverting the base exemption makes the test fail.
- The measure helper now skips infinite animations when it waits for transitions to settle (otherwise it would hang on spinners).
- New styles test: every class selector in both builds is either `.hz-root` or `.hz\:*`, so there are no `.alert`, `.progress` or `.spinner-border` collisions. RED: injecting `.hz-root .alert {}` failed both builds.

## Contrast (WCAG formula, `src/tokens/contrast.test.ts`, 199 assertions; text 4.5:1, non-text 3:1)

| Use | pair | cial | dnb | il |
|---|---|---|---|---|
| Alert info text/icon | `info-strong` / `info-subtle` | 6.59 | 6.59 | 6.59 |
| Alert success text/icon | `success-strong` / `success-subtle` | 6.73 | 6.73 | 8.19 |
| Alert warning text/icon | `warning-strong` / `warning-subtle` | 5.15 | 5.15 | 5.22 |
| Alert error text/icon | `destructive-strong` / `destructive-subtle` | 4.91 | 4.91 | 9.65 |
| Alert neutral text/icon | `neutral-strong` / `neutral-subtle` | 9.45 | 9.45 | 9.45 |
| Alert tertiary Button action, lowest tone (error) | `primary` / `destructive-subtle` | 5.14 | 5.72 | 5.53 |
| Alert dismiss focus ring, lowest tone (error) (3:1) | `ring` / `destructive-subtle` | 5.14 | 5.72 | 5.53 |
| (rejected) Alert foreground text | `foreground` / `destructive-subtle` | 14.87 | 3.96 | 14.37 |
| Spinner primary ring (3:1) | `primary` / `background` | 5.91 | 6.58 | 6.58 |
| Spinner muted ring (3:1) | `muted-foreground` / `background` | 7.26 | 7.26 | 4.56 |
| Spinner arc on track (3:1) | `primary` / `muted` | 5.63 | 6.27 | 6.27 |
| Spinner muted arc on track (3:1) | `muted-foreground` / `muted` | 6.92 | 6.92 | 4.34 |
| Progress primary on track (3:1) | `primary` / `muted` | 5.63 | 6.27 | 6.27 |
| Progress neutral on track (3:1) | `neutral-strong` / `muted` | 9.45 | 9.45 | 9.45 |
| Progress success on track (3:1) | `success-strong` / `muted` | 6.92 | 6.92 | 8.65 |
| Progress warning on track (3:1) | `warning-strong` / `muted` | 5.23 | 5.23 | 5.23 |
| Progress error on track (3:1) | `destructive-strong` / `muted` | 5.38 | 5.38 | 10.94 |
| Progress label | `foreground` / `background` | 17.10 | 4.56 | 17.10 |
| Progress value | `muted-foreground` / `background` | 7.26 | 7.26 | 4.56 |
| Separator (not required, decorative) | `border` / `background` | 1.18 | 1.18 | 1.18 |

Indicators are also checked against `background` (all at least 3:1). Storybook axe passes on every story, including the Brands matrices.

## TDD evidence

Unit tests were written first and confirmed RED: each component's test file failed with "Failed to resolve import ./<Name>" before its implementation existed. Mutation checks (each reverted, and each made the stated test fail):
- **Spinner:**
  - `border-e-transparent` changed to `border-r-transparent`: the 4 viewport geometry stories fail (RTL open side).
  - `motion-reduce` class removed: the unit test fails.
  - Base exemption reverted: both coexistence reduced-motion tests fail.
- **Separator:**
  - `self-stretch` removed: 4 viewport stories fail.
  - `w-full` removed: 4 viewport stories fail.
  - Rendered `<hr>`: unlayered coexistence fails (vertical height 24px to 0px).
- **Progress:**
  - ltr/rtl translate pair collapsed to a physical one: 4 viewport stories fail.
  - The RTL `--hz-progress-dir` class removed: 4 viewport stories fail.
  - `motion-reduce` pulse removed: the coexistence reduced-motion test fails (1.5s indeterminate instead of the 2s pulse).
  - Keyframe namespacing disabled in `build-styles.ts`: the new Progress keyframe tests fail in both builds.
- **Alert:**
  - `tablet:flex-row` removed: the unit test, tablet/laptop/desktop geometry and the LongText overflow test fail.
  - Dismiss shrunk to 32px at mobile: mobile geometry fails.
  - Warning role changed to status: unit tests fail.
  - Dismiss focus classes removed: unlayered coexistence fails with Bootstrap's ring.
- **Styles:** an unprefixed `.alert` rule injected: the new class-prefix test fails in both builds.

Viewport tests run at mobile 375, tablet 768, laptop 1280 and desktop 1920, in both LTR and RTL. They check:
- Spinner: sizes and the open side.
- Separator: fill in flex column, flex row, grid and block.
- Progress: fill edge from the inline start, track height, the value at the inline end, and the indeterminate direction variable and segment width.
- Alert: padding, icon and dismiss placement, the dismiss 44/32 target staying inside the box, and the action below vs inline.

Every set also asserts no horizontal overflow. Alert LongText and Progress LongLabel check overflow in 320px and 240px containers.

## Files

New:
- `src/components/{Spinner,Separator,Progress,Alert}/{Name.tsx, Name.stories.tsx, Name.test.tsx, Name.test-d.ts, index.ts}`

Changed:
- `src/components/index.ts`
- `src/components/Button/Button.tsx` (uses Spinner) and `Button.stories.tsx` (motion doc)
- `src/styles/base.css` (essential-motion exemption)
- `src/styles/index.css` (progress keyframes)
- `src/__tests__/architecture.test.ts` (API snapshot)
- `src/__tests__/styles.test.ts` (reduced-motion selector, progress keyframes, class prefix guard)
- `src/tokens/contrast.test.ts`
- `coexistence/main.tsx`
- `coexistence/tests/components.spec.ts`
- `scripts/usage-map-curation.ts`
- `docs/migration/component-map.md`

## Concerns

1. No Figma was available, so these need design review:
   - The Spinner look: a constant three-quarter ring, not MUI's growing arc.
   - The size steps, and the default `xl` (40px).
   - Alert type at 16px instead of 14px.
   - Alert text in the tone `-strong` shade instead of `foreground`.
   - The Progress `muted` track, and the single-segment indeterminate bar.
   - The Separator using `border`, lighter than x-core's `#CBD5E1`.
2. Typography token issue: `body/secondary` is 14px with a 14px line height. It is unusable for multi-line prose, which is why Alert uses `body/default`. Design should decide whether to give it 20px.
3. A base stylesheet change affects every component: elements with `data-hz-motion="essential"` are exempt from the reduced-motion kill switch, and only Spinner and indeterminate Progress use it. That is a deliberate a11y choice (slow, not frozen), with reduced-motion variants that do not move or move slowly.
4. Features I did not add:
   - Alert `footer` variant (1 call site).
   - A Spinner `success` tone (PathProgress completion: use `tone="inherit"` inside a coloured wrapper).
   - A Separator margin prop (x-core used `sx` spacing; hosts space it with `gap`).
5. Test coverage gaps:
   - The Alert dismiss at tablet+ with a coarse pointer (44px) is only implied by the class; Storybook browser tests run with a fine pointer.
   - Exact breakpoint edges (767/768) are not tested, the same deferred gap as Button.
6. The determinate Spinner ring always fills clockwise; it does not mirror in RTL, same as MUI. Progress does mirror.
7. Default English names ("Loading", "Dismiss") must be translated by consumers through `label` and `dismissLabel`.

## Fix round 1 (review: 1 Important, bundled minors)

Commits: 18aca3d fix(Spinner), 1588337 fix(Alert), f6fc290 fix(Progress), 144ba7e fix(Chip), 13846d2 fix(Typography), f32aa60 fix(Badge), 8dce34a test(styles), 763591f docs.

Gates after the fixes:

| Gate | Result |
|---|---|
| `npx vitest run` | 34 files, 657 tests passed |
| `npm run test:coexistence` | 78 passed, 1 skipped |
| `npm run typecheck` | clean |
| `npm run lint` | clean |
| `npm run build` | ok; `dist/lib/options.js` keeps `process.env.NODE_ENV` for the consumer's bundler |
| `npm run build-storybook` | ok |
| `npx prettier --check src coexistence docs scripts` | clean |

### 1. (Important) Old x-core values from untyped callers

New shared guard `src/lib/options.ts`, not public API:
- `resolveOption(component, prop, value, allowed, fallback)` returns the value if it is allowed, otherwise the fallback, and logs a one-shot `console.warn`.
- The warning reads `[horizon-ui] <Component>: unknown <prop> "<value>"; using "<fallback>". Accepted: ...`.
- `undefined` means "use the default" and never warns.
- `warnOnce` logs each distinct message once.
- Production check: `process.env.NODE_ENV === 'production'` inside a try/catch. Bundlers replace that expression textually, and Vite library mode leaves it in place for the consumer. In a bare browser with no `process` it counts as dev.
- Unit tests cover: accept, default, fallback with warn-once and the exact message, and silence under `vi.stubEnv('NODE_ENV', 'production')`.

Per component (all RED first: 17 new tests failed before the fix, plus 1 for Badge):

- **Spinner.**
  - Pixel sizes (numbers, or strings like `"19px"`) map to the nearest step, ties to the smaller. That gives 12 and 14 to xs, 16 to sm, 19 and 20 to md, 24, 28 and 32 to lg, and 40 or more to xl, matching the map table.
  - Pixel sizes warn once per value. Any other unknown size falls back to `xl` and warns.
  - An unknown `tone` falls back to `primary` and warns.
  - Tested: ten pixel cases, including the determinate ring that used to throw on `ring[size]`, and a `'huge'`/`'secondary'` fallback.
- **Alert.** `variant` of `standard`, `inline` or `footer` (the x-core layout values) renders as info: `role="status"`, info surface, Info icon. It warns once even across a rerender. Before, `toneIcon[variant]` threw.
- **Progress.** `variant="determinate"` falls back to primary with a coloured indicator, and an unknown `size` falls back to `sm`; each warns.
- Other components (checked for the same unguarded lookup):
  - **Chip: patched (it crashed).** `size="small"` with `onClick` or `onDelete` threw on `actionInset[size]` and `removeHit[size]`. Size, variant and appearance now fall back to md, primary and soft (x-core's `variant="outlined"` is an appearance there).
  - **Typography: patched (it crashed).** MUI `variant="h5"` gave `defaultElement[variant]` undefined, so React threw. It now renders body/default as a `<p>`.
  - **Badge: patched (no crash, but an uncoloured dot).** `labelDot[variant]` returned undefined for MUI colours. It now falls back to primary.
  - **Button: unchanged.** It has no record lookup; cva ignores unknown values without throwing.

### 2. ADR 0001

- The "both builds keep..." paragraph now states the `:where(:not([data-hz-motion='essential']))` selector (it stays at (0,1,0)).
- Consequences gains an exception bullet: essential motion is slowed or made motionless rather than stopped (Spinner 3s per turn, Progress pulse), and the attribute is internal, not a consumer API.

### 3. Prefix guard

- `classNamesIn` now scans every non-`@` prelude, parents of nested rules included, skipping keyframe steps and `@property`.
- A negative control parses `.alert { &:hover {} }`, `.hz-root { .progress-bar:focus {} }` and a `33.3%` keyframe step. It expects `alert`, `hz-root` and `progress-bar`.
- RED: the old leaf-only scan (`styleRulesOf`) fails the control.

### 4. Progress pulse

- 0.6 is not enough: the computed minimum across brands and tones is 2.53:1. At 0.7 it is 3.01:1, and at 0.75 it is 3.29:1, so the pulse low point is now 0.75.
- `contrast.test.ts` composites each indicator at 0.75 over `muted` and asserts at least 3:1 (15 cases).
- The styles test asserts the built `@keyframes hz-progress-pulse { 50% { opacity: .75 } }` in both builds.
- RED: at 0.4, 17 tests fail.

### 5. Alert role

- New exported type `AlertRole = 'alert' | 'status' | 'none' | 'region'`, which also replaces the internal `AriaRole` record.
- Type tests: `role: 'region'` is accepted; `role: 'button'` is rejected with `@ts-expect-error`.
- RED: widening the prop to `string` produces an "Unused @ts-expect-error" error.
- The API snapshot is unchanged (type-only export).

### 6. Dismiss focus ring

- The ring uses `hz:focus-visible:-outline-offset-2`, with `hz:tablet:pointer-fine:focus-visible:outline-offset-0` from tablet with a fine pointer.
- The laptop `ComputedStyles` story now also asserts offset `0px`.
- New story `DismissFocusMobile`: inside an `overflow: hidden` parent at 375px, it asserts offset `-2px` and that the ring box stays inside the clip. RED: it received `0px` before the change.
- The coexistence Alert probes run at a 1280px fine-pointer viewport, so offset 0 is unchanged and all Alert coexistence tests still pass.

### 7. Token gaps

- `docs/migration/token-gaps.md` has a new "Design-owner decisions" entry for the 1.0 line-height roles (body/secondary 14/14, body/lg 20/20, caption 12/12, micro 10/10).
- Proposed fixes: 14/20, 20/28 and 12/16; micro is left to design.
- It notes the baseline and coexistence impact. The tokens themselves are unchanged.

Remaining concerns are unchanged from above. Pixel sizes up to 32 still shrink to 24 (`lg`) per the map; that decision was deferred by the reviewer.
