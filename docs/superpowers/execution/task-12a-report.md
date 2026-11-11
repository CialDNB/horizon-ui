# Task 12a report: Table (+ Pagination)

Status: DONE_WITH_CONCERNS. Branch `feat/foundation`.

Commits (no Co-Authored-By, not pushed):
- `60acec7` feat(Pagination): add Pagination
- `07078d0` feat(Table): add Table and composable table parts

Verification (last runs): `npx vitest run` 94 files / 1819 tests pass (unit + storybook browser projects); `npm run test:coexistence` 440/440 (full run on the Table commit before two small amends; the Table/Pagination/mouse-focus/forced-colors subset, 49 tests, re-run green after the amends); an earlier full run had 1 load-sensitive failure (`Tooltip against Bootstrap ... layered (Bootstrap first)`) that passed 12/12 on a targeted rerun and in the next full run; `npm run typecheck`, `npx eslint .`, `npm run build`, `npm run build-storybook` clean. Pagination commit: vitest 1715, coexistence 423/423.

Impeccable: not invoked. `PRODUCT.md` is still absent in horizon-ui (checked with `ls`), and the skill stops at `init` without it, as recorded for Tasks 6 to 11c. I applied its principles myself (token-only colour, restraint: one accent surface for state, the type scale, 4px spacing, no decorative motion, non-colour cues for state). The user still needs to run `/impeccable init`, then `audit`/`polish`/`adapt`, and review visual baselines.

## Sources read

- x-core (read-only): `Table/*` (Table.tsx, Table.types.ts, TableBody, TableCheckbox, TableSortIcon, Header/Column + Checkbox, Row + Row/Collapse, Cell + RenderFactory + 15 cell types, Footer, ColumnSettings, hooks useColumnSettings/useTableScroll), `PaginationV2/*` (PaginationV2, RowsPerPageV2, TotalItems, types), `Pagination/*` (v1).
- customer360 usage: 47 files render `<Table` with x-core imports; prop counts and column-key counts are in the Table section of `docs/migration/component-map.md`. `Table.types` deep imports: 26 files (19 `Column`, 6 `ColumnDataType`, 6 `TableCellData`, 4 `Order`, 1 `TableProps`; one is a `jest.mock` path). Direct Pagination call sites: 3 (DocumentCustomTablePagination.tsx v1, UploadsDetails.jsx v1, DocumentCardsGrid.tsx V2); every other use goes through `Table` (`MuiPaginationProps` in 23 call sites).

## Table API decision (by evidence)

customer360 drives every table through x-core's data contract (`columns` 37, `data` 40, `render` in 127 column definitions, built-in `type` in 30), and 26 files import the types. So the main API is a **data-driven `Table`** that keeps the contract closely enough to migrate mechanically: same prop names where the behaviour is the same, the same type names exported from the package root (`Column`, `TableCellData`, `Order`, `ColumnDataType`, `RowOptions`), the same value shapes for built-in cell types, the same `onPageChange(page, currentPage)` / `onRowClick(id, event)` / `onRequestSort(property, order)` signatures. It is built on **composable parts** (shadcn style): `TableRoot`, `TableHeader`, `TableBody`, `TableFooter`, `TableRow`, `TableHead`, `TableCell`, `TableCaption`, exported for custom layouts (the data table uses them, and so does the `Composition` story).

- `ColumnDataType` is a const object plus a type of the same name (same keys and string values as the x-core enum), so `ColumnDataType.chip` and `'chip'` both work.
- Generics: `Column<Row>`, `TableCellData<Row>`, `TableProps<Row>`, default row `Record<string, unknown>` (x-core rows were `any`; `any` is banned here). `Table` is a generic forwardRef (`<Table<Company> ... />`).
- `onRowClick?(id, event?)` is declared with method syntax and `MouseEvent<unknown> | KeyboardEvent<unknown>` so customer360's `(id, event?: React.MouseEvent<unknown>) => ...` handlers (DecisionTableV2.tsx:68) still type-check; `event.ctrlKey` (DecisionRequestsTable.jsx:150) works for Ctrl+click and Ctrl+Enter.
- Legacy props dropped with a one-shot warning (`omitLegacyProps`), per the 10b/10c ruling (not mapped): `loader` (-> `loading`), `MuiTableProps` (-> `stickyHeader`/`className`), `MuiPaginationProps` (-> `paginationProps`), `headerBackgroundColor`, `hasScrollView`, `showNavigationButtonLeft/Right`, `showColumnSettings`, `columnSettingsStorageKey`, `onColumnSettingsChange`, `selectedRowsPerPage`, `disableSearch`, `sx`. `density`/`responsive` go through `resolveOption`.
- Expandable rows: x-core has them (`rowOptions.collapseData`, `expanded`), so they are ported (4 customer360 files use them).

