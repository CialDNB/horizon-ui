# Component map (x-core -> horizon-ui)

Generated from `scripts/usage-report.ts` run against `/Users/simonmor/dnb/customer360/client` (x-core 2.2.30), with `--x-core /Users/simonmor/dnb/x-core` so that names imported from the `components` barrel (types, hooks, enums) are attributed to their owning component folder. Regenerate the counts with:

```
npx tsx scripts/usage-report.ts /Users/simonmor/dnb/customer360/client --x-core /Users/simonmor/dnb/x-core
```

An import count is one imported binding (a named import, default import, namespace import, re-export or dynamic `import()`), so `import { Card, Chip } from '@cialdnb/x-core/components'` counts once for Card and once for Chip. `files` is the number of distinct files importing the component. Deep paths (`components/Table/Table.types`, `components/Dialog/useDialog`) count for the owning component. JSDoc `import("...")` type references in comments (2 in customer360: Drawer and AppBarActions types) are not counted.

Statuses: `todo`, `in-progress`, `done`, `superseded` (lower version of a family, never ported), `no-equivalent`, `skip` (not ported unless requested). Rows marked `unused-in-customer360` have no direct imports in the app. **Direct imports undercount composites**: `LayoutV2` (1 import) renders AppBarV2, DrawerV2, AppBarActionsV2, HelpDropdown, NotificationsDropdownV2, ProductsDropdownV2 and UserPopover, so those are `todo` with a note rather than `skip`.

## Summary

- 149 x-core components (74 version families imported directly by customer360; 58 components have no direct import).
- Status: 79 todo, 1 done, 33 superseded, 1 no-equivalent, 35 skip.
- **Superseded versions are still heavily used by customer360**: `Button` 75 vs `ButtonV2` 74, `Card` 36 vs `CardV2` 14, `Dialog` 27 vs `DialogV2` 17, `Select` 29 vs `SelectV2` 4, `Checkbox` 17 vs `CheckboxV2` 3. Migration of those call sites targets the single horizon-ui name.
- Not in the plan lists but heavily used: Typography (Batch 1 in plan), `Table` (75), `CircularProgress` (49), `TextField`/`TextInput` (53), `InsightsCard` (13), `Chip` (73), `Autocomplete` (9), `LabelColorActionsPopover` (11), `PhoneInput` (7), `EmailsField` (6), `Filter` (5), `SplitButton` (5), `Grid` (8). See Tasks 10-12 "Usage-ordered batch lists".

### Top 25 by family import count (all versions of a family combined)

| # | family | horizon-ui | batch | imports (all versions) | files (largest member) |
|---|---|---|---|---|---|
| 1 | `Typography` | `Typography` | 1 | 294 | 292 |
| 2 | `Button` + `ButtonV2` | `Button` | 1 | 149 | 75 |
| 3 | `Table` | `Table` | 3 | 75 | 49 |
| 4 | `Chip` | `Chip` | 1 | 73 | 64 |
| 5 | `Card` + `CardV2` | `Card` | 3 | 50 | 35 |
| 6 | `CircularProgress` | `Spinner` | 1 | 49 | 49 |
| 7 | `Dialog` + `DialogV2` | `Dialog` | 2 | 44 | 27 |
| 8 | `TextField` | `Input` | 2 | 43 | 43 |
| 9 | `Select` + `SelectV2` | `Select` | 2 | 33 | 25 |
| 10 | `TooltipV2` + `Tooltip` | `Tooltip` | 2 | 26 | 26 |
| 11 | `Checkbox` + `CheckboxV2` | `Checkbox` | 2 | 20 | 17 |
| 12 | `Alert` | `Alert` | 1 | 18 | 18 |
| 13 | `Badge` | `Badge` | 1 | 17 | 17 |
| 14 | `InsightsCard` | `InsightsCard` | 3 | 13 | 13 |
| 15 | `AreaChartV2` + `AreaChart` | `AreaChart` | 4 | 12 | 9 |
| 16 | `Avatar` | `Avatar` | 1 | 11 | 11 |
| 17 | `LabelColorActionsPopover` | `LabelColorActionsPopover` | 2 | 11 | 8 |
| 18 | `TextInput` | `Input` | 2 | 10 | 10 |
| 19 | `DateRangePicker` + `DateRangePickerV2` | `DateRangePicker` | 4 | 10 | 5 |
| 20 | `Autocomplete` | `Combobox` | 2 | 9 | 9 |
| 21 | `DrawerV3` | `Drawer` | 2 | 9 | 9 |
| 22 | `TimelineV2` + `Timeline` | `Timeline` | 3 | 9 | 5 |
| 23 | `Radio` + `Radiov2` | `RadioGroup` | 2 | 9 | 6 |
| 24 | `Divider` | `Separator` | 1 | 8 | 8 |
| 25 | `Grid` | `Grid` | 3 | 8 | 8 |

