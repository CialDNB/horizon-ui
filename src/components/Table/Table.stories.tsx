import type { Meta, StoryObj } from '@storybook/react-vite';
import { useLayoutEffect, useRef, useState } from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { HorizonProvider } from '../../provider';
import { ResponsiveSpec } from '../../stories/ResponsiveSpec';
import {
    storyLayout as layout,
    viewportStory,
    type Viewport,
} from '../../stories/viewports';
import {
    ColumnDataType,
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableFooter,
    TableHead,
    TableHeader,
    TableRoot,
    TableRow,
    type Column,
    type Order,
    type TableCellData,
    type TableProps,
} from '.';

type Company = {
    name: string;
    duns: string;
    city: string;
    employees: number;
    revenue: number;
    founded: string;
    risk: { label: string; color: string };
    status: { label: string; color: string };
    owners: { alt: string; src: string }[];
    progress: { percentage: number; label: string };
};

const NAMES = [
    'Acme Industries Ltd.',
    'Globex Corporation',
    'Initech',
    'Umbrella Holdings',
    'Stark Logistics',
    'Wayne Analytics',
    'Hooli',
    'Vandelay Import Export',
    'Soylent Foods',
    'Tyrell Systems',
    'Cyberdyne Robotics',
    'Wonka Confectionery',
];
const RISKS = [
    { label: 'Low', color: 'success' },
    { label: 'Medium', color: 'warning' },
    { label: 'High', color: 'error' },
];
const STATUSES = [
    { label: 'Active', color: 'success' },
    { label: 'Under review', color: 'info' },
    { label: 'Dormant', color: 'grey' },
];

const makeRows = (count: number): TableCellData<Company>[] =>
    Array.from({ length: count }, (_, i) => ({
        id: i + 1,
        rowData: {
            name: NAMES[i % NAMES.length] ?? 'Company',
            duns: String(514_000_000 + i * 7919).padStart(9, '0'),
            city: ['Haifa', 'Tel Aviv', 'Eilat', 'Jerusalem'][i % 4] ?? '',
            employees: ((i * 37) % 900) + 3,
            revenue: ((i * 104_729) % 9_000_000) + 12_500,
            founded: `${1980 + (i % 40)}-0${(i % 9) + 1}-1${i % 9}`,
            risk: RISKS[i % 3] ?? { label: 'Low', color: 'success' },
            status: STATUSES[i % 3] ?? { label: 'Active', color: 'success' },
            owners: [
                { alt: 'Dana Levi', src: '' },
                { alt: 'Omer Cohen', src: '' },
            ].slice(0, (i % 2) + 1),
            progress: { percentage: (i * 13) % 101, label: 'Onboarding' },
        },
    }));

const ROWS = makeRows(36);

const COLUMNS: Column<Company>[] = [
    { id: 'name', label: 'Company', minWidth: 180 },
    { id: 'duns', label: 'D-U-N-S', type: ColumnDataType.duns },
    { id: 'city', label: 'City', hideBelow: 'tablet' },
    {
        id: 'employees',
        label: 'Employees',
        type: 'numeric',
        info: 'Full-time employees at the last filing.',
    },
    {
        id: 'revenue',
        label: 'Revenue (USD)',
        type: 'numeric',
        render: (row) => row.revenue.toLocaleString('en-US'),
    },
    { id: 'founded', label: 'Founded', type: 'date', disableSort: true },
    { id: 'risk', label: 'Risk', type: 'chip', hideBelow: 'laptop' },
    { id: 'status', label: 'Status', type: 'status', disableSort: true },
];

const compare = (a: unknown, b: unknown) =>
    typeof a === 'number' && typeof b === 'number'
        ? a - b
        : String(a).localeCompare(String(b));

