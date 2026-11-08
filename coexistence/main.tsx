import {
    Button as MuiButton,
    CssBaseline,
    Dialog as MuiDialog,
    Slide,
    DialogContent as MuiDialogContent,
    ThemeProvider,
    Typography as MuiTypography,
    createTheme,
} from '@mui/material';
import {
    Alert,
    Avatar,
    AvatarGroup,
    Badge,
    BadgeAnchor,
    Button,
    Checkbox,
    Chip,
    Combobox,
    FormField,
    HorizonProvider,
    IconButton,
    Input,
    Label,
    Link,
    Progress,
    RadioGroup,
    RadioGroupItem,
    Select,
    SelectItem,
    Separator,
    Spinner,
    Switch,
    Textarea,
    Tooltip,
    Typography,
    EmailsField,
    Filter,
    NumberInput,
    Pagination,
    SearchBar,
    SplitButton,
    Table,
    TableCell,
    Popover,
    PopoverClose,
    PopoverContent,
    PopoverTrigger,
    Dialog,
    DialogBody,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    ConfirmationDialog,
    Drawer,
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    ToastProvider,
    toast,
} from '@cialdnb/horizon-ui';
import bootstrapFull from 'bootstrap/dist/css/bootstrap.css?raw';
import bootstrapReboot from 'bootstrap/dist/css/bootstrap-reboot.css?raw';
import c360Host from './fixtures/customer360-host.css?raw';
import hzStyles from '@cialdnb/horizon-ui/styles.css?raw';
import hzUnlayeredStyles from '@cialdnb/horizon-ui/styles.unlayered.css?raw';
import { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';

function addStyle(id: string, css: string) {
    const style = document.createElement('style');
    style.id = id;
    style.textContent = css;
    document.head.append(style);
}

const params = new URLSearchParams(location.search);
// customer360 ships Bootstrap 4.4.1 UNLAYERED plus `* { box-sizing: border-box }`.
// ?reboot=1 loads the real bootstrap-reboot.css (the global element rules of
// Bootstrap) and that universal rule, both unlayered. ?reboot=full loads the
// full bootstrap.css instead (what customer360 imports: the reboot plus the
// `h1..h6 { font-weight: 500; line-height: 1.2; font-size }` type rules).
// ?host=customer360 adds customer360's own unlayered global element rules
// (fixtures/customer360-host.css: `a:focus { text-decoration: none }`,
// `button + button { margin-left }`, h1..h6, label ...) after Bootstrap, as
// customer360's index.scss does.
const withHost = params.get('host') === 'customer360';
const reboot = () => {
    if (['1', 'full'].includes(params.get('reboot') ?? ''))
        addStyle(
            'bootstrap-reboot',
            params.get('reboot') === 'full' ? bootstrapFull : bootstrapReboot
        );
    addStyle('c360-global', '* { box-sizing: border-box; }');
    if (withHost) addStyle('c360-host', c360Host);
};
// ?build=unlayered loads dist/styles.unlayered.css instead of dist/styles.css.
const horizon = () =>
    addStyle(
        'hz-styles',
        params.get('build') === 'unlayered' ? hzUnlayeredStyles : hzStyles
    );
// ?styles=0 renders the page without horizon-ui's stylesheet (baseline).
// ?order=horizon-first puts horizon's CSS before the reboot; the default is
// legacy CSS first, the order the docs recommend.
const withReboot =
    ['1', 'full'].includes(params.get('reboot') ?? '') || withHost;
const withHorizon = params.get('styles') !== '0';
if (params.get('order') === 'horizon-first') {
    if (withHorizon) horizon();
    if (withReboot) reboot();
} else {
    if (withReboot) reboot();
    if (withHorizon) horizon();
}

/*
 * ?mui=v2 renders the harness MUI dialogs like x-core DialogV2
 * (x-core/src/components/DialogV2/DialogV2.tsx): `disablePortal` (the
 * dialog stays in the React parent's DOM, here inside the app's
 * HorizonProvider) and a `Slide` (direction up) transition, `fullWidth`,
 * `scroll="paper"`, `keepMounted={false}`. Default: a plain portaled MUI
 * Dialog (x-core Dialog v1).
 */
const muiV2 = params.get('mui') === 'v2';
// Typed loosely: MUI's Slide props do not satisfy exactOptionalPropertyTypes.
const muiDialogVariant: object = muiV2
    ? {
          disablePortal: true,
          TransitionComponent: Slide,
          TransitionProps: { direction: 'up' } as object,
          fullWidth: true,
          scroll: 'paper' as const,
          keepMounted: false,
      }
    : {};

// Mirrors x-core Legacy: MUI htmlFontSize 14 against the browser-default 16px
// root, as in customer360 (it sets no html font-size). Tests also stress 14px.
const muiTheme = createTheme({
    typography: {
        htmlFontSize: 14,
        fontSize: 14,
        fontFamily: 'Open Sans, sans-serif',
    },
    palette: { primary: { main: '#0050F0' } },
});

/**
 * A clickable chip inside a clickable row, counting clicks on the chip, the
 * row's React handler and a native listener on the row (data attributes).
 */
function ChipInRow() {
    const [chip, setChip] = useState(0);
    const [row, setRow] = useState(0);
    const [native, setNative] = useState(0);
    const rowRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const el = rowRef.current;
        if (!el) return;
        const count = () => setNative((n) => n + 1);
        el.addEventListener('click', count);
        return () => el.removeEventListener('click', count);
    }, []);
    return (
        // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- harness fixture: a clickable row
        <div
            ref={rowRef}
            data-testid="hz-chip-row"
            data-chip-clicks={chip}
            data-row-clicks={row}
            data-native-clicks={native}
            style={{ paddingBlock: 32 }}
            onClick={() => setRow((n) => n + 1)}
        >
            <Chip
                label="row chip"
                onClick={() => setChip((n) => n + 1)}
                data-testid="hz-chip-in-row"
            />
        </div>
    );
}

