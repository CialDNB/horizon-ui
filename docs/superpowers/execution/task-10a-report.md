# Task 10a report: Typography, Chip, Badge

Status: DONE_WITH_CONCERNS (all gates green; design decisions need user/design confirmation, see Concerns).
Branch feat/foundation. Commits:

- a3d2ad2 feat(Typography): add Typography (also: tone semantic keys, contrast test, full-bootstrap harness mode)
- 138623c style(Typography): apply prettier to stories and tests
- 1c2ecc7 feat(Chip): add Chip
- 92b08de feat(Badge): add Badge

Impeccable: `/impeccable craft` stops at `NO_PRODUCT_MD` (init needs the user). Per the ledger ruling I applied its principles myself (product register: one family, fixed scale, restrained colour, state vocabulary, AA contrast verified, no em dashes in copy, text-wrap balance/pretty, no decorative motion). The user should run `/impeccable init` then `audit`/`polish` on the three stories.

## Verification (final run, after the Badge commit)

| Gate | Result |
|---|---|
| `npx vitest run` (unit jsdom + storybook chromium, a11y `test: 'error'` on every story) | 25 files, 366 tests passed |
| `npm run test:coexistence` | 50 passed, 1 skipped (pre-existing Dialog `test.fixme`, Task 11) |
| `npm run typecheck` (incl. `*.test-d.ts` and coexistence) | clean |
| `npm run lint` | clean |
| `npm run build` | ok; Chip/Badge import `@phosphor-icons/react/dist/csr/{X,Sparkle}` as bare externals |
| `npm run build-storybook` | ok |
| `npx prettier --check src coexistence` | clean |

## Tokens (ledger ruling: semantic keys may be added)

Added to `SemanticKey` + all three brands + `token-gaps.md` + `npm run build:tokens` (drift tests green): `neutral-subtle`, `neutral-strong`, `info-subtle`, `info-strong`, `success-subtle`, `success-strong`, `warning-subtle`, `warning-strong`, `destructive-subtle`, `destructive-strong`. `-subtle` = tinted surface (x-core chip `[100]`-ish fills), `-strong` = AA text/icon shade (x-core chip text shades; IL uses its own `.dark`/`option_1` values). Primary tone reuses `accent`/`accent-foreground`. New `src/tokens/contrast.test.ts` asserts >= 4.5:1 for every pair below in every brand (85 assertions).

## Contrast table (WCAG ratio, text / surface)

| Use | text / surface | cial | dnb | il |
|---|---|---|---|---|
| Typography foreground | `foreground` / `background` | 17.10 | 4.56 | 17.10 |
| Typography muted-foreground | `muted-foreground` / `background` | 7.26 | 7.26 | 4.56 |
| Typography primary | `primary` / `background` | 5.91 | 6.58 | 6.58 |
| Typography neutral-strong | `neutral-strong` / `background` | 9.92 | 9.92 | 9.92 |
| Typography info-strong | `info-strong` / `background` | 7.09 | 7.09 | 7.09 |
| Typography success-strong | `success-strong` / `background` | 7.27 | 7.27 | 9.08 |
| Typography warning-strong | `warning-strong` / `background` | 5.49 | 5.49 | 5.49 |
| Typography destructive-strong | `destructive-strong` / `background` | 5.65 | 5.65 | 11.48 |
| Chip neutral soft | `neutral-strong` / `neutral-subtle` | 9.45 | 9.45 | 9.45 |
| Chip primary soft | `accent-foreground` / `accent` | 10.09 | 8.20 | 8.20 |
| Chip info soft | `info-strong` / `info-subtle` | 6.59 | 6.59 | 6.59 |
| Chip success soft | `success-strong` / `success-subtle` | 6.73 | 6.73 | 8.19 |
| Chip warning soft | `warning-strong` / `warning-subtle` | 5.15 | 5.15 | 5.22 |
| Chip error soft | `destructive-strong` / `destructive-subtle` | 4.91 | 4.91 | 9.65 |
| Chip disabled (exempt) | `muted-foreground` / `muted` | 6.92 | 6.92 | 4.34 |
| Badge count neutral | `background` / `neutral-strong` | 9.92 | 9.92 | 9.92 |
| Badge count info | `background` / `info-strong` | 7.09 | 7.09 | 7.09 |
| Badge count success | `background` / `success-strong` | 7.27 | 7.27 | 9.08 |
| Badge count warning | `background` / `warning-strong` | 5.49 | 5.49 | 5.49 |
| Badge count error | `background` / `destructive-strong` | 5.65 | 5.65 | 11.48 |
| Badge count primary | `primary-foreground` / `primary` | 6.17 | 5.74 | 5.74 |
| Badge ai label | `primary` / `background` | 5.91 | 6.58 | 6.58 |
| (rejected) destructive text on background | `destructive` / `background` | 4.47 | 5.65 | 5.65 |
| (rejected) success text on background | `success` / `background` | 3.52 | 3.52 | 3.52 |

