# Task 10c report: Avatar, IconButton, Link

Status: DONE_WITH_CONCERNS (concerns at the end). Branch `feat/foundation`, base 763591f.

## Commits

| SHA | Subject |
| --- | --- |
| 17f582d | feat(Avatar): add Avatar |
| 0ff7761 | feat(IconButton): add IconButton |
| 20bbfb7 | feat(Link): add Link |

No Co-Authored-By. Nothing pushed.

## Verification (run on 20bbfb7's tree before committing it)

- `npx vitest run`: 40 files, 850 tests passed (unit + storybook browser project, a11y `test: 'error'` on every story).
- `npm run test:coexistence`: 110 passed, 1 skipped (pre-existing Dialog `test.fixme`).
- `npm run typecheck`, `npm run lint`, `npm run build`, `npm run build-storybook`: clean. `prettier --check` clean.

## Impeccable

`/impeccable craft` stops at setup: `context.mjs` reports `NO_PRODUCT_MD` and init needs the user. Per the Task 6 ruling I applied its principles myself (product register: earned familiarity, state vocabulary, motion only for state, 100ms colour transitions, no decoration; copy rules: link text with standalone meaning, verb+object labels in stories). The user should run `/impeccable init` then `audit`/`polish` on the three components.

## Decisions per component

### Avatar (`Avatar`, `AvatarGroup`, `avatarVariants`, `getInitials`)
- Native, no `@radix-ui/react-avatar` (no new dependency). Image is rendered absolutely over the fallback, hidden (`opacity-0`) until `load`; on `error` the img is removed and the fallback stays; a new `src` restarts (status derived per src, no effect). A layout effect catches already-decoded images (cache/hydration).
- Accessible name: one `role="img"` on the root, named by `alt`, else `name`. Initials, custom children and the img (`alt=""`) are hidden: announced once. `alt=""` (or no name) = decorative (`aria-hidden`). Rationale: customer360 mostly shows the name next to the avatar.
- `name` drives initials (Unicode-aware, punctuation stripped, 2 letters, 1 at `xs`); x-core's `getInitials(alt)` coupling is split into `name` + `alt`.
- Sizes x-core px (16/24/32/40/64), initials on the type scale (micro, label/sm, label/md, label/lg, heading/sm; semibold). `shape` circle | rounded (4px up to sm, 8px from md). `tone` for the fallback: `primary` solid (x-core AvatarGroup look, default) + soft status tints (customer360 fdp colours approvers by status via `sx`). x-core does NOT derive colour from the name, so neither do we.
- Not interactive: no 44px target (documented; wrap in Button/link).
- AvatarGroup: named export (not `Avatar.Group`, consistent with `BadgeAnchor`), children-based, `max` (default 3, min 2, MUI semantics: all when they fit), `total`, `overflowLabel` (default "N more"), size/shape passed via context. Overlap -4px (xs, sm) / -8px (md+) via logical `-ms-*`, 2px `background` ring. Tooltips deferred to Task 11.
- Reboot: `img { vertical-align: middle; border-style: none }` handled with explicit `align-top border-0`.

