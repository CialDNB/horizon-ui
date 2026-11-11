# Task 9 report: component port template and migration map

Status: DONE. Commit `docs: migration map and usage report` (see `git log`; amended once to force-add the node_modules fixture).

## Files
- `scripts/usage-report.ts` (TS compiler API; `collectUsage`, `buildReport`, `groupFamilies`, `loadOwners`, CLI `<dir> [--x-core <dir>] [--json]`)
- `scripts/__tests__/usage-report.test.ts` + `scripts/__tests__/fixtures/usage/*`
- `docs/migration/component-map.md` (all 149 x-core components; Button/Icons/Illustrations sections preserved), `docs/migration/porting-checklist.md`
- Plan: appended "Usage-ordered batch lists (from Task 9)" under Tasks 10-13 only
- `tsconfig.json` (exclude fixtures), `eslint.config.js` (ignore fixtures)

## TDD
RED: test file written first; vitest failed to load `../usage-report` (module missing). GREEN: 8/8 after implementation. Final: eslint clean, `npm run typecheck` clean, `vitest run --project unit` 14 files / 131 tests pass.

## Decisions
- Count unit = imported binding (named, default, namespace, re-export, dynamic). Names from the `components` barrel are mapped to the owning folder with `--x-core` (checker over x-core's barrel), so types/hooks/enums (`ColumnDataType`, `ChipColor`, `useDialog`) land on the owning component. Deep paths use the first segment after `components/` (`inputs/X` -> X; `shared/*` goes to the non-component table).
- Prefix check is boundary-safe: `@cialdnb/x-core-mcp` is not counted.
- Not counted: JSDoc `import("...")` type references in comments (2 in customer360). Barrel namespace/dynamic/`export *` go to the non-component table by specifier.
- Family rule: `Foo`, `FooV2`, `Foov2` (Radiov2) parsed by regex on names (not on source). Drawer exception: Drawer -> superseded (NavigationDrawer), DrawerV2 -> NavigationDrawer todo, DrawerV3 -> Drawer todo. In the map DrawerV3 is its own family so counts are not merged with the nav menu.
- Status `skip` + note `unused-in-customer360 ... Recommend skip porting unless requested` for unused latest versions; unused-but-transitive (via `LayoutV2`) stay `todo`.
- API differences column holds "Planned:" notes for the used components, real differences are recorded at port time (only Button has them now).
- Script has no npm script alias (run with `npx tsx`); the map documents the command.

## Data (customer360/client, x-core 2.2.30)
- Top families (all versions): Typography 294, Button 149 (Button 75 + ButtonV2 74), Table 75, Chip 73, Card 50, CircularProgress 49, Dialog 44, TextField 43 (+TextInput 10), Select 33, TooltipV2 26, Checkbox 20, Alert 18, Badge 17, InsightsCard 13, AreaChart 12, Avatar 11, LabelColorActionsPopover 11.
- 149 components; 58 have no direct imports (most charts/legends/maps, Breadcrumbs, AppBar/Drawer family, which are used only through `LayoutV2`).
- Superseded versions are heavily used: Button v1 75 vs V2 74, Card 36 vs 14, Dialog 27 vs 17, Select 29 vs 4, Checkbox 17 vs 3.
- Plan omissions with real usage: Table 75, CircularProgress 49 (Spinner), Autocomplete 9, LabelColorActionsPopover 11, PhoneInput 7, EmailsField 6, Filter 5, SplitButton 5, InsightsCard 13, Timeline 11, Divider 8, LinearProgress 2. Grid 8 maps to Tailwind (`no-equivalent`).
- Non-component imports: `@cialdnb/x-core/icons` 168 (75 files; 62 use unsuffixed Phosphor names), root `@cialdnb/x-core` 54 (all default = MUI theme into AppThemeProvider, no named root imports), `/theme` 14 (createXCoreTheme, themeHorizon), `/theme/tokens/*` 23, `/theme/global-palette` 4, `/illustrations` 4, `/utils/emailValidation` 2, `shared/chartsLegendMensurable` 8.
- Consumers: only customer360/client (2.2.30) and il-acl-client (^2.2.22) depend on x-core. il-acl-client also uses Breadcrumbs 6, PasswordField 5, InputCompany 3, SearchBar 3, FilterInput 2, Dialog/useDialog hook 12.

## Recommendations for Tasks 10-13 (controller to rule)
1. Task 10: add Spinner (CircularProgress, 49) and Separator (Divider, 8), Progress (2); Skeleton and Link have no x-core source/usage, Skeleton is deferrable.
2. Task 11: add Combobox (Autocomplete 9), SearchBar, SplitButton, Filter, EmailsField as follow-on; PhoneInput needs a dependency decision; ask customer360 whether LabelColorActionsPopover (11) stays local; ConfirmDialog preset (3).
3. Task 12: add Table at the front (75 imports, needs its own design and small-screen pattern; decide if DataGrid is covered), Timeline, InsightsCard/LevelCard; port NavigationDrawer + AppBar + Layout as one unit since customer360 consumes it only via `LayoutV2`; drop Breadcrumbs (0 usage) unless il-acl-client is in scope.
4. Task 13: only AreaChart, StackedBarChart, VerticalBarChart, pickers, FileDropUploader are live; ~30 chart/legend/map variants are unused; no flow diagrams exist.
5. Task 20: needs answers for the theme default export (54 files), `@cialdnb/x-core/theme` factory, global-palette and token imports, and the `useDialog`-style hooks; none have a horizon-ui equivalent yet.

## Fix round (review findings)

Commit `fix(usage-report): separate type-only imports and rank by runtime usage`.

1. Type-only separation: `UsageRecord.typeOnly` from `import type`, `import { type X }`, `export type {..} from`, plus names x-core exports only as types (`loadOwners` now returns `{ owners, types }`, the type set computed with the checker across all x-core component modules; a name that is a value anywhere is treated as runtime). Rows: `count`/`files` are runtime, `typeCount`/`typeFiles`/`typeImports` are type-only; sorted by runtime files, then runtime imports. Shape documented in the script header; markdown has `runtime imports | runtime files | type-only imports | family runtime files`.
2. Map regeneration is now reproducible: `npm run usage-map -- /Users/simonmor/dnb/customer360/client` (new `scripts/usage-map.ts`) rewrites the region between `usage:start`/`usage:end` in `component-map.md` (summary, top 25, porting order, batch tables, non-component imports, follow-ups) and formats it with prettier. Hand-written columns (batch, horizon name, API differences, forced status) moved to `scripts/usage-map-curation.ts`. `npm run usage-report` added. Plan subsections under Tasks 10-13 were rewritten by hand with the new numbers (not generated).
3. Layout/Drawer: superseded rows now carry notes that the successor must export `LayoutEnum` (5 files) and `drawerWidth`/`drawerCollapsedWidth`, and the non-component section has a "Follow-ups: shared enums and constants" table.
4. Tests (11 + 1 new, 135 unit tests total): `.d.ts` skipped, `import { type X }` / `import type` counted separately, CLI `--json` parsed via a subprocess, real `loadOwners` over `fixtures/xcore`, region replacement idempotence.

Ranking changes (runtime files, families combined): Typography 291, Button 144, Chip 57, Card 49, CircularProgress 49, Dialog 44, TextField 43, Table 42 (was 49 files / 75 imports, 29 of its imports are type-only), Select 26 (was 33; 7 type-only), Tooltip 26. Chip now outranks Table and Card; Table is 8th. Badge 17 -> 16, AreaChart 12 -> 9, VerticalBarChart 6 -> 5, LevelCard 5 -> 3, RatingBar 5 -> 3, Timeline 11 -> 4 (6 type-only), DataGrid 3 -> 1, LabelColorActionsPopover 11 -> 4 runtime files (7 type-only). `CustomTooltip` and `NotificationsDropdown(V2)` have zero runtime imports (types only). Recommendation unchanged: Table is still scheduled first in Batch 3 because it is the most-used composite and needs the most design.
