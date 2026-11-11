# Task 11c report: Combobox, SearchBar, SplitButton, Filter, EmailsField, NumberInput

Status: **DONE_WITH_CONCERNS**. All six components are built, tested and committed, one commit per component plus one follow-up commit for SearchBar contrast pairs. PhoneInput and LabelColorActionsPopover are deferred as instructed. CountryInputV2 was read but not ported: it is `skip` in the map with no customer360 usage, and Combobox covers the country picker (`CountryAutoComplete`).

## Commits (branch feat/foundation, base 4576043)

| SHA | Subject |
|---|---|
| 4d86823 | feat(Combobox): add Combobox (also moves Input's `<input>` styles into the shared primitives `fieldInputElement`/`fieldInputText`) |
| 8437169 | feat(SearchBar): add SearchBar |
| fd2d6e8 | test(SearchBar): search icon contrast pairs (3:1, all brands). The pair edit missed the SearchBar commit because Prettier had re-wrapped the target text. |
| 93b1179 | feat(SplitButton): add SplitButton |
| 060daf8 | feat(NumberInput): add NumberInput |
| 37cd5c7 | feat(EmailsField): add EmailsField and the x-core email validator |
| c9d6527 | feat(Filter): add Filter |

There is no Co-Authored-By trailer. Nothing was pushed or published.

## Verification (final tree, c9d6527)

- `npx vitest run`: 89 files, **1639 tests pass** (unit + storybook browser projects, a11y `test: 'error'` on every story). Baseline before the task was 1386 (11b) plus later additions.
- `npm run test:coexistence`: **383 pass**, none skipped (was 335 at 4576043).
- `npm run lint`, `npm run typecheck` (src + coexistence), `npm run build` and `npm run build-storybook` are clean. `prettier --check` flags only `tsconfig.json`, which was already flagged before this task.
- The API snapshot was updated on purpose: `Combobox`, `comboboxVariants`, `SearchBar`, `SplitButton`, `NumberInput`, `EmailsField`, `Filter`, `validateEmail`, `sanitizeEmail`, `normalizeEmailInput`.

## Combobox implementation decision (evidence)

- **cmdk was measured and rejected.** I measured cmdk 1.1.1 with esbuild (minified, React external). With its Radix dependencies external it is 11.9 KB (4.7 KB gzip). Bundled with them it is 52.2 KB (17.9 KB gzip). Size was not the deciding factor. Its behaviour is wrong for this component:
  - it puts `aria-selected` on the **highlighted** item, which contradicts multi-select state;
  - it keeps `aria-expanded="true"` while the list is hidden;
  - it ranks options with a fuzzy scorer, while MUI and x-core match "contains";
  - it has no chip or free-text model, so the field, chips and announcements would be our code anyway.
- **Chosen:** a hand-rolled ARIA 1.2 editable combobox with list autocomplete, positioned with Radix Popover (already a dependency). Radix handles collision-aware placement, outside press and layered Escape (`containEscape`, so an MUI dialog does not close). The module is 12.5 KB (4.9 KB gzip) minified, mostly class strings. **No new dependency.** This is recorded in `docs/architecture/03-packaging-and-distribution.md` (Dependency justifications) and in the Combobox section of the component map.
- **ARIA:**
  - The input has `role="combobox"`, `aria-autocomplete="list"`, `aria-expanded` (true only while a listbox exists), `aria-controls` and `aria-activedescendant`. The listbox is named from the FormField label or `aria-label` and has `aria-multiselectable`. Options have `aria-selected` (chosen) and `aria-disabled`. Groups use `role="group"` with `aria-labelledby`.
  - Options are never focused (`tabIndex=-1`; one lint rule is disabled on that line, with the reason given).
  - Loading and empty states render as a visible message instead of a fake option. One always-mounted `role="status"` region in the field announces each message once per change. Tested: the same text node survives further typing.
- **Keyboard:** typing filters (case- and accent-insensitive "contains", as MUI) and highlights the first match, unless `allowCustomValue` is set. ArrowUp/Down open the list and move, skipping disabled options and wrapping. Alt+arrows open and close it. Enter picks. Escape closes and restores the selected label. Backspace removes the last chip. Blur restores the label.
- **Features:**
  - `multiple`: removable Chips with the 44px hit area; the list stays open while picking.
  - `allowCustomValue` (MUI `freeSolo`).
  - `filter={false}` for server-side search, `limit` (default 100, x-core `filterOptionsLimit`).
  - `onInputChange(text, reason)`, `clearable`, `option.group` / `option.description`.
  - Hidden inputs for `name`; FormField wiring.
  - The list portals into the HorizonProvider root at `--z-dropdown`.
  - Option-object values from x-core `.jsx` callers are ignored with a one-time warning.
- **Mobile is not a bottom sheet (deviation from the brief).** The list stays anchored under the field: field-wide, 44px rows, 16px text, 44px toggle and clear buttons. Reason: the on-screen keyboard covers a bottom-pinned sheet, and the typed text must stay visible next to its suggestions. Select made the same call in Task 11a. This is documented in the story, the Responsive spec and the map. The design owner needs to confirm it.

## Per-component decisions and API differences

The full migration tables are in `docs/migration/component-map.md`, one section per component.

- **SearchBar:**
  - Input inside a `role="search"` landmark, named by the field's `aria-label` or `landmarkLabel`, so several search bars stay distinguishable (axe landmark-unique).
  - The 44px search button sits at the inline start; the clear button is Input's.
  - Enter calls `onSearch` without submitting an enclosing form. Clearing calls `onValueChange("")` and `onSearch("")`, as x-core does.
  - **No debounce**, because x-core has none.
  - Renames: `searchValue` → `value`, `onSearchChange` → `onValueChange`, `loader` → `loading`, `hasError` → `invalid`. Label and helper text move to FormField. `iconSize`, `actions` and x-core's 300px min-width are dropped (the min-width overflowed at 320px).
- **SplitButton:**
  - Button + DropdownMenu inside `role="group"`. The main button runs the selected option.
  - The caret is the DropdownMenu trigger (`aria-haspopup="menu"`, named by `menuLabel`). Options are `menuitemradio`; picking one selects and runs it, as x-core.
  - The menu is a bottom sheet at mobile, which replaces customer360's own MobileSplitButton.
  - `variant`: contained → primary, outlined → secondary. Any other value falls back to primary with a warning. `color` (including `bright`) and the customer360 wrapper-only props are dropped with a warning.
  - Measured: customer360's `button + button { margin-left: 8px }` loses to the `.hz-root` button reset in the unlayered build. An `hz:ms-0` guard I added proved redundant (the mutation survived), so I removed it.
- **NumberInput:**
  - WAI-ARIA spinbutton built on Input: `aria-valuenow/min/max/valuetext`, `inputmode` decimal or numeric.
  - Typing filters input as x-core `cleanInput` does. `onValueChange` fires only for in-range numbers, as x-core.
  - Blur clamps to min/max and applies decimals and grouping. ArrowUp/Down step, Page Up/Down move 10 steps, Home/End jump to the bounds.
  - Steppers are two buttons side by side: 44px at mobile, 32px with a fine pointer. They are out of the tab order (the pattern keeps one tab stop), use `aria-controls` and disable at the bounds. x-core drew 12px stacked arrows.
  - Formatting follows x-core (`.` decimal, `,` grouping), not the locale.
  - `step` is added. The `append` selectors are not ported.
- **EmailsField:**
  - A chip field that reuses `comboboxVariants` for the box. It is a plain textbox, not a combobox (MUI's combobox role was wrong here).
  - Enter, `,`, `;`, space and blur add an address. Paste splits lists; x-core split on `,;`, horizon also splits on whitespace and new lines.
  - Addresses are normalized first ("Name <email>", invisible characters, lowercase), then validated.
  - **New behaviour:** invalid typed text stays in the input with a `role="alert"` message linked through `aria-describedby` and `aria-invalid`. x-core ignored it silently.
  - Duplicates are ignored. Backspace removes the last chip. `limit` shows an "n / limit" counter linked to the input, and the input becomes read-only when full.
  - **Validator port:** `src/lib/email.ts` contains `validateEmail`, `sanitizeEmail` and `normalizeEmailInput`, the same rules as x-core. They are tested with 17 cases (RED first: the import failed before the file existed) and exported from the package root, because customer360 imports `@cialdnb/x-core/utils/emailValidation` in 2 files.
- **Filter:** x-core Filter is a pill with a count badge that opens a Menu with checkboxes or radios, search, apply/reset, a skeleton while loading, `clean` and `disableMenu`.
  - The pill is 44px at mobile and 32px with a fine pointer. It has `aria-haspopup="dialog"`, a count bubble and a `totalCount` bubble. The counts are read from visually hidden text, or appended to a caller's `aria-label`.
  - The Popover panel is named by the label.
  - `multiple` uses a Checkbox group and commits **once on close**, as x-core. With `applyLabel`, changes are staged until Apply, Reset clears and closes, and closing discards. Closing with no change reports nothing (tested, mutation killed).
  - `single` uses a RadioGroup; picking commits and closes. `clean` renders as `single`, with a warning.
  - `searchable` adds a search field. Loading and empty are `role="status"` messages.
  - `toggle` (x-core `disableMenu`) is an `aria-pressed` pill without a panel.
  - Renamed props: see the map. `range`, `switch` and `list` are not ported (unused in customer360).

## Coexistence (both builds, reboot / full Bootstrap / `?host=customer360`, both load orders)

- **Every new component is in `coexistence/main.tsx`** and in `PROBES` with `FIELD_PROPS` (SplitButton also checks the start-border colour and width). For each one, the unlayered build renders identically to the layered build, and is unchanged by bootstrap-reboot, full bootstrap.css and full bootstrap + customer360 host CSS, with horizon CSS loaded first and last.
- **Open lists and panels:**
  - Combobox list and Filter panel are unchanged in the unlayered build under all three legacy stylesheets, in both orders. z-index is 1400 (list) and 1450 (panel).
  - Filter needed one normalization: the option that takes focus on open has `outline-style: none`, so Bootstrap's `button:focus` width and colour draw nothing and are ignored in that probe.
- **MUI dialogs:** Combobox inside a real MUI Dialog and inside x-core DialogV2 (`?mui=v2`), with an inner HorizonProvider, both builds:
  - the list is topmost at the option centre and sits 4px under the field;
  - a keyboard pick works and focus stays in the input;
  - Escape closes only the list.
- **Layered build (known limit, asserted exactly in `LAYERED_FORMS_DIFF`):**
  - Combobox and EmailsField: input line-height 14→21px; round buttons lose their radius; the clear button loses its focus ring.
  - SearchBar: additionally the `[type=search]` outline offset and the tuck margins.
  - NumberInput: the increase button takes `button + button` margin 8px.
  - SplitButton: radius and font, and the `button + button` margin splits the pill.
  - Filter: pill radius, font and focus ring.
  - customer360 must use `styles.unlayered.css`, as already ruled.
- **Forced colors** (both builds), with borders and focus outlines asserted for:
  - the Combobox, SearchBar, NumberInput and EmailsField fields;
  - the SearchBar search button;
  - the Filter pills.

  The Combobox multi-select box has a CanvasText border; highlighted rows get a Highlight outline.

## Contrast (WCAG; enforced in `src/tokens/contrast.test.ts`, all three brands)

| Pair | min | cial | dnb | il |
|---|---|---|---|---|
| Combobox option (`popover-foreground` on `popover`) | 4.5:1 | 17.85 | 4.76 | 17.85 |
| Combobox highlighted option and its description (`accent-foreground` on `accent`) | 4.5:1 | 10.09 | 8.20 | 8.20 |
| Combobox group label / description / messages (`muted-foreground` on `popover`) | 4.5:1 | 7.58 | 7.58 | 4.76 |
| Field value (`foreground` on `background`) | 4.5:1 | 17.10 | 4.56 | 17.10 |
| Placeholder / EmailsField counter (`muted-foreground` on `background`) | 4.5:1 | 7.26 | 7.26 | 4.56 |
| Combobox chip neutral soft (`neutral-strong` on `neutral-subtle`) | 4.5:1 | 9.45 | 9.45 | 9.45 |
| EmailsField chip / Filter pill rest (`accent-foreground` on `accent`) | 4.5:1 | 10.09 | 8.20 | 8.20 |
| EmailsField invalid message (`destructive-strong` on `background`) | 4.5:1 | 5.65 | 5.65 | 11.48 |
| Filter pill open/pressed, count bubble (`primary-foreground` on `primary`) | 4.5:1 | 6.17 | 5.74 | 5.74 |
| Filter count bubble on the open pill (`primary` on `primary-foreground`) | 4.5:1 | 6.17 | 5.74 | 5.74 |
| Filter total bubble (`accent-foreground` on `background`) | 4.5:1 | 12.15 | 12.69 | 12.69 |
| Combobox check / SearchBar icon (`primary` on `background`) | 3:1 | 5.91 | 6.58 | 6.58 |
| Combobox check on a highlighted row (`primary` on `accent`) | 3:1 | 4.90 | 4.25 | 4.25 |
| Multi-select box boundary (`control-border` on `popover`) | 3:1 | 4.76 | 4.76 | 4.76 |
| Multi-select box boundary, highlighted row (`accent-foreground` on `accent`) | 3:1 | 10.09 | 8.20 | 8.20 |
| SearchBar icon hover (`primary-hover` on `background`) | 3:1 | 9.03 | 8.61 | 8.61 |
| NumberInput steppers / Combobox toggle (`muted-foreground` on `background`) | 3:1 | 7.26 | 7.26 | 4.56 |
| Filter hover ring (`primary` on `accent`) | 3:1 | 4.90 | 4.25 | 4.25 |

Contrast fix found by the test: `control-border` on `accent` (multi-select box on a highlighted row) is 2.95:1 for dnb and il, below 3:1. The box now switches to `accent-foreground` on highlighted rows. SplitButton reuses the existing Button and DropdownMenu pairs.

## TDD evidence (RED, then GREEN; mutations reverted)

- **Combobox (jsdom, 21 tests).** Each mutation below failed the named tests:
  - navigation does not skip disabled options: keyboard test;
  - no `aria-activedescendant`: 3 tests;
  - empty state not announced: announce test;
  - Backspace removes nothing: multiple test;
  - accent-sensitive filter: filter test.
- **Combobox mutant that survived at first:** "blur keeps the typed text" passed because Radix's focus-outside also resets the text. I added an Alt+ArrowUp-then-blur test, which killed it.
- **Combobox (browser, 18 stories).** Each mutation failed the viewport stories:
  - 36px rows at mobile;
  - removing `-my-1` (end actions grow the field to 52px; the first run caught this real bug);
  - list not field-wide;
  - chips not wrapping.
- **Real bugs found by the first story run and fixed:**
  - field 52px instead of 44px;
  - content width read during the scale-in animation (now waits for `settled()`).
- **Combobox harness:** dropping the button reset from the end actions failed 6 Bootstrap tests (cursor, outline 5px auto, colour). The first two mutations I tried survived because the `.hz-root` base reset and the `focus:outline-none` guard already covered them.
- **SearchBar:**
  - Enter submits the form: RED.
  - Clear does not search: RED.
  - Landmark role removed: RED. My first attempt only edited the header comment; the retry was RED.
  - Viewport: 32px search button at mobile: RED.
  - Harness: dropping the button reset failed 6 of 7 tests.
- **SplitButton:**
  - Picking does not select: RED.
  - Group role removed: RED (3 tests).
  - Menu enabled while loading: RED.
  - Viewport: round inner corners failed all 4 viewport stories; a narrow menu target failed mobile.
  - Harness: the `hz:ms-0` guard mutation survived, which proved it redundant (see SplitButton above).
- **NumberInput:**
  - No clamping: RED (2 tests).
  - Reports out-of-range values: RED.
  - Increase never disables: RED.
  - No `aria-valuenow`: RED (2 tests).
  - Viewport: 24px steppers at mobile: RED.
- **EmailsField:**
  - Validator: RED (module missing), then GREEN with 17 tests.
  - No normalization: RED (3 tests).
  - Duplicates added: RED.
  - Paste ignores the limit: RED.
  - No error on invalid input: RED.
  - Viewport: field 48px at mobile: RED.
- **Filter:**
  - No commit on close: RED.
  - `clean` → multiple: RED.
  - "Commits unchanged" survived at first; I added an open/close-without-change assertion, which killed it.
  - Viewport: 32px pill at mobile: RED.
  - Harness: two focus-outline mutations survived. The pill's ring is guarded twice (`.hz-root` reset plus the `focus-visible` utilities), and I did not track down which layer holds. See concerns.

## Files

- **New:** `src/components/{Combobox,SearchBar,SplitButton,NumberInput,EmailsField,Filter}/{Name.tsx, Name.stories.tsx, Name.test.tsx, Name.test-d.ts, index.ts}`, `src/lib/email.ts`, `src/lib/email.test.ts`.
- **Changed:**
  - `src/primitives/fieldStyles.ts` and `index.ts` (`fieldInputElement`, `fieldInputText`), `src/components/Input/Input.tsx` (uses them; identical classes).
  - `src/components/Select/{Select.tsx, Select.stories.tsx, Select.test-d.ts}`: warnings now point to "Combobox multiple" instead of "planned".
  - `src/components/index.ts`, `src/index.ts`, `src/__tests__/architecture.test.ts`, `src/tokens/contrast.test.ts`.
  - `coexistence/main.tsx`, `coexistence/tests/components.spec.ts`, `coexistence/tests/forcedColors.spec.ts`.
  - `docs/migration/component-map.md`: Blocked migrations now records SelectV2/Select multi-select and search as unblocked by Combobox; the rows were removed and an explanatory paragraph added. Map rows and new sections were added for all six components.
  - `scripts/usage-map-curation.ts`, `docs/architecture/03-packaging-and-distribution.md`.

## Concerns

1. **Combobox at mobile is anchored, not a bottom sheet** (the brief asked for a sheet). The rationale is the on-screen keyboard; it is the same call as Select. Design needs to confirm it.
2. **No design for several looks** (no Figma):
   - Filter `clean` renders as `single` radios;
   - SplitButton `color="bright"` falls back to primary;
   - Filter pill states: accent at rest, primary ring on hover, primary fill when open or pressed;
   - steppers moved from stacked to side by side;
   - the EmailsField chip tone is primary soft.
3. **Behaviour changes from x-core:**
   - EmailsField shows an error for invalid text and splits pastes on whitespace;
   - NumberInput clamps on blur;
   - Filter's loading skeleton becomes a status message;
   - Combobox values are option-value strings: call sites that use objects need one `map`, and `renderOption` cards (customer360 SearchAutocomplete.tsx) are not supported.
4. **Harness RED is not shown for every probe.** I showed it for Combobox and SearchBar. For Filter, two focus-ring mutations survived and I did not investigate further. The pill's ring is double-guarded, but the reviewer may want that probe's focused state re-checked.
5. **Not measured:**
   - breakpoint edges (767/768 …) and 200% zoom for these components;
   - Combobox inside a Horizon Dialog or Drawer (only MUI dialogs);
   - inversion of the Filter count bubble on the open pill (CSS only; contrast is enforced, but no story asserts it).
6. **Combobox empty/loading state:** `aria-expanded` stays false while the popup shows only a status message. This is deliberate (no empty listbox), but differs from MUI.
7. **Tailwind's `in-*` variant emits selectors that do not start with `.hz\:`.** The prefix guard test caught it, and Filter uses `group-*` instead. Future components should do the same.
8. **Impeccable** stops at init without PRODUCT.md, as in earlier tasks. I applied its principles myself; the user still needs to run `/impeccable init` and then audit, polish and adapt, and review the visual baselines.

---

# Fix round 1 (review: spec pass, 3 Important + minors)

Status: **DONE_WITH_CONCERNS**. Every item is fixed, and each has RED evidence. Commits run from c9d6527 to b3ad224.

Final verification on b3ad224, all clean:

| Check | Result |
|---|---|
| `npx vitest run` | 90 files, **1649** tests pass |
| `npm run test:coexistence` | **408** pass, none skipped |
| `npm run typecheck`, `npm run lint` | clean |
| `npm run build`, `npm run build-storybook` | clean |

| SHA | Subject |
|---|---|
| 104617b | test(coexistence): measure mouse focus on every button-like control |
| 11b336e | fix(Combobox): measure it in Horizon dialogs; announce picks; clear by default; required multi |
| 81243b4 | fix(EmailsField): announce additions/removals; keep invalid pasted parts |
| 2b920b6 | fix(Filter): always-mounted status region; bubble ring in forced colors |
| 2c85f0c | fix(SplitButton): give the group its own accessible name |
| 4df8a81 | refactor(primitives): shared listItem row for Select, Combobox and DropdownMenu |
| 73d41ed | fix(Combobox): optionContent slot; record renderOption call sites as blocked |
| b3ad224 | docs(Combobox): note deferred Page Up/Down and second Escape |

## I1: Combobox in a Horizon Dialog and Drawer; pointer picks

I added a harness section, `ComboboxInModals` in `coexistence/main.tsx`: a Horizon Dialog and a Drawer, each holding a single and a multi Combobox over 40 options. The new spec `coexistence/tests/combobox.spec.ts` runs 12 tests (Dialog and Drawer × layered and unlayered builds, all with full Bootstrap + customer360 host CSS).

**Measured: everything works without a library change for the scroll lock.**

- **Accessibility tree:** the portaled listbox has no `aria-hidden` or `inert` ancestor, and is reachable by role with its name.
- **Scrolling under the dialog's react-remove-scroll lock:**
  - mouse wheel scrolls the 320px list (`scrollTop` rises);
  - a CDP touch gesture (`Input.synthesizeScrollGesture`, gesture source "touch") scrolls it further;
  - why it works: react-remove-scroll follows the React tree, and the portal is a React child of the dialog content.
  - Sensitivity RED: with the list made `overflow:hidden`, the scroll test fails (4/4).
  - A first mutation (stopping wheel propagation at the list in the capture phase) could not break it, because RemoveScroll's capture handler sits on an ancestor and runs first. That is recorded, not hidden.
- **Pointer picks:** a click on an option keeps the Dialog/Drawer open, keeps focus in the input, and announces "Company 12 selected" in the status region.
- **Escape:** ArrowDown reopens the list; Escape closes only the list; a second Escape closes the modal.
- **Multi-select chips:** picking keeps the list open; removing a chip by pointer keeps the modal open and is announced.
- **MUI dialog test:**
  - it now also picks with the pointer: the value is set, focus stays, the MUI dialog stays open;
  - it runs in both CSS load orders × both builds × plain MUI Dialog and `?mui=v2`: 8 tests, all pass.
- **Change found along the way:** the clear button is now on by default (M1) and reachable by Tab. The blur reset therefore moved from the input to a native `focusout` on the whole field: focus moving to the clear button no longer resets, leaving the field does. Tests were updated (Tab lands on Clear, a second Tab leaves the field and resets).

## I2: mouse (pointer) focus in the coexistence harness

New suite: "mouse focus: button-like controls show no ring and nothing from the host". For each control, the test presses it without clicking (mouse down on the control, move away, release), then reads outline style, width, colour, box-shadow, `:focus` and `:focus-visible`. The width and colour of a style-none outline are ignored, because they draw nothing. Controls covered:

- Button (6 variants), IconButton
- Chip action and Chip remove
- Alert dismiss
- Checkbox, Radio, Switch
- Select trigger, Input clear
- SearchBar search button
- Combobox chip remove
- EmailsField chip remove and clear all
- SplitButton main
- Filter pill and Filter toggle
- Popover trigger
- Toast dismiss (after showing a toast)

Focus-return cases after pointer-closed overlays:

- the SplitButton menu button after a pointer pick from its menu;
- the Filter pill after its panel is closed by a second click;
- the DropdownMenu trigger after a pointer pick.

Results:

- **Baseline:** in the unlayered build without host CSS, every control is focused, not `:focus-visible`, and has outline-style none.
- **Host CSS:** 6 tests (reboot, full bootstrap, full + customer360, × both load orders) assert the values are identical with and without the host CSS. All pass.
- **No real leak was found.** Every component already had `hz:focus:outline-none`, either directly or via the `.hz-root` reset.
- **Not covered:** the Combobox clear and toggle buttons, and the NumberInput steppers. They never take pointer focus (mousedown is prevented so focus stays in the input), as documented in the spec.
- **RED:** removing `hz:focus:outline-none` from the Filter pill now fails the suite. "Filter pill", "Filter pill, focus returned after a pointer close" and "Filter toggle" each show outline 5px auto `rgb(0, 95, 204)` from Bootstrap. This is the mutation that survived in the first round, now killed.

## I3: renderOption call sites in the map, plus an `optionContent` slot

- **Blocked migrations** has two new rows:
  - **SearchAutocomplete.jsx** (company search used by FilterComponentV2): interactive `renderOption` cards with their own onClick, matched-text highlight from `state.inputValue`, a 720px popper, identity by `_id`. Blocked on interactive content inside an option and a popup wider than the field. Proposed API: `optionContent` (now built) plus a `listWidth` prop (design decision).
  - **ScheduleGroups.jsx:84-112** (direct MUI Autocomplete): checkbox rows are built in to Combobox `multiple`. Its sort moves to pre-sorted `options` plus `filter`; create-on-Enter becomes `allowCustomValue` plus a value check at the call site. No library change is needed.
- **SearchBar section:** the wrong sentence about SearchAutocomplete.jsx is corrected. The curation note and the regenerated map region are updated too (`npm run usage-map`; the hand-written columns are kept).
- **New prop `optionContent(option, { selected, highlighted, inputValue })`:**
  - it replaces only the row content; `role="option"`, `aria-selected`, the id, `aria-activedescendant`, the check and picking stay Combobox's;
  - it is deliberately not named `renderOption`: MUI's `(props, option)` signature passed through from `.jsx` would break, so `renderOption` stays dropped with a warning pointing to `optionContent`;
  - tests: jsdom covers state, selection, highlight, the activedescendant id and pointer pick (RED: disabling the slot fails it); a `RichRows` story runs axe.

## Minors

- **M1 (Combobox clearable default):**
  - `clearable` now defaults to `true`, as MUI (`disableClearable` → `clearable={false}`). TSDoc and map are updated.
  - RED: default false fails 2 tests.
  - The layered known limit for `hz-combobox-multi` gains "width: changed", because a clear button is now present.
- **M2 (required on multiple):**
  - `required` with `multiple` is enforced through `setCustomValidity(requiredMessage)` on the input while nothing is selected.
  - Test: `form.checkValidity()` is false and `validationMessage` is set when empty; true after a pick. RED: removing the validity call fails it.
- **M3 (announce chip changes):**
  - Combobox: picks ("X selected", multi toggle-off "X removed") and removals (chip X, Backspace) go to the polite status region; typing clears the announcement. New props `selectedAnnouncement` and `removedAnnouncement`.
  - EmailsField: a new always-mounted `role="status"` announces "x added", "n added" (paste) and "x removed". Props `addedAnnouncement` and `removedAnnouncement`.
  - RED: each silenced path fails its test.
- **M4 (Filter status region):**
  - One always-mounted sr-only `role="status"` sits outside the panel and receives the loading/empty text. The visible messages in the panel are plain text.
  - Tests: the region exists empty before the panel opens and is the same node after "No options".
  - RED: putting the filled regions back inside the panel fails 2 tests.
- **M5 (EmailsField decisions):**
  - Enter on an **empty** input is not swallowed, so forms (including in dialogs) submit. The existing test covers it, and it is documented in TSDoc and the map.
  - Invalid parts of a pasted list now **stay in the input** with the error message; valid parts become chips.
  - Entries are split on `, ;` tabs and new lines. "Name <address>" stays whole; other entries also split on spaces.
  - RED: dropping the rejected parts fails the paste test.
- **M6 (shared list row):**
  - New `src/primitives/listItem.ts` (cva, variant `disabledBy: data | aria`) is used by Select, Combobox and DropdownMenu. Unit test added.
  - The existing row-height, text-size and highlight-colour story tests and the Select/DropdownMenu coexistence probes still pass unchanged.
  - Select options also gain the forced-colors Highlight outline on the highlighted row.
- **M9 (forced colors):**
  - New forced-colors test: SplitButton main and menu borders, Filter count and total bubbles, the highlighted Combobox row's outline, and the list border, in both builds.
  - The Filter bubbles had no boundary (the fill is dropped in forced colors). They now have a CanvasText ring. RED: removing it fails both builds.
- **M10 (SplitButton group name):**
  - The group name is `aria-label`, else "<visible label> actions" (new `groupSuffix` prop, translatable), so it no longer repeats the main button's name.
  - A ReactNode headline without `aria-label` warns in development.
  - RED: reverting to the plain label fails 2 tests.
- **M8 (deferred):** documented only, in the Combobox TSDoc: Page Up/Page Down and the second-Escape clear are not implemented.

## Concerns

- The Combobox stays anchored at mobile, per the ruling. This is recorded in the map Combobox section as a controller ruling flagged for design.
- I could not build a mutation that breaks the scroll lock through the React tree, because the ancestor capture handler runs first. The scroll assertion's sensitivity is shown with a non-scrollable list instead.
- Interactive rich rows (SearchAutocomplete cards) and a wider-than-field popup remain blocked: they need design, and the proposed API is `listWidth`.
- Deferred as instructed: M7 colours, breakpoint edges and 200% zoom.

---

# Fix round 2 (re-review: Clear Tab stop / Tab with an open list, plus minors a–f)

Commits: 050aef5, 58fa8e9, 8a08004 (on top of b3ad224).

## IMPORTANT: Clear button Tab stop; Tab from an open list

**Fix (050aef5).** Four behaviour changes in Combobox:

- **Clear is not a Tab stop.** It has `tabIndex={-1}`, like MUI's indicator, and is pointer-only, as the TSDoc now says.
- **Tab with the list open closes the list.** The handler is in `onKeyDown` and does not prevent default, so focus moves on to the next control after the combobox. Tab does not pick the highlighted option. This follows ARIA 1.2 (Tab closes the popup) and the component's existing rule that picking happens only on Enter or click (MUI `autoSelect` off). Before this fix, Shift+Tab from an open multi-select list to a chip left the list open, because the `focusout` handler ignores targets inside the field.
- **Keyboard clearing has a documented path.**
  - Escape with the list open closes it and restores the label.
  - Escape again, with the list closed, clears the text; for a single Combobox it also clears the value (APG; MUI `clearOnEscape`).
  - Escape with nothing to clear bubbles, so an enclosing dialog can close.
  - Backspace in an empty multi-select still removes the last chip.
- **Stale warning fixed.** The `disableClearable` warning now maps to `clearable={false}`.

**Tests (jsdom):**

- Tab from an open list (with an "After" button):
  - focus lands on After, not on Clear;
  - the listbox is gone and `aria-expanded` is false;
  - nothing was picked, and the label is restored;
  - Shift+Tab returns to the input;
  - Clear has `tabindex="-1"`.
- Shift+Tab from an open multi-select list to a chip closes the list.
- Escape twice on a single Combobox calls `onValueChange(null)`.
- Escape on a closed multi-select clears only the typed text and is not seen by an outer handler; a second Escape with nothing left bubbles.
- Clearing by pointer still works (existing test).

**RED (each mutation reverted):**

| Mutation | Result |
|---|---|
| Clear is a Tab stop again | 2 tests fail |
| Tab leaves the list open | the Shift+Tab chip test fails (forward Tab is also caught by `focusout`) |
| Escape never clears | 2 tests fail |

**Docs:** the TSDoc for `clearable` and for the component, the curation note, the map row and the Combobox section are corrected. They no longer give the unqualified "MUI parity" claim; they state that the button is not a Tab stop and that Escape clears.

## Minors

- **a. Stale warning:** fixed in 050aef5 (see above).
- **b. EmailsField paste wiped typed text (58fa8e9):**
  - a paste with only valid parts now keeps the text typed before it;
  - rejected parts are inserted at the caret (the selection is replaced), as a native paste would.
  - Test: "draft" plus a valid paste keeps "draft"; a caret at 2 with "e@f.com; oops" gives "droopsaft" and the alert.
  - RED: the old unconditional `setText` fails it.
- **c. EmailsField Clear all is now announced (58fa8e9):** "All emails removed" (`clearedAnnouncement`).
  - RED: removing the announcement fails the test.
- **d. Map, all `renderOption` call sites on an Autocomplete:** a fresh grep of customer360/client finds exactly three, all now under Blocked migrations:
  - `mui_containers/SearchPage/IL/components/CompanySearchCard/SearchAutocomplete.tsx:188-208` (x-core Autocomplete, interactive `OptionItem onClick`, minWidth 600px, search `popupIcon`): new row.
  - `mui_components/SearchAutocomplete.jsx`: a direct MUI import, now labelled as such; callers FilterComponent.jsx:84 and FilterComponentV2.tsx:81.
  - `ScheduleGroups.jsx`.

  UnileverForm.jsx and NewSourceModalBody.jsx contain similarly named local functions only; this is noted in the map.
- **e. Layered build under mouse focus (8a08004):** same probe and controls, asserted as measured.
  - **Full bootstrap.css alone:** every probed control (Buttons, IconButton, Chip action and remove, Alert dismiss, Checkbox, Radio, Switch, Select trigger, Input clear, SearchBar search, Combobox chip remove, EmailsField remove and clear all, SplitButton main and the menu after a pick, Filter pill and toggle, DropdownMenu trigger after a pick, Popover trigger, Toast dismiss) changes `outlineStyle: none -> auto`. The cause is Bootstrap's unlayered `button:focus { outline: 5px auto }`.
  - **Full bootstrap.css plus customer360 host CSS:** no change, because customer360's own unlayered `button:focus { outline: none }` hides the ring.
  - So the layered build is unsafe for mouse focus in any Bootstrap host that lacks that host rule. customer360 is protected only by its own reset, and still loses everything listed in LAYERED_FORMS_DIFF.
- **f. Scroll-lock spec (8a08004):**
  - The misleading comment now says "focus stayed in the input".
  - New test per modal × build (4): a negative control, a scrollable box appended to the same `.hz-root` portal container but outside the dialog's React tree, fixed on top. Under the wheel:
    - the box stays at `scrollTop` 0 (the lock is active);
    - the page's `scrollY` is unchanged;
    - the Combobox list still scrolls.
  - Control of the control: after Escape (list) and Escape (modal), the same wheel scrolls the box. This proves the assertion can fail.

## Verification

All six checks were run after the last commit, 8a08004:

| Check | Result |
|---|---|
| `npx vitest run` | **1655 / 1655 pass** (90 files) |
| `npm run typecheck`, `npm run lint` | clean |
| `npm run build`, `npm run build-storybook` | clean |
| `npm run test:coexistence` | **414 / 414 pass** in one full run |

Earlier runs in this round failed intermittently on unrelated tests. Instrumenting `measure()` showed the cause: Chromium aborts requests to the localhost dev server with `net::ERR_NETWORK_CHANGED` while the host's network is changing, so the page never renders. One vitest run had 3 test files fail the same way while all their tests passed. Each affected test passed on rerun (`--last-failed`: 9/9), and the final full runs above are clean.

`playwright.config.ts` now sets `expect.timeout` to 15s, because the suite of 400+ tests runs slowly under full load. I did not add retries.

## Concerns

- Coexistence is sensitive to host network changes (`ERR_NETWORK_CHANGED` aborts localhost requests). This is environmental: the last full run is green.
- The Combobox mobile ruling stands (anchored, flagged for design). M7 colours, breakpoint edges and 200% zoom stay deferred.

---

# Fix round 3 (re-review: Escape on a closed list; verification items)

Commits: 0d432a5 fix(Combobox): Escape on a closed list bubbles; clearOnEscape is opt-in · aa089bd test: fix two load-sensitive unit tests; harden the coexistence run.

## IMPORTANT: Escape on a closed list lost the value inside dialogs

**Fix (0d432a5).**

- New prop `clearOnEscape?: boolean`, **default false**. It is MUI's prop and maps 1:1.
- Without it, Escape on a closed list does nothing in Combobox and bubbles, so an enclosing Dialog or Drawer closes and the value is kept.
- Escape on an open list is unchanged: it closes the list and restores the label.
- With `clearOnEscape`, Escape on a closed list clears the text (and, for a single Combobox, the value) and stops there.
- Keyboard clear path, as MUI: deleting all the text of a single Combobox clears its value immediately (`onValueChange(null)`). It does not with `clearable={false}`, mirroring MUI's `disableClearable`.
- The TSDoc for `clearable`, `clearOnEscape` and the component, the map row and section, and the curation note are all updated.

**Tests (jsdom, 33 pass):**

- Default: Escape with the list open closes it and the outer handler does not see it. A second Escape reaches an ancestor keydown handler, the value is unchanged and the input still shows "France".
- Deleting all the text clears the value. With `clearable={false}`, deleting keeps the value and blur restores the label.
- `clearOnEscape` single: Escape clears the value and does not bubble; a second Escape bubbles. `clearOnEscape` multiple: Escape clears the typed text only.
- **Inside a Horizon Dialog** (controlled value): Escape closes the list and the dialog stays; a second Escape closes the dialog; `onValueChange` is never called and the kept value is "fr".
- The old "Escape twice clears" tests were rewritten. The "restores the label" test now replaces the text with a triple-click selection, because emptying it now clears by design.

**RED (each mutation reverted):**

| Mutation | Fails |
|---|---|
| `clearOnEscape` defaults to true (the round-2 behaviour) | the default-bubbles test |
| Emptying the text keeps the value | the keyboard-clear-path test |
| Ignore `clearable={false}` | the disableClearable test |

**Coexistence:** `coexistence/tests/combobox.spec.ts` passes 16/16. This includes "Escape closes only the list, a second Escape closes the modal" in Dialog and Drawer, both builds.

## Verification items

**(1) `npx vitest run`.**

| Run | Files | Tests | Failures | Duration |
|---|---|---|---|---|
| 1 (before fix) | 90/90 | 1658 | none | ~54s |
| 2 (before fix) | 88/90 | 1656 + 1 skipped | 2 files | ~54s |
| 3 (before fix) | 89/90 | 1657 + 1 skipped | 1 file | ~54s |
| after fix | 90/90 | 1658 | none | 53.4s |
| after fix | 90/90 | 1658 | none | 54.2s |

The two failing files were:

- `src/__tests__/architecture.test.ts` › public API: "Hook timed out in 30000ms" (failed in runs 2 and 3).
  - Cause: the hook's cold `import('../index')`, which transforms every component and the Phosphor icons. It took 1.2s alone and more than 30s while the unit and browser projects ran in parallel on a machine whose load average was 10–80 during this session.
  - This is not a race: the import only waits for the transform. The hook timeout is now 120s, with the measurement documented beside it. This is the only timeout that was raised.
- `src/components/Toast/Toast.test.tsx` › "the timer pauses while the pointer is over the toasts" (failed in run 2).
  - Cause: a real race in the test. A 100ms auto-dismiss timer started when the toast appeared, and the hover came after `waitFor`. Under load the toast closed first: `toasts()[0]` was undefined.
  - Radix does not start a toast paused (I checked: hovering first fails the test), so the fix is a 1000ms duration with a 1300ms hovered wait, which leaves room for the hover.

**(2) `npm run test:coexistence` to completion.**

| Run | Command | Result | Duration |
|---|---|---|---|
| alternate port | `COEX_PORT=4175 npx playwright test` | 414 passed, 0 failed, exit 0 | 277s (4.6m) |
| default port | `npm run test:coexistence` | 414 passed, 0 failed, exit 0 | 280s (4.6m) |

**Hang/slowness findings:**

- **Orphaned dev server.** Mid-session, a dev server from one of my interrupted runs was left on port 4173 (the playwright parent was gone; ppid 1, the npm exec wrapper). With `strictPort` and `reuseExistingServer: false`, any new run fails immediately ("http://localhost:4173 is already used"). I was not allowed to kill it.
  - Fix: `COEX_PORT` makes the port configurable in both `playwright.config.ts` and `coexistence/vite.config.ts`. The orphan was gone by the default-port run above.
- **`net::ERR_NETWORK_CHANGED`** (round 2). Chromium aborted localhost requests while the host network changed, so the first probe never rendered (15s expect timeouts). These are fast failures, not hangs.
- **Hard limits added** so a hang fails fast: `timeout: 30_000` per test (the mouse-focus suites set 120s explicitly) and `globalTimeout: 15 min` for the whole run. Full runs take about 4–5 minutes. No retries were added.
- I found no spec that hangs. Individual specs finish in seconds; the longest is the mouse-focus suite at about 25s per test.

**Other checks:** `npm run typecheck`, `npm run lint`, `npm run build` and `npm run build-storybook` all exit 0.

## Concerns

- The machine load during this session (load average up to 80) makes timing-sensitive tests fragile. The two unit flakes are fixed (one a real race), and coexistence is green twice in full runs.
- The rulings stand: the Combobox list stays anchored at mobile, flagged for design; M7 colours, breakpoint edges and 200% zoom stay deferred.