/** Sorting, selection and paging held in story state (as a page would). */
function Managed({
    data = ROWS,
    pageSize = 8,
    ...props
}: Partial<TableProps<Company>> & { pageSize?: number }) {
    const [order, setOrder] = useState<Order>('asc');
    const [orderBy, setOrderBy] = useState('name');
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(pageSize);
    const [selected, setSelected] = useState<(string | number)[]>([2]);
    const sorted = [...data].sort((a, b) => {
        const key = orderBy as keyof Company;
        const d = compare(a.rowData[key], b.rowData[key]);
        return order === 'asc' ? d : -d;
    });
    const rows = sorted.slice((page - 1) * limit, page * limit);
    return (
        <Table<Company>
            caption="Portfolio companies"
            columns={COLUMNS}
            data={rows}
            order={order}
            orderBy={orderBy}
            onRequestSort={(property, next) => {
                setOrderBy(property);
                setOrder(next);
            }}
            selectable
            selectedItems={selected}
            onCheckClick={(id) =>
                setSelected((s) =>
                    s.includes(id) ? s.filter((x) => x !== id) : [...s, id]
                )
            }
            onSelectAllClick={() => {
                const ids = rows.map((r) => r.id);
                setSelected((s) =>
                    ids.every((id) => s.includes(id))
                        ? s.filter((id) => !ids.includes(id))
                        : [...new Set([...s, ...ids])]
                );
            }}
            page={page}
            limit={limit}
            totalCount={data.length}
            onPageChange={setPage}
            paginationProps={{
                showRowsPerPage: true,
                showTotalItems: true,
                rowsPerPageOptions: [5, 8, 25],
                onRowsPerPageChange: (n) => {
                    setLimit(n);
                    setPage(1);
                },
            }}
            {...props}
        />
    );
}

const meta = {
    title: 'Components/Table',
    component: Table,
    parameters: {
        layout: 'padded',
        docs: {
            description: {
                component: [
                    'A data table from `columns` + `data` (the x-core `Table` contract: `Column`, `TableCellData`, `Order`, `ColumnDataType` keep their names), built on composable parts (`TableRoot`, `TableHeader`, `TableBody`, `TableFooter`, `TableRow`, `TableHead`, `TableCell`, `TableCaption`) that you can use directly for custom layouts.',
                    '',
                    'Real `<table>` markup: a caption, `scope` on headers, the first column as row headers, sort buttons inside headers with `aria-sort` (the change is announced), a selection column with an indeterminate select-all and `aria-selected` rows, clickable rows (Enter/Space on a focused row), expandable rows, loading (skeleton rows, `aria-busy`), empty and error states, and Pagination.',
                    '',
                    'Small screens (`responsive`): `scroll` (default, wide data tables) scrolls sideways inside a focusable region with edge shadows and keeps the first column in view; `stack` (short key/value tables) turns rows into cards. `hideBelow` moves a column into a per-row Details disclosure below `tablet` or `laptop`.',
                ].join('\n'),
            },
        },
    },
    args: { columns: COLUMNS, data: ROWS, onRowClick: fn() },
    render: (args) => (
        <Managed onRowClick={(id, event) => args.onRowClick?.(id, event)} />
    ),
} satisfies Meta<typeof Table<Company>>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Sortable, selectable and paginated, with built-in cell types. */
export const Playground: Story = {};

/** Sorting: buttons in the headers, aria-sort, an announcement. */
export const Sorting: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const header = canvas.getByRole('columnheader', { name: /^Employees/ });
        await userEvent.click(
            within(header).getByRole('button', { name: 'Employees' })
        );
        await expect(header).toHaveAttribute('aria-sort', 'ascending');
        await userEvent.click(
            within(header).getByRole('button', { name: 'Employees' })
        );
        await expect(header).toHaveAttribute('aria-sort', 'descending');
        await expect(canvas.getAllByRole('status')[0]).toHaveTextContent(
            'Sorted by Employees, descending'
        );
    },
};

/** Clickable rows and expandable rows (`rowOptions.collapseData`). */
export const RowsAndDetails: Story = {
    render: (args) => (
        <Managed
            onRowClick={(id, event) => args.onRowClick?.(id, event)}
            data={ROWS.slice(0, 6).map((row, i) => ({
                ...row,
                rowOptions:
                    i < 3
                        ? {
                              collapseData: (
                                  <p style={{ margin: 0 }}>
                                      {row.rowData.name}: three open alerts
                                      since the last review.
                                  </p>
                              ),
                              expanded: i === 0,
                          }
                        : i === 5
                          ? { disableRowSelect: true }
                          : {},
            }))}
        />
    ),
    play: async ({ canvasElement, args }) => {
        const canvas = within(canvasElement);
        const row = canvas
            .getByRole('rowheader', { name: 'Initech' })
            .closest('tr');
        if (!row) throw new Error('no row');
        await userEvent.click(within(row).getByText('Eilat'));
        await expect(args.onRowClick).toHaveBeenCalledWith(
            3,
            expect.anything()
        );
        const toggle = canvas.getByRole('button', { name: 'Details Initech' });
        await userEvent.click(toggle);
        await expect(toggle).toHaveAttribute('aria-expanded', 'true');
        await expect(
            canvas.getByText(/Initech: three open alerts/)
        ).toBeVisible();
    },
};