const AVATAR_PHOTO = `data:image/svg+xml,${encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 8 8"><rect width="8" height="8" fill="#5b7083"/></svg>'
)}`;

const ICON_BUTTON_VARIANTS = [
    'primary',
    'secondary',
    'tertiary',
    'destructive',
    'ghost',
] as const;

/** Inline icon (Phosphor is not a harness dependency); sized by IconButton. */
function PencilIcon() {
    return (
        <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M2 14 14 2" stroke="currentColor" strokeWidth="2" />
        </svg>
    );
}

const CHIP_TONES = [
    'neutral',
    'primary',
    'info',
    'success',
    'warning',
    'error',
] as const;

const TYPOGRAPHY_ROLES = [
    'display/xl',
    'display/lg',
    'heading/xl',
    'heading/lg',
    'heading/md',
    'heading/sm',
    'body/lg',
    'body/default',
    'body/secondary',
    'caption',
    'micro',
    'label/sm',
    'label/md',
    'label/lg',
] as const;

const SELECT_OPTIONS = ['Acme Ltd.', 'Globex', 'Initech'] as const;
const COMBOBOX_OPTIONS = SELECT_OPTIONS.map((o) => ({ value: o, label: o }));

/**
 * An MUI dialog (z-index 1300) holding horizon Selects. Inside: a
 * HorizonProvider in the dialog (the documented pattern: the list portals
 * into it) and a Select that only has the app-level provider (React context
 * crosses MUI's portal, so its list portals to the app root, outside the
 * dialog DOM).
 */
function SelectInMuiDialog() {
    const [open, setOpen] = useState(false);
    return (
        <>
            <MuiButton
                data-testid="open-mui-dialog"
                onClick={() => setOpen(true)}
            >
                Open MUI dialog
            </MuiButton>
            <MuiDialog
                open={open}
                onClose={() => setOpen(false)}
                {...muiDialogVariant}
            >
                <MuiDialogContent data-testid="mui-dialog-content">
                    <HorizonProvider>
                        <Input
                            aria-label="Inner input"
                            data-testid="hz-input-dialog"
                        />
                        <Combobox
                            aria-label="Inside provider search"
                            options={COMBOBOX_OPTIONS}
                            data-testid="hz-combobox-dialog"
                        />
                        <Select
                            aria-label="Inside provider"
                            placeholder="Pick"
                            data-testid="hz-select-dialog"
                        >
                            {SELECT_OPTIONS.map((o) => (
                                <SelectItem key={o} value={o}>
                                    {o}
                                </SelectItem>
                            ))}
                        </Select>
                    </HorizonProvider>
                    <Input
                        aria-label="Outer input"
                        data-testid="hz-input-dialog-outer"
                    />
                    <Select
                        aria-label="App provider only"
                        placeholder="Pick"
                        data-testid="hz-select-dialog-outer"
                    >
                        {SELECT_OPTIONS.map((o) => (
                            <SelectItem key={o} value={o}>
                                {o}
                            </SelectItem>
                        ))}
                    </Select>
                </MuiDialogContent>
            </MuiDialog>
        </>
    );
}

/**
 * The overlays a page opens. Rendered twice: in the app's provider and,
 * inside a real MUI Dialog, under an inner `<HorizonProvider>` (the
 * documented pattern). `scope` prefixes the test ids.
 */
/**
 * An MUI Dialog opened from inside a Horizon Dialog: the unsupported order
 * (it renders below the Horizon dialog), kept to measure it.
 */