### Porting order recommendation

1. Finish Batch 1 around real usage: Typography, Chip, Spinner (CircularProgress), Alert, Badge, Avatar, IconButton, Progress, Separator. Button is done.
2. Batch 2 inputs next because every form screen needs them together: Input (TextField/TextInput) with FormField, Select, Checkbox, RadioGroup, Switch, Autocomplete (Combobox), then overlays Dialog, Tooltip, Popover, Drawer, Toast, then SplitButton and Filter (need DropdownMenu/Popover).
3. Batch 3 starts with Table (75 imports, most-used composite after Typography) and Card (+ InsightsCard, LevelCard), then Tabs, Accordion, Timeline, Pagination, then NavigationDrawer + AppBar + Layout as one unit (customer360 consumes it through `LayoutV2`).
4. Batch 4 only on request: charts (AreaChart 12, StackedBarChart 8, VerticalBarChart 6) and pickers (DatePicker 7, DateRangePicker 10) are the live ones; most chart, legend and map variants have no imports.
5. Skip everything marked `skip` and `unused-in-customer360` unless a consumer asks (il-acl-client uses Breadcrumbs, PasswordField, InputCompany, FilterInput, DualDataCard, SearchBar, Timeline that customer360 does not).

## Batch 1: Foundations

Ordered by family import count (descending); versions of one family are adjacent.

| x-core component | horizon-ui component | status | API differences | customer360 import count | files |
|---|---|---|---|---|---|
| `Typography` | `Typography` | todo | Planned: slash-notation `variant` keys kept; `component` becomes `as`; MUI `sx`/`color` props dropped (semantic text utilities). | 294 | 292 |
| `Button` | `Button` | superseded | Lower version of the family; not ported. Migrate call sites to `Button` (from ButtonV2). | 75 | 75 |
| `ButtonV2` | `Button` | done | Done in Task 6, see Button section below. | 74 | 73 |
| `Chip` | `Chip` | todo | Planned: `ChipColor`/`color` become `variant` (info/success/warning/error/neutral); `onDelete` renders a labelled remove button. | 73 | 64 |
| `CircularProgress` | `Spinner` | todo | Not in the plan. Add to Batch 1 as `Spinner` (role status, accessible name, reduced-motion safe). 49 imports. | 49 | 49 |
| `Alert` | `Alert` | todo | Planned: role alert; `severity` becomes `variant`. | 18 | 18 |
| `Badge` | `Badge` | todo | Planned: `BadgeColor` becomes `variant`. | 17 | 17 |
| `Avatar` | `Avatar` | todo | Planned: Radix Avatar with image fallback to initials. | 11 | 11 |
| `Divider` | `Separator` | todo | Planned: shadcn `Separator` (orientation, decorative). | 8 | 8 |
| `BadgeAI` | `Badge` | todo | Becomes a Badge `ai` variant if design keeps it; confirm with design. | 5 | 4 |
| `IconButton` | `IconButton` | todo | Planned: `aria-label` required in the type. | 3 | 3 |
| `AIVerifiedBadge` | `Badge` | todo | Becomes a Badge variant or composition; confirm with design. | 2 | 2 |
| `LinearProgress` | `Progress` | todo | Not in the plan. Add to Batch 1 as `Progress` (Radix Progress). | 2 | 2 |
| `AIButton` | `Button` | todo | Becomes a Button variant or composition; confirm with design (1 import). | 1 | 1 |
| `AvatarGroup` | `Avatar` | todo | Composition of Avatar (`Avatar.Group`); 1 import. | 1 | 1 |
| `CountryFlag` | `CountryFlag` | todo | 1 import; decide flag asset source at port time. | 1 | 1 |
| `ActionIconButton` | `IconButton` | todo | unused-in-customer360 (direct imports); Merge into IconButton (only used inside AppBar). | 0 | 0 |
| `ChipGroup` | `Chip` (not ported) | skip | unused-in-customer360. Compose Chips in a flex wrap. Recommend skip porting unless requested. | 0 | 0 |
| `StatusIcon` | `StatusIcon` (not ported) | skip | unused-in-customer360. Recommend skip porting unless requested. | 0 | 0 |

## Batch 2: Forms and overlays

Ordered by family import count (descending); versions of one family are adjacent.