/** Loading, empty and error states. */
export const States: Story = {
    render: () => (
        <div style={layout.stack}>
            <Managed caption="Loading" loading pageSize={3} />
            <Managed
                caption="Empty"
                data={[]}
                emptyComponent="No companies match these filters."
            />
            <Managed
                caption="Error"
                error="Companies could not be loaded. Try again."
            />
        </div>
    ),
};

/** Comfortable density and zebra rows. */
export const DensityAndZebra: Story = {
    render: () => (
        <div style={layout.stack}>
            <Managed caption="Compact (default)" />
            <Managed
                caption="Comfortable, striped"
                density="comfortable"
                striped
            />
        </div>
    ),
};

const CELL_COLUMNS: Column<Company>[] = [
    { id: 'name', label: 'Text' },
    { id: 'duns', label: 'D-U-N-S', type: 'duns' },
    { id: 'employees', label: 'Numeric', type: 'numeric' },
    { id: 'founded', label: 'Date', type: 'date' },
    { id: 'risk', label: 'Chip', type: 'chip' },
    { id: 'status', label: 'Status', type: 'status' },
    { id: 'owners', label: 'Avatars', type: 'avatar' },
    { id: 'progress', label: 'Progress', type: 'progress' },
];

/** Every ported built-in cell type (customer360: chip, status, date, avatar, email, progress, titleSubtitle, priority). */
export const CellTypes: Story = {
    render: () => (
        <div style={layout.stack}>
            <Table<Company>
                caption="Built-in cell types"
                columns={CELL_COLUMNS}
                data={ROWS.slice(0, 4)}
                disablePagination
            />
            <Table<Record<string, unknown>>
                caption="More cell types"
                columns={[
                    {
                        id: 'who',
                        label: 'Title / subtitle',
                        type: 'titleSubtitle',
                    },
                    { id: 'emails', label: 'Emails', type: 'email' },
                    { id: 'priority', label: 'Priority', type: 'priority' },
                    { id: 'missing', label: 'Empty' },
                ]}
                data={[
                    {
                        id: 'a',
                        rowData: {
                            who: {
                                title: 'Dana Levi',
                                subtitle: 'Credit analyst',
                            },
                            emails: ['dana@example.com', 'd.levi@example.com'],
                            priority: 'high',
                        },
                    },
                    {
                        id: 'b',
                        rowData: {
                            who: { title: 'Omer Cohen', subtitle: 'Owner' },
                            emails: 'omer@example.com',
                            priority: 'non_critical',
                        },
                    },
                ]}
                disablePagination
            />
        </div>
    ),
};

/** Sticky header in a 320px scroll area (x-core `MuiTableProps.stickyHeader`). */
export const StickyHeader: Story = {
    render: () => (
        <Managed
            caption="Sticky header"
            stickyHeader
            maxBlockSize={320}
            pageSize={25}
            disablePagination
        />
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const scroller = canvasElement.querySelector<HTMLElement>(
            '[data-table-scroll]'
        );
        if (!scroller) throw new Error('no scroller');
        const header = canvas.getByRole('columnheader', { name: /Company/ });
        scroller.scrollTop = 200;
        // The caption scrolls away; the header row sticks to the area's top.
        await waitFor(() =>
            expect(Math.round(header.getBoundingClientRect().top)).toBe(
                Math.round(scroller.getBoundingClientRect().top)
            )
        );
        const firstRow = canvas.getAllByRole('rowheader')[0];
        await expect(firstRow?.getBoundingClientRect().top).toBeLessThan(
            header.getBoundingClientRect().top
        );
    },
};