function MuiFromHorizon() {
    const [open, setOpen] = useState(false);
    return (
        <>
            <Button
                variant="secondary"
                data-testid="open-mui-from-hz"
                onClick={() => setOpen(true)}
            >
                Open MUI dialog
            </Button>
            <MuiDialog
                open={open}
                onClose={() => setOpen(false)}
                disableEnforceFocus
            >
                <MuiDialogContent data-testid="mui-from-hz-content">
                    MUI dialog opened from a Horizon dialog
                </MuiDialogContent>
            </MuiDialog>
        </>
    );
}

/** Fires an action toast (customer360 showActionSnackbar with "Cancel"). */
function ActionToastButton({ testId }: { testId: string }) {
    return (
        <Button
            variant="secondary"
            data-testid={testId}
            onClick={() =>
                toast({
                    id: 'action-toast',
                    description: 'Request sent',
                    action: { label: 'Undo send', onClick: () => undefined },
                    duration: Infinity,
                })
            }
        >
            Action toast
        </Button>
    );
}

/** Opens a ConfirmationDialog (destructive). */
function ConfirmDelete({ scope }: { scope: string }) {
    const [open, setOpen] = useState(false);
    return (
        <>
            <Button
                variant="destructive"
                data-testid={`${scope}-confirm-trigger`}
                onClick={() => setOpen(true)}
            >
                Delete
            </Button>
            <ConfirmationDialog
                open={open}
                onOpenChange={setOpen}
                variant="destructive"
                title="Delete this report?"
                description="It cannot be undone."
                confirmLabel="Delete report"
                onConfirm={() => undefined}
                data-testid={`${scope}-confirm`}
            />
        </>
    );
}

const LONG_OPTIONS = Array.from({ length: 40 }, (_, i) => ({
    value: `c${i}`,
    label: `Company ${i + 1}`,
}));

type HarnessRow = {
    name: string;
    city: string;
    employees: number;
    risk: { label: string; color: string };
};

const TABLE_ROWS = (count: number) =>
    Array.from({ length: count }, (_, i) => ({
        id: i + 1,
        rowData: {
            name: `Company ${i + 1}`,
            city: ['Haifa', 'Tel Aviv', 'Eilat'][i % 3] ?? '',
            employees: (i * 37) % 500,
            risk: { label: ['Low', 'High'][i % 2] ?? '', color: 'error' },
        },
    }));

const TABLE_COLUMNS = [
    { id: 'name', label: 'Company' },
    { id: 'city', label: 'City', info: 'Head office' },
    { id: 'employees', label: 'Employees', type: 'numeric' as const },
    { id: 'risk', label: 'Risk', type: 'chip' as const, disableSort: true },
];

/**
 * A data Table with everything Bootstrap's table rules can reach: caption,
 * sortable headers, row headers, a selection column, a selected and a
 * clickable row, an open details row (dl/dt/dd), a footer and pagination.
 */
function HarnessTable() {
    return (
        <Table<HarnessRow>
            caption="Harness companies"
            columns={TABLE_COLUMNS}
            data={TABLE_ROWS(3).map((row, i) =>
                i === 0
                    ? {
                          ...row,
                          rowOptions: {
                              collapseData: 'Opened details',
                              expanded: true,
                          },
                      }
                    : row
            )}
            order="asc"
            orderBy="name"
            onRequestSort={() => undefined}
            selectable
            selectedItems={[2]}
            onRowClick={() => undefined}
            page={1}
            limit={3}
            totalCount={9}
            paginationProps={{ showTotalItems: true }}
            footerRow={
                <>
                    <TableCell />
                    <TableCell />
                    <TableCell>Total</TableCell>
                    <TableCell />
                    <TableCell numeric>111</TableCell>
                    <TableCell />
                </>
            }
            data-testid="hz-table"
        />
    );
}

/** Tall tables in a Horizon Dialog (own scroll area) and a Drawer (body scrolls). */
function TableInModals() {
    const [drawer, setDrawer] = useState(false);
    return (
        <>
            <Dialog>
                <DialogTrigger asChild>
                    <Button
                        variant="secondary"
                        data-testid="hz-table-dialog-trigger"
                    >
                        Table dialog
                    </Button>
                </DialogTrigger>
                <DialogContent data-testid="hz-table-modal-dialog">
                    <DialogHeader>
                        <DialogTitle>Companies</DialogTitle>
                        <DialogDescription>
                            A table in a dialog
                        </DialogDescription>
                    </DialogHeader>
                    <DialogBody>
                        <Table<HarnessRow>
                            caption="Dialog companies"
                            columns={TABLE_COLUMNS}
                            data={TABLE_ROWS(30)}
                            disablePagination
                            stickyHeader
                            maxBlockSize={200}
                            data-testid="hz-table-dialog"
                        />
                    </DialogBody>
                </DialogContent>
            </Dialog>
            <Button
                variant="secondary"
                data-testid="hz-table-drawer-trigger"
                onClick={() => setDrawer(true)}
            >
                Table drawer
            </Button>
            <Drawer
                open={drawer}
                onOpenChange={setDrawer}
                title="Companies"
                data-testid="hz-table-modal-drawer"
                content={
                    <Table<HarnessRow>
                        caption="Drawer companies"
                        columns={TABLE_COLUMNS}
                        data={TABLE_ROWS(40)}
                        disablePagination
                        data-testid="hz-table-drawer"
                    />
                }
            />
        </>
    );
}

