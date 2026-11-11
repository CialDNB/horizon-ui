# Task 11b report: overlays (Tooltip, Popover, Dialog + ConfirmationDialog, Drawer, DropdownMenu, Toast) + carry-over fixes

Status: DONE_WITH_CONCERNS (concerns are at the end). Branch `feat/foundation`. Not pushed or published.

Impeccable: it was not run. Without PRODUCT.md it stops at init and asks for input, as in Tasks 6-11a. I applied its principles myself: token-only colour, the 4px scale, the radius rule, motion tokens with opacity/transform only, states, RTL, all three brands and four breakpoints. The user still needs to run `/impeccable init`, then audit, polish and adapt, and review the visual baselines.

## Commits (base 6a5c1da)

| SHA | Subject |
|---|---|
| 44c9400 | test(coexistence): wait for the focused option instead of a 300ms settle |
| 5bedee3 | fix(Chip,Badge): stay visible in forced colors |
| b3f6bac | fix(FormField): name a group with the caption of self-labelled choice controls |
| 8d35341 | chore(deps): add Radix tooltip, popover, dialog, dropdown-menu and toast |
| 327325b | feat(Tooltip): add Tooltip |
| 2ea7b46 | feat(Popover): add Popover (also fixes the rtl double alignment flip that affected Tooltip) |
| c40cf28 | feat(Dialog): add Dialog (Task 7 fixme is now a real test) |
| d0abfd5 | fix(Dialog): return focus to the opener when there is no DialogTrigger |
| 12bff55 | feat(ConfirmationDialog): add ConfirmationDialog |
| 57b6317 | chore(storybook): pre-bundle runtime dependencies for browser tests |
| c63adde | feat(Drawer): add Drawer |
| 6d653fe | feat(DropdownMenu): add DropdownMenu |
| f6a23c0 | feat(Toast): add Toast |
| bec62b9 | feat(IconButton): opt-in tooltip showing the aria-label |

No Co-Authored-By trailer in any commit. The Radix packages went into one dependency commit before the components, because they share one lockfile change. Each package's justification is a row in docs/architecture/03.

## Verification (final run, clean tree)

- `npx vitest run`: 75 files, 1371 tests passed (unit + storybook browser projects).
- `npm run test:coexistence`: 293 passed. Nothing is skipped and there is no `test.fixme` left in coexistence/tests.
- `npm run typecheck`, `npm run lint` (`eslint .`), `npm run build` and `npm run build-storybook`: all clean.
- The overlay coexistence suites were also run with `--repeat-each=3`; all 156 passed.

## Carry-over fixes (done first)

1. **components.spec.ts settle.** I corrected the comment: the Radix window is about 10-25ms, not "a few hundred ms". The 300ms sleeps are gone. `listSettled` now waits until the popper wrapper has left its off-screen position and a highlighted option has focus. After ArrowDown in the aria-hidden "outer" case, it waits for DOM focus on "Globex". 15 repeats: 30/30 passed.
2. **Forced colors.**
   - Outline Chip: gets the shared `forcedBorder` (a CanvasText border).
   - Badge dot and the label-form dot marker: get `choiceForcedFill` (`forced-color-adjust: none` and a CanvasText fill).
   - forcedColors.spec.ts covers both builds.
   - RED: before the fix the chip border read "none 0px". With the badge change reverted alone, `forced-color-adjust` read "auto".
3. **FormField.** A self-labelled Checkbox or Switch (caption mode) now makes the field wrapper `role="group"` with `aria-labelledby` set to the caption, so the group context is kept. A field named by a `<label>` does not become a group. RED: the "group named Terms" test failed before the fix.

## Components: decisions, API, behaviour

