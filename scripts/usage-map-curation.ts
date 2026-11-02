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
    status?: 'skip' | 'no-equivalent' | 'done' | 'partial' | 'superseded';
    /**
     * Status for the family's superseded rows when their call sites cannot
     * fully migrate yet (e.g. `partial`: the port lacks a feature they use).
     */
    supersededStatus?: 'partial';
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
        note: 'PARTIAL (Task 11a): single selection only, see Select section below. `options` array becomes `SelectItem` children (`group` -> `SelectGroup`, `disabled` per item); `onChange(event, value)` becomes `onValueChange(value)`; `placeholderValue` becomes `placeholder`; `clearable` kept (+ `clearLabel`); `size="small"` -> `sm`; label/helperText/error/isLabelContainer/info move to FormField. BLOCKED: multiple selection (`multiple`, `variant` check/radio/switch, apply/reset) and the search field need Combobox (planned, Task 11c): 2 of 4 customer360 SelectV2 files (5 of 7 openings) use `multiple`, 1 opening uses search. Dropped props warn in development.',
        status: 'partial',
        supersededNote:
            'PARTIAL: 8 of 22 customer360 files (10 of 30 openings) use `multiple` (MUI multi-select with chips): blocked until Combobox (planned, Task 11c); single-value call sites can migrate to `Select` now.',
        supersededStatus: 'partial',
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
        note: 'Done in Task 11a, see RadioGroup section below. `Radiov2` becomes `RadioGroupItem` inside a `RadioGroup` (a lone radio has no use without a group); `checked`/`onChange` move to the group (`value`/`onValueChange`); `size` moves to the group (small -> sm); `color`, `sx`, `inputProps`, `disableRipple` dropped with a dev warning. v1 `Radio` call sites (8 files: `size`, `checked`, `value`, `onChange`, `sx`) migrate the same way.',
        status: 'done',
    },
    RadioGroup: {
        batch: 2,
        horizon: 'RadioGroup',
        note: 'Done in Task 11a, see RadioGroup section below. `options` array becomes `RadioGroupItem` children; `row` becomes `orientation="horizontal"`; `onChange(event, value)` becomes `onValueChange(value)` (string values); `label`, `error`, `errorText` move to FormField; `other` (radio + free-text TextField) is composed from RadioGroupItem + Input; `sx` dropped with a dev warning.',
        status: 'done',
    },
    Switch: {
        batch: 2,
        horizon: 'Switch',
        note: 'Done in Task 11a, see Switch section below. `onChange(event, checked)` becomes `onCheckedChange(checked)`; MUI `FormControlLabel` becomes `label`; `checked`, `defaultChecked`, `disabled`, `name` kept; `color`, `size`, `sx`, `edge`, `inputProps`, `disableRipple` dropped with a dev warning; the squish animation becomes a spring transform (instant under reduced motion). v1 `Switch` call sites (4 files: `checked`, `onChange`) migrate the same way.',
        status: 'done',
    },
    Dialog: {
        batch: 2,
        horizon: 'Dialog',
        note: 'Done in Task 11b (Radix Dialog, compound): `<DialogV2 open onClose dialogTitle dialogContent dialogActions>` becomes `<Dialog open onOpenChange><DialogContent><DialogHeader><DialogTitle/></DialogHeader><DialogBody/><DialogFooter/></DialogContent></Dialog>`; `isStickyHeader`/`isStickyFooter` are the default (body scrolls); `maxWidth` -> `size` (xs/sm -> sm 570, md/tablet -> md 600, lg/laptop -> lg 900, xl/desktop -> xl 1136); full screen below tablet as x-core; `onClose(event, reason)` -> `onOpenChange(false)`; `disableEscapeKeyDown` -> `dismissible={false}`; `sx`/`PaperProps`/`dialogContentSx`/`dialogActionsSx`/`TransitionProps`/`transitionDirection` dropped (className on the part). New: dev warnings for a missing title/description. Opening an MUI dialog from a Horizon dialog is not supported (renders below). Dropped props warn in development.',
        status: 'done',
        supersededNote:
            'Call sites (27 files: `open`, `onClose`, `maxWidth` sm/md/xs/xl/tablet/laptop/desktop, `sx`, `TransitionProps`, `scroll`, `fullScreen`, `PaperProps`) migrate to `Dialog` like DialogV2: children become DialogHeader/DialogBody/DialogFooter parts, `maxWidth` -> `size`.',
    },
    ConfirmationDialog: {
        batch: 2,
        horizon: 'ConfirmationDialog',
        note: 'Done in Task 11b: preset of Dialog (`role="alertdialog"`). `onSubmit` -> `onConfirm`; `onClose` -> `onOpenChange(false)` + `onCancel`; `title` kept (required); `children` kept (body) + new `description`; `approveText`/`cancelText` -> `confirmLabel`/`cancelLabel` (defaults Confirm/Cancel, x-core save/cancel); `submitLoading` -> `loading` (also blocks cancel/Escape); `submitDisabled` -> `confirmDisabled`; `manualClose` -> `closeOnConfirm={false}`; `color="error"` -> `variant="destructive"`; `submitColor`/`cancelColor`/`submitVariant`/`cancelVariant`/`cancelLoading`/`cancelDisabled` dropped. Order changed: Cancel then Confirm (x-core: approve first); initial focus on Cancel; no close icon. Dropped props warn in development.',
        status: 'done',
    },
    DrawerV3: {
        batch: 2,
        horizon: 'Drawer',
        note: 'Done in Task 11b (Radix Dialog as a side panel). `isOpen` -> `open`; `onClose()` -> `onOpenChange(false)`; `direction` (LayoutDirection) -> logical `side` (`end` default = x-core right edge, mirrored under rtl by itself); `title`, `content`, `actions`, `width` (default 320px; customer360 widths such as `"90%"` work from tablet, capped at the viewport), `keepMounted` kept (content state survives closing; closed content is not in the document); `sx` dropped. Full-width bottom sheet below tablet as x-core. Dropped props warn in development.',
        status: 'done',
    },
    Popover: {
        batch: 2,
        horizon: 'Popover',
        note: 'Done in Task 11b (Radix Popover, compound). `<PopoverV2 open anchorEl onClose title icon footer hideCloseButton>` becomes `<Popover open onOpenChange><PopoverTrigger asChild>{anchor}</PopoverTrigger><PopoverContent title icon footer hideCloseButton>`; `anchorEl` -> `PopoverTrigger`/`PopoverAnchor` (no imperative element); `anchorOrigin`/`transformOrigin` -> logical `side`/`align` (default bottom/end = x-core default); `slotProps.paper` width -> `width` (default 320px, x-core 318); non-modal by default (`modal` for the MUI focus trap); new `closeLabel`, `showArrow`, `PopoverClose`. At mobile capped to the viewport minus 16px. Dropped props warn in development.',
        status: 'done',
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
        note: 'Done in Task 11b (Radix Tooltip). `title` becomes `content` (required); `placement` becomes logical `side` (top/bottom/start/end) + `align` (start/center/end): `bottom-end` -> side="bottom" align="end", `right` -> side="end", `auto` -> default top (flips when there is no room); `enterDelay` becomes `delayDuration` (default 300, customer360 always passes 300); `leaveDelay` dropped (closes on leave; grace area to the content); `multipleLine` is the default (wraps at 280px, keeps line breaks); new `showArrow`, `disabled`, optional `TooltipProvider`. Touch never opens a tooltip. `open`/`onClose` -> `open`/`onOpenChange`. Dropped props warn in development. A disabled button cannot trigger it: wrap it in a focusable span.',
        status: 'done',
    },
    Snackbar: {
        batch: 2,
        horizon: 'Toast',
        note: 'Done in Task 11b (Radix Toast + Alert): mount `<ToastProvider />` once (replaces notistack `SnackbarProvider` in App.jsx); customer360 `useSimpleSnackbar().showErrorSnackbar(text, title)` etc. become `toast({ variant: "error", description: text, title })`; `color` -> `variant` (info/success/warning/error); `text` -> `description`; `onActionClick` + `actionTitle` -> `action: { label, onClick }`; `autoHideDuration` -> `duration` (default 5000); `preventDuplicate` -> a stable `id` (replaces the shown toast); returns `{ id, dismiss }` (was `handleClose`); `showProgress` -> pass a Progress in `description`; `anchorOrigin` top/right + `style.top: 65px` dropped: bottom centre at mobile/tablet, bottom end from laptop (design decision); `SnackbarAlert`/`useSnackbar` exports dropped; `useToast()` hook. Toasts in an MUI dialog are announced but their visible list is aria-hidden by MUI (known limit).',
        status: 'done',
    },
    SplitButton: {
        batch: 2,
        horizon: 'SplitButton',
        note: 'Not in the plan. Button + DropdownMenu composition (DropdownMenu done in Task 11b).',
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
        note: 'Used transitively through LayoutV2. Its menu is built on `DropdownMenu` (done in Task 11b: items with icons, `asChild` links, checkbox/radio items, submenus; bottom sheet at mobile).',
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
        note: 'Used transitively through LayoutV2 (V2). Its menu is built on `DropdownMenu` (done in Task 11b: items with icons, `asChild` links, checkbox/radio items, submenus; bottom sheet at mobile).',
    },
    HelpDropdown: {
        batch: 3,
        horizon: 'HelpDropdown',
        note: 'Used transitively through LayoutV2. Its menu is built on `DropdownMenu` (done in Task 11b: items with icons, `asChild` links, checkbox/radio items, submenus; bottom sheet at mobile).',
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
