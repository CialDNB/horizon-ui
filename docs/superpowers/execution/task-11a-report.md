# Task 11a report: forms (Label, Input, Textarea, FormField, Checkbox, RadioGroup, Switch, Select) + zIndex tokens

Status: DONE_WITH_CONCERNS. Branch `feat/foundation`, base `8910e07`, head `e5e05ee`. Everything committed, nothing pushed.

## Commits

| SHA | Subject |
|---|---|
| 16181c2 | feat(tokens): add zIndex scale and form/popover semantic keys |
| 7c1a574 | feat(Label): add Label |
| cd8777a | feat(Input): add Input |
| dc8d86c | feat(Textarea): add Textarea |
| 81bd0ed | feat(FormField): add FormField |
| 47d1bd2 | feat(Checkbox): add Checkbox |
| 29106e0 | feat(RadioGroup): add RadioGroup |
| 114cb6c | feat(Switch): add Switch |
| 2e8e4ce | feat(Select): add Select |
| 8df70ca | test(Avatar): wait up to 5s for image load/error in ImageFallback (pre-existing flake that the larger suite exposed) |
| e5e05ee | test(Select): open outside any provider renders in the fallback root |

## Verification (final, at e5e05ee minus the last test-only commit; that test was re-run alone)

- `npx vitest run`: 60 files, 1187 tests pass (unit jsdom + storybook chromium, a11y `test: 'error'` on every story). Select unit file is 12/12 after the last commit.
- `npm run test:coexistence`: 225 pass, 1 skipped (the existing Dialog stacking `test.fixme`, Task 11b).
- `npm run lint`, `npm run typecheck` (incl. coexistence project): clean. `npm run build`, `npm run build-storybook`: OK. Prettier check clean.

## Impeccable

`/impeccable` stops at init without `PRODUCT.md` (none in the repo), so I applied its principles myself, as previous tasks did: token-only colour, 4px spacing, radius rule (fields 20px as x-core, boxes 4px), type roles only (no ad-hoc leading), motion tokens (fast 100ms colour, normal 200ms + spring for the Switch thumb), every state designed (hover, focus-visible, invalid, disabled, read-only, loading, empty, long text, RTL, 3 brands), and harden-style edge states (empty Select, clear, long values at 320px, outside-provider overlay). The user should still run `/impeccable init` + audit/polish and review visual baselines.

## Tokens (16181c2)