### Behaviour

- Semantics: real `<table>`; `<caption>` (optional prop `caption`, `hideCaption` for sr-only) names the table and the scroll region; headers `scope="col"`; the first visible column without `hideBelow` is a row header (`<th scope="row">`, normal weight; `Column.rowHeader` overrides).
- Sorting: with `onRequestSort`, each non-`disableSort` header contains a real `<button>` (label + Phosphor arrow, `CaretUpDown` when unsorted: shape is the non-colour cue); the sorted header cell has `aria-sort`; a sort change is announced once ("Sorted by Employees, descending") in an always-mounted polite status region. The sorted column toggles; **another column starts `asc`** (x-core flipped the current order for any column).
- Selection (`selectable`): a checkbox column (horizon `Checkbox`, 44px target at mobile), row checkboxes named "Select <row header>" (`aria-labelledby` = hidden "Select" + row header id), select-all checked/`indeterminate` from `selectedItems` on the page (disabled rows excluded), `aria-selected` on rows, `disableSelectAll` keeps the column with an sr-only "Selection" header. The column only exists with `selectable` (x-core rendered an empty checkbox column unless `disableSelectAll`; 32 call sites pass `disableSelectAll`, most only to hide it).
- Row click: pointer anywhere except on interactive descendants (`a[href]`, buttons, inputs, `[role=checkbox]` ...); clickable rows are focusable (`tabIndex=0`) and fire on Enter/Space, with a focus ring inside the scroller (x-core rows had `role="checkbox"` and `tabIndex=-1`, no keyboard path). `disableRowSelect` rows are not clickable.
- Details: a per-row toggle (ghost `IconButton`, 44px at mobile, `aria-expanded`, `aria-controls`, named "Details <row header>") opens a details row with `collapseData` and the row's `hideBelow` columns as `dl`/`dt`/`dd`.
- States: `loading` (skeleton rows `aria-hidden`, `aria-busy` on the table, "Loading" announced, Pagination `disabled`), `emptyComponent` (default "No results"; announced once when rows disappear; the visual block is not itself a live region, to avoid double announcements), `error` (new; `role="alert"` row).
- Pagination: rendered below when `!disablePagination`, `tableActions` or `paginationProps.showRowsPerPage` (as x-core); `paginationProps` is spread last; its landmark is named "Pagination: <caption>" so several tables on a page do not collide (axe `landmark-unique` caught this). Page changes scroll the table into view only if its top is above the viewport.
- Footer: `footerRow` cells in a `<tfoot>` row (semibold).

## Responsive strategy

`responsive` prop, default `scroll` (customer360 tables are mostly wide data tables: 8+ columns, chips, avatars):

| | mobile (<768) | tablet (768) | laptop (1280) | desktop (1920) |
| --- | --- | --- | --- | --- |
| `scroll` | grid scrolls sideways inside a focusable `region` named by the caption; edge shadows (start/end, mirrored under RTL; the start shadow begins after sticky cells); selection column + row header sticky; 44px sort buttons/checkboxes/toggles/info buttons | full grid (scrolls with shadows if wider); fine pointer: 24px sort buttons, 20px checkbox targets, 32px toggles | as tablet | as laptop |
| `stack` | each row is a bordered card of label/value pairs (`data-label` via `::before`, `content: attr(data-label)`), row header as the card title; sortable headers become a wrapping bar of 44px sort pills, other headers sr-only; explicit ARIA table roles keep semantics under `display: block/grid` | grid | grid | grid |
| `hideBelow: 'tablet'` | hidden, listed in Details | shown | shown | shown |
| `hideBelow: 'laptop'` | hidden, in Details | hidden, in Details | shown | shown |