| x-core component | horizon-ui component | status | API differences | customer360 import count | files |
|---|---|---|---|---|---|
| `Dialog` | `Dialog` | superseded | Lower version of the family; not ported. Migrate call sites to `Dialog`. | 27 | 27 |
| `DialogV2` | `Dialog` | todo | Planned: compound `Dialog.*`; full-screen at mobile. | 17 | 17 |
| `TextField` | `Input` | todo | Planned: `Input` + `FormField` (label/description/error); MUI `helperText`/`error` move to FormField. | 43 | 43 |
| `Select` | `Select` | superseded | Lower version of the family; not ported. Migrate call sites to `Select`. | 29 | 25 |
| `SelectV2` | `Select` | todo | Planned: Radix Select; options as children, not an `options` array; bottom sheet on mobile. | 4 | 4 |
| `Tooltip` | `Tooltip` | superseded | Lower version of the family; not ported (unused-in-customer360). | 0 | 0 |
| `TooltipV2` | `Tooltip` | todo | Planned: Radix Tooltip; hover-only content gets a focus/touch equivalent. | 26 | 26 |
| `Checkbox` | `Checkbox` | superseded | Lower version of the family; not ported. Migrate call sites to `Checkbox`. | 17 | 17 |
| `CheckboxV2` | `Checkbox` | todo | Planned: Radix Checkbox, `onCheckedChange`. | 3 | 3 |
| `LabelColorActionsPopover` | `LabelColorActionsPopover` | todo | Not in the plan. 11 imports in 8 files; app-specific. Ask customer360 whether to keep it local; port after Popover. | 11 | 8 |
| `TextInput` | `Input` | todo | Planned: same as TextField. | 10 | 10 |
| `Autocomplete` | `Combobox` | todo | Not in the plan. 9 imports; Command + Popover combobox. Also covers CountryAutoComplete. | 9 | 9 |
| `DrawerV3` | `Drawer` | todo | Planned: content side panel; `direction` becomes logical `side`. See plan Task 11 interface. | 9 | 9 |
| `Radio` | `RadioGroup` | superseded | Lower version of the family; not ported. Migrate call sites to `RadioGroup`. | 6 | 6 |
| `Radiov2` | `RadioGroup` | todo | Planned: Radiov2 is the item of `RadioGroup` (Radix RadioGroup). | 3 | 3 |
| `PhoneInput` | `PhoneInput` | todo | Not in the plan. 7 imports; needs a dependency decision (react-phone-number-input) with a bundle-size justification. | 7 | 7 |
| `Popover` | `Popover` | superseded | Lower version of the family; not ported (unused-in-customer360). | 0 | 0 |
| `PopoverV2` | `Popover` | todo | Planned: Radix Popover; portal inside `.hz-root`. | 7 | 7 |
| `EmailsField` | `EmailsField` | superseded | Lower version of the family; not ported. Migrate call sites to `EmailsField`. | 5 | 5 |
| `EmailsFieldV2` | `EmailsField` | todo | Not in the plan. 6 imports; tag input composed from Input and Chip. | 1 | 1 |
| `Switch` | `Switch` | superseded | Lower version of the family; not ported. Migrate call sites to `Switch`. | 3 | 3 |
| `SwitchV2` | `Switch` | todo | Planned: Radix Switch, `onCheckedChange`. | 3 | 3 |
| `Filter` | `Filter` | todo | Not in the plan. 5 imports; composite of Popover, Checkbox and Button. Port after those. | 5 | 5 |
| `SplitButton` | `SplitButton` | todo | Not in the plan. 5 imports; Button + DropdownMenu composition. | 5 | 4 |
| `RadioGroup` | `RadioGroup` | todo | Planned: same component as above. | 4 | 4 |
| `SearchBar` | `SearchBar` | superseded | Lower version of the family; not ported (unused-in-customer360). | 0 | 0 |
| `SearchBarV2` | `SearchBar` | todo | Planned: input with search icon and clear button. | 4 | 4 |
| `ConfirmationDialog` | `ConfirmDialog` | todo | Not in the plan. 3 imports; preset composition of Dialog. | 3 | 3 |
| `CountryAutoComplete` | `Combobox` | todo | Composition of Combobox; 2 imports. | 2 | 2 |
| `NumberInput` | `NumberInput` | superseded | Lower version of the family; not ported. Migrate call sites to `NumberInput`. | 1 | 1 |
| `NumberInputV2` | `NumberInput` | todo | Not in the plan. 1 import; port only if still needed (otherwise Input type=number). | 1 | 1 |
| `Snackbar` | `Toast` | todo | Planned: role status, auto-dismiss. | 2 | 1 |
| `TextArea` | `Textarea` | todo | Planned: native textarea props. | 2 | 2 |
| `AppendInput` | `Input` (not ported) | skip | unused-in-customer360. Input with an adornment slot if requested. Recommend skip porting unless requested. | 0 | 0 |
| `BackdropLoader` | `BackdropLoader` | superseded | Lower version of the family; not ported (unused-in-customer360). | 0 | 0 |
| `BackdropLoaderV2` | `BackdropLoader` (not ported) | skip | unused-in-customer360. Spinner + Dialog overlay if requested. Recommend skip porting unless requested. | 0 | 0 |
| `CountryInput` | `CountryInput` | superseded | Lower version of the family; not ported (unused-in-customer360). | 0 | 0 |
| `CountryInputV2` | `CountryInput` (not ported) | skip | unused-in-customer360. Recommend skip porting unless requested. | 0 | 0 |
| `FilterInput` | `Filter` (not ported) | skip | unused-in-customer360. In customer360 (0 imports); il-acl-client uses it 2x. Recommend skip porting unless requested. | 0 | 0 |
| `InputCompany` | `InputCompany` (not ported) | skip | unused-in-customer360. Recommend skip porting unless requested. | 0 | 0 |
| `PasswordField` | `Input` (not ported) | skip | unused-in-customer360. In customer360 (0 imports); il-acl-client uses it 5x. Input + show/hide button if requested. Recommend skip porting unless requested. | 0 | 0 |
| `Popper` | `Popover` (not ported) | skip | unused-in-customer360. Radix handles positioning. Recommend skip porting unless requested. | 0 | 0 |