- `src/tokens/zIndex.ts`: dialog 1350, dropdown 1400, popover 1450, tooltip 1500, toast 1600 (all > MUI modal 1300). Emitted as `--z-*` on `.hz-root` (tokens.css) and `--z-index-<name>: var(--z-<name>)` in the `@theme` (utilities `hz:z-dropdown` ...; bare `hz:z-1` still works). Drift tests extended (RED: missing module first). Confirmed by the coexistence stacking test: an open Select (1400) is the topmost element over an open MUI Dialog and selects, both builds.
- New semantic keys (ledger ruling allows adding): `control-border` (blueGrey/500, x-core's input border; `input` blueGrey/300 is 1.4:1 and fails WCAG 1.4.11, kept for disabled), `popover` (white, x-core `background.paper`), `popover-foreground` (= foreground). Documented in `docs/migration/token-gaps.md`.

## Per-component decisions and API differences

Shared primitives (in `src/primitives`, used by 3+ components): `FormFieldContext`/`useFieldControl` (merges control props with FormField; own props win, describedby concatenates), `composeRefs`, `useResolvedDir` (reads the PARENT's computed direction: Radix roots echo the `dir` prop as an attribute, found by a failing RTL test), `fieldStyles` (Input/Textarea/Select trigger look; boundary is an inset ring = box-shadow, so host border rules cannot reach it and adornment buttons get the full 44px), `choiceStyles` (Checkbox/Radio/Switch: the 44px target is the real button box, visual control centred inside; no hit layer, so stacked options touch and never overlap).

- **Label**: native `<label>` (no Radix Label: it only blocks double-click selection, not worth a dep). `required` = decorative `aria-hidden` asterisk (control carries `aria-required`), `disabled`. Type label/md. Display/margin/colour/weight explicit. Dropped: sx, color, focused, error, filled, shrink, variant, component.
- **Input** (TextField 43 files + TextInput 10): native input in a field box. Sizes sm/md/lg: 44/44/48 at mobile and touch pointers with 16px text (no iOS zoom, incl. iPad via `tablet:pointer-fine:`), 32/40/48 with a fine pointer (md 40 = x-core TextInput default). States: rest control-border ring, hover primary, focus 2px ring, invalid destructive + warning icon (non-colour cue), disabled muted, read-only = rest ring without hover (a muted fill would put dnb foreground at 4.34:1). `startAdornment`/`endAdornment`, `clearable` (+`clearLabel`, `onClear`; native value setter so `onChange` fires with '' for controlled and uncontrolled; refocuses; 44px target), `loading` (spinner + `aria-busy`; x-core `isLoading`). Number spin buttons and search cancel hidden. `className` -> field box; `ref`/`data-did`/attrs -> `<input>`. No password toggle: x-core TextField/TextInput have none (PasswordField is separate, skip). Dropped (warn): label, helperText, error, success, fullWidth (full width by default), InputProps, inputProps, InputLabelProps, FormHelperTextProps, inputRef, sx, variant, margin, color, multiline/rows/minRows/maxRows (Textarea), characterLimit, mask/definitions, hideAdornment, leadingAdornment, isLabelContainer, isLoading, info, append. `size` small/medium/large -> resolveOption fallback md + warn.
- **Textarea**: native textarea, field look, padding 12/16, 4 rows, text 16/20 at every breakpoint (body/secondary is 14/14, too tight for prose; also avoids iPad zoom). `resize` vertical|none (native handle replaces x-core's custom one), `autoResize` + `maxRows` (instant height, overflow auto past the cap). Dropped (warn): label, helperText, error, fullWidth, multiline, minRows (use rows), maxRows (use autoResize), inputProps etc.
- **FormField**: Label + one control + description + error via context. `aria-describedby` = description then error; `aria-invalid` when `error` (or `invalid`); `aria-required` (not native `required`: no browser bubbles; pass `required` to the control for native validation); `disabled`. Error `<p role="alert">` with icon, mounted only while present (announced on appearance/text change, not on re-render; jsdom test asserts the same node survives re-renders). RadioGroup is named via `aria-labelledby` = label id. react-hook-form (customer360: 113 files) and Formik (74) work without a dependency: `register` spread tested in jsdom; Controller/Formik pattern documented in the story docs. Dropped (warn): helperText, errorText, fullWidth, margin, sx, variant, color, focused, hiddenLabel, isLabelContainer, info.
- **Checkbox** (CheckboxV2 3 files; v1 17): Radix Checkbox, tri-state (`checked="indeterminate"`, aria-checked mixed), `label`, sm/md box (16/20), target 44 at mobile/touch, 24/20 fine. `onCheckedChange(checked)` replaces MUI `onChange(event, checked)`; `onChange` and `indeterminate` are dropped WITH warning (an untyped `onChange` would silently never fire). Dropped: color, sx, edge, inputProps, inputRef, icons, disableRipple, readOnly. Label 16/20 (x-core 14px).
- **RadioGroup** (RadioGroup 9 files, Radiov2 3, v1 Radio 8): Radix RadioGroup + `RadioGroupItem` (`value`, `label`). `orientation` vertical|horizontal (x-core `row`), group-level `size`, `invalid`, `disabled`, `dir` (auto from DOM). Roving focus, arrows select and skip disabled, RTL horizontal arrows reversed (jsdom + story tests). Look = MUI Radio (2px primary ring + dot when checked). `options` array -> children; `onChange(e, value)` -> `onValueChange(value)` (string values); label/error/errorText -> FormField; `other` -> compose Item + Input. Dropped with warn on group and item.
- **Switch** (SwitchV2 3, v1 4): Radix Switch, `label`, track 40x24 (x-core 42x22) control-border off / primary on (x-core blueGrey/400 off track is 2.5:1, fails), background thumb with shadow-1, transform-only travel mirrored with `rtl:` variants, spring easing 200ms (x-core squish keyframes not ported); reduced motion -> instant (base kill switch). Target 44x44 mobile/touch, 44x28 fine. Dropped (warn): onChange, color, size, sx, edge, inputProps, inputRef, icons, disableRipple.
- **Select** (SelectV2 4 files/7 openings; v1 MUI Select 22): see decision below. API: `<Select value defaultValue onValueChange placeholder size invalid clearable clearLabel emptyMessage name required open defaultOpen onOpenChange dir>` + `SelectItem` (truncates; string children become `title`), `SelectGroup label`, `SelectSeparator`. ref/className/data-did -> trigger. `options`, `onChange`, `multiple`, `variant`, `placeholderValue`, search, apply/reset, menu header, loading, startAdornment, muiSelectProps, sx, fullWidth, label/helperText/error dropped with warn. size small -> md fallback + warn.

### Select implementation decision

Radix Select, single value, no native fallback. Evidence: customer360 call sites use groups, disabled options, placeholders and clearing; a native `<select>` cannot style options/groups per brand or RTL consistently. Radix gives typeahead, arrow/Home/End/Escape, collision-aware placement, focus return, and a hidden native select for forms/autofill. Mobile adaptation: popover as wide as the trigger (full-width fields at mobile, so it spans the screen) with 44px rows / 16px text and max height = available height with scroll buttons; 36px rows / 14px text with a fine pointer (viewport tests open the list at all four viewports and measure). Not a bottom sheet: documented in the Responsive story; sheets arrive with Popover/Dialog in 11b. Portal: `usePortalContainer()`, Portal rendered only when non-null; outside a provider the fallback `.hz-root` (cial) + warn once (jsdom test). Clear button is a sibling of the trigger (a button cannot nest in a button) over reserved end padding. Cost: 34.2 KB gzip (shared overlay stack). **Multi-select (5 of 7 SelectV2 openings, 10 v1 openings) and the search field are NOT ported**: Radix Select is single-value; they need a Combobox (Popover + listbox) in Task 11b.

## Coexistence (reboot / full bootstrap / customer360 host, both builds, both orders)

Every new component is in `coexistence/main.tsx` (`hz-forms` section) with a PROBES entry: the unlayered build is identical with and without bootstrap-reboot.css, full bootstrap.css and full bootstrap.css + `?host=customer360`, in both load orders, and layered == unlayered without host CSS. Property list `FIELD_PROPS`: width, height, margins (top/bottom/inline start/end), paddings, border width/style, radius, box-shadow, box-sizing, background, colour, font family/size/weight, line-height, letter-spacing, appearance, outline style/width/colour/offset, overflow, resize, cursor, display, vertical-align (+ rowGap for FormField, translate/transform for Switch, zIndex for the open list). Targets include focused states (keyboard modality), inner spans (box, circle, dot, track, thumb), labels, the Input clear button and an IconButton adornment, the Select clear button (adjacent to the trigger, so customer360's `button + button` applies), placeholder colour (`::placeholder`, separate test), and the OPEN Select list + option (separate test, all 6 host/order combos).

Real defects found and fixed by these tests (RED then GREEN):
1. Bootstrap `[type="search"] { outline-offset: -2px }` won when loaded after horizon (equal specificity) -> `hz:[&[type]]:outline-offset-0` (0,2,0).
2. Reboot `svg { vertical-align: middle }` changed FormField/Input icons -> explicit `align-middle`.
3. Bootstrap/customer360 `button:focus` changed the Select trigger's outline width/colour (Tailwind `outline-none` only sets style) -> explicit `focus:outline-2 focus:outline-ring` with `outline-none`.
4. (storybook) Radix `ItemText` drops `className`: options wrapped instead of truncating -> wrapper span.

Layered build (known limit, measured and asserted in `LAYERED_FORMS_DIFF`): Label/choice labels take `label { display:block; colour; bold; margin-bottom }`; Input/Textarea/Select take Bootstrap line-height/font-size; buttons lose radius and negative margins; the Input clear button loses its focus ring under customer360's `button:focus { outline: none }`. Checkbox/Radio/Switch focus rings survive even layered (drawn on spans). customer360 must keep using `styles.unlayered.css`.

MUI dialog: Select inside an open MUI Dialog with a HorizonProvider inside the dialog opens above it (z 1400, `elementFromPoint` hits the option), selects, returns focus, both builds with full host CSS. Known limit (asserted): without a provider inside the dialog, the trigger (MUI portals to body) is outside `.hz-root` and has no Horizon variables -> wrap MUI dialog content in `HorizonProvider` (documented in the map).

## Contrast (all asserted per brand in src/tokens/contrast.test.ts)

| Pair | min | cial | dnb | il |
|---|---|---|---|---|
| control-border on background (field/box/radio/switch-off boundary) | 3:1 | 4.56 | 4.56 | 4.56 |
| control-border on popover | 3:1 | 4.76 | 4.76 | 4.76 |
| primary on background (hover ring, checked fill, radio, switch on) | 3:1 | 5.91 | 6.58 | 6.58 |
| ring on background (focus) | 3:1 | 5.91 | 6.58 | 6.58 |
| destructive on background (invalid ring) | 3:1 | 4.47 | 5.65 | 5.65 |
| primary-foreground on primary (check mark) | 3:1 | 6.17 | 5.74 | 5.74 |
| background on control-border (switch thumb off) | 3:1 | 4.56 | 4.56 | 4.56 |
| background on primary (switch thumb on) | 3:1 | 5.91 | 6.58 | 6.58 |
| primary on accent (selected check, highlighted) | 3:1 | 4.90 | 4.25 | 4.25 |
| foreground on background (value, label) | 4.5:1 | 17.10 | 4.56 | 17.10 |
| muted-foreground on background (placeholder, description) | 4.5:1 | 7.26 | 7.26 | 4.56 |
| destructive-strong on background (error text, asterisk) | 4.5:1 | 5.65 | 5.65 | 11.48 |
| popover-foreground on popover (option) | 4.5:1 | 17.85 | 4.76 | 17.85 |
| accent-foreground on accent (highlighted option) | 4.5:1 | 10.09 | 8.20 | 8.20 |
| muted-foreground on popover (group label, empty) | 4.5:1 | 7.58 | 7.58 | 4.76 |

Also asserted: primary-hover fills under the check mark/thumb, switch thumb on primary-hover, Input icons. Error text uses `destructive-strong` because cial `destructive` is 4.47:1 as text.

## TDD evidence (RED, then GREEN; mutation checks reverted)

- RED by missing module for every component's jsdom file and the zIndex drift test; then real assertion REDs: RadioGroup arrow-key/RTL tests failed (Radix selects on the focus after a held key; and `useResolvedDir` read Radix's echoed `dir`), Input `[type=search]` coexistence, FormField/Input svg align, Select trigger outline, Select long-option truncation.
- Mutations (each failed the named tests, then restored): Label `text-label-md`->`lg` (4 viewport tests); Label without `hz:m-0` (6 coexistence groups, `marginBottom 0 -> 8px`); Input clear shown when disabled/readOnly (1), no refocus after clear (1), md fine height `h-9` + clear `size-10` (4 viewport); Textarea cap/resize removed (2), `body-secondary` text (5 storybook); FormField error id dropped from describedby (1); Checkbox `htmlFor`/`required` removed (4), sm target sizes (4 viewport); RadioGroup `dir` and FormField labelling removed (2), vertical gap at mobile (1 viewport); Switch rtl classes + fine height (4: RTL story + 3 viewport); Select Portal never rendered (5 jsdom).

## Files

New: `src/components/{Label,Input,Textarea,FormField,Checkbox,RadioGroup,Switch,Select}/*` (Name.tsx, stories, test, test-d, index), `src/primitives/{formField.ts,formField.test.tsx,composeRefs.ts,useResolvedDir.ts,fieldStyles.ts,choiceStyles.ts}`, `src/tokens/zIndex.ts`, `src/stories/viewports.tsx` (viewport story helper + `settled()`).
Changed: `src/components/index.ts`, `src/primitives/index.ts`, `src/__tests__/architecture.test.ts` (API snapshot: +Checkbox, FormField, Input, Label, RadioGroup, RadioGroupItem, Select, SelectGroup, SelectItem, SelectSeparator, Switch, Textarea and their `*Variants`), `src/tokens/{brands/*,contrast.test.ts,index.ts}`, `src/styles/{tokens,theme}.css`, `scripts/build-tokens.ts` (+test), `src/test-setup.ts` (ResizeObserver/pointer-capture/scrollIntoView stubs for Radix in jsdom), `coexistence/{main.tsx,tests/components.spec.ts}`, `scripts/usage-map-curation.ts` + regenerated `docs/migration/component-map.md` (rows done + sections Label, FormField, Input, Textarea, Checkbox, RadioGroup, Switch, Select), `docs/migration/token-gaps.md`, `docs/architecture/03-packaging-and-distribution.md`, `package.json`/lock, `src/components/Avatar/Avatar.stories.tsx` (flake timeout only).

## Dependency justifications (docs/architecture/03, measured as before: Vite lib build of the package alone, react external, min (gzip))

- `@radix-ui/react-checkbox` 19.8 KB (6.3 KB): role/tri-state/Space/label click/hidden native input.
- `@radix-ui/react-radio-group` 39.5 KB (11.3 KB): roving focus, arrow selection skipping disabled, RTL, native inputs.
- `@radix-ui/react-switch` 16.0 KB (5.3 KB): mostly internals shared with Checkbox.
- `@radix-ui/react-select` 117.8 KB (34.2 KB): carries the overlay stack (popper/floating-ui, focus scope, dismissable layer, scroll lock, aria-hidden, portal) that Task 11b overlays reuse; native select considered and rejected.
- No `@radix-ui/react-label` (native label).

## Concerns

1. Multi-select and search from SelectV2/v1 Select are not ported (most customer360 SelectV2 openings use `multiple`): need Combobox in Task 11b before those call sites can migrate.
2. Design calls without Figma: option/choice labels and Textarea text are 16/20 at all breakpoints (x-core 14px) because 14/14 is too tight for wrapped text (ties to the open line-height token decision); read-only Input has no fill; Switch off track is darker than x-core (contrast); `control-border`/`popover` keys added.
3. Not ported: x-core `characterLimit` counter (7 TextField uses; native `maxLength` only), `mask` (3 uses, needs react-imask decision), TextInput `append` country/text selectors, Select `loading`/`startAdornment`.
4. Horizon controls inside MUI dialogs need a `HorizonProvider` inside the dialog content (measured; MUI portals to body, outside `.hz-root`).
5. Layered build stays unsafe for customer360 forms (labels, type, the Input clear button focus ring), as for earlier components.
6. Radix Select open stories disable axe `aria-hidden-focus` (Radix hides the page behind the modal list; the trigger cannot be focused while focus is trapped). The Avatar ImageFallback story flaked under the larger suite; its waitFor timeout was raised to 5s (separate test commit).
7. Breakpoint edges (767/768 ...) and 200% zoom are not separately tested (same deferral as earlier tasks); 320px no-overflow is asserted in every component's viewport tests.

---

# Fix round 1 (review: 2 spec fails, 4 Important, minors)

Status: DONE_WITH_CONCERNS. Head `6a5c1da`. Final gates: vitest 61 files / 1207 tests pass; coexistence 231 pass, 1 skipped (Dialog fixme); lint, typecheck, build, build-storybook clean.

| # | Commit | What and evidence (RED first) |
|---|---|---|
| S2 | 013a148 fix(Select): pass form and autoComplete to the Radix root | `form`/`autoComplete` fell through to the trigger button. New `src/__tests__/formSubmit.test.tsx` (FormData): all controls submit under `name`; required empty Select and Checkbox fail `checkValidity()` until filled; `form="ext"` associates Input, Checkbox, Switch, RadioGroup, Select with an external form. RED: trigger carried `form`. |
| S1 | fa815fe + e1e2d5c fix(Select) | RTL story `play` opens the list from a 140px trigger under `dir=rtl`: list inline-start (right) edge = trigger's, extra width grows to the inline end (left), chevron and check on the left. `side="bottom" align="start"` explicit. Mutations `align="end"` and check `right-3` both fail it. e1e2d5c: open-list stories were order-dependent (a list left open, or Radix's delayed focus return, took focus from the next story's trigger; reproduced on the original commit too): stories now open from the keyboard after focus is confirmed and close the list waiting for focus to return; 3/3 stable runs. |
| I1 + m10 | 2f3dfc6 fix(FormField) | Chose "control publishes its id" (more robust: keeps customer360's ids): `useFieldControl` registers the control's own `id` through context, the Label `htmlFor` follows it. Tests with `getByLabelText` for own id, FormField id, both (control wins). Checkbox/Switch with their own `label` register it and the FormField label renders as a caption `<div>` (no second `<label>`): named once. RED: 3 FormField tests + Checkbox name test. |
| I2a + m8 | 8f86335 fix(HorizonProvider) | Nested provider inherits `brand`/`dir` from the parent (context, crosses React portals); explicit props win; no parent = cial/ltr. Tests: inherit, override, default, runtime parent change, through a portal. `useResolvedDir` re-reads when the provider's dir changes: RadioGroup ArrowLeft after a runtime flip to rtl, Select list `dir` after flip. RED: 3 provider + 2 runtime-dir tests. |
| I2b | c67fd49 fix(Select) | Harness: Select + Input in a real MUI Dialog, unlayered + full Bootstrap + customer360 host. **Inner `<HorizonProvider>` (no props)**: inside `.hz-root` (variables, 20px radius), keyboard open/arrow/Enter, Escape closes only the list (dialog stays), focus returns to trigger, options exposed to role queries, pointer select, Input types. **Outer provider only: NOT usable** (asserted): controls outside `.hz-root` so `var(--primary)` = Bootstrap's `#007bff` and other vars missing; the list portals into `#root`, which MUI's ModalManager sets `aria-hidden="true"` -> options unreachable by screen readers (role queries find 0) although focus is on one; keyboard/pointer selection works for sighted users. Guidance with snippet in README, ADR 0001 (new section) and docs/architecture/05 ("Horizon controls inside MUI dialogs"). `container` prop on Select not added: any container must itself be `.hz-root`, which the inner provider gives. No MUI detection. Note: the keyboard steps need a short settle (300ms) after Radix opens/moves: keys sent faster than a person types intermittently selected the first option (also without MUI); documented in the spec. |
| I3 | acf41d6 fix: forced colors | Fields and choice boxes get a CanvasText border under `forced-colors`, fields a Highlight focus outline (Input wrapper via `has-[>input:focus]`, Textarea, Select trigger focus-visible/open), Select list a border, radio dot and switch thumb `forced-color-adjust: none` + CanvasText fill; check mark is `currentColor`. `coexistence/tests/forcedColors.spec.ts` (`emulateMedia({ forcedColors: 'active' })`, both builds): borders, focus outlines, checked marks. RED: all 4 failed (`none 0px`). Earlier components: Button/IconButton/Link/Chip/Alert focus rings are outlines (survive forced colors); Chip `outline` appearance and the Badge dot use ring/fill and would lose their tint (not interactive boundaries; not changed). |
| I4 | d0087df fix(Select): map partial | Map generator gains status `partial` (+ `supersededStatus`); SelectV2 and v1 Select rows are `partial`. Measured by call-site prop scan: SelectV2 2 of 4 files (5 of 7 openings) use `multiple`, 1 opening search; v1 Select 8 of 22 files (10 of 30 openings) `multiple`. New "Blocked migrations" table at the top (also TextField `characterLimit` 7 / `mask` 3, TextInput `append` 5). zIndex location noted (tokens/zIndex.ts). |
| m7 | 6a8e690 fix: task numbers | Warnings now say "use Combobox (planned)" / "Tooltip (planned)"; architecture test fails on any runtime string with "Task N" (RED: 7 offenders incl. IconButton). |
| m9 | 06f525c fix(Input) | Uncontrolled filled state re-read from the DOM after every render and after the owning form's `reset`. Tests: `form.reset()` hides the clear button; a DOM value written like RHF `setValue` shows it on the next render. RED: both failed. |
| m12 | 31978a4 fix(Select) | Empty state counts items registered via context (a wrapper component rendering no items now shows the message). RED: 1 failed. |
| m13 | 0c20111 fix(Avatar) | Root cause: the broken image was a missing URL, so the error waited on the dev server's 404 (over 1s under the parallel suite). Now an undecodable data URI (no network); the 5s timeout is reverted; stable. |
| m11 | 6a5c1da refactor | `src/primitives/inlineAction.ts`: shared reset/44-32px target/shape/focus ring for Input and Select clear and Alert dismiss (each adds its own colour/position). Chip's remove button keeps its hit-layer design (documented). Coexistence caught a regression during the refactor (dropped `focus-visible:outline-ring` let Bootstrap's `button:focus` colour win), fixed before commit; all coexistence diffs unchanged. |

Remaining concerns: multi-select/search still need Combobox (now listed as blocked migrations); outer-provider use inside MUI dialogs is unusable by design and only documented (guidance prominent); forced colors verified by emulation (media match), not on real Windows High Contrast; Chip outline tint and Badge dot not adapted for forced colors.