/** Long text: a truncated column (full text in `title`) and long headers. */
export const LongText: Story = {
    render: () => (
        <Table<Company>
            caption="Companies with very long names and descriptions"
            columns={[
                {
                    id: 'name',
                    label: 'Registered company name',
                    truncate: true,
                    width: 160,
                },
                { id: 'city', label: 'City of the head office registration' },
                { id: 'employees', label: 'Employees', type: 'numeric' },
            ]}
            data={ROWS.slice(0, 4).map((r) => ({
                ...r,
                rowData: {
                    ...r.rowData,
                    name: `${r.rowData.name} International Holdings and Subsidiaries`,
                },
            }))}
            disablePagination
        />
    ),
    play: async ({ canvasElement }) => {
        const cell = within(canvasElement).getAllByRole('rowheader')[0];
        await expect(cell).toHaveAttribute(
            'title',
            expect.stringContaining('International Holdings')
        );
        const text = cell?.querySelector('span');
        if (!text) throw new Error('no text');
        // One line, cut with an ellipsis.
        await expect(getComputedStyle(text).textOverflow).toBe('ellipsis');
        await expect(text.scrollWidth).toBeGreaterThan(text.clientWidth);
    },
};

/** Stacked cards below tablet (`responsive="stack"`, short key/value tables). */
export const Stacked: Story = {
    render: () => (
        <Managed
            caption="Stacked on small screens"
            responsive="stack"
            pageSize={4}
        />
    ),
};