## Batch 3: Navigation, layout, data display

Ordered by family import count (descending); versions of one family are adjacent.

| x-core component | horizon-ui component | status | API differences | customer360 import count | files |
|---|---|---|---|---|---|
| `Table` | `Table` | todo | Not in the plan. Highest-use composite (75 imports, 49 files). Needs its own design: `Column`/`TableColumnSettings`/`Order` API, sorting, cell data types. Small-screen pattern required. | 75 | 49 |
| `Card` | `Card` | superseded | Lower version of the family; not ported. Migrate call sites to `Card`. | 36 | 35 |
| `CardV2` | `Card` | todo | Planned: compound `Card.*`; `CardVariant` becomes a cva variant. | 14 | 14 |
| `InsightsCard` | `InsightsCard` | todo | Not in the plan. 13 imports (default import); app-level composite on Card. | 13 | 13 |
| `Timeline` | `Timeline` | superseded | Lower version of the family; not ported (unused-in-customer360). | 0 | 0 |
| `TimelineV2` | `Timeline` | todo | 9 imports (TimelineV2); not in the plan, port with Batch 3. | 9 | 5 |
| `Accordion` | `Accordion` | superseded | Lower version of the family; not ported. Migrate call sites to `Accordion`. | 7 | 7 |
| `AccordionV2` | `Accordion` | todo | Planned: Radix Accordion; `aria-expanded`. | 1 | 1 |
| `Grid` | (none) | no-equivalent | no-equivalent: use Tailwind grid/flex utilities; `PageContainer` is decided with Layout. | 8 | 8 |
| `Layout` | `Layout` | superseded | Lower version of the family; not ported. Migrate call sites to `Layout`. | 5 | 5 |
| `LayoutV2` | `Layout` | todo | Used via `LayoutV2` (1 import) which composes AppBarV2, DrawerV2, dropdowns and UserPopover. Port with NavigationDrawer and AppBar. | 1 | 1 |
| `EvaluationAccordion` | `EvaluationAccordion` | todo | 5 imports; composition on Accordion. | 5 | 5 |
| `LevelCard` | `LevelCard` | todo | 5 imports; composition on Card. | 5 | 3 |
| `RatingBar` | `RatingBar` | superseded | Lower version of the family; not ported (unused-in-customer360). | 0 | 0 |
| `RatingBarV2` | `RatingBar` | todo | 5 imports (V2); small data-display component. | 5 | 5 |
| `AppBarActions` | `AppBarActions` | superseded | Lower version of the family; not ported (unused-in-customer360). | 0 | 0 |
| `AppBarActionsV2` | `AppBarActions` | superseded | Lower version of the family; not ported (unused-in-customer360). | 0 | 0 |
| `AppBarActionsV3` | `AppBarActions` | todo | V3 is imported directly (4 imports, 1 file: useHeaderActions); V2 is used inside LayoutV2. | 4 | 1 |
| `Pagination` | `Pagination` | superseded | Lower version of the family; not ported. Migrate call sites to `Pagination`. | 2 | 2 |
| `PaginationV2` | `Pagination` | todo | Planned: previous/next + indicator at mobile. | 1 | 1 |
| `CardElevation` | `Card` | todo | Merge into Card variant. | 2 | 2 |
| `Drawer` | `NavigationDrawer` | superseded | Lower version of the family; not ported. Migrate call sites to `NavigationDrawer`. | 2 | 1 |
| `DrawerV2` | `NavigationDrawer` | todo | unused-in-customer360 (direct imports); Navigation menu; used transitively through LayoutV2. Preserve isExternal/highlighted behaviours (plan Task 12). | 0 | 0 |
| `NotificationsDropdown` | `NotificationsDropdown` | superseded | Lower version of the family; not ported. Migrate call sites to `NotificationsDropdown`. | 1 | 1 |
| `NotificationsDropdownV2` | `NotificationsDropdown` | todo | 1 direct import (V2); also used in LayoutV2. | 1 | 1 |
| `SectionDescriptionWithIcon` | `SectionDescriptionWithIcon` | todo | 2 imports; small composition. | 2 | 2 |
| `TimeLineHistory` | `Timeline` | todo | 2 imports; fold into Timeline if the design allows. | 2 | 1 |
| `StatisticCard` | `StatisticCard` | todo | 1 import; composition on Card. | 1 | 1 |
| `TabsV2` | `Tabs` | todo | Planned: Radix Tabs; scrollable at mobile. | 1 | 1 |
| `AppBar` | `AppBar` | superseded | Lower version of the family; not ported (unused-in-customer360). | 0 | 0 |
| `AppBarV2` | `AppBar` | todo | unused-in-customer360 (direct imports); Used transitively through LayoutV2 (AppBarV2). | 0 | 0 |
| `AppBarDropdown` | `AppBarDropdown` | superseded | Lower version of the family; not ported (unused-in-customer360). | 0 | 0 |
| `AppBarDropdownV2` | `AppBarDropdown` | todo | unused-in-customer360 (direct imports); Used transitively through LayoutV2. | 0 | 0 |
| `AppBarHelp` | `AppBarHelp` | superseded | Lower version of the family; not ported (unused-in-customer360). | 0 | 0 |
| `AppBarHelpV2` | `AppBarHelp` | todo | unused-in-customer360 (direct imports); Used transitively through LayoutV2. | 0 | 0 |
| `Breadcrumbs` | `Breadcrumbs` | superseded | Lower version of the family; not ported (unused-in-customer360). | 0 | 0 |
| `BreadcrumbsV2` | `Breadcrumbs` (not ported) | skip | unused-in-customer360. Used by il-acl-client (6 imports). The plan lists it; defer unless a consumer requests it. Recommend skip porting unless requested. | 0 | 0 |
| `CardListView` | `CardListView` (not ported) | skip | unused-in-customer360. Recommend skip porting unless requested. | 0 | 0 |
| `DrawerContent` | `NavigationDrawer` (not ported) | skip | unused-in-customer360. Internal part of DrawerV2; ported inside NavigationDrawer. Recommend skip porting unless requested. | 0 | 0 |
| `DrawerToggleButton` | `NavigationDrawer` (not ported) | skip | unused-in-customer360. Internal part of DrawerV2; ported inside NavigationDrawer. Recommend skip porting unless requested. | 0 | 0 |
| `DualDataCard` | `DualDataCard` (not ported) | skip | unused-in-customer360. In customer360 (0 imports); il-acl-client 1. Recommend skip porting unless requested. | 0 | 0 |
| `HelpDropdown` | `HelpDropdown` | todo | unused-in-customer360 (direct imports); Used transitively through LayoutV2. | 0 | 0 |
| `MobileBottomNav` | `MobileBottomNav` (not ported) | skip | unused-in-customer360. Recommend skip porting unless requested. | 0 | 0 |
| `MobileBottomNavItem` | `MobileBottomNav` (not ported) | skip | unused-in-customer360. Recommend skip porting unless requested. | 0 | 0 |
| `ProductsDropdown` | `ProductsDropdown` | superseded | Lower version of the family; not ported (unused-in-customer360). | 0 | 0 |
| `ProductsDropdownV2` | `ProductsDropdown` | todo | unused-in-customer360 (direct imports); Used transitively through LayoutV2 (V2). | 0 | 0 |
| `ScrollView` | `ScrollView` (not ported) | skip | unused-in-customer360. Use overflow utilities. Recommend skip porting unless requested. | 0 | 0 |
| `TabNavigatorDrawer` | `Tabs` (not ported) | skip | unused-in-customer360. Recommend skip porting unless requested. | 0 | 0 |
| `TabSection` | `Tabs` (not ported) | skip | unused-in-customer360. Recommend skip porting unless requested. | 0 | 0 |
| `TabsScrollSpyContainer` | `Tabs` (not ported) | skip | unused-in-customer360. Recommend skip porting unless requested. | 0 | 0 |
| `TopBarNav` | `TopBarNav` (not ported) | skip | unused-in-customer360. Recommend skip porting unless requested. | 0 | 0 |
| `TopBarNavItem` | `TopBarNav` (not ported) | skip | unused-in-customer360. Recommend skip porting unless requested. | 0 | 0 |
| `UserPopover` | `UserPopover` | todo | unused-in-customer360 (direct imports); Used transitively through LayoutV2. | 0 | 0 |

