export type Batch = 1 | 2 | 3 | 4;

/** Hand-written columns of the component map; counts come from usage-report. */
export interface Curation {
    batch: Batch;
    /** horizon-ui component name for the highest version of the family. */
    horizon: string;
    /** "API differences" column. */
    note: string;
    /** Extra text for the superseded rows of the family (shared enums/constants). */
    supersededNote?: string;
    /** Forces a status for the latest version (skip, no-equivalent, done). */
    status?: 'skip' | 'no-equivalent' | 'done' | 'superseded';
}

/** Keyed by family base name (or by exact name for the Drawer exception). */
export const curation: Record<string, Curation> = {
    Typography: {
        batch: 1,
        horizon: 'Typography',
        note: "Done in Task 10a, see Typography section below. `variant` = the 14 slash-notation roles (MUI `h1`..`caption` map to them); `component` becomes `as`; `color` takes semantic tokens; `noWrap` becomes `truncate` (also 2-4 line clamp); default colour `inherit` and default elements as MUI (`h5`/`h6`/subtitles need `as`); `weight`, `align` added; `sx`, `gutterBottom`, `paragraph`, `display` and MUI typography props dropped. The Typography module's `Link` export (1 customer360 file) maps to horizon `Link` (Task 10c, see Link section below).",
        status: 'done',
    },
    Button: {
        batch: 1,
        horizon: 'Button',
        note: 'Done in Task 6, see Button section below.',
        status: 'done',
    },
    Chip: {
        batch: 1,
        horizon: 'Chip',
        note: 'Done in Task 10a, see Chip section below. `color` becomes `variant` (neutral/primary/info/success/warning/error; palette colours dropped), `variant` filled/outlined becomes `appearance` soft/outline, `size` small/medium becomes sm/md; `label` is a required string (array labels with the +N tooltip dropped); `onDelete` renders a remove button named `Remove <label>`; `onClick` renders a real button; `avatar`, `deleteIcon`, `sx` dropped; `ChipColor` type becomes `ChipVariant`. Known regression: 17 colours fold into 6 tones (categorical palette needs a design decision).',
        status: 'done',
    },
    CircularProgress: {
        batch: 1,
        horizon: 'Spinner',
        note: 'Done in Task 10b, see Spinner section below. `size={n}` becomes a step (`xs` 12, `sm` 16, `md` 20, `lg` 24, `xl` 40, default `xl` as x-core); `color` becomes `tone` (`primary`, `muted`, `inherit`); `variant="determinate" value` becomes `value` (ring on a built-in track); accessible name `label` (default "Loading"), `aria-hidden` makes it decorative; `thickness`, `disableShrink`, `sx`, `children` dropped. Also renders the loading Button ring.',
        status: 'done',
    },
    LinearProgress: {
        batch: 1,
        horizon: 'Progress',
        note: 'Done in Task 10b, see Progress section below. `variant="determinate" value` becomes `value` (omit for indeterminate); `color` becomes `variant` (primary/neutral/success/warning/error); new `max`, `size` (sm 4px, md 8px), `label`, `showValue`; a name is required (`label`, `aria-label` or `aria-labelledby`); `variant="buffer"`/`"query"`, `valueBuffer`, `sx`, `children` dropped.',
        status: 'done',
    },
    Alert: {
        batch: 1,
        horizon: 'Alert',
        note: 'Done in Task 10b, see Alert section below. `color`/`severity` become `variant` (info/success/warning/error + neutral); `AlertTitle` child becomes `title`; `onClose` becomes `onDismiss` (+ `dismissLabel`); `action` and `icon` (incl. `false`) kept; MUI `variant` standard/inline/outlined/filled/footer folded into one look; role is `alert` for warning/error and `status` otherwise (`role` overrides); `sx`, `elevation`, `closeText`, `slots` dropped.',
        status: 'done',
    },
    Badge: {
        batch: 1,
        horizon: 'Badge',
        note: 'Done in Task 10a, see Badge section below. `color` becomes `variant` (tones); `label` becomes children (dot + uppercase label); `badgeContent` becomes `count` (max 999, hidden at 0); a dot alone needs `aria-label`; wrapping children becomes `BadgeAnchor` (`overlap` kept); `labelColor`, `sx`, `invisible`, `anchorOrigin` dropped; `BadgeAnchor` defaults to `overlap="rectangular"` (x-core: circular); `BadgeColor` type becomes `BadgeTone`.',
        status: 'done',
    },
    BadgeAI: {
        batch: 1,
        horizon: 'Badge',
        note: 'Done in Task 10a: `<Badge variant="ai">` (plain marker). The clickable call site (`onClick` + `showBorder`) maps to `Button` with a Sparkle icon, not Badge. `variant=FILLED` (gradient pill) not ported; confirm with design.',
        status: 'done',
    },
    AIVerifiedBadge: {
        batch: 1,
        horizon: 'Badge',
        note: 'Done in Task 10a: `<Badge variant="ai-verified">` (`isValidated`) / `"ai-unverified"`; `text` becomes children (no default label); confirm with design.',
        status: 'done',
    },
    AIButton: {
        batch: 1,
        horizon: 'Button',
        note: 'Becomes a Button variant or composition; confirm with design.',
    },
    Avatar: {
        batch: 1,
        horizon: 'Avatar',
        note: 'Done in Task 10c, see Avatar section below. Native (no Radix). `alt` (initials source + name) splits into `name` (initials + default accessible name) and `alt` (`alt=""` = decorative, name visible nearby); `size` xsmall/small/medium/large/xlarge becomes xs/sm/md/lg/xl (16/24/32/40/64, default sm); custom `{ width, height }` size dropped (className); MUI `variant` circular/rounded/square becomes `shape` circle/rounded; new `tone` for the fallback surface (default primary; status tints replace `sx` colours); `sx`, `imgProps`, `sizes`, `srcSet`, `component` dropped.',
        status: 'done',
    },
    AvatarGroup: {
        batch: 1,
        horizon: 'AvatarGroup',
        note: 'Done in Task 10c, see Avatar section below. Named export `AvatarGroup` (not `Avatar.Group`, consistent with `BadgeAnchor`). `avatars` data array becomes `<Avatar>` children; `max` keeps MUI semantics (all shown when they fit; x-core always showed max-1 plus `+N` and clamped max to 3..4); new `total`, `overflowLabel`, `shape`; `+N` named "N more"; per-avatar and surplus tooltips dropped until Tooltip (Task 11); single-avatar caption mode dropped (compose Avatar + text).',
        status: 'done',
    },
    IconButton: {
        batch: 1,
        horizon: 'IconButton',
        note: 'Done in Task 10c, see IconButton section below. `aria-label` (or `aria-labelledby`) required in the type; `color` becomes `variant` (default -> primary, primary -> tertiary, secondary -> secondary, error -> destructive, inherit -> ghost; success/info/warning -> secondary, known visual regression); `size` small/medium/large becomes sm/md/lg; `tooltipInfo`/`tooltipProps` dropped until Tooltip (Task 11); new `loading`, `asChild`; `sx`, `edge`, `disableRipple` dropped.',
        status: 'done',
    },
    ActionIconButton: {
        batch: 1,
        horizon: 'IconButton',
        note: 'Done in Task 10c (merged, see IconButton section below): compact form is `IconButton variant="secondary"`; `count` becomes `BadgeAnchor` + `Badge count`; the labelled/arrow form becomes `Button variant="ghost"` with icons. AppBar surface (shadow, 40px) is styled by the AppBar port (Task 12).',
        status: 'done',
    },
    Divider: {
        batch: 1,
        horizon: 'Separator',
        note: 'Done in Task 10b, see Separator section below. `orientation` kept; `flexItem` built in (vertical always stretches to its row); new `decorative` (default true: `role="none"`; false: `role="separator"` + `aria-orientation`); renders a `<div>`, not `<hr>`; `color`, `sx`, `variant` (fullWidth/inset/middle), `textAlign`/children (text divider), `light`, `absolute`, `component` dropped.',
        status: 'done',
    },
    CountryFlag: {
        batch: 1,
        horizon: 'CountryFlag',
        note: 'decide flag asset source at port time.',
    },
    ChipGroup: {
        batch: 1,
        horizon: 'Chip',
        note: 'Skip; compose Chips in a flex wrap.',
        status: 'skip',
    },
    StatusIcon: {
        batch: 1,
        horizon: 'StatusIcon',
        note: 'Skip unless requested.',
        status: 'skip',
    },
    TextField: {
        batch: 2,
        horizon: 'Input',
        note: 'Done in Task 11a, see Input section below. `label`, `helperText` and `error` move to `FormField` (`label`, `description`, `error`); `error` on the input itself becomes `invalid`; `InputProps.startAdornment/endAdornment` and `leadingAdornment` become `startAdornment`/`endAdornment`; `size` small/medium becomes sm/md (+ lg); full width by default (`fullWidth` dropped); `multiline`/`rows`/`minRows` use `Textarea`; `characterLimit`, `mask`/`definitions`, `success`, `sx`, `variant`, `margin`, `InputLabelProps`, `inputProps`, `inputRef` dropped with a dev warning.',
        status: 'done',
    },
    TextInput: {
        batch: 2,
        horizon: 'Input',
        note: 'Done in Task 11a, see Input section below. As TextField; `clearable` kept (+ `clearLabel`, `onClear`), `isLoading` becomes `loading`; `size` small/medium/large becomes sm/md/lg (default md 40px from tablet, was large 40px); `isLabelContainer`, `info` use FormField; `append` (text/country selectors), `autoPopulateCountryCode` and country props not ported.',
        status: 'done',
    },
    TextArea: {
        batch: 2,
        horizon: 'Textarea',
        note: 'Done in Task 11a, see Textarea section below. `label`, `helperText`, `error` move to `FormField` (`error` on the field becomes `invalid`); the custom drag handle becomes the native vertical handle (`resize="none"` hides it); `minRows` becomes `rows` (default 4); new `autoResize` + `maxRows`; `multiline`, `fullWidth`, `characterLimit`, `isLabelContainer`, `info`, `inputProps`, `sx` dropped with a dev warning.',
        status: 'done',
    },
    NumberInput: {
        batch: 2,
        horizon: 'NumberInput',
        note: 'Not in the plan. port only if still needed (otherwise Input type=number).',
    },
    PhoneInput: {
        batch: 2,
        horizon: 'PhoneInput',
        note: 'Not in the plan. needs a dependency decision (react-phone-number-input) with a bundle-size justification.',
    },
    PasswordField: {
        batch: 2,
        horizon: 'Input',
        note: 'Skip in customer360; il-acl-client uses it 5x. Input + show/hide button if requested.',
        status: 'skip',
    },
    InputCompany: {
        batch: 2,
        horizon: 'InputCompany',
        note: 'App-specific; skip.',
        status: 'skip',
    },
    AppendInput: {
        batch: 2,
        horizon: 'Input',
        note: 'Skip; Input with an adornment slot if requested.',
        status: 'skip',
    },
    Autocomplete: {
        batch: 2,
        horizon: 'Combobox',
        note: 'Not in the plan. Command + Popover combobox. Also covers CountryAutoComplete.',
    },
    CountryAutoComplete: {
        batch: 2,
        horizon: 'Combobox',
        note: 'Composition of Combobox;',
    },
    CountryInput: {
        batch: 2,
        horizon: 'CountryInput',
        note: 'Skip.',
        status: 'skip',
    },
    EmailsField: {
        batch: 2,
        horizon: 'EmailsField',
        note: 'Not in the plan. tag input composed from Input and Chip.',
    },
    Select: {
        batch: 2,
        horizon: 'Select',
        note: 'Planned: Radix Select; options as children, not an `options` array; bottom sheet on mobile.',
    },
    Checkbox: {
        batch: 2,
        horizon: 'Checkbox',
        note: 'Done in Task 11a, see Checkbox section below. `onChange(event, checked)` becomes `onCheckedChange(checked)`; `indeterminate` becomes `checked="indeterminate"`; `size` small/medium becomes sm/md; MUI `FormControlLabel` becomes `label`; `color`, `sx`, `edge`, `inputProps`, `icon`/`checkedIcon`, `readOnly`, `disableRipple` dropped with a dev warning. v1 `Checkbox` call sites (17 files: `checked`, `onChange`, `size`, `value`, `color`, `sx`, `edge`, one `indeterminate`, one `readOnly`) migrate the same way.',
        status: 'done',
    },
    Radio: {
        batch: 2,
        horizon: 'RadioGroup',
        note: 'Planned: Radiov2 is the item of `RadioGroup` (Radix RadioGroup).',
    },
    RadioGroup: {
        batch: 2,
        horizon: 'RadioGroup',
        note: 'Planned: same component as above.',
    },
    Switch: {
        batch: 2,
        horizon: 'Switch',
        note: 'Planned: Radix Switch, `onCheckedChange`.',
    },
    Dialog: {
        batch: 2,
        horizon: 'Dialog',
        note: 'Planned: compound `Dialog.*`; full-screen at mobile.',
    },
    ConfirmationDialog: {
        batch: 2,
        horizon: 'ConfirmDialog',
        note: 'Not in the plan. preset composition of Dialog.',
    },
    DrawerV3: {
        batch: 2,
        horizon: 'Drawer',
        note: 'Planned: content side panel; `direction` becomes logical `side`. See plan Task 11 interface.',
    },
    Popover: {
        batch: 2,
        horizon: 'Popover',
        note: 'Planned: Radix Popover; portal inside `.hz-root`.',
    },
    Popper: {
        batch: 2,
        horizon: 'Popover',
        note: 'Skip; Radix handles positioning.',
        status: 'skip',
    },
    Tooltip: {
        batch: 2,
        horizon: 'Tooltip',
        note: 'Planned: Radix Tooltip; hover-only content gets a focus/touch equivalent.',
    },
    Snackbar: {
        batch: 2,
        horizon: 'Toast',
        note: 'Planned: role status, auto-dismiss.',
    },
    SplitButton: {
        batch: 2,
        horizon: 'SplitButton',
        note: 'Not in the plan. Button + DropdownMenu composition.',
    },
    Filter: {
        batch: 2,
        horizon: 'Filter',
        note: 'Not in the plan. composite of Popover, Checkbox and Button. Port after those.',
    },
    FilterInput: {
        batch: 2,
        horizon: 'Filter',
        note: 'Skip in customer360; il-acl-client uses it 2x.',
        status: 'skip',
    },
    SearchBar: {
        batch: 2,
        horizon: 'SearchBar',
        note: 'Planned: input with search icon and clear button.',
    },
    LabelColorActionsPopover: {
        batch: 2,
        horizon: 'LabelColorActionsPopover',
        note: 'Not in the plan. App-specific. Ask customer360 whether to keep it local; port after Popover.',
    },
    BackdropLoader: {
        batch: 2,
        horizon: 'BackdropLoader',
        note: 'Skip; Spinner + Dialog overlay if requested.',
        status: 'skip',
    },
    Table: {
        batch: 3,
        horizon: 'Table',
        note: 'Not in the plan. Heavily used composite. Needs its own design: `Column`/`TableColumnSettings`/`Order` API, sorting, cell data types. Small-screen pattern required.',
    },
    Card: {
        batch: 3,
        horizon: 'Card',
        note: 'Planned: compound `Card.*`; `CardVariant` becomes a cva variant.',
    },
    InsightsCard: {
        batch: 3,
        horizon: 'InsightsCard',
        note: 'Not in the plan. app-level composite on Card.',
    },
    CardElevation: {
        batch: 3,
        horizon: 'Card',
        note: 'Merge into Card variant.',
    },
    CardListView: {
        batch: 3,
        horizon: 'CardListView',
        note: 'Skip.',
        status: 'skip',
    },
    DualDataCard: {
        batch: 3,
        horizon: 'DualDataCard',
        note: 'Skip in customer360; il-acl-client uses it once.',
        status: 'skip',
    },
    StatisticCard: {
        batch: 3,
        horizon: 'StatisticCard',
        note: 'composition on Card.',
    },
    LevelCard: {
        batch: 3,
        horizon: 'LevelCard',
        note: 'composition on Card.',
    },
    Grid: {
        batch: 3,
        horizon: 'Grid',
        note: 'no-equivalent: use Tailwind grid/flex utilities; `PageContainer` is decided with Layout.',
        status: 'no-equivalent',
    },
    Accordion: {
        batch: 3,
        horizon: 'Accordion',
        note: 'Planned: Radix Accordion; `aria-expanded`.',
    },
    EvaluationAccordion: {
        batch: 3,
        horizon: 'EvaluationAccordion',
        note: 'composition on Accordion.',
    },
    Tabs: {
        batch: 3,
        horizon: 'Tabs',
        note: 'Planned: Radix Tabs; scrollable at mobile.',
    },
    Breadcrumbs: {
        batch: 3,
        horizon: 'Breadcrumbs',
        note: 'Used by il-acl-client. The plan lists it; defer unless a consumer requests it.',
        status: 'skip',
    },
    Pagination: {
        batch: 3,
        horizon: 'Pagination',
        note: 'Planned: previous/next + indicator at mobile.',
    },
    Timeline: {
        batch: 3,
        horizon: 'Timeline',
        note: 'Not in the plan; port with Batch 3 (TimelineV2 is the latest).',
    },
    TimeLineHistory: {
        batch: 3,
        horizon: 'Timeline',
        note: 'fold into Timeline if the design allows.',
    },
    SectionDescriptionWithIcon: {
        batch: 3,
        horizon: 'SectionDescriptionWithIcon',
        note: 'small composition.',
    },
    RatingBar: {
        batch: 3,
        horizon: 'RatingBar',
        note: 'small data-display component.',
    },
    Layout: {
        batch: 3,
        horizon: 'Layout',
        note: 'Used via `LayoutV2`, which composes AppBarV2, DrawerV2, dropdowns and UserPopover. Port with NavigationDrawer and AppBar.',
        supersededNote:
            'Its shared `LayoutEnum` (from `Layout/Layout.types`) is still imported; the successor `Layout` (port of `LayoutV2`) must export it.',
    },
    Drawer: {
        batch: 3,
        horizon: 'NavigationDrawer',
        note: 'Navigation menu; V2 is latest (see DrawerV2). Plain Drawer is only imported for the shared constants `drawerWidth` and `drawerCollapsedWidth`, which `NavigationDrawer` must export.',
        status: 'superseded',
        supersededNote:
            'Only the shared constants `drawerWidth` and `drawerCollapsedWidth` are imported; `NavigationDrawer` must export them.',
    },
    DrawerV2: {
        batch: 3,
        horizon: 'NavigationDrawer',
        note: 'Navigation menu; used transitively through LayoutV2. Preserve isExternal/highlighted behaviours (plan Task 12). Must also provide the `drawerWidth`/`drawerCollapsedWidth` constants currently imported from plain `Drawer`.',
    },
    AppBar: {
        batch: 3,
        horizon: 'AppBar',
        note: 'Used transitively through LayoutV2 (AppBarV2).',
    },
    AppBarActions: {
        batch: 3,
        horizon: 'AppBarActions',
        note: 'V3 is imported directly (in useHeaderActions); V2 is used inside LayoutV2.',
    },
    AppBarDropdown: {
        batch: 3,
        horizon: 'AppBarDropdown',
        note: 'Used transitively through LayoutV2.',
    },
    AppBarHelp: {
        batch: 3,
        horizon: 'AppBarHelp',
        note: 'Used transitively through LayoutV2.',
    },
    NotificationsDropdown: {
        batch: 3,
        horizon: 'NotificationsDropdown',
        note: 'Only a type is imported directly (no runtime import); the component is used inside LayoutV2.',
    },
    ProductsDropdown: {
        batch: 3,
        horizon: 'ProductsDropdown',
        note: 'Used transitively through LayoutV2 (V2).',
    },
    HelpDropdown: {
        batch: 3,
        horizon: 'HelpDropdown',
        note: 'Used transitively through LayoutV2.',
    },
    UserPopover: {
        batch: 3,
        horizon: 'UserPopover',
        note: 'Used transitively through LayoutV2.',
    },
    MobileBottomNav: {
        batch: 3,
        horizon: 'MobileBottomNav',
        note: 'Skip.',
        status: 'skip',
    },
    MobileBottomNavItem: {
        batch: 3,
        horizon: 'MobileBottomNav',
        note: 'Skip.',
        status: 'skip',
    },
    TopBarNav: {
        batch: 3,
        horizon: 'TopBarNav',
        note: 'Skip.',
        status: 'skip',
    },
    TopBarNavItem: {
        batch: 3,
        horizon: 'TopBarNav',
        note: 'Skip.',
        status: 'skip',
    },
    TabSection: {
        batch: 3,
        horizon: 'Tabs',
        note: 'Skip.',
        status: 'skip',
    },
    TabsScrollSpyContainer: {
        batch: 3,
        horizon: 'Tabs',
        note: 'Skip.',
        status: 'skip',
    },
    TabNavigatorDrawer: {
        batch: 3,
        horizon: 'Tabs',
        note: 'Skip.',
        status: 'skip',
    },
    DrawerContent: {
        batch: 3,
        horizon: 'NavigationDrawer',
        note: 'Internal part of DrawerV2; ported inside NavigationDrawer.',
        status: 'skip',
    },
    DrawerToggleButton: {
        batch: 3,
        horizon: 'NavigationDrawer',
        note: 'Internal part of DrawerV2; ported inside NavigationDrawer.',
        status: 'skip',
    },
    ScrollView: {
        batch: 3,
        horizon: 'ScrollView',
        note: 'Skip; use overflow utilities.',
        status: 'skip',
    },
    AreaChart: {
        batch: 4,
        horizon: 'AreaChart',
        note: 'Chart library decision (Recharts) per Task 13.',
    },
    StackedBarChart: {
        batch: 4,
        horizon: 'StackedBarChart',
        note: 'Recharts.',
    },
    VerticalBarChart: {
        batch: 4,
        horizon: 'VerticalBarChart',
        note: 'Recharts.',
    },
    HorizontalBarchart: {
        batch: 4,
        horizon: 'HorizontalBarChart',
        note: 'Recharts.',
    },
    MultipleBarChart: {
        batch: 4,
        horizon: 'MultipleBarChart',
        note: '. Recharts.',
    },
    DonutChart: {
        batch: 4,
        horizon: 'DonutChart',
        note: 'Recharts.',
    },
    PieChart: {
        batch: 4,
        horizon: 'PieChart',
        note: 'Recharts.',
    },
    CustomTooltip: {
        batch: 4,
        horizon: 'ChartTooltip',
        note: 'Only types are imported directly (no runtime import); ports with the chart batch.',
    },
    CustomLegend: {
        batch: 4,
        horizon: 'ChartLegend',
        note: 'Skip.',
        status: 'skip',
    },
    Legend: {
        batch: 4,
        horizon: 'ChartLegend',
        note: 'Skip.',
        status: 'skip',
    },
    LegendCustom: {
        batch: 4,
        horizon: 'ChartLegend',
        note: 'Skip.',
        status: 'skip',
    },
    LineChart: {
        batch: 4,
        horizon: 'LineChart',
        note: 'Skip.',
        status: 'skip',
    },
    SemiDonutChart: {
        batch: 4,
        horizon: 'SemiDonutChart',
        note: 'Skip.',
        status: 'skip',
    },
    PieChartRounded: {
        batch: 4,
        horizon: 'PieChart',
        note: 'Skip.',
        status: 'skip',
    },
    PieChartThick: {
        batch: 4,
        horizon: 'PieChart',
        note: 'Skip.',
        status: 'skip',
    },
    PieChartThin: {
        batch: 4,
        horizon: 'PieChart',
        note: 'Skip.',
        status: 'skip',
    },
    StackedBarChartHorizontal: {
        batch: 4,
        horizon: 'StackedBarChart',
        note: 'Skip.',
        status: 'skip',
    },
    StackedBarChartVertical: {
        batch: 4,
        horizon: 'StackedBarChart',
        note: 'Skip.',
        status: 'skip',
    },
    WorldMapChart: {
        batch: 4,
        horizon: 'WorldMapChart',
        note: 'Skip.',
        status: 'skip',
    },
    ClusterMap: {
        batch: 4,
        horizon: 'ClusterMap',
        note: 'map library decision with the user.',
    },
    LocationMap: {
        batch: 4,
        horizon: 'LocationMap',
        note: 'map library decision with the user.',
    },
    DatePicker: {
        batch: 4,
        horizon: 'DatePicker',
        note: 'react-day-picker per Task 13.',
    },
    DateRangePicker: {
        batch: 4,
        horizon: 'DateRangePicker',
        note: 'react-day-picker per Task 13.',
    },
    FileDropUploader: {
        batch: 4,
        horizon: 'FileDropUploader',
        note: 'react-dropzone per Task 13.',
    },
    FileInputUploader: {
        batch: 4,
        horizon: 'FileInputUploader',
        note: 'See FileDropUploader.',
    },
    DataGrid: {
        batch: 4,
        horizon: 'DataGrid',
        note: 'MUI X DataGrid wrapper. Decide whether Table covers it.',
    },
    PDFViewer: {
        batch: 4,
        horizon: 'PDFViewer',
        note: 'library decision.',
    },
    JSONExplorer: {
        batch: 4,
        horizon: 'JSONExplorer',
        note: 'library decision.',
    },
    JSONViewer: {
        batch: 4,
        horizon: 'JSONViewer',
        note: 'Skip.',
        status: 'skip',
    },
    Palette: {
        batch: 4,
        horizon: 'Palette',
        note: 'Docs-only; skip.',
        status: 'skip',
    },
};