/** Composable parts for a custom layout. */
export const Composition: Story = {
    render: () => (
        <TableRoot density="comfortable">
            <TableCaption>Exposure by region</TableCaption>
            <TableHeader>
                <TableRow>
                    <TableHead>Region</TableHead>
                    <TableHead align="end">Companies</TableHead>
                    <TableHead align="end">Exposure (USD)</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {[
                    ['North', 42, '1,204,500'],
                    ['Center', 118, '9,880,120'],
                    ['South', 17, '310,000'],
                ].map(([region, count, amount]) => (
                    <TableRow key={region}>
                        <TableCell rowHeader>{region}</TableCell>
                        <TableCell numeric>{count}</TableCell>
                        <TableCell numeric>{amount}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
            <TableFooter>
                <TableRow hoverable={false}>
                    <TableCell rowHeader>Total</TableCell>
                    <TableCell numeric>177</TableCell>
                    <TableCell numeric>11,394,620</TableCell>
                </TableRow>
            </TableFooter>
        </TableRoot>
    ),
};

/** Right-to-left: alignment, sticky column and edge shadows mirror. */
export const RTL: Story = {
    globals: { direction: 'rtl' },
    render: () => (
        <div style={{ maxInlineSize: 520 }}>
            <Managed
                caption="חברות"
                labels={{
                    selectAll: 'בחר הכל',
                    selectRow: 'בחר',
                    details: 'פרטים',
                    empty: 'אין תוצאות',
                }}
            />
        </div>
    ),
    play: async ({ canvasElement }) => {
        const scroller = canvasElement.querySelector<HTMLElement>(
            '[data-table-scroll]'
        );
        const wrapper =
            canvasElement.querySelector<HTMLElement>('[data-table]');
        const end = canvasElement.querySelector<HTMLElement>(
            '[data-scroll-edge="end"]'
        );
        if (!scroller || !wrapper || !end) throw new Error('missing parts');
        // The end shadow is on the left under RTL.
        await expect(
            Math.abs(
                end.getBoundingClientRect().left -
                    wrapper.getBoundingClientRect().left
            )
        ).toBeLessThanOrEqual(1);
        const numeric = canvasElement.querySelector('td.hz\\:tabular-nums');
        await expect(numeric && getComputedStyle(numeric).textAlign).toBe(
            'end'
        );
        // Numbers sit at the inline end: the cell's left edge under RTL.
        const cellBox = numeric?.getBoundingClientRect();
        await expect(cellBox?.width).toBeGreaterThan(0);
    },
};

/** All three brands side by side. */
export const Brands: Story = {
    render: () => (
        <div style={layout.stack}>
            {(['cial', 'dnb', 'il'] as const).map((brand) => (
                <HorizonProvider
                    key={brand}
                    brand={brand}
                    style={{ background: 'var(--background)', padding: 16 }}
                >
                    <Managed
                        caption={`${brand} companies`}
                        pageSize={4}
                        striped
                        paginationProps={{
                            'aria-label': `${brand} pagination`,
                        }}
                    />
                </HorizonProvider>
            ))}
        </div>
    ),
};

/** Per-breakpoint specification (Responsive Standard). */
export const Responsive: Story = {
    render: () => (
        <ResponsiveSpec
            caption="Table responsive specification"
            spec={{
                mobile: {
                    size: '44px sort buttons, row checkboxes, details toggles and info buttons; compact rows 14px text (taller where a 44px control sits).',
                    density:
                        'Cells 12px padding (compact) / 16px (comfortable).',
                    layout: '`scroll` (default): the table keeps its grid and scrolls sideways inside a focusable region named by the caption; edge shadows show more content; the selection column and the row header stay sticky at the inline start. `stack`: each row is a bordered card of label/value pairs (labels from the column headers), sortable headers become a wrapping bar of 44px sort pills.',
                    contentVisibility:
                        '`hideBelow: "tablet" | "laptop"` columns are hidden; a Details toggle per row lists them (dt/dd). No page-level horizontal overflow at 320px.',
                    interaction:
                        'Swipe the table sideways; tap headers to sort; tap a row (or Enter/Space on a focused row) when rows are clickable; Pagination collapses to previous / indicator / next.',
                },
                tablet: {
                    size: 'Fine pointer: 24px sort buttons, 20px checkbox targets, 32px icon buttons (24px info). Touch: mobile sizes.',
                    density: 'As mobile.',
                    layout: 'Full grid. It still scrolls sideways when wider than the viewport (shadows, region). The row header is sticky only for columns marked `sticky`.',
                    contentVisibility:
                        '`hideBelow: "tablet"` columns appear; `"laptop"` ones stay in the Details row.',
                    interaction:
                        'Pointer hover tints rows; keyboard: Tab to sort buttons, checkboxes, toggles and clickable rows.',
                },
                laptop: {
                    size: 'As tablet.',
                    density: 'As tablet.',
                    layout: 'As tablet.',
                    contentVisibility:
                        'Every column; the Details toggle remains only for expandable rows (`collapseData`).',
                    interaction: 'As tablet.',
                },
                desktop: {
                    size: 'As tablet.',
                    density: 'As tablet.',
                    layout: 'As laptop.',
                    contentVisibility: 'As laptop.',
                    interaction: 'As tablet.',
                    note: 'Identical to laptop: the content already fits.',
                },
            }}
        />
    ),
};

/* ---- Viewport tests ---- */

const rect = (el: Element | null | undefined) =>
    el?.getBoundingClientRect() ?? new DOMRect();

async function assertScroll(canvasElement: HTMLElement, vp: Viewport) {
    const canvas = within(canvasElement);
    const scroller = canvasElement.querySelector<HTMLElement>(
        '[data-table-scroll]'
    );
    if (!scroller) throw new Error('no scroller');
    const th = (text: string) =>
        Array.from(canvasElement.querySelectorAll('th')).find(
            (cell) => cell.textContent === text
        );
    const city = th('City');
    const risk = th('Risk');
    const sort = within(
        canvas.getByRole('columnheader', { name: /Company/ })
    ).getByRole('button');
    const toggle = canvas.getAllByRole('button', {
        name: /^Details /,
        hidden: true,
    })[0];
    const rowHeader = canvas.getAllByRole('rowheader')[0];
    // The page never scrolls sideways.
    await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(
        window.innerWidth
    );
    if (vp === 'mobile') {
        await expect(scroller.scrollWidth).toBeGreaterThan(
            scroller.clientWidth
        );
        await waitFor(() => expect(scroller).toHaveAttribute('role', 'region'));
        await expect(scroller).toHaveAttribute('tabindex', '0');
        await expect(scroller).toHaveAccessibleName('Portfolio companies');
        await expect(rect(sort).height).toBe(44);
        await expect(rect(city).width).toBe(0);
        await expect(rect(risk).width).toBe(0);
        await expect(rect(toggle).height).toBe(44);
        await expect(rowHeader && getComputedStyle(rowHeader).position).toBe(
            'sticky'
        );
        const end = canvasElement.querySelector('[data-scroll-edge="end"]');
        const start = canvasElement.querySelector('[data-scroll-edge="start"]');
        await waitFor(() =>
            expect(end && getComputedStyle(end).opacity).toBe('1')
        );
        await expect(start && getComputedStyle(start).opacity).toBe('0');
        scroller.scrollLeft = 200;
        await waitFor(() =>
            expect(start && getComputedStyle(start).opacity).toBe('1')
        );
        // The start shadow begins after the sticky columns.
        await waitFor(() =>
            expect(Math.round(rect(start).left - rect(rowHeader).right)).toBe(0)
        );
        // The row header stays at the inline start (after the 56px selection column).
        await expect(
            Math.round(rect(rowHeader).left - rect(scroller).left)
        ).toBe(56);
    } else {
        await expect(rect(sort).height).toBe(24);
        await expect(
            rowHeader && getComputedStyle(rowHeader).position
        ).not.toBe('sticky');
        await expect(rect(city).width).toBeGreaterThan(0);
        if (vp === 'tablet') {
            await expect(rect(risk).width).toBe(0);
            await expect(rect(toggle).height).toBe(32);
        } else {
            await expect(rect(risk).width).toBeGreaterThan(0);
            await expect(rect(toggle).width).toBe(0);
            await expect(scroller).not.toHaveAttribute('role');
        }
    }
}

const scrollProbe = () => <Managed pageSize={5} />;

export const ScrollMobile: Story = {
    ...viewportStory('mobile', scrollProbe, assertScroll),
    name: 'scrolls sideways with a sticky first column at mobile',
};
export const ScrollTablet: Story = {
    ...viewportStory('tablet', scrollProbe, assertScroll),
    name: 'shows tablet columns; laptop columns in details at tablet',
};
export const ScrollLaptop: Story = {
    ...viewportStory('laptop', scrollProbe, assertScroll),
    name: 'shows every column without details at laptop',
};
export const ScrollDesktop: Story = {
    ...viewportStory('desktop', scrollProbe, assertScroll),
    name: 'shows every column without details at desktop',
};

async function assertStack(canvasElement: HTMLElement, vp: Viewport) {
    const canvas = within(canvasElement);
    const row = canvas.getAllByRole('rowheader')[0]?.closest('tr');
    const cell = row?.querySelector<HTMLElement>('td[data-label="D-U-N-S"]');
    if (!row || !cell) throw new Error('no row');
    const box = canvasElement.querySelector<HTMLElement>(
        '[data-testid="narrow"]'
    );
    const founded = canvas.getByRole('columnheader', { name: 'Founded' });
    if (vp === 'mobile') {
        // No horizontal overflow in a 320px column.
        await expect(box && box.scrollWidth).toBeLessThanOrEqual(320);
        await expect(getComputedStyle(row).display).toBe('block');
        await expect(getComputedStyle(cell).display).toBe('grid');
        await expect(getComputedStyle(cell, '::before').content).toBe(
            '"D-U-N-S"'
        );
        // A `hideBelow: 'tablet'` column is not in the card (it is in Details).
        const city = row.querySelector<HTMLElement>('td[data-label="City"]');
        await expect(city && getComputedStyle(city).display).toBe('none');
        // Not sortable: kept for screen readers, out of the header bar.
        await expect(rect(founded).width).toBe(1);
        const sort = within(
            canvas.getByRole('columnheader', { name: /Company/ })
        ).getByRole('button');
        await expect(rect(sort).height).toBe(44);
    } else {
        await expect(getComputedStyle(row).display).toBe('table-row');
        await expect(getComputedStyle(cell).display).toBe('table-cell');
        await expect(rect(founded).width).toBeGreaterThan(1);
    }
}

const stackProbe = () => (
    <div data-testid="narrow" style={{ inlineSize: 320, maxWidth: '100%' }}>
        <Managed responsive="stack" pageSize={3} />
    </div>
);

export const StackMobile: Story = {
    ...viewportStory('mobile', stackProbe, assertStack),
    name: 'stacks rows into label/value cards at mobile (320px)',
};
export const StackTablet: Story = {
    ...viewportStory('tablet', stackProbe, assertStack),
    name: 'is a grid again from tablet',
};

/** Header, zebra, hover and selected surfaces come from the tokens. */
export const ComputedStyles: Story = {
    name: 'applies Horizon tokens to header, zebra, hover and selected rows',
    tags: ['!autodocs', '!dev'],
    render: () => (
        <div>
            <Managed striped pageSize={4} data={ROWS.slice(0, 12)} />
            <span
                data-testid="probe"
                style={{
                    color: 'var(--neutral-strong)',
                    background: 'var(--neutral-subtle)',
                    borderColor: 'var(--control-border)',
                    outlineColor: 'var(--accent)',
                    caretColor: 'var(--primary)',
                }}
            />
            <span
                data-testid="mix"
                style={{
                    background:
                        'color-mix(in srgb, var(--muted) 30%, var(--background))',
                }}
            />
        </div>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const probe = getComputedStyle(canvas.getByTestId('probe'));
        const mix = getComputedStyle(canvas.getByTestId('mix'));
        const th = getComputedStyle(
            canvas.getByRole('columnheader', { name: 'City' })
        );
        await expect(th.backgroundColor).toBe(probe.backgroundColor);
        await expect(th.color).toBe(probe.color);
        await expect(th.borderBottomColor).toBe(probe.borderColor);
        const header = (name: RegExp) =>
            canvas.getByRole('rowheader', { name });
        // Sorted by name: Acme, Cyberdyne (zebra), Globex (selected), Hooli.
        const selectedRow = header(/^Globex/).closest('tr');
        const firstCell = selectedRow?.querySelector('td');
        if (!firstCell) throw new Error('no cell');
        await expect(getComputedStyle(firstCell).backgroundColor).toBe(
            probe.outlineColor
        );
        await expect(getComputedStyle(firstCell).borderInlineStartColor).toBe(
            probe.caretColor
        );
        await expect(getComputedStyle(firstCell).borderInlineStartWidth).toBe(
            '4px'
        );
        const zebra = header(/^Cyberdyne/);
        await expect(getComputedStyle(zebra).backgroundColor).toBe(
            mix.backgroundColor
        );
        // A rest row is the page background. Hover needs a real pointer: it
        // is measured in the coexistence suite (coexistence/tests).
        const root = canvasElement.querySelector('.hz-root');
        await expect(getComputedStyle(header(/^Acme/)).backgroundColor).toBe(
            root && getComputedStyle(root).backgroundColor
        );
    },
};

const PLAIN_COLUMNS: Column<Company>[] = COLUMNS.map((c) => ({
    id: c.id,
    label: c.label,
}));

/** Times the first commit of a 500-row table with the given columns; Clear unmounts it. */
function TimedTable({
    name,
    columns,
}: {
    name: string;
    columns: Column<Company>[];
}) {
    const [show, setShow] = useState(false);
    const started = useRef(0);
    const [elapsed, setElapsed] = useState<number | null>(null);
    useLayoutEffect(() => {
        if (show && elapsed === null)
            setElapsed(performance.now() - started.current);
    }, [show, elapsed]);
    return (
        <div>
            <button
                type="button"
                onClick={() => {
                    started.current = performance.now();
                    setShow(true);
                }}
            >
                Render {name}
            </button>
            <button
                type="button"
                onClick={() => {
                    setShow(false);
                    setElapsed(null);
                }}
            >
                Clear {name}
            </button>
            {elapsed !== null && (
                <output data-testid={`elapsed-${name}`}>
                    {Math.round(elapsed)}
                </output>
            )}
            {show && (
                <Table<Company>
                    caption={`500 rows, ${name}`}
                    columns={columns}
                    data={makeRows(500)}
                    disablePagination
                />
            )}
        </div>
    );
}

/**
 * 500 rows x 8 columns with rich cells (chips, badges, dates, an info
 * tooltip) cost at most 5x the same table with plain text. Both are
 * rendered three times, alternating, after a warm-up, and the fastest of
 * each is compared: a ratio in the same run, so machine load and JIT
 * warm-up cancel out. Storybook runs React in development mode. Measured
 * (Task 12a review): plain ~38ms, rich ~125ms, ratio ~3.3. Virtualization is a future option (no
 * dependency).
 */
export const Performance: Story = {
    name: 'renders 500 rich rows within 5x of plain text',
    tags: ['!autodocs', '!dev'],
    render: () => (
        <div>
            <Table<Company>
                caption="Warm-up, rich"
                columns={COLUMNS}
                data={makeRows(50)}
                disablePagination
            />
            <Table<Company>
                caption="Warm-up, plain"
                columns={PLAIN_COLUMNS}
                data={makeRows(50)}
                disablePagination
            />
            <TimedTable name="plain" columns={PLAIN_COLUMNS} />
            <TimedTable name="rich" columns={COLUMNS} />
        </div>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const time = async (name: string) => {
            await userEvent.click(
                canvas.getByRole('button', { name: `Render ${name}` })
            );
            const out = await canvas.findByTestId(`elapsed-${name}`);
            const ms = Number(out.textContent);
            await userEvent.click(
                canvas.getByRole('button', { name: `Clear ${name}` })
            );
            return ms;
        };
        const plain: number[] = [];
        const rich: number[] = [];
        for (let round = 0; round < 3; round++) {
            plain.push(await time('plain'));
            rich.push(await time('rich'));
        }
        await expect(
            Math.min(...rich) / Math.max(Math.min(...plain), 1)
        ).toBeLessThan(5);
    },
};