/** Combobox (single and multiple) inside a Horizon Dialog and a Drawer. */
function ComboboxInModals() {
    const [drawer, setDrawer] = useState(false);
    const fields = (scope: string) => (
        <>
            <Combobox
                aria-label={`${scope} company`}
                options={LONG_OPTIONS}
                data-testid={`hz-combobox-${scope}`}
            />
            <Combobox
                multiple
                aria-label={`${scope} companies`}
                options={LONG_OPTIONS}
                defaultValue={['c0']}
                data-testid={`hz-combobox-${scope}-multi`}
            />
        </>
    );
    return (
        <>
            <Dialog>
                <DialogTrigger asChild>
                    <Button
                        variant="secondary"
                        data-testid="hz-combobox-dialog-trigger"
                    >
                        Combobox dialog
                    </Button>
                </DialogTrigger>
                <DialogContent data-testid="hz-combobox-modal-dialog">
                    <DialogHeader>
                        <DialogTitle>Pick companies</DialogTitle>
                        <DialogDescription>
                            Combobox in a dialog
                        </DialogDescription>
                    </DialogHeader>
                    <DialogBody>{fields('dlg')}</DialogBody>
                </DialogContent>
            </Dialog>
            <Button
                variant="secondary"
                data-testid="hz-combobox-drawer-trigger"
                onClick={() => setDrawer(true)}
            >
                Combobox drawer
            </Button>
            <Drawer
                open={drawer}
                onOpenChange={setDrawer}
                title="Pick companies"
                data-testid="hz-combobox-modal-drawer"
                content={fields('drw')}
            />
        </>
    );
}

/** Opens a Drawer (customer360 passes widths like "90%"). */
function DetailsDrawer({ scope }: { scope: string }) {
    const [open, setOpen] = useState(false);
    return (
        <>
            <Button
                variant="secondary"
                data-testid={`${scope}-drawer-trigger`}
                onClick={() => setOpen(true)}
            >
                Drawer
            </Button>
            <Drawer
                open={open}
                onOpenChange={setOpen}
                title="Overlay drawer"
                width={480}
                data-testid={`${scope}-drawer`}
                content={
                    <>
                        <Input
                            aria-label="Drawer field"
                            data-testid={`${scope}-drawer-input`}
                        />
                        <ActionToastButton testId={`${scope}-drawer-toast`} />
                    </>
                }
                actions={
                    <Button
                        data-testid={`${scope}-drawer-save`}
                        onClick={() => setOpen(false)}
                    >
                        Save
                    </Button>
                }
            />
        </>
    );
}