### IconButton (`IconButton`, `iconButtonVariants`, type `IconButtonName`)
- Variants mirror Button minus `link`: primary (default, x-core `color="default"`), secondary, tertiary (hover tints to `accent`; no underline on an icon), destructive (solid, as Button), ghost. x-core success/info/warning have no tone variant (map: secondary, recorded as a visual regression).
- Sizes: real square box, circular. 44/44/48px at mobile and on touch pointers; 32/36/44px from tablet with a fine pointer (Button's heights); icons 16/20/24.
- Name: `aria-label` or `aria-labelledby` required by a union type (`@ts-expect-error` tests); dev `warnOnce` on an empty name. Icon wrapped in `aria-hidden` span (svg `<title>` cannot leak into the name).
- `loading`: shared Spinner (`md`/`lg` follow size), `aria-busy` + `aria-disabled`, focus kept, clicks blocked. `asChild`: Slot, disabled -> `aria-disabled` + `tabIndex -1` + blocked; `anchorGuard` per variant.
- Shared code decision: click blocking and the asChild-disabled mapping now exist in Button and IconButton only (2 uses) -> kept local per the extract-at-3 rule; comment in code and note in the map. Variant strings mirror Button's.
- Tooltip label pattern documented (TSDoc + story docs): `aria-label` is the name; Tooltip wraps later (Task 11).
- Real finding fixed: Bootstrap `svg { vertical-align: middle }` changed the icon's computed value in the unlayered build -> explicit `[&_svg]:align-middle`.
- ActionIconButton merged (map): compact form = `IconButton variant="secondary"` + `BadgeAnchor`; labelled form = `Button variant="ghost"`.

### Link (`Link`, `linkVariants`)
- x-core has `Link` in the Typography module (1 customer360 import); app links are react-router `Link` (33 files), MUI `Link component={RouterLink}` (3 files), `Box component="a"` (1).
- Variants: `inline` (default; primary, always underlined (WCAG 1.4.1), thicker on hover, inherits type), `standalone` (x-core look: semibold label/md or label/sm via `size`, underline on pointer hover, 44px min box at mobile/touch, text-sized with a fine pointer), `subtle` (inherits colour, underline on pointer hover; not for links inside sentences). Visited = same colour.
- `isExternal`: `target="_blank"`, `rel` merged with `noopener noreferrer`, visually hidden `externalLabel` ("(opens in new tab)", translatable), decorative `ArrowSquareOut` icon (1em, `showExternalIcon`). Works with `asChild` via Radix `Slottable`.
- `disabled` (or consumer `aria-disabled="true"`): native -> href removed, `role="link"`, `aria-disabled`, not focusable, muted; asChild -> href kept, `tabIndex -1`, click blocked.
- anchorGuard extended with `primary-hover` and `inherit` tokens (tests added). Disabled styling uses the `inactive:` variant whose `:is([aria-disabled='true']:not([aria-busy='true']))` gives (0,3,0), beating `a:not([href]):hover` (0,2,1); measured, and a redundant hover/touch guard set was removed after a mutation showed it had no effect. `inactive:decoration-auto` fixes a measured thickness diff on hover of the disabled link.

## API differences
Full migration tables are in `docs/migration/component-map.md` (new sections "Avatar", "IconButton", "Link"; rows Avatar, AvatarGroup, IconButton, ActionIconButton `done`; Typography note points to Link; curation in `scripts/usage-map-curation.ts`, map regenerated with `npm run usage-map`). Highlights: Avatar `alt` split into `name`/`alt`, `size` xsmall..xlarge -> xs..xl, custom `{width,height}` dropped, `variant` -> `shape`; AvatarGroup `avatars` -> children, `max` semantics, tooltips deferred; IconButton `color` -> `variant`, `tooltipInfo` dropped, name required; Link x-core default -> `variant="standalone"`, MUI `underline`/`color`/`component` -> variants/`asChild`.

## Coexistence (reboot) measurements
Harness (`coexistence/main.tsx`) gained Avatars (sm initials, xl rounded success, lg photo, md group with +N), 5 IconButtons + 5 asChild icon links + disabled + loading, and 5 Links (inline in a `<p>`, standalone, subtle in a coloured span, external sm, disabled). New shared helper `coexistence/tests/linkStates.ts` (rest/hover/focus/active/visited + touch sticky hover).

Unlayered build, unchanged (diff `{}`) without vs with `bootstrap-reboot.css` and full `bootstrap.css`, both load orders, and identical to the layered build without Bootstrap:
- Avatar (7 targets incl. img, group member, +N): width, height, marginInlineStart, borderRadius, borderTopStyle/Width, fontFamily, fontSize, fontWeight, lineHeight, color, backgroundColor, boxShadow (ring), objectFit, opacity, position, overflow, display, verticalAlign.
- IconButton (12 targets incl. keyboard-focused button and link, icon svg): width, height, paddingTop, paddingInlineStart, marginTop, borderRadius, borderTopWidth/Color, color, backgroundColor, fontSize, lineHeight, textDecorationLine, outlineStyle/Width/Color/Offset, cursor, display, verticalAlign. Plus: mouse-clicked button shows no ring under full Bootstrap (both orders).
- Link (7 targets incl. focused standalone, external icon): width, height, minHeight, color, backgroundColor, textDecorationLine/Thickness, textUnderlineOffset, fontFamily, fontSize, fontWeight, lineHeight, borderRadius, outline*, cursor, display.
- Anchor states (IconButton asChild x5, Link x5): color, backgroundColor, textDecorationLine/Thickness, borderRadius, fontSize, fontWeight, outlineStyle/Color, cursor at rest/hover/focus/active/visited, reboot and full, both orders; touch device (no hover media) sticky hover, both orders.

Layered build known limits (asserted as measured truth, ADR 0001): Avatar only invisible img properties (`border-style solid->none`, `vertical-align top->middle`); IconButton buttons squared (`border-radius 100px->0`, line-height 16->24, no visual effect), focused ring replaced by Bootstrap's, loading cursor lost, asChild links take `#007bff` and lose the fill; Link colours become `#007bff`, the inline link loses its underline, disabled inherits text colour. Legacy hosts must use `styles.unlayered.css`.

## Contrast (added to `src/tokens/contrast.test.ts`, all brands)

| Pair | min | cial | dnb | il |
|---|---|---|---|---|
| Avatar primary (primary-foreground on primary) | 4.5:1 | 6.17 | 5.74 | 5.74 |
| Avatar neutral (neutral-strong on neutral-subtle) | 4.5:1 | 9.45 | 9.45 | 9.45 |
| Avatar info (info-strong on info-subtle) | 4.5:1 | 6.59 | 6.59 | 6.59 |
| Avatar success (success-strong on success-subtle) | 4.5:1 | 6.73 | 6.73 | 8.19 |
| Avatar warning (warning-strong on warning-subtle) | 4.5:1 | 5.15 | 5.15 | 5.22 |
| Avatar error (destructive-strong on destructive-subtle) | 4.5:1 | 4.91 | 4.91 | 9.65 |
| IconButton primary (primary-foreground on primary) | 3:1 | 6.17 | 5.74 | 5.74 |
| IconButton primary hover (primary-foreground on primary-hover) | 3:1 | 9.42 | 7.50 | 7.50 |
| IconButton secondary/tertiary icon + secondary border (primary on background) | 3:1 | 5.91 | 6.58 | 6.58 |
| IconButton tertiary/ghost hover (accent-foreground on accent) | 3:1 | 10.09 | 8.20 | 8.20 |
| IconButton destructive (destructive-foreground on destructive) | 3:1 | 4.67 | 5.90 | 5.90 |
| IconButton destructive hover (on destructive-hover) | 3:1 | 7.54 | 7.54 | 7.54 |
| IconButton ghost (foreground on background) | 3:1 | 17.10 | 4.56 | 17.10 |
| Focus ring (ring on background) | 3:1 | 5.91 | 6.58 | 6.58 |
| Link rest (primary on background) | 4.5:1 | 5.91 | 6.58 | 6.58 |
| Link hover/active (primary-hover on background) | 4.5:1 | 9.03 | 8.61 | 8.61 |
| Link disabled (muted-foreground on background; exempt) | 4.5:1 | 7.26 | 7.26 | 4.56 |

IconButton icons are graphics (WCAG 1.4.11, 3:1) and every pair also clears 4.5:1. Storybook a11y (`test: 'error'`, axe contrast) passes on every story including the Brands matrices.

## TDD evidence
- RED first: each `*.test.tsx` was written before its component and failed on the missing module (Avatar, IconButton, Link). anchorGuard token test and code were added together (not RED-first; small additive change).
- Unit mutations (all killed): Avatar fallback not aria-hidden; broken img kept; overflow off-by-one; xs two initials (initially SURVIVED: `toHaveTextContent` matched a substring -> test tightened to exact text, then killed); punctuation-to-space. IconButton icon exposed; asChild disabled mapping dropped; loading not blocking; missing-name warning removed. Link no `noreferrer`; disabled keeps href; asChild disabled focusable; asChild drops external hint; consumer aria-disabled ignored.
- Viewport/computed (storybook browser, 4 viewports) mutations killed: Avatar sm grows at tablet (3 tests), md overlap 4px (4), xl type step, no object-cover; IconButton sm 32 at mobile, md dense only from laptop, md icon 16 (4); Link standalone without 44px, dense only from laptop, disabled not muted. SURVIVED (documented): IconButton without `focus-visible:outline-offset-2` (the scoped base `.hz-root :focus-visible` already gives 2px offset); Link without `underline` in Storybook (UA default underlines anchors) -> caught by coexistence instead (10 failures).
- Coexistence mutations killed: Avatar img without `align-top` (5), IconButton ghost without anchorGuard (6), IconButton without `focus:outline-none` (2, new mouse-focus test written for it after the first version missed it), Link inline without underline (10), Link subtle without anchorGuard (6), Link without `inactive:decoration-auto` (4).

## Files changed
- New: `src/components/Avatar/{Avatar.tsx, Avatar.stories.tsx, Avatar.test.tsx, Avatar.test-d.ts, index.ts}`, same for `IconButton/` and `Link/`, `coexistence/tests/linkStates.ts`.
- Modified: `src/components/index.ts`, `src/__tests__/architecture.test.ts` (snapshot: Avatar, AvatarGroup, avatarVariants, getInitials, IconButton, iconButtonVariants, Link, linkVariants; reviewed), `src/primitives/anchorGuard.ts` + test (tokens `primary-hover`, `inherit`), `src/tokens/contrast.test.ts`, `coexistence/main.tsx`, `coexistence/tests/components.spec.ts`, `scripts/usage-map-curation.ts`, `docs/migration/component-map.md`.

## Concerns
1. No Figma: design choices to confirm: Avatar default tone `primary` solid vs soft tints for status; overlap/ring sizes; xl initials 24px (x-core 18px, no 18px token); IconButton always circular and without success/info/warning tones (customer360 uses success/error outlines in 2 files); destructive is solid (x-core error was outlined); Link default `inline` (x-core Link maps to `standalone`); visited colour equals rest colour.
2. Button still does not use `resolveOption` (pre-existing, outside 10c scope; IconButton does).
3. The `ArrowSquareOut` external icon is not mirrored under RTL (no consensus; design call).
4. Name tooltips for IconButton and AvatarGroup wait for Tooltip (Task 11); until then the IconButton name is invisible to sighted users.
5. Layered build: inline Link loses its underline under Bootstrap (a11y-relevant), adding to the known limits; customer360 must use `styles.unlayered.css`.
6. Breakpoint edges (767/768 etc.) and 200% zoom are not separately tested for these components (same gap as earlier tasks); the 320px reflow is covered only by Link LongText.
7. Impeccable `init`/`audit`/`polish` and visual baselines still need the user.

---

# Fix round 1 (review of 10c)

Commits (base 20bbfb7): a1383be refactor(primitives): share click blocking, button tones and legacy-prop filtering; 0fae55f fix(Button): fall back on x-core values, add startIcon/endIcon, stop leaking MUI props; 0699383 fix(IconButton): drop x-core-only props; share tones and click blocking with Button; ab8b776 fix(Link): drop MUI-only props; use the shared click blocking; 26ac8fe fix(anchorGuard): keep underlined links underlined under customer360 a:focus; 1dab1d5 fix(Avatar): derive initials from alt without a name; drop x-core-only props; 1e2cc7e fix: drop x-core-only props instead of leaking them to the DOM; 8910e07 docs(migration): Button icons, Avatar alt initials, dropped legacy props.

Verification: `npx vitest run` 43 files / 874 tests passed; `npm run test:coexistence` 150 passed, 1 skipped (pre-existing Dialog fixme); typecheck, lint, build, build-storybook clean.

## 1. Button x-core values and DOM leaks (Important)
- `variant`/`size` go through `resolveOption('Button', ...)` (fallback `primary`/`md`, one warning). Tests: `variant="contained"`, `"text"`, `size="small"` assert fallback data attributes and classes and exactly one warning each (RED: 3 failing before the fix).
- Decision: real `startIcon`/`endIcon` props (5 customer360 files use them): rendered inside the label span before/after `children`, each wrapped `aria-hidden`; not rendered with `asChild`. Test (RED first) checks order, hiding and name. Story `StartEndIcon`. Map row updated.
- New `omitLegacyProps` (src/lib/options): drops listed x-core/MUI props from untyped callers with a one-shot dev warning naming the replacement. Button drops `color`, `textColor`, `showTextUnderLine`, `sx`, `disableElevation`, `disableRipple`, `endIconAnimation`; `color` also removed from the Button type (`@ts-expect-error` test).
- Sweep (rough file counts of customer360 files importing x-core that use the prop: `sx` 368, `onClose` 91, `fontWeight` 74, `fontSize` 72, `component` 68, `startIcon` 19, `endIcon` 7, `underline` 5, `severity` 4): drop-and-warn added to IconButton (`color` incl. `"neutralDark.option_2"`, `tooltipInfo`, `tooltipProps`, `sx`, `edge`, `disableRipple`; item 7 confirmed by test), Link (`color`, `underline`, `sx`, `component`, `TypographyClasses`), Avatar (`sx`, `variant`, `imgProps`, `sizes`, `srcSet`, `component`), Chip, Badge, Alert, Spinner, Progress, Separator, and Typography (DOM elements only; a component passed as `as` still receives them, tested). `src/__tests__/legacyProps.test.tsx` asserts no leaked attribute, no React console.error, one warning per prop (RED: 7 failing before).

## 2. customer360 host CSS (Important)
- Fix: `anchorGuard` adds `hz:focus:underline` for looks underlined at rest (Link `inline`, Button `link`): (0,2,0) beats `a:focus { text-decoration: none }` (0,1,1). Not added for hover-only looks (their rest is already no underline; a `focus:no-underline` would remove the hover underline while a clicked link stays focused). Keyboard ring: the `focus-visible:outline-*` classes (0,2,0) already beat `a:focus { outline: none }`; measured.
- Harness: `?host=customer360` loads `coexistence/fixtures/customer360-host.css` (customer360's global element rules copied from `projectx-core/css/index.scss` lines 115-261, 360-366, 451-459; `css/index.scss` only adds `html { scroll-behavior }`; source cited in the file) after Bootstrap, in both load orders.
- Every component probe group (Button newly added: 6 variants, 6 asChild links, focused; plus Typography, Chip, Badge, Spinner, Separator, Progress, Alert, Avatar, IconButton, Link) now runs against bootstrap-reboot, full bootstrap, and full bootstrap + host CSS, both orders: all unchanged in the unlayered build.
- Anchor state suites (Link x5, Button asChild x6, IconButton asChild x5): rest, hover, focus (keyboard, :focus-visible), active, clicked (new: mouse focus, pointer moved away), visited; with reboot, full, full + host, both orders; touch sticky hover with full + host. All unchanged in the unlayered build. Measurement note: the host's `a:hover, a:focus { outline: none }` resets the colour of the non-drawn rest outline; `linkStates` reports outline colour as `-` when `outline-style` is `none` (invisible), documented in the helper.
- RED: removing `hz:focus:underline` from anchorGuard fails 4 host tests (Link and Button asChild, both orders: `inline focus/clicked textDecorationLine: underline -> none`).
- Layered limit, measured and asserted: with full Bootstrap + host CSS every Link state changes: Bootstrap blue at rest/hover, the inline link has no underline in any state, and keyboard focus shows NO ring (`outline-style none`); disabled inherits the text colour.
- Host scan result: rules that touch ported components are `a:hover, a:visited, a:focus` (fixed above), `button + button { margin-left: 8px }` (no effect: the scoped base `.hz-root :where(button) { margin: 0 }` is (0,1,0) > (0,0,2) in the unlayered build; Button probes measure `marginInlineStart` on sibling buttons), `button:focus { outline: none }` (beaten by the focus-visible classes; measured), `h1..h6 { color; margin; font-weight }` plus sizes and h5/h6 line-height (Typography sets all explicitly; measured on h1-h6), `label`, `strong`, `hr`, `ul`, `input`, `input::placeholder` (no ported component renders these), `* { box-sizing }`, `html, body` font (horizon sets its own family on `.hz-root`). Nothing else overrides a Horizon component in the unlayered build.

## Minors
3. `blockedClick(blocked, onClick)` in src/primitives with unit tests (RED: missing module); used by Button, IconButton, Link.
4. `buttonTones` record (primary, secondary, destructive, ghost) in src/primitives, used by Button and IconButton; their computed-style stories and coexistence probes pass unchanged.
5. Avatar derives initials from `alt` when `name` is absent (x-core `<Avatar alt={name} />` in SegmentRequestNew.jsx); `alt` stays the accessible name. Test (RED first) + map note.
6. Duplicate `hz:font-semibold` removed from Avatar `xs`; the dead `if (asChild) return <Slot>` duplicate in Button removed (Button had no duplicated `[&_svg]` class string; that was the duplicated line).
7. IconButton `color="neutralDark.option_2"` is dropped with a warning (test).

## Remaining concerns
- Dropped legacy props warn but are not mapped (for example Button `color="error"` does not become `destructive`, `variant="text"` falls back to `primary` not `tertiary`): mapping old values would be friendlier but is a convention change; call sites still need migrating.
- The layered build is unusable for links in customer360 (no focus ring); only `styles.unlayered.css` is safe there.