## Batch 4: Heavy components (Task 13, deferred)

Ordered by family import count (descending); versions of one family are adjacent.

| x-core component | horizon-ui component | status | API differences | customer360 import count | files |
|---|---|---|---|---|---|
| `AreaChart` | `AreaChart` | superseded | Lower version of the family; not ported. Migrate call sites to `AreaChart`. | 1 | 1 |
| `AreaChartV2` | `AreaChart` | todo | 12 imports (V2 mostly). Chart library decision (Recharts) per Task 13. | 11 | 9 |
| `DateRangePicker` | `DateRangePicker` | superseded | Lower version of the family; not ported. Migrate call sites to `DateRangePicker`. | 5 | 4 |
| `DateRangePickerV2` | `DateRangePicker` | todo | 10 imports across V1/V2; react-day-picker per Task 13. | 5 | 5 |
| `StackedBarChart` | `StackedBarChart` | todo | 8 imports. Recharts. | 8 | 8 |
| `DatePicker` | `DatePicker` | superseded | Lower version of the family; not ported. Migrate call sites to `DatePicker`. | 6 | 6 |
| `DatePickerV2` | `DatePicker` | todo | 7 imports across V1/V2; react-day-picker per Task 13. | 1 | 1 |
| `FileDropUploader` | `FileDropUploader` | superseded | Lower version of the family; not ported. Migrate call sites to `FileDropUploader`. | 6 | 6 |
| `FileDropUploaderV2` | `FileDropUploader` | todo | 7 imports across V1/V2; react-dropzone per Task 13. | 1 | 1 |
| `CustomTooltip` | `ChartTooltip` | todo | 6 imports; chart tooltip, ports with the chart batch. | 6 | 6 |
| `VerticalBarChart` | `VerticalBarChart` | todo | 6 imports. Recharts. | 6 | 5 |
| `ClusterMap` | `ClusterMap` | todo | 3 imports; map library decision with the user. | 3 | 3 |
| `DataGrid` | `DataGrid` | todo | 3 imports; MUI X DataGrid wrapper. Decide whether Table covers it. | 3 | 3 |
| `DonutChart` | `DonutChart` | todo | 2 imports. Recharts. | 2 | 2 |
| `LocationMap` | `LocationMap` | todo | 2 imports; map library decision with the user. | 2 | 2 |
| `MultipleBarChart` | `MultipleBarChart` | superseded | Lower version of the family; not ported (unused-in-customer360). | 0 | 0 |
| `MultipleBarChartV2` | `MultipleBarChart` | todo | 2 imports (V2). Recharts. | 2 | 2 |
| `FileInputUploader` | `FileInputUploader` | todo | See FileDropUploader. | 1 | 1 |
| `HorizontalBarchart` | `HorizontalBarChart` | todo | 1 import. Recharts. | 1 | 1 |
| `JSONExplorer` | `JSONExplorer` | todo | 1 import; library decision. | 1 | 1 |
| `PDFViewer` | `PDFViewer` | todo | 1 import; library decision. | 1 | 1 |
| `PieChart` | `PieChart` | todo | 1 import. Recharts. | 1 | 1 |
| `CustomLegend` | `ChartLegend` (not ported) | skip | unused-in-customer360. Recommend skip porting unless requested. | 0 | 0 |
| `JSONViewer` | `JSONViewer` (not ported) | skip | unused-in-customer360. Recommend skip porting unless requested. | 0 | 0 |
| `Legend` | `ChartLegend` (not ported) | skip | unused-in-customer360. Recommend skip porting unless requested. | 0 | 0 |
| `LegendCustom` | `ChartLegend` (not ported) | skip | unused-in-customer360. Recommend skip porting unless requested. | 0 | 0 |
| `LineChart` | `LineChart` (not ported) | skip | unused-in-customer360. Recommend skip porting unless requested. | 0 | 0 |
| `Palette` | `Palette` (not ported) | skip | unused-in-customer360. Recommend skip porting unless requested. | 0 | 0 |
| `PieChartRounded` | `PieChart` (not ported) | skip | unused-in-customer360. Recommend skip porting unless requested. | 0 | 0 |
| `PieChartThick` | `PieChart` (not ported) | skip | unused-in-customer360. Recommend skip porting unless requested. | 0 | 0 |
| `PieChartThin` | `PieChart` (not ported) | skip | unused-in-customer360. Recommend skip porting unless requested. | 0 | 0 |
| `SemiDonutChart` | `SemiDonutChart` (not ported) | skip | unused-in-customer360. Recommend skip porting unless requested. | 0 | 0 |
| `StackedBarChartHorizontal` | `StackedBarChart` (not ported) | skip | unused-in-customer360. Recommend skip porting unless requested. | 0 | 0 |
| `StackedBarChartVertical` | `StackedBarChart` (not ported) | skip | unused-in-customer360. Recommend skip porting unless requested. | 0 | 0 |
| `WorldMapChart` | `WorldMapChart` (not ported) | skip | unused-in-customer360. Recommend skip porting unless requested. | 0 | 0 |