function Overlays({ scope }: { scope: string }) {
    return (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <Tooltip
                content="Overlay tooltip text"
                data-testid={`${scope}-tooltip`}
            >
                <Button
                    variant="secondary"
                    data-testid={`${scope}-tooltip-trigger`}
                >
                    Tooltip
                </Button>
            </Tooltip>
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        variant="secondary"
                        data-testid={`${scope}-popover-trigger`}
                    >
                        Popover
                    </Button>
                </PopoverTrigger>
                <PopoverContent
                    title="Overlay popover"
                    data-testid={`${scope}-popover`}
                    footer={
                        <PopoverClose asChild>
                            <Button size="sm">Apply</Button>
                        </PopoverClose>
                    }
                >
                    <Input
                        aria-label="Popover field"
                        data-testid={`${scope}-popover-input`}
                    />
                </PopoverContent>
            </Popover>
            <Dialog>
                <DialogTrigger asChild>
                    <Button
                        variant="secondary"
                        data-testid={`${scope}-dialog-trigger`}
                    >
                        Dialog
                    </Button>
                </DialogTrigger>
                <DialogContent data-testid={`${scope}-dialog`}>
                    <DialogHeader>
                        <DialogTitle>Overlay dialog</DialogTitle>
                        <DialogDescription>
                            Dialog description
                        </DialogDescription>
                    </DialogHeader>
                    <DialogBody>
                        <Input
                            aria-label="Dialog field"
                            data-testid={`${scope}-dialog-input`}
                        />
                        {scope === 'hz' && <MuiFromHorizon />}
                        <ActionToastButton testId={`${scope}-dialog-toast`} />
                    </DialogBody>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="secondary">Cancel</Button>
                        </DialogClose>
                        <DialogClose asChild>
                            <Button data-testid={`${scope}-dialog-save`}>
                                Save
                            </Button>
                        </DialogClose>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <ConfirmDelete scope={scope} />
            <DetailsDrawer scope={scope} />
            <Button
                variant="secondary"
                data-testid={`${scope}-toast-trigger`}
                onClick={() =>
                    toast({
                        id: `${scope}-toast`,
                        variant: 'success',
                        title: 'Overlay toast',
                        description: 'Saved from the harness',
                        duration: Infinity,
                        'data-did': `${scope}-toast`,
                    })
                }
            >
                Toast
            </Button>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="secondary"
                        data-testid={`${scope}-menu-trigger`}
                    >
                        Menu
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent data-testid={`${scope}-menu`}>
                    <DropdownMenuItem
                        shortcut="Ctrl+E"
                        data-testid={`${scope}-menu-item`}
                    >
                        Export
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                        <a href="#menu-link" data-testid={`${scope}-menu-link`}>
                            Open history
                        </a>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuCheckboxItem checked>
                        Compact rows
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuItem destructive>Delete</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}

/**
 * An MUI Dialog with `keepMounted` (x-core Dialog v1, customer360
 * FilterModal) holding an inner HorizonProvider: in the DOM, hidden, while
 * closed.
 */
function KeptMuiDialog() {
    const [open, setOpen] = useState(false);
    return (
        <>
            <MuiButton
                data-testid="open-mui-kept"
                onClick={() => setOpen(true)}
            >
                Open kept MUI dialog
            </MuiButton>
            <MuiDialog open={open} onClose={() => setOpen(false)} keepMounted>
                <MuiDialogContent data-testid="mui-kept-content">
                    <HorizonProvider data-testid="mui-kept-provider">
                        <Button
                            variant="secondary"
                            data-testid="mui-kept-close"
                            onClick={() => setOpen(false)}
                        >
                            Close
                        </Button>
                    </HorizonProvider>
                </MuiDialogContent>
            </MuiDialog>
        </>
    );
}

/** A real MUI Dialog (z-index 1300) whose content holds every overlay. */
function OverlaysInMuiDialog() {
    const [open, setOpen] = useState(false);
    return (
        <>
            <MuiButton
                data-testid="open-mui-overlays"
                onClick={() => setOpen(true)}
            >
                Open MUI dialog with overlays
            </MuiButton>
            <MuiDialog
                open={open}
                onClose={() => setOpen(false)}
                data-testid="mui-overlays-dialog"
                {...muiDialogVariant}
            >
                <MuiDialogContent data-testid="mui-overlays-content">
                    <HorizonProvider>
                        <Overlays scope="mui" />
                    </HorizonProvider>
                </MuiDialogContent>
            </MuiDialog>
        </>
    );
}

function App() {
    return (
        <ThemeProvider theme={muiTheme}>
            <CssBaseline />
            <main style={{ padding: 16 }}>
                <section data-testid="mui">
                    <MuiTypography variant="h5" data-testid="mui-typography">
                        MUI section
                    </MuiTypography>
                    <MuiButton variant="contained" data-testid="mui-button">
                        MUI button
                    </MuiButton>
                </section>
                <section data-testid="plain">
                    <h1>Plain h1</h1>
                    <p>Plain p</p>
                    <a href="#plain">Plain a</a>
                    <ul>
                        <li>Plain li</li>
                    </ul>
                    <button type="button">Plain button</button>
                    <input aria-label="Plain input" />
                    <table>
                        <tbody>
                            <tr>
                                <td>Plain td</td>
                            </tr>
                        </tbody>
                    </table>
                </section>
                <section data-testid="horizon">
                    <HorizonProvider>
                        {(
                            [
                                'primary',
                                'secondary',
                                'tertiary',
                                'destructive',
                                'ghost',
                                'link',
                            ] as const
                        ).map((variant) => (
                            <Button
                                key={variant}
                                variant={variant}
                                data-testid={`hz-variant-${variant}`}
                            >
                                {variant}
                            </Button>
                        ))}
                        {(
                            [
                                'primary',
                                'secondary',
                                'tertiary',
                                'destructive',
                                'ghost',
                                'link',
                            ] as const
                        ).map((variant) => (
                            <Button
                                key={variant}
                                asChild
                                variant={variant}
                                data-testid={`hz-link-${variant}`}
                            >
                                <a href="#reports">{variant} link</a>
                            </Button>
                        ))}
                        <Button data-testid="hz-button">Horizon button</Button>
                        <Button loading data-testid="hz-ltr-loading">
                            Horizon ltr loading
                        </Button>
                        <div
                            data-testid="hz-bp-probe"
                            className="hz:text-micro hz:tablet:text-caption hz:laptop:text-body-default hz:desktop:text-heading-xl"
                        >
                            Breakpoint probe
                        </div>
                    </HorizonProvider>
                </section>
                <section data-testid="hz-components">
                    <HorizonProvider>
                        {TYPOGRAPHY_ROLES.map((variant) => (
                            <Typography
                                key={variant}
                                variant={variant}
                                data-testid={`hz-typo-${variant}`}
                            >
                                {variant}
                            </Typography>
                        ))}
                        <Typography
                            variant="body/default"
                            weight="semibold"
                            as="h5"
                            data-testid="hz-typo-h5"
                        >
                            h5 element
                        </Typography>
                        <Typography
                            variant="body/secondary"
                            as="h6"
                            data-testid="hz-typo-h6"
                        >
                            h6 element
                        </Typography>
                        {CHIP_TONES.map((variant) => (
                            <Chip
                                key={variant}
                                variant={variant}
                                label={variant}
                                data-testid={`hz-chip-${variant}`}
                            />
                        ))}
                        <Chip
                            appearance="outline"
                            variant="success"
                            size="sm"
                            label="outline sm"
                            data-testid="hz-chip-outline"
                        />
                        <Chip
                            label="action"
                            onClick={() => undefined}
                            onDelete={() => undefined}
                            data-testid="hz-chip-action"
                        />
                        <Chip
                            label="disabled"
                            disabled
                            onClick={() => undefined}
                            data-testid="hz-chip-disabled"
                        />
                        <ChipInRow />
                        <Badge variant="success" data-testid="hz-badge-label">
                            Approved
                        </Badge>
                        <Badge
                            variant="error"
                            count={12}
                            data-testid="hz-badge-count"
                        />
                        <Badge
                            variant="warning"
                            aria-label="Pending"
                            data-testid="hz-badge-dot"
                        />
                        <Badge variant="ai" data-testid="hz-badge-ai">
                            AI summary
                        </Badge>
                        <Badge
                            variant="ai-verified"
                            data-testid="hz-badge-ai-verified"
                        >
                            AI verified
                        </Badge>
                        <Alert
                            variant="warning"
                            title="Contract expired"
                            onDismiss={() => undefined}
                            action={
                                <Button variant="tertiary" size="sm">
                                    Renew
                                </Button>
                            }
                            data-testid="hz-alert"
                        >
                            Renew to keep ordering reports.
                        </Alert>
                        <Alert variant="info" data-testid="hz-alert-plain">
                            Few data credits left.
                        </Alert>
                        <Separator data-testid="hz-separator-h" />
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                            }}
                        >
                            <span>start</span>
                            <Separator
                                orientation="vertical"
                                decorative={false}
                                data-testid="hz-separator-v"
                            />
                            <span>end</span>
                        </div>
                        <Progress
                            value={30}
                            label="Profile completion"
                            showValue
                            data-testid="hz-progress"
                        />
                        <Progress
                            aria-label="Exporting"
                            data-testid="hz-progress-indeterminate"
                        />
                        <Spinner size="sm" data-testid="hz-spinner-sm" />
                        <Spinner
                            size="xl"
                            tone="muted"
                            data-testid="hz-spinner-xl"
                        />
                        <Spinner
                            size="lg"
                            value={40}
                            data-testid="hz-spinner-ring"
                        />
                        <Avatar name="Dana Levi" data-testid="hz-avatar-sm" />
                        <Avatar
                            name="Acme Trading"
                            size="xl"
                            shape="rounded"
                            tone="success"
                            data-testid="hz-avatar-xl"
                        />
                        <Avatar
                            name="Omer Katz"
                            size="lg"
                            src={AVATAR_PHOTO}
                            data-testid="hz-avatar-photo"
                        />
                        <AvatarGroup
                            size="md"
                            aria-label="Assignees"
                            data-testid="hz-avatar-group"
                        >
                            <Avatar name="Dana Levi" />
                            <Avatar name="Omer Katz" />
                            <Avatar name="Noa Peretz" />
                            <Avatar name="Tom Gil" />
                        </AvatarGroup>
                        {ICON_BUTTON_VARIANTS.map((variant) => (
                            <IconButton
                                key={variant}
                                variant={variant}
                                aria-label={`Edit ${variant}`}
                                data-testid={`hz-iconbutton-${variant}`}
                            >
                                <PencilIcon />
                            </IconButton>
                        ))}
                        {ICON_BUTTON_VARIANTS.map((variant) => (
                            <IconButton
                                key={variant}
                                asChild
                                variant={variant}
                                aria-label={`Open ${variant}`}
                                data-testid={`hz-iconlink-${variant}`}
                            >
                                <a href="#icon-link">
                                    <PencilIcon />
                                </a>
                            </IconButton>
                        ))}
                        <IconButton
                            size="sm"
                            disabled
                            aria-label="Edit disabled"
                            data-testid="hz-iconbutton-disabled"
                        >
                            <PencilIcon />
                        </IconButton>
                        <IconButton
                            size="lg"
                            loading
                            aria-label="Saving"
                            data-testid="hz-iconbutton-loading"
                        >
                            <PencilIcon />
                        </IconButton>
                        <p style={{ margin: 0 }}>
                            Read the{' '}
                            <Link href="#terms" data-testid="hz-anchor-inline">
                                terms
                            </Link>{' '}
                            first.
                        </p>
                        <Link
                            href="#all"
                            variant="standalone"
                            data-testid="hz-anchor-standalone"
                        >
                            View all
                        </Link>
                        <span style={{ color: 'rgb(20, 120, 60)' }}>
                            <Link
                                href="#doc"
                                variant="subtle"
                                data-testid="hz-anchor-subtle"
                            >
                                Subtle
                            </Link>
                        </span>
                        <Link
                            href="#ext"
                            variant="standalone"
                            size="sm"
                            isExternal
                            data-testid="hz-anchor-external"
                        >
                            External
                        </Link>
                        <Link
                            href="#off"
                            disabled
                            data-testid="hz-anchor-disabled"
                        >
                            Disabled
                        </Link>
                        <BadgeAnchor
                            data-testid="hz-badge-anchor"
                            badge={
                                <Badge
                                    variant="error"
                                    count={4}
                                    aria-label="4 unread"
                                    data-testid="hz-badge-anchored"
                                />
                            }
                        >
                            <Button variant="ghost">Inbox</Button>
                        </BadgeAnchor>
                    </HorizonProvider>
                </section>
                <section data-testid="hz-forms">
                    <HorizonProvider>
                        <Label
                            htmlFor="hz-form-input"
                            required
                            data-testid="hz-label"
                        >
                            Company name
                        </Label>
                        <Label disabled data-testid="hz-label-disabled">
                            Disabled label
                        </Label>
                        <Input
                            id="hz-form-input"
                            placeholder="Acme Ltd."
                            data-testid="hz-input"
                        />
                        <Input
                            size="sm"
                            aria-label="Small"
                            data-testid="hz-input-sm"
                        />
                        <Input
                            size="lg"
                            aria-label="Large"
                            data-testid="hz-input-lg"
                        />
                        <Input
                            aria-label="Invalid"
                            invalid
                            defaultValue="acme@"
                            data-testid="hz-input-invalid"
                        />
                        <Input
                            aria-label="Disabled"
                            disabled
                            defaultValue="off"
                            data-testid="hz-input-disabled"
                        />
                        <Input
                            type="number"
                            aria-label="Amount"
                            defaultValue={12}
                            data-testid="hz-input-number"
                        />
                        <Input
                            type="search"
                            aria-label="Search"
                            clearable
                            defaultValue="acme"
                            startAdornment={<PencilIcon />}
                            endAdornment={
                                <IconButton
                                    variant="ghost"
                                    size="sm"
                                    aria-label="Go"
                                >
                                    <PencilIcon />
                                </IconButton>
                            }
                            data-testid="hz-input-search"
                        />
                        <FormField
                            label="Email"
                            description="Work address"
                            error="Enter a valid email"
                            required
                            data-testid="hz-formfield"
                        >
                            <Input type="email" defaultValue="acme@" />
                        </FormField>
                        <div data-testid="hz-checkboxes">
                            <Checkbox
                                label="Unchecked"
                                data-testid="hz-checkbox"
                            />
                            <Checkbox
                                label="Checked"
                                defaultChecked
                                data-testid="hz-checkbox-checked"
                            />
                            <Checkbox
                                aria-label="Mixed"
                                size="sm"
                                checked="indeterminate"
                                data-testid="hz-checkbox-mixed"
                            />
                            <Checkbox
                                label="Disabled"
                                disabled
                                data-testid="hz-checkbox-disabled"
                            />
                        </div>
                        <RadioGroup
                            aria-label="Plan"
                            defaultValue="pro"
                            data-testid="hz-radiogroup"
                        >
                            <RadioGroupItem
                                value="basic"
                                label="Basic"
                                data-testid="hz-radio"
                            />
                            <RadioGroupItem
                                value="pro"
                                label="Pro"
                                data-testid="hz-radio-checked"
                            />
                            <RadioGroupItem
                                value="team"
                                label="Team"
                                disabled
                                data-testid="hz-radio-disabled"
                            />
                        </RadioGroup>
                        <div>
                            <Switch label="Alerts" data-testid="hz-switch" />
                            <Switch
                                label="On"
                                defaultChecked
                                data-testid="hz-switch-on"
                            />
                        </div>
                        <Select
                            aria-label="Company"
                            placeholder="Choose a company"
                            data-testid="hz-select"
                        >
                            {SELECT_OPTIONS.map((o) => (
                                <SelectItem key={o} value={o}>
                                    {o}
                                </SelectItem>
                            ))}
                        </Select>
                        <Select
                            aria-label="Owner"
                            defaultValue="Globex"
                            clearable
                            data-testid="hz-select-value"
                        >
                            {SELECT_OPTIONS.map((o) => (
                                <SelectItem key={o} value={o}>
                                    {o}
                                </SelectItem>
                            ))}
                        </Select>
                        <Combobox
                            aria-label="Company search"
                            placeholder="Search companies"
                            options={COMBOBOX_OPTIONS}
                            data-testid="hz-combobox"
                        />
                        <Combobox
                            aria-label="Owner search"
                            defaultValue="Globex"
                            clearable
                            options={COMBOBOX_OPTIONS}
                            data-testid="hz-combobox-value"
                        />
                        <Combobox
                            multiple
                            aria-label="Companies"
                            defaultValue={['Acme Ltd.', 'Globex']}
                            options={COMBOBOX_OPTIONS}
                            data-testid="hz-combobox-multi"
                        />
                        <SearchBar
                            aria-label="Search companies"
                            defaultValue="Acme"
                            data-testid="hz-searchbar"
                        />
                        <SearchBar
                            aria-label="Search loading"
                            loading
                            placeholder="Search"
                            data-testid="hz-searchbar-loading"
                        />
                        <div>
                            <SplitButton
                                options={['New decision', 'Import']}
                                data-testid="hz-split"
                            />
                            <SplitButton
                                variant="secondary"
                                options={['New decision', 'Import']}
                                data-testid="hz-split-secondary"
                            />
                        </div>
                        <NumberInput
                            aria-label="Rows"
                            defaultValue={5}
                            min={0}
                            max={10}
                            data-testid="hz-number"
                        />
                        <EmailsField
                            aria-label="Recipients"
                            defaultValue={['dana@example.com']}
                            limit={3}
                            clearable
                            data-testid="hz-emails"
                        />
                        <div>
                            <Filter
                                label="Severity"
                                options={COMBOBOX_OPTIONS}
                                value={['Globex']}
                                totalCount={4}
                                onChange={() => undefined}
                                data-testid="hz-filter"
                            />
                            <Filter
                                toggle
                                label="Expired"
                                options={[]}
                                value={['1']}
                                onChange={() => undefined}
                                data-testid="hz-filter-toggle"
                            />
                        </div>
                        <Pagination
                            page={3}
                            count={120}
                            rowsPerPage={10}
                            showTotalItems
                            showRowsPerPage
                            aria-label="Harness pagination"
                            data-testid="hz-pagination"
                        />
                        <HarnessTable />
                        <SelectInMuiDialog />
                        <Textarea
                            aria-label="Comment"
                            placeholder="Add a comment"
                            data-testid="hz-textarea"
                        />
                        <Textarea
                            aria-label="Notes"
                            invalid
                            resize="none"
                            rows={2}
                            data-testid="hz-textarea-invalid"
                        />
                        <Textarea
                            aria-label="Locked"
                            disabled
                            data-testid="hz-textarea-disabled"
                        />
                    </HorizonProvider>
                </section>
                <section data-testid="hz-overlays">
                    <HorizonProvider>
                        <Overlays scope="hz" />
                        <ComboboxInModals />
                        <TableInModals />
                        <OverlaysInMuiDialog />
                        <KeptMuiDialog />
                        <ToastProvider />
                    </HorizonProvider>
                </section>
                <section data-testid="hz-rtl-section">
                    <HorizonProvider dir="rtl">
                        <Button loading data-testid="hz-rtl-loading">
                            Horizon rtl loading
                        </Button>
                    </HorizonProvider>
                </section>
                <section data-testid="rtl-area" dir="rtl">
                    <MuiButton data-testid="mui-in-rtl">
                        MUI in rtl area
                    </MuiButton>
                    <HorizonProvider dir="ltr">
                        <Button loading data-testid="hz-ltr-in-rtl">
                            Horizon ltr in rtl
                        </Button>
                    </HorizonProvider>
                </section>
            </main>
        </ThemeProvider>
    );
}

const container = document.getElementById('root');
if (container) createRoot(container).render(<App />);