Disabled chip (IL 4.34) is exempt (WCAG 1.4.3 inactive components); the chip's buttons are natively `disabled`. The two "rejected" rows are why Typography offers `-strong` tokens instead of `success`/`destructive` as text colours. Storybook a11y (axe colour-contrast) also passes on every story incl. the Brands stories.

## Typography

Decisions:
- `variant` = the 14 type-scale roles in slash notation; `typographyVariants()` exported. Default `body/default`.
- Default element per role: `display/*` and `heading/xl` -> h1, `heading/lg|md|sm` -> h2|h3|h4, body/caption/micro -> p, `label/*` -> span. `as?: ElementType` (x-core `component`), never changes the look.
- `color` semantic only: foreground (default), muted-foreground, primary, primary-foreground, neutral/info/success/warning/destructive `-strong`, inherit. Failing-contrast text colours not offered.
- `weight` (regular/medium/semibold/bold; covers customer360's 92 `fontWeight` + MUI `h6`/`subtitle2`), `align` (logical start/center/end), `truncate` (true = one line, 2|3|4 = line clamp; customer360 had 40 textOverflow / 8 WebkitLineClamp in sx).
- Always sets `hz:m-0` + the type utility (family/size/line-height/weight) + colour, so Bootstrap cannot restyle it in the unlayered build.
- Responsive: `display/xl` 36, `display/lg` 32, `heading/xl` 32 below 768px (one step down the scale, all bold); full sizes from tablet. Everything else identical at four breakpoints (product register: fixed scale).
- Headings `text-wrap: balance`, body `pretty`; `overflow-wrap: anywhere` (break-word does not shrink min-content in grid/flex; a measured 699px overflow at 240px proved it).

API differences (MUI -> horizon): see map section "Typography". Dropped: `sx`, `gutterBottom`, `paragraph`, `display`, `fontSize`, `lineHeight`, `fontFamily`, `letterSpacing`, palette-path/hex colours, MUI variant names (`h1`.. mapped in the table), `overline` and legacy x-core variants (no role).

## Chip

Decisions:
- `label: string` required (names action and remove buttons; type-tested). `variant` tone (neutral/primary/info/success/warning/error, default primary as x-core), `appearance` soft|outline (x-core filled|outlined), `size` sm 20px | md 24px (x-core heights), `icon`, `onClick`, `onDelete`, `removeLabel` (default `Remove <label>`), `disabled`.
- Root `<span>`; `onClick` renders the label as a `<button>` whose `::after` hit area covers the whole chip; `onDelete` renders a separate remove `<button>` (Phosphor X, bold, decorative). Backspace/Delete on the action button removes (MUI parity). No nested buttons.
- Look: 4px radius (x-core chipStyles), label/sm 12/16 semibold, padding md 8 / sm 6, gap 4. soft = `-subtle` fill + `-strong` text; outline = 1px inset ring in the tone colour (ring, so heights match across appearances). State layer: currentColor 8% hover / 12% press via `has-[[data-chip-action]:hover]`; focus ring 2px `ring` around the chip; disabled = muted.
- Touch targets: visual size unchanged; at mobile and coarse pointers the action hit area is 44px tall and an interactive chip at least 44px wide; remove button 44x44 (md and sm). From tablet with a fine pointer: action = chip height, remove = 24x24 (same gating as Button).
- Long labels truncate; `title` set only while truncated (ResizeObserver).

API differences: see map section "Chip". Dropped: array labels with `+N` tooltip (Tooltip arrives in Task 11), `avatar`, `deleteIcon`, `clickable` without handler, `sx`, palette colours (purple has no tone: confirm with design).

## Badge

Decisions:
- One `Badge` with three forms, typed as a union (type tests: unnamed dot, count + children, ai + count all rejected):
  - label (children): tone dot 8px + 10px semibold uppercase `foreground` label (x-core Badge as customer360 uses it: `label` + `variant="dot"`).
  - count (`count`, `max` default 999 as x-core, `0` renders nothing): 20px pill, label/sm tabular, `-strong` fill + `background` text (primary: primary/primary-foreground).
  - dot (no children): requires `aria-label`, renders `role="img"`. A labelled count also becomes `role="img"`; consumer `role` wins (`role="status"` for live counts).
- AI markers: `ai` (x-core BadgeAI default: Phosphor Sparkle fill in a 20px secondary->primary gradient circle, label/sm primary text), `ai-verified` / `ai-unverified` (x-core AIVerifiedBadge isValidated true/false: 24px pill, 1px success/destructive inset ring, duotone sparkle in `-strong`, 10px semibold foreground label). No default English label; consumer must give the two states different text (x-core used colour only, a 1.4.1 failure).
- `BadgeAnchor` (x-core Badge wrapping children): pins a badge to the top end corner, `overlap` rectangular|circular (14% inset), RTL-aware (ltr/rtl translate).
- Responsive: identical at all four breakpoints (written and justified in the story; non-interactive, host owns the target). Tested at all four viewports in LTR and RTL.

API differences: see map section "Badge". Not ported: BadgeAI `variant=FILLED`/`showBorder`, `labelColor`, `anchorOrigin`, `invisible`, `showZero`, `sx`. Mapping of BadgeAI/AIVerifiedBadge to variants is flagged for design confirmation in the map.

## Coexistence with Bootstrap 4.4.1 (both builds, both load orders)

Harness changes: `?reboot=full` loads the full `bootstrap.css` (what customer360 imports: reboot plus `h1..h6 { margin-bottom; font-weight: 500; line-height: 1.2; font-size }`); `?reboot=1` is still `bootstrap-reboot.css`. New `coexistence/tests/components.spec.ts` measures every target without Bootstrap and with it; focus targets are keyboard-focused first so `button:focus` and `:focus-visible` compete.

Measured properties:
- Typography (16 targets: 14 roles at their default elements + `as="h5"`, `as="h6"`): marginTop, marginBottom, marginInlineStart, paddingTop, fontFamily, fontSize, fontWeight, lineHeight, letterSpacing, textTransform, color, display.
- Chip (13 targets: 6 tones, outline sm, disabled, action chip at rest and with its action focused, action button focused, remove button at rest and focused, disabled action button): height, width, paddingInlineStart, paddingInlineEnd, marginTop, borderRadius, fontFamily, fontSize, fontWeight, lineHeight, textTransform, color, backgroundColor, boxShadow, outlineStyle, outlineWidth, outlineColor, outlineOffset, cursor, display, verticalAlign.
- Badge (9 targets: label, count, dot, ai, ai-verified, anchor, anchored count, label text, anchor slot): the Chip list plus position, top, insetInlineEnd, transform.

Results:

| Build / Bootstrap | Typography | Chip | Badge |
|---|---|---|---|
| unlayered vs layered, no Bootstrap | identical | identical | identical |
| unlayered + reboot.css, Bootstrap first | unchanged | unchanged | unchanged |
| unlayered + reboot.css, horizon first | unchanged | unchanged | unchanged |
| unlayered + full bootstrap.css, Bootstrap first | unchanged | unchanged | unchanged |
| unlayered + full bootstrap.css, horizon first | unchanged | unchanged | unchanged |
| layered + full bootstrap.css (known limit, asserted exactly) | headings: marginBottom 0 -> 8px, fontWeight -> 500, lineHeight -> 1.2em (e.g. 44 -> 48px), fontSize for h1 (44/36 -> 40px), h5 (16 -> 20), h6 (14 -> 16); p (body/caption/micro): marginBottom 0 -> 16px; labels (span) untouched; colour and family survive | chip spans untouched; remove button borderRadius 100px -> 0; focused action and remove buttons get Bootstrap's 5px auto ring rgb(0,95,204) | badge spans untouched; only the anchor's width changes, because its host is a horizon Button whose type the reboot enlarges (known Button limit) |

Defect found and fixed by the harness (unlayered build): Bootstrap `button:focus` (0,1,1) replaced the Chip remove button's focus ring colour with `-webkit-focus-ring-color`, and gave the action button a 5px outline width (invisible, style none). Fixed with `hz:focus-visible:outline-ring` (0,2,0) on the remove button and `hz:focus:outline-0 hz:focus:outline-transparent` on the action button. Same pattern as Button in Task 7b.

## TDD evidence

Each component: jsdom test file written first and run RED (`Failed to resolve import "."`), then implementation to GREEN. Browser tests (story play functions) and harness tests were proven able to fail by deliberate mutations, each reverted:

| Component | Mutation | Failing test(s) |
|---|---|---|
| Typography | drop the mobile step on display/xl | "steps display and heading/xl down one size at mobile" |
| Typography | drop `hz:m-0` | ComputedStyles (display/xl margin 29.48px); coexistence unlayered + full bootstrap (marginBottom 26.8px -> 8px etc.) |
| Typography | `weight="semibold"` ignored | ComputedStyles (400 vs 600) |
| Typography | (found, not planted) `text-pretty` reset truncate's nowrap; `break-word` overflowed 699px at 240px | ComputedStyles, LongText, SizeMobile: fixed with `text-nowrap` / `wrap-anywhere` |
| Chip | drop fine-pointer hit-area shrink | HitArea tablet/laptop/desktop |
| Chip | drop the 44px action hit area | HitAreaMobile |
| Chip | drop `hz:focus:outline-none` | ComputedStyles |
| Chip | soft success fill `bg-success` | ComputedStyles + a11y contrast on VariantsAndSizes, States, RTL, Brands |
| Chip | drop `min-w-11` | HitAreaMobile |
| Chip | (found, not planted) sm remove hit area 40px | HitAreaMobile: fixed with size-specific inset |
| Chip | (found by harness) remove ring colour under reboot | coexistence unlayered x4: fixed |
| Badge | physical `translate-x` (RTL corner) | Geometry at all four viewports |
| Badge | count height 24 | Geometry at all four viewports |
| Badge | error count fill `bg-destructive` | unit test + ComputedStyles + a11y contrast on Forms, Brands |
| Badge | (found, not planted) ai looks lost to label-form classes in cn() order | ComputedStyles: fixed with compound variants + jsdom regression test |

## Files changed

- src/components/Typography/{Typography.tsx, Typography.stories.tsx, Typography.test.tsx, Typography.test-d.ts, index.ts}
- src/components/Chip/{Chip.tsx, Chip.stories.tsx, Chip.test.tsx, Chip.test-d.ts, index.ts}
- src/components/Badge/{Badge.tsx, Badge.stories.tsx, Badge.test.tsx, Badge.test-d.ts, index.ts}
- src/components/index.ts; src/__tests__/architecture.test.ts (API snapshot: + Badge, BadgeAnchor, badgeVariants, Chip, chipVariants, Typography, typographyVariants)
- src/tokens/brands/{types,cial,dnb,il}.ts; src/styles/{tokens,theme}.css (generated); src/tokens/contrast.test.ts (new)
- coexistence/main.tsx (full-bootstrap mode, MUI Typography alias, component probes); coexistence/tests/components.spec.ts (new)
- docs/migration/component-map.md (rows done + Typography, Chip, Badge sections); docs/migration/token-gaps.md (tone keys); scripts/usage-map-curation.ts

## Concerns

1. No Figma: visual decisions (tone keys and their values, chip state layer, count pill on `-strong` fills, AI icons swapped to Phosphor Sparkle, gradient on brand secondary->primary, mobile heading step-down) need design review; Impeccable init/audit/polish still to be run by the user.
2. Badge status label stays x-core's 10px semibold uppercase (`micro`): legible but small; design may prefer `caption`/sentence case.
3. Dropped behaviour needing follow-up: Chip array labels with `+N` tooltip (needs Tooltip, Task 11); Chip `avatar` (Avatar later); Chip `purple` colour and BadgeAI FILLED/showBorder have no mapping.
4. Typography default colour is `foreground` (MUI inherited); migrated text inside coloured containers must pass `color="inherit"`. dnb `foreground` on `background` is 4.56:1 (passes, thin margin).
5. Layered build known limits are asserted, not fixed (by design, ADR 0001): headings/paragraphs and chip buttons are restyled by unlayered Bootstrap; customer360 must use `styles.unlayered.css`.
6. Consumers can only use `hz:` classes compiled into dist via `className` (e.g. `hz:line-clamp-5` does not exist), hence the `truncate`/`weight`/`align` props.
7. Storybook vitest shows a one-off "Vite unexpectedly reloaded" on the first run after adding new Phosphor deep imports (dependency optimisation); a second run is green. CI with a warm cache is unaffected; could be pre-declared in `optimizeDeps.include`.

---

# Fix round 1 (review of Task 10a)

Commits: e1c3288 fix(Chip): 44px hit areas for every size, no neighbour stealing · a000199 fix(Badge): announce live counts once and give dots a 3:1 boundary · 7cea545 fix(Typography): inherit colour, MUI default elements, typed as

Verification after the fixes: `npx vitest run` 25 files / 399 tests passed; `npm run test:coexistence` 50 passed, 1 skipped (Dialog fixme); typecheck, lint, build, build-storybook clean; prettier clean; `hz:sr-only` present in both CSS builds.

| # | Finding | Fix | RED evidence |
|---|---|---|---|
| 1 | Chip `sm` action hit area was 40px; test probed only 9px | Hit areas are now separate pointer-only `aria-hidden` layers (`[data-chip-hit]`, z-0) that forward clicks to their button; md insets 10px, sm 12px vertically (44px both), fine pointer = visual box. Chip body `::before` (z-1) and buttons (z-2) sit above every hit layer, so wrapped neighbours 8px apart can never take a click inside a chip's own box; only the gap between rows is shared (later chip wins: documented in the story). Remove target: outer 44x44 layer at z-0 plus an inner layer at z-1 limited to its own chip's height (beats its own body, never a neighbour). The action button is stretched over the chip padding (logical negative margins), and the icon moved inside it. Root no longer `isolate`; state layer kept on `::before` with `:enabled` hover/active. | New test probes `(44 - h) / 2 - 0.5`px above and below each size and clicks the point (spy called). On the old code: `sm at -11.5: expected null not to be null`; new adjacency story: `a-sm bottom: expected 'b-sm' to be 'a-sm'`. Mutations after the fix: sm inset back to 10px fails HitAreaMobile; body layer `-z-1` fails the adjacency story; action button not raised fails all four HitArea stories. jsdom: hit layers aria-hidden, forward clicks, inert when disabled. |
| 2 | Typography default colour must be `inherit` | Default `color="inherit"` (class `hz:text-inherit` still emitted); TSDoc, story docs and map updated. | Unit RED (class) before the change; browser check: Typography inside a `primary`-coloured span computes `primary`; mutation back to `foreground` fails (`rgb(15, 23, 42)` vs `rgb(0, 80, 240)`). |
| 3 | Default elements | `display/*` render `p`, `heading/xl..sm` `h1..h4`, body `p`, `caption`/`micro`/labels `span`. Table test covers all 14 variants. Map rows give explicit `as` for `h5`, `h6`, `subtitle1`, `subtitle2`. | 4 table rows RED before the change. Layered coexistence expectations re-measured (display now paragraphs; caption/micro untouched). |
| 4 | Badge live count not announced | `role` other than `img` + `aria-label`: the label is also rendered as `hz:sr-only` text and the visible number is `aria-hidden`, so the live region announces exactly the label; `role="img"` keeps `aria-label` + hidden number; unlabelled counts keep a readable number. | Status test RED (`getByText('3 unread notifications')` missing); browser check that the sr-only element is absolute and at most 1px wide. |
| 5 | Dot-only Badge below 3:1 (warning, info) | Dots keep their tone fill and gain a 1px inset ring in the tone's AA shade (`-strong`, primary for primary). New non-text pairs (3:1) in `src/tokens/contrast.test.ts`: `ring` and every dot boundary on `background`, all brands. A component-linked test reads the dot's real classes and checks its best boundary token reaches 3:1 in every brand. Contrast helper moved to `src/tokens/contrast.ts` (internal, not exported from the tokens entry). | Info and warning dot tests RED before the change; mutation `ring-warning` (tone main) fails again. |
| 6 | Map wrong about BadgeAI | Verified: rendered at `SegmentEvaluate.component.jsx:497` (plain) and `SegmentEvaluate.jsx:148` (clickable "Settings*", `showBorder`, `onClick`). Map corrected; the clickable site maps to `<Button variant="secondary" size="sm">` with a Sparkle icon; Badge has no border/button semantics by design. | n/a (docs) |
| 7 | Cold/stale Vite cache flake | `.storybook/optimize-deps.ts` scans `src` for `@phosphor-icons/react/dist/csr/*` imports; the list goes into `optimizeDeps.include` in Storybook `viteFinal` and the vitest storybook project. | A fully cold cache (cleared `node_modules/.vite` and `node_modules/.cache/storybook`) already passed before the fix, so I reproduced the real trigger, a stale cache plus a new deep import (temporary `StarIcon`): 17 failures from "Vite unexpectedly reloaded". With the fix, the same stale-cache run passed on the first try; after removing the temp import and clearing both caches again, the first run passed (70/70). |
| 8 | Typography `as` typing | `TypographyProps<E extends ElementType = 'p'>` = own props + `as?: E` + `Omit<ComponentPropsWithoutRef<E>, own keys>`; the component is typed as a generic call signature with `ref?: ComponentPropsWithRef<E>['ref']` (forwardRef implementation unchanged, no `any`). | Type tests: `as="a"` with `href`/`target`, `as="label"` with `htmlFor`, a custom component with its required `to`, an anchor ref. `@ts-expect-error` on `href` for `p`, `htmlFor` on `a`, a missing `to`, and an anchor ref on `p`. These were RED (12 type errors) before the change. |
| 9 | Map notes | BadgeAnchor keeps `overlap="rectangular"` as its default (MUI's own default, correct for buttons and icons); the map says to pass `overlap="circular"` for avatars or for x-core's exact position. Chip palette loss is recorded as a known visual regression (17 colours to 6 tones; grey 8, default 7, secondary 3, purple 2, blueGrey, blue, amber, user-tag colours), with a recommended design decision: a separate categorical palette (`category-1..8` subtle/strong pairs, AA per brand) as a Chip `category` prop or a `Tag` component. | n/a (docs) |

Coexistence re-measured (both builds, both orders, reboot.css and full bootstrap.css): unlayered is still unchanged for Typography, Chip and Badge. Layered known limits changed: (a) Typography: `display/*` now get the `p` margin (0 -> 16px) instead of heading rules, and caption/micro (span) are untouched; (b) Chip: the reboot's `button { margin: 0 }` cancels the layered negative margins that stretch the action button, so chips with an action are 8px wider per stretched side (asserted: action chip +8, disabled action chip +16), on top of the remove-button radius and focus-ring overrides measured before.

Remaining concerns (unchanged from the first report, plus): wrapped clickable chips share the 8px gap between rows (the later chip gets it); a clickable chip that also has a remove button gives its remove target the space beside the label only up to the action button (two adjacent targets, each at least 24px wide on fine pointers and 44px tall on touch).

---

# Fix round 2 (re-review: Chip hit-layer regressions)

Commit: 56ef3f6 fix(Chip): keep labels hoverable and selectable, click ancestors once

Verification: `npx vitest run` 25 files / 402 tests passed (no "unexpectedly reloaded", no config-loader warning); `npm run test:coexistence` 52 passed, 1 skipped (Dialog fixme); typecheck, lint, build, build-storybook clean. `tsconfig.json` fails `prettier --check`, but that predates this round (the same check fails on the previous commit).

| # | Finding | Fix | RED evidence |
|---|---|---|---|
| a | Static chips lost the truncation `title` and text selection: the root `::before` (z-1, pointer target) painted over the unpositioned label | The label and icon are `relative z-2`. Layering is now: hit layers z-0 < chip body `::before` z-1 < label/icon/action button z-2 < remove button and its in-chip hit layer z-3. The remove target keeps its reach over the end of its own label. | New LongLabel play checks: `elementFromPoint` at the label returns the label (truncated, deletable and short chips), `caretRangeFromPoint` lands in the label's text node, `closest('[title]')` from the hover target is the truncated label, and `selectAllChildren` selects exactly the label. RED on the old code (`expected <span data-testid="long"> to be <span>`); dropping `z-2` again fails it. |
| b | A hit-layer click bubbled AND the forwarded button click bubbled (an ancestor fired twice); the button was not focused | HitLayer uses a native `click` listener (React's `stopPropagation` acts at the React root, so native ancestor listeners would still see it) that stops propagation, focuses the button and forwards the click. Only the button click bubbles. Focus uses `{ preventScroll: true, focusVisible: false }`: like a Chrome/Edge/Firefox mouse click, without the keyboard ring that scripted focus would otherwise show in Chromium (Safari does not focus buttons on click; we choose the consistent behaviour, documented in code). | jsdom: React parent called once for a visible click and once per layer click (action and remove); a native ancestor listener sees one click; the layer focuses its button. RED on the old code (parent called 3 times instead of 2; focus missing). Harness, real mouse at 375px, both builds: a click 8px above the 24px chip gives chip 1, row React handler 1, native row listener 1, the action button focused but not `:focus-visible`, and no outline on the chip; a visible click gives 2/2/2. Mutations: without `stopPropagation`, row and native counts are 2; without focus, `action: false`; without `focusVisible: false`, `visible: true` (found on the first run). |
| c | `vitest.config.ts` imported `./.storybook/optimize-deps` without an extension (Vite native config loader warning) | Import ends in `.ts`; `allowImportingTsExtensions` enabled (tsconfig is `noEmit`). The same warning came from `vite.config.ts` importing `./scripts/build-styles`, fixed the same way. The warning no longer appears. | Warning shown before the change, gone after. |