## Imports that are not components

These need migration answers in Task 20 (consumer integration pilot) even though they are not in the component list.

| import path | imports | files | what is imported | horizon-ui answer |
|---|---|---|---|---|
| `@cialdnb/x-core/icons` | 168 | 75 | `InfoIcon` 10, `Info` 5, `BuildingIcon` 5, `CheckCircleIcon` 4, `PencilSimple` 4, `GavelIcon` 4 | Phosphor re-export at `@cialdnb/horizon-ui/icons` (Task 8). 62 of 168 imports use Phosphor names without the `Icon` suffix (for example `Info`, `CaretLeft`, `PencilSimple`); prefer the `*Icon` names when migrating (the unsuffixed names are legacy Phosphor aliases, confirm they are still exported at Task 20). |
| `@cialdnb/x-core` | 54 | 54 | `default` 54 | Default export is the MUI theme (all 54 imports, in 54 files) passed to `AppThemeProvider` (MUI). Replaced by `HorizonProvider`; during coexistence the MUI theme stays. No named root imports (`components`/`icons`/`illustrations` namespaces are unused). |
| `@cialdnb/x-core/theme` | 14 | 13 | `default` 11, `createXCoreTheme` 2, `themeHorizon` 1 | MUI theme factory (`createXCoreTheme`, `themeHorizon`, default theme). Stays on x-core while MUI screens exist; no horizon-ui equivalent by design. |
| `@cialdnb/x-core/theme/tokens/colors` | 11 | 4 | `lightBlue` 2, `red` 2, `teal` 2, `amber` 2, `blue` 1, `blueGrey` 1 | Primitive colour scales. Use CSS variables / Tailwind semantic tokens; a few chart colours need `@cialdnb/horizon-ui/tokens` exports. |
| `@cialdnb/x-core/components/shared/chartsLegendMensurable/ChartsLegendMensurable` | 8 | 4 | `ChartsLegendMensurable` 4, `LegendMensurableData` 4 | Internal chart helper imported by 4 chart files; goes with the chart batch (4). |
| `@cialdnb/x-core/theme/tokens/typography` | 6 | 3 | `fontWeight` 3, `fontSize` 2, `typeScale` 1 | `fontWeight`/`fontSize`/`typeScale` for chart text; use Typography variants or `@cialdnb/horizon-ui/tokens`. |
| `@cialdnb/x-core/illustrations` | 4 | 4 | `Failed` 1, `Mail` 1, `Positive` 1, `NoData` 1 | Done in Task 8: `@cialdnb/horizon-ui/illustrations`. |
| `@cialdnb/x-core/theme/global-palette` | 4 | 4 | `default` 4 | Legacy global palette; no equivalent (Horizon DS only). Needs a per-use replacement with semantic tokens. |
| `@cialdnb/x-core/theme/tokens/borderRadius` | 4 | 4 | `borderRadius` 4 | Radius tokens; use `rounded-*` utilities / `@cialdnb/horizon-ui/tokens`. |
| `@cialdnb/x-core/theme/tokens` | 2 | 2 | `borderRadius` 2 | Same as above. |
| `@cialdnb/x-core/utils/emailValidation` | 2 | 2 | `validateEmail` 2 | `validateEmail` util; no horizon-ui equivalent (utilities are not part of the library). Copy into customer360 or add to horizon-ui if a second consumer needs it. |