Shared pieces are in `src/primitives/overlay.ts`:
- `overlaySurface`: popover surface, `shadow-3`, a 1px `border` ring, a CanvasText border in forced colors, and `text-start` (Bootstrap's body sets `text-align: left`, which was measured).
- `anchoredMotion`, `panelMotion` and `scrimStyles`: keyframes `overlay-in` and `overlay-out` in `src/styles/index.css`, built as `hz-overlay-*`. They animate only opacity and transform, using `--hz-enter-x`, `--hz-enter-y` and `--hz-enter-scale` with the duration and easing tokens. base.css collapses them under reduced motion.
- `physicalPlacement`: maps logical sides to physical ones. Alignment passes through because floating-ui already mirrors it under rtl. My first version mirrored it a second time; Popover's RTL story caught this.
- `containEscape`: see below.

Every overlay renders its Portal only when `usePortalContainer()` is non-null. Outside any provider it uses the fallback root and warns once (tested for each component).

**Escape containment (real bug, measured).** MUI's Modal closes on any Escape keydown that reaches it and ignores `defaultPrevented`. Radix handles Escape on `document` in the capture phase. Without stopping the event, one Escape closed both the Horizon overlay and the enclosing MUI dialog. Measured on Tooltip: the trigger was gone after Escape. `containEscape` calls `stopPropagation()` on the native event in every Radix layer. Toast handles Escape in a React `onKeyDown`, so it stops the synthetic event instead. jsdom RED: removing either fix makes the "Escape does not reach outside handlers" tests fail.

### Tooltip (from TooltipV2)
- API: `content` (was `title`), logical `side`/`align` (was `placement`), `delayDuration` (default 300, which is what customer360 always passes), `showArrow`, `disabled`, `labelOnly`, plus `open`/`defaultOpen`/`onOpenChange` and `dir`.
- Dropped with a warning: `title`, `placement`, `enterDelay`, `leaveDelay`, `multipleLine` (wrapping at 280px is the default), `PopperProps`, `sx`, and others.
- Provider: a Tooltip with no `TooltipProvider` above it wraps itself in a Radix provider. An optional `TooltipProvider` shares the skip-delay. Deviation from the brief's "default provider inside HorizonProvider": putting the Radix tooltip module into HorizonProvider would add it to every consumer bundle, even those that never use Tooltip. The requirement that it "works without a consumer-level provider" is met.
- Touch: never opens (Radix). Documented in the stories and the TSDoc, and tested with `pointerType: touch`.
- Keyboard focus opens it and Escape closes it. `aria-describedby` is wired (tested). Max width is `min(280px, 100vw-16px)`, it wraps, and it keeps `\n` line breaks.
- New tokens: `tooltip` (blueGrey/800), `tooltip-foreground` (white) and `overlay` (the scrim, used at 50%), in all brands, with rows in token-gaps.md.

### Popover (from PopoverV2)
- Compound API: `Popover`, `PopoverTrigger`, `PopoverAnchor`, `PopoverContent`, `PopoverClose`. `PopoverContent` keeps x-core's title row, icon, close button (`hideCloseButton`, `closeLabel`) and footer.
- `anchorEl` becomes Trigger or Anchor; `anchorOrigin`/`transformOrigin` become logical side/align. The default is bottom/end, as in x-core.
- `width` defaults to 320px (x-core used 318).
- Non-modal by default; `modal` gives MUI's focus trap. Focus moves in and returns. Escape and outside clicks close it.
- Mobile: the width is capped at `100vw-16px` and the panel stays anchored. It is not a bottom sheet; the reason is in the Responsive spec.
- Viewport RED: changing the cap to `100vw-8px` fails the mobile test.

### Dialog (from DialogV2; v1 Dialog superseded)
- Compound API: `Dialog`, `DialogTrigger`, `DialogContent`, `DialogHeader`, `DialogTitle` (h2), `DialogDescription`, `DialogBody` (scrolls), `DialogFooter` (always visible), `DialogClose`.
- `DialogContent` takes `size` (sm 570 / md 600 / lg 900 / xl 1136), `dismissible` (false blocks Escape and the scrim and hides the close button), `showClose` and `closeLabel`.
- Mobile: full screen, with the safe areas in the header and footer. Footer buttons are full width and stacked with the primary on top (Cancel/Confirm DOM order, `flex-col-reverse`).
- Tablet and up: centred with inset 0, auto margins and fit height, at most the size and `100vw-64px` wide and `100dvh-64px` tall, 16px radius.
- Warnings: Radix 1.3.1 no longer warns about a missing title or description. Our own dev `warnOnce` runs after Radix wires the ids. `aria-describedby={undefined}` opts out.
- Focus restore fix: Radix only refocuses a `DialogTrigger`, so controlled dialogs opened from other buttons (customer360's usual pattern) dropped focus to body. Content now remembers the element that was focused when it opened. Found by the coexistence ConfirmationDialog test; jsdom RED test added.
- `maxWidth` mapping for migration: xs/sm → sm, md/tablet → md, lg/laptop → lg, xl/desktop → xl. Old values fall back to md with a warning; they are not mapped automatically, per the 10c ruling.
- The x-core `dialogWidth.mobile` token (312) is unused. Both x-core DialogV2 and ConfirmationDialog go full screen at mobile, and so does Horizon.

### ConfirmationDialog (from ConfirmationDialog)
- Dialog preset with `role="alertdialog"`. Props: `open`, `onOpenChange`, `title`, `description`, `children`, `confirmLabel`/`cancelLabel` (Confirm/Cancel), `onConfirm`, `onCancel`, `variant` (default or destructive), `loading`, `confirmDisabled`, `closeOnConfirm` (replaces `manualClose`), `size` (default sm).
- `loading` disables Cancel and blocks Escape and the scrim.
- Initial focus is on Cancel, the first action. There is no close icon.
- Order changed: Cancel then Confirm (x-core put approve first).
- Note: the map's "ConfirmDialog" name is now "ConfirmationDialog".

### Drawer (from DrawerV3)
- Props as briefed: `title`, `content`, `actions`, `open`, `onOpenChange`, `side` (start or end, default end, mirrored under rtl by itself), `width` (default 320px, any CSS width, from tablet, capped at the viewport), `keepMounted`, `closeLabel`.
- Dropped with a warning: `isOpen`, `onClose`, `direction`, `sx`.
- Mobile: full-width bottom sheet, at most 90dvh tall, 16px top radius.
- Tablet and up: full-height side panel that slides in from its edge.
- `keepMounted` uses a persistent portal target, a detached div moved into the open body. Content state survives closing, and closed content is not in the document, so there are no hidden focusables. Radix `forceMount` would have kept `hideOthers` and the scroll lock active while closed.
- Focus returns to the opener.
- RED: switching to physical `right-0` fails the rtl-tablet story; disabling the keeper fails the jsdom keepMounted test.

### DropdownMenu (no direct x-core import)
- Compound API: `DropdownMenu`, `DropdownMenuTrigger`, `DropdownMenuContent`, `DropdownMenuItem`, `DropdownMenuCheckboxItem`, `DropdownMenuRadioGroup`, `DropdownMenuRadioItem`, `DropdownMenuLabel`, `DropdownMenuGroup`, `DropdownMenuSeparator` (uses Separator's `separatorVariants`), `DropdownMenuShortcut`, `DropdownMenuSub`, `DropdownMenuSubTrigger`, `DropdownMenuSubContent`.
- `DropdownMenuItem` takes `icon`, `shortcut`, `destructive`, `disabled`, and `asChild` for links with `anchorGuard`. Coexistence checks hover against Bootstrap `a:hover`: no underline and no colour change.
- The direction comes from the nearest provider. Submenus open toward the inline end; ArrowLeft opens them in rtl. Tested in jsdom and in the `RTLSubmenu` story.
- Mobile bottom sheet: a base.css rule under `(width < 768px)` pins the Radix popper wrapper of `[data-hz-menu-sheet]` to the bottom edge with `!important`, because Radix positions the wrapper with inline styles. The selector is wrapped in `:where()` so it stays at (0,1,0). styles.test.ts caught (0,4,0) before.
- Rows are 44px at mobile and 36px with a fine pointer from tablet.
- Contrast finding: muted shortcut and icon text on the `accent` highlight is 2.9:1 in il. Highlighted rows now switch it to `accent-foreground`.
- a11y: `aria-hidden-focus` is off only for the story rendered open (RTL), on the same reasoning as Select.

### Toast (from Snackbar)
- Library choice: **Radix Toast**. `sonner` was not installed and its size was not measured. I ruled it out because it injects its own global stylesheet with unprefixed `[data-sonner-*]` selectors and its own toast look, a second styling system that conflicts with ADR 0001. notistack is MUI-coupled.
- API (matches customer360 `useSimpleSnackbar`):
  - `toast({ variant, title, description, action: { label, onClick, altText }, duration, id, dismissLabel, 'data-did' })` returns `{ id, dismiss }`.
  - `toast.dismiss(id?)` and `useToast()` are also available.
  - `<ToastProvider duration label>` is mounted once inside HorizonProvider and portals its viewport into the provider root.
  - `duration` defaults to 5000; `Infinity` keeps the toast until dismissed.
  - A repeated `id` replaces the shown toast; this replaces `preventDuplicate`.
  - `toast()` with no provider mounted warns once and queues the toast.
- Each toast is a Horizon Alert with `role="none"`.
- Announce once: Radix puts one visually hidden live region in body (polite, assertive for `error`). The `li` has no role or live attribute. Tested, including RED with `type` forced to background.
- Pause on hover, focus and window blur, from Radix. Swipe goes toward the inline end (left in rtl). The dismiss button is 44px at mobile.
- Position: bottom centre at mobile (full width minus 32px) and tablet (400px); bottom end from laptop, 24px inset. RED: moving it to `start-0` fails the laptop and desktop tests.
- Differences from customer360: it used top-right with `style.top: 65px`; Horizon puts toasts at the bottom. `showProgress` becomes a Progress inside `description`.

### Follow-ups wired
- IconButton gets `tooltip?: boolean`, which shows the `aria-label` through `Tooltip labelOnly`. `labelOnly` drops the `aria-describedby` that Radix adds, using a Slot wrapper, because Radix Slot concatenates `aria-describedby` and cannot be overridden from outside. The first two attempts failed the tests (RED). There is a new `WithTooltip` story with a play test.
- AvatarGroup `+N` and the Chip `+N` overflow: documented composition with Tooltip in the map rather than a built-in prop.

## Coexistence measurements

New `coexistence/tests/overlays.spec.ts`. The harness has an `Overlays` block rendered twice: under the app provider, and inside a real MUI Dialog under an inner `<HorizonProvider>`.

- **Unlayered build vs bootstrap-reboot.css / full bootstrap.css / full + customer360 host CSS, both load orders:**
  - Unchanged: Tooltip, Popover (surface, title, close), Dialog (surface, h2 title, description p, close, footer button), Drawer, DropdownMenu (menu, item, link item at rest and highlighted), Toast (li, ol viewport, dismiss).
  - The properties measured are width, max-width, padding, margin, radius, border, font family/size/weight, line-height, colour, background, shadow, box-sizing, text-align, and z-index; plus list-style and margins for the toast `ol`, and text-decoration for menu links.
- **Layered build with full Bootstrap + host CSS (known limit, measured for Dialog):** these properties change:
  - content `marginTop`
  - title `fontSize`, `fontWeight` and `color`
  - close button `borderRadius`
  - footer button `width`, `borderRadius` and `fontSize`
  As for Button and Link, customer360 must use `styles.unlayered.css`. Tooltip measured unchanged in the layered build too.
- **Bootstrap class names:** no `.modal`, `.tooltip`, `.popover`, `.dropdown-menu`, `.toast`, `.btn` or `.close` are used; the existing prefix guard covers this. Bootstrap's z-scale (1000-1070) sits below all Horizon layers.
- **Stacking (Task 7 fixme, now a real test in coexistence.spec.ts, both builds):**
  - Horizon Dialog opened inside an MUI Dialog: Horizon is at z 1350 and MUI at 1300. The panel is the topmost element at its centre and the Horizon scrim covers (4,4), so there is no click-through.
  - Focus starts in the field. Six Tabs stay inside (MUI's trap accepts it because the inner provider is inside MUI's DOM).
  - Escape closes only the Horizon dialog and focus returns to its trigger. A scrim click closes only the Horizon dialog. A second Escape then closes the MUI dialog.
  - RED: setting the dialog token to 1250 fails the test.
  - **Not supported, measured:** an MUI Dialog opened from a Horizon Dialog. MUI (1300) is in body below Horizon (1350); both are root-level stacking contexts; MUI's `pointer-events` is `none` because the Radix modal blocks outside input. Documented in docs/05 and the Dialog docs.
- **Per-overlay MUI-dialog scenarios (both builds).** Each one checks keyboard use, that the overlay is visible to screen readers (role queries), that it is on top by hit test, that Escape closes only the Horizon overlay, focus return, and pointer use. Overlays covered: Tooltip, Popover, ConfirmationDialog, Drawer, DropdownMenu, Toast.
  - **Toast known limit:** inside an MUI dialog the announcement reaches screen readers (it lives in body, outside what MUI hides), but the visible list is inside `#root`, which MUI marks aria-hidden, and MUI's focus trap keeps F8 out. The pointer can still dismiss it. Documented in docs/05 and the map.
- **Forced colors (both builds):** Tooltip, Popover, Dialog, Drawer, DropdownMenu and Toast keep a solid border. The highlighted menu row gets an outline. The radio indicator opts out with a CanvasText fill.

## Contrast (computed, WCAG; all ≥ 4.5 text, asserted in src/tokens/contrast.test.ts)

| Pair | cial | dnb | il |
|---|---|---|---|
| tooltip-foreground / tooltip | 14.63 | 14.63 | 14.63 |
| popover-foreground / popover (titles, bodies) | 17.85 | 4.76 | 17.85 |
| muted-foreground / popover (descriptions, shortcuts) | 7.58 | 7.58 | 4.76 |
| accent-foreground / accent (highlighted rows, incl. shortcuts) | 10.09 | 8.20 | 8.20 |
| destructive-strong / popover (destructive item) | 5.90 | 5.90 | 11.99 |
| destructive-strong / destructive-subtle (highlighted destructive) | 4.91 | 4.91 | 9.65 |
| Toast = Alert tones (`-strong` on `-subtle`): success / info / warning | 6.73 / 6.59 / 5.15 | same | 8.19 / 6.59 / 5.22 |

Rejected pair: muted-foreground on accent in il is 2.95, so it was fixed in DropdownMenu as described above. Non-text: overlay boundaries are the `border` ring plus elevation (the existing popover pairs from 11a); forced colors use real borders.

## TDD evidence (RED, then GREEN)

- Tooltip:
  - Physical side mapping removed: the rtl test fails.
  - Shared-provider wrap removed: 7 tests fail (Radix throws).
  - z class removed: the hover test fails.
  - Max width raised to 320: 5 viewport tests fail.
- Popover:
  - `aria-labelledby` removed: the name test fails.
  - Viewport cap widened: mobile fails.
- Dialog:
  - `containEscape` removed, or the dismissible guard removed: the corresponding test fails.
  - Footer order or md width mutated: 4 viewport tests fail.
  - The no-trigger focus test failed before the fix.
- ConfirmationDialog: the `loading` dismiss guard and `closeOnConfirm` mutations each fail their test; sm width at 560 fails 3 viewport tests.
- Drawer: physical right fails rtl-tablet; the keeper mutation fails keepMounted.
- DropdownMenu:
  - The provider direction ignored: the rtl submenu test fails.
  - The base.css media rule disabled: the mobile sheet fails.
  - Row height mutated: 3 tests fail.
  - styles.test.ts caught the over-specific sheet selector.
- Toast: the Escape stop, the id dedupe and the error type each fail their test when removed; the laptop position mutation fails 2 tests.
- Coexistence: the z-index token mutation fails stacking. Without containment, Escape closed the MUI dialog (measured). Chip and Badge forced-colors RED as above.

## Files

- New: `src/components/{Tooltip,Popover,Dialog,ConfirmationDialog,Drawer,DropdownMenu,Toast}/*` (each with Name.tsx, stories, test, test-d, index), `src/primitives/overlay.ts`, `coexistence/tests/overlays.spec.ts`.
- Changed:
  - Component code: `src/components/{index.ts,Chip,Badge,FormField,IconButton,Tooltip}`, `src/primitives/index.ts`.
  - Styles and tokens: `src/styles/{index.css,base.css,theme.css,tokens.css}`, `src/tokens/brands/*`, `src/tokens/contrast.test.ts`, `src/__tests__/architecture.test.ts` (API snapshot, updated intentionally per component).
  - Coexistence: `coexistence/main.tsx`, `coexistence/tests/{coexistence,components,forcedColors}.spec.ts`.
  - Storybook config: `.storybook/{optimize-deps.ts,main.ts}`, `vitest.config.ts`.
  - Docs: `docs/architecture/03` (dependency rows), `docs/architecture/05` (stacking, Escape, toast limits), `docs/migration/{component-map.md,token-gaps.md}`, `scripts/usage-map-curation.ts`.
  - Dependencies: package.json and the lockfile.

## Dependency justifications (docs/architecture/03; minified, gzip in brackets; "next to Select" = marginal cost)

- `@radix-ui/react-tooltip` 71.6 KB (21.6); +11.3 (+2.6)
- `@radix-ui/react-popover` 87.8 (26.3); +8.1 (+1.6)
- `@radix-ui/react-dialog` 50.8 (14.8); +7.1 (+1.4); shared by Dialog, ConfirmationDialog and Drawer
- `@radix-ui/react-dropdown-menu` 121.7 (34.1); +30.7 (+6.1)
- `@radix-ui/react-toast` 47.7 (13.2); +15.4 (+3.7)

## Concerns

1. **No Figma, design calls made:**
   - Tooltip blueGrey/800 with 12px caption text.
   - Dialog title 16px at mobile and 24px from tablet; full screen at mobile even for confirmations (x-core behaviour; the 312px mobile token is unused).
   - Bottom placement for toasts instead of customer360's top-right.
   - The menu bottom sheet has no scrim.
   - Drawer sheet capped at 90dvh.
   - New `tooltip` and `overlay` tokens.
2. **`!important` in base.css (menu sheet).** It is scoped and at (0,1,0), and needed because Radix positions the wrapper inline. It is fragile if Radix changes its wrapper markup; covered by the mobile viewport test.
3. **Toast inside MUI dialogs** is announced but the list is aria-hidden and keyboard-unreachable (known limit, measured). **MUI Dialog opened from a Horizon Dialog** is unsupported (measured); call-site order matters during migration.
4. **TooltipProvider** is not rendered by HorizonProvider (bundle-size reason above). Without a shared TooltipProvider, neighbouring tooltips do not skip the delay.
5. **Layered build** loses dialog typography, radius and margin to the unlayered host CSS (measured). Only the unlayered build is safe for customer360, as before.
6. **Flakes found and fixed in tests, not product:**
   - A Radix tooltip closes on page scroll, so the tests scroll first.
   - Radix listens for outside presses one tick after opening, so the tests wait for the open animation before clicking the scrim.
   - Vite reloaded mid-run on newly discovered Radix imports; fixed by pre-bundling the runtime dependencies (chore commit).
7. **Not done:** il-acl-client's `useDialog` hook is out of scope; noted in the map, no equivalent yet. Tooltip does not open on long-press for touch; I chose "none" and documented it. Breakpoint edges (767/768 and so on) and 200% zoom are not separately tested for the overlays.

---

# Fix round 1 (review of Task 11b)

Status: DONE_WITH_CONCERNS. Commits `bec62b9..c348df3` (no Co-Authored-By):

| SHA | Subject |
|---|---|
| 3a69351 | fix(Tooltip): shared provider in HorizonProvider, default side bottom |
| 8936d45 | fix(Dialog): keepMounted for x-core Dialog v1 call sites; side safe areas |
| 40e018c | fix(ConfirmationDialog): children describe the dialog without a description |
| ab2863d | fix(IconButton): warn when tooltip has no aria-label to show |
| a0ca23e | fix(Toast): keep toasts reachable while a modal is open |
| 4a098c7 | fix(Toast): repair the Snackbar map note and a test type error |
| a19c174 | fix(Dialog): warn when an MUI overlay opens inside a Horizon modal |
| c348df3 | test(coexistence): x-core DialogV2 variant (disablePortal + Slide) |

**a0ca23e left the tree broken until 4a098c7.** It was committed with a syntax error in `scripts/usage-map-curation.ts` (an unescaped apostrophe in a note) and a type error in the new test (a HorizonProvider with no children). `4a098c7` repaired both before any further work. Every commit from `4a098c7` on passes typecheck and lint.

Final verification on a clean tree:
- `npx vitest run`: 76 files, 1386 tests passed.
- `npm run test:coexistence`: 315 passed. Nothing is skipped and there are no fixme tests.
- `npm run typecheck`, `npm run lint`, `npm run build`, `npm run build-storybook`: all clean.

## Deviations

**D1. Shared tooltip provider. Done (3a69351).**
- `HorizonProvider` renders `TooltipPrimitive.Provider` with `delayDuration` 300 and `skipDelayDuration` 800. Only the outermost provider renders it; nested providers inherit it through React context, including across MUI portals.
- `Tooltip` creates its own provider only when there is no HorizonProvider scope and no `TooltipProvider` above it. That case already triggers the portal fallback's one-time warning.
- Tests in jsdom:
  - Two adjacent tooltips: the second opens within 10ms of moving to it, using fake timers. RED: with `skipDelayDuration={0}` this test fails.
  - A tooltip outside any provider still works (existing test).

**D2. Dialog `keepMounted`. Done (8936d45).**
- The Drawer's keeper technique is now a shared primitive, `useKeptContent` in `src/primitives/keptContent.ts`. The keeper element uses `display: contents`, and a host `div.hz:contents` inside the panel holds it, so the flex layout of header, body and footer is unchanged.
- `forceMount` is not used. The focus trap, scroll lock and `aria-hidden` of the page apply only while the dialog is open.
- jsdom test: an uncontrolled input's typed value survives closing and reopening. While closed, the input is not in the document and the page is not `aria-hidden`. Without `keepMounted` the value resets.
- A second jsdom test checks that the dialog keeps its name and description and that the first field gets focus.
- RED: with `useKeptContent(false)` the test fails.
- A new `KeepMounted` story has a play test that types, closes, reopens, and checks that the body still scrolls and the footer stays inside the panel.
- The v1 map note now covers FilterModal.tsx `keepMounted`.

## Important

**I1. MUI overlays opened inside a Horizon modal. Done (a19c174).**
- Docs:
  - docs/architecture/05 now covers any portaled MUI overlay (Dialog or confirmation, Select or Autocomplete list, Popover, Menu, Popper) and states the migration-order rule: port the whole modal subtree, or use MUI `container` / `disablePortal`.
  - Added a checklist item in porting-checklist.md and a paragraph in the README.
- Call sites flagged with "MIGRATION ORDER" in the Dialog, DrawerV3 and ConfirmationDialog curation notes; the map was regenerated. All three files were checked in customer360:
  - `TagsManagement.tsx:363-383`
  - `ComplianceAlertsDialogNew.jsx:176`
  - `RiskLevelDialogNew.jsx:218`
- Dev-only warning:
  - Implemented in `src/provider/layers.ts`. A `MutationObserver` starts when the first Horizon Dialog or Drawer layer registers and is disconnected when the last one closes.
  - Nested HorizonProviders register as layers without starting the observer.
  - It calls `warnOnce` when `.MuiModal-root`, `.MuiPopover-root` or `.MuiPopper-root` is added.
  - In production it does nothing: `isProduction()` is now exported from `lib/options`.
- jsdom test: the warning fires when an MUI root appears while a dialog is open. `isWatchingForMuiOverlays()` is false before opening and after closing, so there is no cost while no modal is open. RED: without the watch call the test fails.

**I2. x-core DialogV2 variant (`?mui=v2`). Done as tests and docs (c348df3).**
- The harness MUI dialogs take x-core DialogV2's real props: `disablePortal`, `TransitionComponent={Slide}`, `TransitionProps={{ direction: 'up' }}`, `fullWidth`, `scroll="paper"`, `keepMounted={false}`.
- New tests, both builds (16 overlay tests in overlays.spec.ts plus 2 Select tests in components.spec.ts):
  - Horizon Dialog is centred on the viewport within 1px, on top, Escape closes only it, and focus returns to its trigger.
  - Drawer sits at the end edge at full height; a scrim click closes only it.
  - Popover and DropdownMenu sit 0-12px under their trigger, are on top, and Escape closes only them.
  - Tooltip sits under its trigger, on top.
  - Toast sits at the viewport's bottom end, on top, and can be dismissed. In the layered build the reboot's `ol` margin moves it 16px higher (known limit, encoded in the test).
  - Select (components.spec.ts): the list opens 4px under its trigger and selects by pointer.
- Containing-block question: measured, nothing to fix. After the Slide the paper's computed `transform` is `none`, so fixed overlays are not offset. An overlay opened during the 225ms slide would be offset until the slide ends; this is documented.
- **Measured x-core defect.** With `disablePortal`, MUI's ModalManager sets `aria-hidden` on `#root`, and `#root` contains the DialogV2 itself. The x-core dialog and everything inside it, MUI or Horizon, is hidden from screen readers (`getByRole('dialog')` finds 0). horizon-ui cannot fix this from inside. For that reason the v2 tests use test ids instead of role queries. Documented in docs/05: fix DialogV2 (drop `disablePortal`) or migrate it.
- The original portaled scenarios are unchanged, still run in both builds, and still use role queries.

**I3. Toasts while a modal is open. Done, the complete fix (a0ca23e).**
- Layer registry in `src/provider/layers.ts`:
  - Open Dialog and Drawer panels register through `useModalLayer`.
  - A nested HorizonProvider registers when it sits inside a `role="dialog"` or `role="alertdialog"`, which covers the MUI Dialog paper.
  - `ToastProvider` portals its viewport into the topmost layer and falls back to the provider root when no modal is open.
  - Result: the toast list is inside the focus trap, not `aria-hidden`, and reachable with F8, Tab and the pointer.
- Outside-press exemption:
  - `fromToast` and `ignoreToastPresses` are wired into DialogContent (`onPointerDownOutside` / `onInteractOutside`), Drawer, Popover and DropdownMenu content.
  - Measured: Radix's toast viewport is already a DismissableLayer "branch", so presses on it never counted as outside. Removing the exemption does not fail the Popover test. The exemption is kept as a safeguard; there is no RED evidence for it.
- Enter animations now fill `backwards` only (exit animations `forwards`). With `both`, the finished transform kept the dialog panel a containing block, so the toast list was confined to the panel. RED: with `both`, the coexistence check measured the toast bottom at 455 instead of 696.
- jsdom tests in `ToastInModal.test.tsx`:
  - Horizon Dialog: the viewport is inside the dialog, the action is found by role (not aria-hidden), focusable and clickable, and the dialog stays open.
  - Escape on a focused toast inside the dialog closes the toast only.
  - The list returns to the root when the dialog closes.
  - Drawer: dismissing a toast keeps the drawer open.
  - An open Popover stays open when a toast is pressed.
  - A nested provider inside a host dialog hosts the list.
  - RED: with root-first container selection, 3 of these fail.
- Coexistence tests, both builds:
  - MUI Dialog: the earlier "known limit" test is inverted. The toast is now reachable by role and keyboard (Enter on Dismiss).
  - App-level Horizon Dialog and Drawer: the toast is on top at the page's bottom end, the action is focusable and keyboard-activated, and the panel stays open.
  - The same scenarios inside the MUI dialog for Horizon Dialog and Drawer.

**I4. ConfirmationDialog description from children. Done (40e018c).**
- When `description` is missing and children are given, `DialogBody` gets an id and `aria-describedby` points at it.
- jsdom test: the alertdialog's accessible description is the children text. RED: with `aria-describedby` forced to undefined, the test fails.

## Minor

**M1. Tooltip default side `bottom`. Done (3a69351).** Matches x-core. Covered by tests (default side and the unknown-value fallback), the TSDoc and the map note.

**M2. Dialog side safe areas at mobile. Done (8936d45).**
- Header, body and footer use a symmetric `px-[max(16px, env(safe-area-inset-left), env(safe-area-inset-right))]`, so they stay correct under RTL.
- The close button's end offset and the header's end padding also respect the insets.
- Checked that the compiled CSS contains the rules. Not tested: Chromium cannot emulate `env()` insets, so there is no RED.

**M3. Two ToastProviders and click-to-dismiss. Done (a0ca23e).**
- `warnOnce` fires when more than one provider is mounted (jsdom test).
- Decision: customer360's click-anywhere-on-the-toast-to-dismiss is dropped. A click target the size of the whole toast conflicts with selecting text and with the action button. This is recorded in the map note.

**M4. IconButton `tooltip` with `aria-labelledby`. Done (ab2863d).** Dev `warnOnce`, TSDoc updated, jsdom test. RED: with the check disabled the test fails.

**M5. Drawer `keepMounted` limits. Documented (8936d45).** The TSDoc and the map now state that `keepMounted` is read once on mount and that kept content measures 0 while closed. The Dialog `keepMounted` TSDoc says the same.

## Deferred, as instructed

Not done in this round:
- containEscape documentation beyond the TSDoc line.
- A scrim or back affordance for the menu sheet.
- A version pin for the `!important` rule.
- Toast swipe snap-back.
- A tree-shaking test (Task 15).
- Breakpoint-edge and 200% zoom probes.

## Remaining concerns

1. x-core DialogV2 hides itself from screen readers. This is an upstream defect; it is documented with a recommended fix.
2. The toast exemption (I3 part 1) has no RED evidence because Radix already covers that case.
3. M2 is untested in a browser because safe-area insets cannot be emulated.
4. The layered build still loses some properties to unlayered host CSS. For example, the toast list sits 16px higher (measured). customer360 must use the unlayered build.

---

# Fix round 2 (re-review)

Status: DONE. One commit: `4576043 fix(Toast): count host-dialog layers only while visible` (no Co-Authored-By).

## NEW Important: closed keepMounted host dialog captured the toast list. Fixed.

- **Visibility check.** `topLayer()` in `src/provider/layers.ts` now skips any layer that `isLayerHidden(el)` reports as hidden:
  - disconnected from the document;
  - inside `[aria-hidden="true"]`, `[inert]` or `.MuiModal-hidden`;
  - inside an element whose computed `display` is `none` or `visibility` is `hidden`.
- **Reactivity.** A nested provider inside a host `role="dialog"` now registers through `registerHostLayer(el)`. That function adds a `MutationObserver` on the attributes of the element and of each of its ancestors. It watches only `class`, `style`, `aria-hidden`, `inert` and `hidden`, with no subtree observation.
  - When the host opens or closes, the registry re-emits.
  - `ToastProvider` re-reads `topLayer()` through `useSyncExternalStore`, so the list moves into the dialog and back again.
  - A toast that is already showing is kept: its Radix Root stays mounted and re-portals into the moved list.
  - The observer is disconnected in the effect cleanup, so a StrictMode double-mount leaves no leak. During SSR or without `MutationObserver`, the provider registers the layer without an observer.
- **Unchanged.** Horizon Dialog/Drawer panels mount only while open. They now also go through the visibility check.

Tests:
- jsdom, `src/components/Toast/ToastInModal.test.tsx`. The fixture is a closed `keepMounted` MUI root (`.MuiModal-hidden` + `aria-hidden`) holding an inner HorizonProvider.
  1. Closed: the toast is in the app root and reachable by role.
  2. Opening (class and attribute removed) moves the list into the inner provider, and the toast is still reachable.
  3. Closing moves the list back.
  4. Unmounting disconnects the observer.
- RED, jsdom:
  - Tests 1 and 2 failed before the fix ("Cancel request" not found, because it was inside the hidden dialog).
  - With the visibility check reduced to `isConnected`, both fail again.
  - Removing `watcher.disconnect()` fails test 4.
- Coexistence: a new harness `KeptMuiDialog` is a real MUI `Dialog keepMounted` with an inner HorizonProvider. In both builds:
  - Closed: the toast is not in the dialog, not aria-hidden, and its Dismiss button is found by role.
  - Open: the same toast moves into the dialog and stays reachable.
  - Closed again: it moves back and stays visible and reachable.
- RED, coexistence: with the visibility check reduced to `isConnected`, both builds fail ("Expected visible, Received hidden").
- Adding the kept dialog put a second `.MuiDialog-paper` on the page. The DialogV2 tests now target the paper of their own dialog content, not the first `.MuiDialog-paper` in the document.

## Minors

- **(a) Dev MUI-overlay warning, false positive.** Done. Nodes added inside an open Horizon modal panel (MUI `container` / `disablePortal`, the documented fix) are skipped. A jsdom test appends `.MuiPopover-root` inside the open dialog and checks that no warning fires. RED: without the skip, the test fails.
- **(b) Toast outside-press exemption.** Removed. `fromToast` and `ignoreToastPresses` are deleted, along with their wiring in Dialog, Drawer, Popover and DropdownMenu.
  - The behaviour is still covered: the existing ToastInModal tests check that pressing a toast does not close a Dialog, a Drawer or a Popover, and they still pass.
  - Radix's toast viewport is a DismissableLayer branch, so presses on it already do not count as outside presses.
  - docs/05 now gives that reason.
- **(c) Tooltip skip delay.** `TooltipProvider` now defaults `skipDelayDuration` to 800, and the fallback provider used outside any HorizonProvider also uses 800, the same as HorizonProvider.

## Verification

- `npx vitest run`: 76 files, 1390 tests passed.
- `npm run test:coexistence`: 317 passed.
- `npm run typecheck`, `npm run lint`, `npm run build`, `npm run build-storybook`: all clean.

One timing fix in the new jsdom test: after the list moves, the toast re-portals on the next render, so the test now waits with `findByRole` instead of `getByRole`. It flaked once under full-suite load before that change.