The region is focusable whenever the area scrolls on either axis (found by the Dialog test: a `maxBlockSize` table that only scrolled vertically was not focusable). `stickyHeader` sticks inside the scroll area (set `maxBlockSize`), as MUI's did inside TableContainer. No page-level horizontal overflow at 320px (story assertion in a 320px column).

Pagination: below tablet it collapses to previous, "Page 2 of 12", next (44px); from tablet, range text, rows-per-page, first, previous, numbered pages with ellipses (MUI `usePagination` algorithm, `siblingCount` 2, `boundaryCount` 1 as x-core), next, last.

## Pagination decisions and API differences

- `nav` landmark (`aria-label` "Pagination", translatable via `labels`), `ul`/`li`, page **buttons** (x-core calls back; no links, so no anchorGuard), `aria-current="page"`, `aria-label` "Page n" (contains the visible number). Edge buttons are `aria-disabled` (via IconButton's blocked click) and keep focus, instead of natively disabled buttons that drop focus to `body`.
- Page change announced once (polite status, "Page 3 of 12"), not on mount.
- `page` required (controlled, 1-based, clamped); `count` = items (V2); `pageCount` for v1 call sites (v1 `count` was pages); `onChange(event, page)` -> `onPageChange(page)`; `showRowsPerPageOptions` -> `rowsPerPageOptions`; `shouldShow` -> `showPages`; `isTablePagination`, MUI look props dropped with a warning. New: `disabled`, `labels`. Arrows mirror under RTL (`rtl:[&_svg]:-scale-x-100`, measured `scale: -1 1`). Rows per page uses horizon `Select`. Range text and indicator use tabular figures.
- Exported helper `paginationItems(page, pageCount, siblingCount, boundaryCount)` (tested against MUI's output).

## Visual design (no Figma)

Header `neutral-subtle` with `neutral-strong` label/sm text and a `control-border` separator (the meaningful boundary, 3:1); row dividers and stacked card borders `border` (decorative, not 3:1, see contrast note); rows `background`; zebra = 30% `muted` mixed into `background` in sRGB; hover = 50% `accent` mix with text switched to `accent-foreground`; selected = `accent` with `accent-foreground` text and a 4px `primary` inline-start bar on the first cell (x-core 5px primary border); compact rows 38px with 14px text (x-core 38px/12px), comfortable 52px with 16px text; numeric columns end-aligned with tabular figures; truncation with ellipsis and `title`. Surfaces are painted on cells (opaque), so sticky cells hide what scrolls under them; `border-separate` keeps per-cell borders on sticky cells.

Built-in cell types (customer360 uses chip 10, status 8, date 8, avatar 6, email 5, progress 4, titleSubtitle 3, priority 1): all ported, reusing Chip, Badge, AvatarGroup, Progress; x-core palette names map to tones, others neutral. `date` renders "Jan 05 2001" as `<time>` (x-core's grey two-size date chip not reproduced); `email` shows the first address chip + "+N" (with sr text); `user`, `rating`, `link`, `label` (unused in customer360) fall back to text with a warning.

## Coexistence measurements

Harness: a full data Table (`hz-table`: caption, sortable headers, info tooltip, row headers, selection, selected and clickable rows, an open details row, footer, pagination) and a Pagination (`hz-pagination`), plus a tall Table in a Horizon Dialog (`maxBlockSize` 200, sticky header) and in a Drawer.

- Unlayered build: **unchanged** by bootstrap-reboot.css, full bootstrap.css and full + customer360 host CSS, both load orders. Table probe: wrapper, table, caption, column header, sort button (+ keyboard-focused), select-all checkbox, row header, cell, numeric cell, selected-row bar cell, selected cell, details toggle, details cell, footer cell; props = FIELD_PROPS + borderCollapse, borderSpacing, captionSide, textAlign, paddingBottom, borderBottom width/colour, borderInlineStart width/colour, whiteSpace, position, fontVariantNumeric. Pagination probe: nav, ul, li, page button, current page, focused page button, previous, next, range `p`, rows-per-page trigger; props = FIELD_PROPS + listStyleType, paddingBottom, textAlign, fontVariantNumeric.
- Real finding fixed: Bootstrap's `body { text-align: left }` reached Pagination by inheritance (`textAlign: start -> left`, wrong under RTL): Pagination and the Table wrapper/table/caption set `text-start` explicitly.
- Layered build (known limit, asserted as measured, sizes excluded): Table: `border-collapse: separate -> collapse` on every part; caption `padding-top 0 -> 12px`, colour `#0F172A -> #6C757D`, `caption-side top -> bottom`, `text-align start -> left`; sort buttons lose the -4px inline margins and radius; checkbox and details toggle squared; focused sort button loses the 2px ring. Pagination: `nav display flex -> block` (reboot `nav { display: block }`), buttons squared, focused page ring lost, range `p` gains 16px bottom margin, Select trigger squared. customer360 must use `styles.unlayered.css` (as for every component).
- Mouse focus (pointer probe, both builds, all host modes): Pagination page button and next, Table sort button, row checkbox, details toggle and clickable row: no ring, nothing from the host. Layered + full Bootstrap: every button gets Bootstrap's auto ring (known limit); the clickable row (a `tr`) does not (no Bootstrap rule for it).
- Real hover (Playwright pointer, unlayered + full Bootstrap + host, and layered): the hovered row paints the 50% accent mix and `accent-foreground` text.
- Forced colors (both builds): Pagination current page keeps a `Highlight` fill (`forced-color-adjust: none`); Table selected bar solid 4px and visible, unselected bar equals its Canvas cell, header separator solid 1px, focused row outlined. Real finding fixed: forced colors turned the transparent 4px bar into CanvasText on **every** row (alpha is not kept), so every row looked selected; now `Canvas` at rest, `Highlight` when selected.
- Dialog/Drawer (both builds): a tall table in a Horizon Dialog scrolls in its own area by wheel under the scroll lock, the page does not scroll, the sticky header stays at the area's top, Escape (from Close) closes; in a Drawer a 40-row table scrolls the drawer body, the page stays. `?mui=v2` not applicable (no overlay of its own; Pagination's Select and the header info Tooltip follow the existing rule: inside an MUI dialog they need an inner `HorizonProvider`).
- Never uses Bootstrap's unprefixed `.table` classes (all classes `hz:`; prefix guard test covers both builds).

## Contrast (WCAG; all pairs in `src/tokens/contrast.test.ts`, mixes composited with `over()`)

| pair | min | cial | dnb | il |
|---|---|---|---|---|
| Table cell text (`foreground` on background) | 4.5:1 | 17.10 | 4.56 | 17.10 |
| Table secondary text / stacked label (`muted-foreground`) | 4.5:1 | 7.26 | 7.26 | 4.56 |
| Table header text (`neutral-strong` on `neutral-subtle`) | 4.5:1 | 9.45 | 9.45 | 9.45 |
| Table selected row text (`accent-foreground` on `accent`) | 4.5:1 | 10.09 | 8.20 | 8.20 |
| Table zebra text (`foreground` on muted 30% mix) | 4.5:1 | 16.91 | 4.51 | 16.91 |
| Table zebra secondary text (`muted-foreground`) | 4.5:1 | 7.18 | 7.18 | 4.51 |
| Table hover text (`accent-foreground` on accent 50% mix) | 4.5:1 | 11.12 | 10.30 | 10.30 |
| Table error (`destructive-strong`) | 4.5:1 | 5.65 | 5.65 | 11.48 |
| Pagination page number (`foreground`) | 4.5:1 | 17.10 | 4.56 | 17.10 |
| Pagination current page (`primary-foreground` on `primary`) | 4.5:1 | 6.17 | 5.74 | 5.74 |
| Pagination current page hover (on `primary-hover`) | 4.5:1 | 9.42 | 7.50 | 7.50 |
| Pagination hover (`accent-foreground` on `accent`) | 4.5:1 | 10.09 | 8.20 | 8.20 |
| Selected row bar (`primary` on `accent`) | 3:1 | 4.90 | 4.25 | 4.25 |
| Header separator (`control-border` on `neutral-subtle`) | 3:1 | 4.34 | 4.34 | 4.34 |
| Header separator (`control-border` on background) | 3:1 | 4.56 | 4.56 | 4.56 |
| Focus ring on a selected row (`ring` on `accent`) | 3:1 | 4.90 | 4.25 | 4.25 |
| Focus ring on a hovered row (`ring` on accent mix) | 3:1 | 5.40 | 5.34 | 5.34 |
| Current page fill (`primary` on background) | 3:1 | 5.91 | 6.58 | 6.58 |

Why the text switches on tinted rows: dnb `foreground` and il `muted-foreground` are both #64748B (4.56:1 on background) and fall below 4.5:1 on every tint (4.34 on `muted`, 2.95 on `accent`). A 50% `muted` zebra fails (dnb 4.47; mutation-checked), so zebra is 30% (4.51, thin margin). The sort button's hover keeps `neutral-strong` (an earlier `foreground` hover was 4.34:1 on the header in dnb; caught in self-review). Row dividers and card borders (`border`, 1.2:1) are decorative: rows are identified by alignment and content, so WCAG 1.4.11 does not apply; the meaningful boundaries (header separator, selected bar, focus) are 3:1.

## TDD evidence

- Pagination: tests written first; RED = module missing (transform error, 0 tests); GREEN 17/17 (one wrong expectation of mine fixed against MUI's algorithm). Mutations killed (unit): `aria-current` removed (3 fail), edge `aria-disabled` removed (1), announcement guard removed (1), `disabled` guard removed (1). Viewport/story mutations killed: page items always visible (1), RTL mirror removed (1), fine-pointer 32px size removed (3), mobile indicator always visible (3).
- Table: **the implementation was written before `Table.test.tsx`** (the design needed the parts in place); RED evidence is by mutation. Unit mutations killed (11/11): sort toggle rule, interactive-descendant click guard (2), indeterminate state, `aria-selected`, sort announcement, empty announcement, `aria-expanded`, `onPageChange` current page, default row header (10), `aria-sort`, Enter/Space keyboard path, stack roles. Story/viewport mutations: 9 killed (hideBelow tablet class, fine-pointer sort height (3), start-edge shadow, focusable region, zebra surface, selected bar, stacked cell grid, mobile sticky row header); 1 survivor is equivalent (removing `max-tablet:block` on body rows: the stacked `tbody` is a flex column, which blockifies its rows). Coexistence mutations killed: `border-separate` removed (6 fail), caption `caption-top` removed (6 fail). Contrast mutation: zebra at 50% fails dnb and il (2 fail).
- Real bugs found by the new tests and fixed before commit: duplicate Pagination landmarks (axe), forced-colors bar on every row, vertical-only scroll area not focusable, inherited `text-align: left`.

## Performance

`Performance` story (browser, React development mode in Storybook, load average ~7): 500 rows x 8 columns, first commit measured 820-940ms with chip/badge/date columns and ~500ms with plain text columns; the budget is 1500ms (catches a regression to quadratic work). jsdom guard: 500 rows under 6000ms. Each Chip creates its own ResizeObserver for truncation (500 per such column); a shared observer in Chip would help. Virtualization is noted as a future option, with no dependency added.

## Files

New: `src/components/Pagination/{Pagination.tsx, Pagination.stories.tsx, Pagination.test.tsx, Pagination.test-d.ts, index.ts}`; `src/components/Table/{Table.tsx, TablePrimitives.tsx, tableCells.tsx, Table.types.ts, Table.stories.tsx, Table.test.tsx, Table.test-d.ts, index.ts}`; `coexistence/tests/table.spec.ts`.
Changed: `src/components/index.ts`, `src/__tests__/architecture.test.ts` (API snapshot: `Pagination`, `paginationItems`, `ColumnDataType`, `Table`, `TableBody`, `TableCaption`, `TableCell`, `TableFooter`, `TableHead`, `TableHeader`, `TableRoot`, `TableRow`), `src/tokens/contrast.test.ts`, `coexistence/main.tsx`, `coexistence/tests/components.spec.ts`, `coexistence/tests/forcedColors.spec.ts`, `scripts/usage-map-curation.ts`, `docs/migration/component-map.md` (regenerated rows: PaginationV2 `done`, Pagination v1 superseded note `count` -> `pageCount`, Table `partial`; new Table and Pagination sections; Table.types follow-up table outside the generated region; Blocked migrations row for column settings).

Dependencies: none added (Phosphor icons already a dependency; Radix via existing Checkbox/Select/Tooltip).

## Concerns

1. Column settings (`showColumnSettings`, `columnSettingsStorageKey`, `onColumnSettingsChange`; 2 call sites: ReportOrdersTable.jsx:426, DecisionTableV2.tsx:208) are not ported, so Table is `partial`. Proposed follow-up: a column-settings part on Popover + Checkbox list with move up/down buttons (no drag dependency).
2. Design calls without Figma: header fill and separator, 30% zebra (dnb margin 4.51:1), 50% accent hover, selected bar, compact 38px/14px rows, date cell as text, email "+N", stacked cards and sort pills, sort icons. Needs design review and the Impeccable pass.
3. Behaviour changes for migration: a new sort column starts `asc`; no checkbox column without `selectable`; legacy props drop with a warning rather than map (`loader`, `MuiPaginationProps`, `MuiTableProps`); TypeScript call sites with untyped `render(row)` need a row type (x-core `any`); `Column` no longer accepts MUI cell props (`sx` 8, `padding` 15, `backgroundColor` 13, `justifyContent` 20 occurrences).
4. Performance in development mode is ~0.8-0.9s for 500 rich rows; Chip's per-instance ResizeObserver is a cost; virtualization deferred.
5. Untested: breakpoint edges (767/768, 1279/1280, 1919/1920), 200% zoom, Table inside an MUI dialog, the details `dl/dt/dd` against Bootstrap (the harness runs at 1280px, where the hidden-column list is not shown; its classes restate margins and `dt` weight).
6. Pagination breakpoints follow the viewport, not the container: in a 320px container at tablet width the numbered list overflows (seen while testing; the stacked-table story asserts 320px only at mobile). Container queries would fix it.
7. When a Dialog opens with a Table, Radix may put initial focus on the first header info button, which shows its tooltip; Escape then closes the tooltip first (existing Dialog/Tooltip behaviour).
8. Clickable rows are focusable `tr`s activated by Enter/Space (keyboard equivalent of x-core's pointer-only rows); a link in the row header would be the more conventional pattern, but would change every call site.
9. The coexistence suite remains load-sensitive (one Tooltip flake in one of three full runs).

---

# Fix round 1 (review of 60acec7..07078d0)

Commits (no Co-Authored-By, not pushed):
- `5754612` fix(Table): accept customer360 row typings in Column and TableCellData
- `17d80b7` fix(Table): export DateCell; map every deep Table/Pagination import
- `db61985` fix(Pagination): wrap the page list in a narrow container; export paginationVariants
- `f90c0e2` fix(Table): measure sticky reach on resize; start shadow after sticky cells; export tableVariants
- `a5a4fda` fix(Chip): share one ResizeObserver across chips; Table perf as a warmed ratio
- `a8d35f2` test(Table): MUI dialog scenario and mobile row-details probe

Verification (final, after all commits; output to log files, exit codes checked): `npm run typecheck` 0, `npm run lint` 0, `npx vitest run` 95 files / 1825 tests pass, `npm run build` 0, `npm run test:coexistence` 444 passed (0 failed, 0 flaky), `npm run build-storybook` 0.

## Per item

**F1 typings.** RED: added to `Table.test-d.ts` customer360's patterns (untyped `Column[]` with `render: (row: DecisionRow) => ...` and `dataTestId: (row: DecisionRow) => ...`; `TableCellData[]` with an interface-typed `rowData`): `tsc` failed with TS2322 x2 ("TableRowData is missing ... id, status") and "Index signature for type 'string' is missing". Fix: `TableRowData = object` (default row type), `render?(row: Row): ReactNode` and `dataTestId?(row: Row): string` as method signatures (bivariant). GREEN: `tsc` clean, and the existing negative case (`Column<Row>` render reading a missing key) still needs its `@ts-expect-error`; new negative: `rowData: 'x'` is rejected. Map guidance (Table.types follow-up) corrected: untyped `Column[]` keeps working with annotated renders; an unannotated `render: (row) => row.x` on a plain `Column[]` sees `object` and needs the annotation or `Column<MyRow>`.

**F2 deep imports.** Grep of customer360/client for `@cialdnb/x-core/components/(Table|Pagination|PaginationV2)/` found (besides `Table.types`): default `Table` from `Table/Table` (ScheduleManagementTable.jsx:9, PortfolioOverviewTable.jsx:2) and from `components/Table` (ReportOrdersTable.jsx:3, DecisionRequestsTable.jsx:8, DecisionTableV2.tsx:4); `TableHeaderColumn` from `Table/Header/Column` (ComplianceAlerts.jsx:16, RiskLevelByGroupsTable.tsx:2, RiskLevel.jsx:2: header-looking cells inside `footerRow`); `DateCell` from `Table/Cell/Types/date.index` (DuplicatesInternalTable.jsx:6); default v1 `Pagination` (DocumentCustomTablePagination.tsx:2, UploadsDetails.jsx:10). All are mapped in a new "Table follow-up: deep imports" table in component-map.md (`TableHeaderColumn` -> `TableHead` with `scope`, `onSort`/`sortDirection`/`adornment`, `align`). `DateCell` is exported with x-core's props (`row`, `column.id`) plus `formatCellDate` (RED: `tableCells.test.tsx` failed on the missing exports; GREEN 4/4). API snapshot: `DateCell`, `formatCellDate`.

**I2 Pagination in a narrow container.** RED: story `NarrowContainerLaptop` (320px box at the laptop viewport). A first version asserting `box.scrollWidth <= 320` passed although the list was 448px wide: with `justify-end` the overflow runs past the inline start, which `scrollWidth` does not count (the buttons were clipped off the left edge). The assertion now checks the list width and that every button lies inside the box: RED `expected 448 to be <= 320`. Fix: `ul` gets `flex-wrap justify-end min-w-0`, `nav` gets `min-w-0`; GREEN (Pagination 31/31). ADR 0001: new section "Breakpoints follow the viewport, not the container": the list wraps rather than collapsing; container-query collapse (`hz:@container` + `--container-*` tokens) is a future option and a deviation from the viewport-breakpoint standard.

**I3 sort behaviour.** Recorded in component-map.md (Table section row and the curated Table row): a click on another column requests `asc`; x-core requested the flip of the current order, so with `order="asc"` its first click on a new column sorted descending. The 16 files that pass `onRequestSort` are listed (ComplianceAlertsByCompanyTable, DecisionRequestsTable, DecisionTableV2, DocumentDetailsTable(+Legacy), DocumentsByGroupCard(+Legacy), DocumentsCompanyTable(+Legacy), FinancialRiskLevelTableByCompany(+Legacy), ReportOrdersTable, RiskLevelByGroupsTable, RiskLevelDialogNew, ScheduleManagementTable, SegmentRequestNew). The coordinator's count was 17 handlers; my grep finds 16 files rendering `<Table` with `onRequestSort`. Horizon behaviour kept.

**I4 Table in an MUI dialog.** Harness `TableInMuiDialog`: paginated Table (`maxBlockSize` 180, rows-per-page 10/25) under an inner `HorizonProvider` in an MUI Dialog with `?mui=v2` (x-core DialogV2 shape). Spec in `coexistence/tests/table.spec.ts`, both builds: the scroller is a `region`, its `aria-labelledby` points at the caption, it takes keyboard focus inside MUI's FocusTrap and PageDown scrolls it while focus stays; the rows-per-page Select opens (the option is visible above the dialog), picking 25 renders 25 rows, the dialog stays open, and the landmark is named "Pagination: MUI dialog companies". Accessible names are not computed in this mode: x-core DialogV2 `disablePortal` makes MUI aria-hide `#root`, which contains the dialog. That is the existing customer360 defect documented in docs/05, so the test checks the wiring and uses CSS locators. Pass 2/2.

**M1.** `tableVariants` (TablePrimitives) and `paginationVariants` (page button, `current`) are exported as `cn(cva(...))`, with `TableVariantOptions` and `PaginationVariantOptions`. API snapshot updated.

**M2 sticky width.** The dependency-less layout effect is gone. `useScrollEdges` measures the sticky reach in its ResizeObserver callback; resizes include crossing `tablet`, and scroll events read positions only. Self-review found a real bug while doing this: the cells that are sticky only at mobile (`max-tablet:sticky`) had no `data-sticky`, so the start shadow was drawn over the sticky row header. RED: a ScrollMobile assertion that the start shadow begins at the row header's end failed with `expected -236 to be 0`. Summing widths was off by 4px (the selection cell's 4px bar border), and measuring the natural position was off by 60px (the non-sticky Details column sits between the selection column and the row header). The reach is now each sticky cell's `inset-inline-start` plus its width, taking the maximum. GREEN.

**M3 performance and Chip.** RED: a new Chip test "many chips share one ResizeObserver and do not read layout on mount" failed with 20 observers created. Fix: one module-level ResizeObserver with a WeakMap from element to callback, recreated only if the global constructor changes (tests stub it). The observer's initial callback is the first measurement, so mounting reads no `scrollWidth`. The existing truncation test now delivers entries, as a real observer does. Chip unit and stories pass. Table perf story: a warm-up (both column sets, 50 rows), then 500 plain and 500 rich rows rendered three times alternating; assertion: fastest rich < 5x fastest plain. The ratio is only meaningful warmed and alternating. Measured: unwarmed plain-then-rich gave 185/150ms, rich-then-plain gave 40/310ms; in a full story run a warm plain table dropped to ~50ms (ratio 2.55, so a 2.5x threshold failed). Warmed, alternating minima: plain 37-38ms, rich 124-125ms, ratio ~3.3 across 5 runs. The 5x threshold leaves headroom and does not depend on load. The original report's 820-940ms figure was a cold single render with 500 observers.

**M4 local dates.** `<time dateTime>` is built from local parts (`localIsoDate`). Test sets `TZ=Asia/Jerusalem`: '2026-03-01' -> `datetime="2026-03-01"`. Mutation back to `toISOString().slice(0,10)`: 2 tests fail.

**M5.** `onRowClick` TSDoc names a link in the row header (a column `render` returning `Link`) as the preferred pattern, and `onRowClick` as the x-core-parity or pointer shortcut.

**M6.** `max-tablet:hidden` in `hideBelowClass` is not redundant. With `responsive="stack"` the cells get `max-tablet:grid`/`block`, which would override `hidden` below tablet. A comment now says so, and a StackMobile assertion checks that the `hideBelow: 'tablet'` cell is `display: none` in the card. Mutation (class removed): 1 fails.

**M7 dl/dt/dd.** The harness table has a `hideBelow: 'tablet'` column (`region`), so the open details row lists it at mobile. Spec: at 375px, the unlayered build's `dl`/`dt`/`dd` (display, margins, padding, type, colour) are unchanged by full Bootstrap + customer360 host CSS in both load orders; `dt` stays 600 and `dd` margin-bottom 0. Mutation (`dd` without `m-0`): 2 fail.

## Remaining concerns

- Deferred by the coordinator: container-query collapse, the double live region on page change, breakpoint edges and 200% zoom, Figma-dependent design calls.
- Inside x-core DialogV2 (`disablePortal`) the whole dialog, Horizon content included, is hidden from assistive technology by MUI. This existing customer360 defect is unchanged here.
- Column settings (2 call sites) are still not ported, so Table stays `partial`.