Hooks and types that live under component folders (for example `useDialog`, `TableColumnSettings`, `ColumnDataType`, `Order`, `SelectOption`, `ChipColor`) are attributed to their owning component above. Hooks are not exported by horizon-ui yet: `useDialog` (il-acl-client, 12 imports) has no equivalent and must be designed with Dialog.

### Other consumers of x-core (informational)

`package.json` files under `/Users/simonmor/dnb` that depend on `@cialdnb/x-core`: `customer360/client` (2.2.30) and `il-acl-client` (^2.2.22). No dependency in il-acl, mycial-backend, autobahn, workflow-engine, c360-api, projectx-backend or the deployment repos. il-acl-client direct usage: Table 72, Button 60, Typography 51, CircularProgress 43, TextField 29, Chip 26, Dialog 25, Card 16, Checkbox 8, Breadcrumbs 6, LinearProgress 5, PasswordField 5, Select 5; plus `Dialog/useDialog` 12 imports and the default theme (3).

## Button (from `ButtonV2`)

| x-core `ButtonV2` | horizon-ui `Button` |
|---|---|
| `variant="contained"` (any `color`) | `variant="primary"` |
| `variant="outlined"` | `variant="secondary"` |
| `variant="text"` | `variant="tertiary"` (`showTextUnderLine` is the default hover: underline) |
| `color="error"` | `variant="destructive"` |
| `color` = `secondary`/`success`/`warning`/`info`/`orange`/`purple`/`neutral`/`bright` | Not ported. Colour is set by the variant; status colours belong to Alert/Badge. `neutral` text buttons map to `variant="ghost"`. |
| (none) | `variant="ghost"`, `variant="link"` (new) |
| `size="small"` / `"medium"` / `"large"` | `size="sm"` / `"md"` / `"lg"` |
| `startIcon` / `endIcon` | Icons as `children`, before or after the label |
| `textColor` | Not ported (token-only colour) |
| `loading` | `loading` (also sets `aria-busy`/`aria-disabled`, keeps focus and width) |
| `sx`, MUI props | `className` (`hz:` utilities), `asChild` for links |
| (none) | `fullWidth` |

Visual deviations from ButtonV2 (no Figma link was available; decisions in the Task 6 report):

- Heights at tablet and up: sm 24 -> 32px, md 36px (same), lg 42 -> 44px (4px grid). Mobile and touch pointers: 44/44/48px minimum target.
- Type: sm 10 -> 12px, md 12 -> 14px (the Horizon `button` token), lg 14 -> 16px; semibold; no 1.25px letter-spacing.
- Radius 20px in both directions (ButtonV2 used 16px in RTL).
- No elevation (ButtonV2 forced `box-shadow: none` on the component anyway).
- Secondary hover fills with `primary` (as ButtonV2 outlined); tertiary hover underlines (as ButtonV2 text with `showTextUnderLine`). The end-icon bounce animation is not ported (decorative motion).

## Icons

x-core `icons` is `export * from '@phosphor-icons/react'` plus 14 deprecated legacy aliases. horizon-ui re-exports Phosphor unchanged from the subpath: `import { CheckIcon } from '@cialdnb/horizon-ui/icons'` replaces x-core's `icons` namespace usage (there is no root `icons` namespace); legacy aliases are not carried over, use the `*Icon` names. Under `dir="rtl"`, pass `mirrored` on directional icons (`ArrowLeftIcon`, `ArrowRightIcon`, `CaretLeftIcon`, `CaretRightIcon`, `ArrowBendUpLeftIcon`).

## Illustrations

x-core renders each SVG through `<img src width={50} height={50}>`. horizon-ui renders inline `<svg>` components (generated by `scripts/port-illustrations.ts` from the verbatim SVGs in `src/illustrations/assets/`): `aria-hidden` unless `title`/`aria-label`, `size` sets width and height, intrinsic size is the artwork's own (not 50px), ids unique per instance. Props change from `ImgHTMLAttributes` to `SVGProps` (`alt` becomes `title`/`aria-label`, `src` is gone). Export names are unchanged; import from `@cialdnb/horizon-ui/illustrations` (no root namespace).

| x-core export | horizon-ui export | Set |
|---|---|---|
| `DataNeutral`, `Data`, `EmptyState`, `HighRisk`, `LeverageRisk`, `LowRisk`, `NoData`, `Portfolio`, `Positive`, `Report`, `ScheduleMonitoring`, `Mail`, `Failed` | same names | cial |
| `BlockedIL`, `BrokenLinkIL`, `CompareIL`, `DAAIL`, `EmailIL`, `EmptyStateIL`, `OkIL`, `RankIL`, `ReportIL`, `ScoreIL`, `ScreenIL`, `SearchIL`, `StampIL`, `SuccessIL`, `ValidateIL` | same names | il |
