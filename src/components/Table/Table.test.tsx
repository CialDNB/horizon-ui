import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, useState, type Ref } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { resetWarnings } from '../../lib/options';
import { HorizonProvider } from '../../provider';
import {
    ColumnDataType,
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRoot,
    TableRow,
    type Column,
    type Order,
    type TableCellData,
    type TableProps,
} from '.';

afterEach(() => {
    resetWarnings();
    vi.restoreAllMocks();
});

type Company = {
    name: string;
    city: string;
    employees: number;
    founded: string;
    risk: { label: string; color: string };
    owner?: { name: string };
};

const COLUMNS: Column<Company>[] = [
    { id: 'name', label: 'Name' },
    { id: 'city', label: 'City' },
    { id: 'employees', label: 'Employees', type: ColumnDataType.numeric },
    { id: 'founded', label: 'Founded', type: 'date', disableSort: true },
    { id: 'risk', label: 'Risk', type: 'chip' },
];

const DATA: TableCellData<Company>[] = [
    {
        id: 1,
        rowData: {
            name: 'Acme Ltd.',
            city: 'Haifa',
            employees: 120,
            founded: '2001-01-05',
            risk: { label: 'High', color: 'error' },
        },
    },
    {
        id: 2,
        rowData: {
            name: 'Globex',
            city: 'Tel Aviv',
            employees: 48,
            founded: '1999-12-31',
            risk: { label: 'Low', color: 'success' },
            owner: { name: 'Dana' },
        },
    },
    {
        id: 3,
        rowData: {
            name: 'Initech',
            city: 'Eilat',
            employees: 7,
            founded: '2015-06-15',
            risk: { label: 'Medium', color: 'warning' },
        },
        rowOptions: { disableRowSelect: true },
    },
];

function renderTable(
    props: Partial<TableProps<Company>> & { ref?: Ref<HTMLDivElement> } = {}
) {
    return render(
        <HorizonProvider>
            <Table<Company>
                caption="Companies"
                columns={COLUMNS}
                data={DATA}
                disablePagination
                {...props}
            />
        </HorizonProvider>
    );
}

const table = () => screen.getByRole('table', { name: 'Companies' });
const rowOf = (name: string) =>
    screen.getByRole('rowheader', { name }).closest('tr') as HTMLElement;

describe('Table semantics', () => {
    it('is a real table named by its caption, with column and row headers', () => {
        renderTable();
        expect(table().tagName).toBe('TABLE');
        const headers = within(table()).getAllByRole('columnheader');
        expect(headers.map((h) => h.textContent)).toEqual([
            'Name',
            'City',
            'Employees',
            'Founded',
            'Risk',
        ]);
        for (const h of headers) expect(h).toHaveAttribute('scope', 'col');
        const rowHeader = screen.getByRole('rowheader', { name: 'Acme Ltd.' });
        expect(rowHeader.tagName).toBe('TH');
        expect(rowHeader).toHaveAttribute('scope', 'row');
        expect(within(table()).getAllByRole('row')).toHaveLength(4);
    });

    it('built-in renderers: numeric end-aligned, dates, chips, empty values, dotted paths', () => {
        renderTable({
            columns: [
                ...COLUMNS,
                { id: 'owner.name', label: 'Owner' },
                {
                    id: 'name',
                    label: 'Upper',
                    render: (row) => row.name.toUpperCase(),
                },
            ],
        });
        const acme = rowOf('Acme Ltd.');
        const employees = within(acme).getByText('120');
        expect(employees).toHaveClass('hz:text-end', 'hz:tabular-nums');
        expect(
            within(acme).getByText('Jan 05 2001').closest('time')
        ).toHaveAttribute('datetime');
        expect(within(acme).getByText('High')).toBeVisible();
        // A missing value shows "-" (x-core).
        expect(within(acme).getByText('-')).toBeVisible();
        expect(within(rowOf('Globex')).getByText('Dana')).toBeVisible();
        expect(within(acme).getByText('ACME LTD.')).toBeVisible();
    });

    it('numeric headers align to the end; left/right map to start/end', () => {
        renderTable({
            columns: [
                { id: 'name', label: 'Name', align: 'right' },
                { id: 'employees', label: 'Employees', type: 'numeric' },
            ],
        });
        expect(
            screen.getByRole('columnheader', { name: 'Employees' })
        ).toHaveClass('hz:text-end');
        expect(screen.getByRole('columnheader', { name: 'Name' })).toHaveClass(
            'hz:text-end'
        );
    });
});

describe('Table sorting', () => {
    function Sortable(props: Partial<TableProps<Company>>) {
        const [order, setOrder] = useState<Order>('asc');
        const [orderBy, setOrderBy] = useState('name');
        return (
            <HorizonProvider>
                <Table<Company>
                    caption="Companies"
                    columns={COLUMNS}
                    data={DATA}
                    disablePagination
                    order={order}
                    orderBy={orderBy}
                    onRequestSort={(property, next) => {
                        setOrderBy(property);
                        setOrder(next);
                        props.onRequestSort?.(property, next);
                    }}
                />
            </HorizonProvider>
        );
    }

    it('sortable headers are buttons; the sorted header has aria-sort', () => {
        render(<Sortable />);
        const name = screen.getByRole('columnheader', { name: 'Name' });
        expect(name).toHaveAttribute('aria-sort', 'ascending');
        expect(
            screen.getByRole('columnheader', { name: 'City' })
        ).not.toHaveAttribute('aria-sort');
        expect(
            within(name).getByRole('button', { name: 'Name' })
        ).toBeVisible();
        // disableSort: plain text, no button.
        expect(
            within(
                screen.getByRole('columnheader', { name: 'Founded' })
            ).queryByRole('button')
        ).toBeNull();
    });

    it('the sorted column toggles; another column starts ascending; announced once', async () => {
        const user = userEvent.setup();
        const onRequestSort = vi.fn();
        render(<Sortable onRequestSort={onRequestSort} />);
        const status = screen.getByRole('status');
        expect(status).toHaveTextContent('');
        await user.click(screen.getByRole('button', { name: 'Name' }));
        expect(onRequestSort).toHaveBeenLastCalledWith('name', 'desc');
        expect(
            screen.getByRole('columnheader', { name: 'Name' })
        ).toHaveAttribute('aria-sort', 'descending');
        expect(status).toHaveTextContent('Sorted by Name, descending');
        await user.click(screen.getByRole('button', { name: 'City' }));
        expect(onRequestSort).toHaveBeenLastCalledWith('city', 'asc');
        expect(status).toHaveTextContent('Sorted by City, ascending');
    });

    it('keyboard: Enter on a sort button sorts', async () => {
        const user = userEvent.setup();
        const onRequestSort = vi.fn();
        render(<Sortable onRequestSort={onRequestSort} />);
        screen.getByRole('button', { name: 'Employees' }).focus();
        await user.keyboard('{Enter}');
        expect(onRequestSort).toHaveBeenLastCalledWith('employees', 'asc');
    });

    it('without onRequestSort there are no sort buttons', () => {
        renderTable({ orderBy: 'name' });
        expect(within(table()).queryAllByRole('button')).toHaveLength(0);
    });
});

describe('Table selection and row click', () => {
    it('a checkbox column: named rows, aria-selected, select-all state', async () => {
        const user = userEvent.setup();
        const onCheckClick = vi.fn();
        const onSelectAllClick = vi.fn();
        const onRowClick = vi.fn();
        const { rerender } = renderTable({
            selectable: true,
            selectedItems: [1],
            onCheckClick,
            onSelectAllClick,
            onRowClick,
        });
        const acme = screen.getByRole('checkbox', { name: 'Select Acme Ltd.' });
        expect(acme).toBeChecked();
        expect(rowOf('Acme Ltd.')).toHaveAttribute('aria-selected', 'true');
        expect(rowOf('Globex')).toHaveAttribute('aria-selected', 'false');
        const all = screen.getByRole('checkbox', { name: 'Select all rows' });
        expect(all).toHaveAttribute('aria-checked', 'mixed');
        await user.click(
            screen.getByRole('checkbox', { name: 'Select Globex' })
        );
        expect(onCheckClick).toHaveBeenCalledWith(2);
        // The checkbox is its own action: no row click.
        expect(onRowClick).not.toHaveBeenCalled();
        await user.click(all);
        expect(onSelectAllClick).toHaveBeenCalledTimes(1);
        // Initech has disableRowSelect: disabled, and not counted for select-all.
        expect(
            screen.getByRole('checkbox', { name: 'Select Initech' })
        ).toBeDisabled();
        rerender(
            <HorizonProvider>
                <Table<Company>
                    caption="Companies"
                    columns={COLUMNS}
                    data={DATA}
                    disablePagination
                    selectable
                    selectedItems={[1, 2]}
                />
            </HorizonProvider>
        );
        expect(
            screen.getByRole('checkbox', { name: 'Select all rows' })
        ).toBeChecked();
    });

    it('disableSelectAll keeps the column without a select-all box', () => {
        renderTable({ selectable: true, disableSelectAll: true });
        expect(
            screen.queryByRole('checkbox', { name: 'Select all rows' })
        ).toBeNull();
        expect(
            screen.getByRole('columnheader', { name: 'Selection' })
        ).toBeInTheDocument();
    });

    it('rows are not selectable unless asked (x-core showed an empty checkbox column)', () => {
        renderTable();
        expect(screen.queryAllByRole('checkbox')).toHaveLength(0);
        expect(rowOf('Acme Ltd.')).not.toHaveAttribute('aria-selected');
    });

    it('row click: pointer anywhere but on controls, Enter/Space on the focused row', async () => {
        const user = userEvent.setup();
        const onRowClick = vi.fn();
        const onButton = vi.fn();
        renderTable({
            onRowClick,
            columns: [
                ...COLUMNS,
                {
                    id: 'action',
                    label: 'Action',
                    render: (row) => (
                        <button type="button" onClick={onButton}>
                            Open {row.name}
                        </button>
                    ),
                },
            ],
        });
        await user.click(screen.getByText('Haifa'));
        expect(onRowClick).toHaveBeenLastCalledWith(1, expect.anything());
        await user.click(screen.getByRole('button', { name: 'Open Globex' }));
        expect(onButton).toHaveBeenCalledTimes(1);
        expect(onRowClick).toHaveBeenCalledTimes(1);
        const globex = rowOf('Globex');
        expect(globex).toHaveAttribute('tabindex', '0');
        globex.focus();
        await user.keyboard('{Enter}');
        expect(onRowClick).toHaveBeenLastCalledWith(2, expect.anything());
        await user.keyboard(' ');
        expect(onRowClick).toHaveBeenCalledTimes(3);
        // disableRowSelect: not clickable, not focusable.
        const initech = rowOf('Initech');
        expect(initech).not.toHaveAttribute('tabindex');
        await user.click(within(initech).getByText('Eilat'));
        expect(onRowClick).toHaveBeenCalledTimes(3);
    });
});

describe('Table states', () => {
    it('loading: aria-busy, hidden skeleton rows, announced, pagination disabled', () => {
        renderTable({
            loading: true,
            limit: 4,
            disablePagination: false,
            totalCount: 40,
        });
        expect(screen.getByRole('table')).toHaveAttribute('aria-busy', 'true');
        expect(
            document.querySelectorAll('tr[data-skeleton][aria-hidden="true"]')
        ).toHaveLength(4);
        expect(screen.queryByText('Acme Ltd.')).toBeNull();
        expect(screen.getAllByRole('status')[0]).toHaveTextContent('Loading');
        expect(
            screen.getByRole('button', { name: 'Next page' })
        ).toHaveAttribute('aria-disabled', 'true');
    });

    it('empty: default text, custom content, announced when rows disappear', () => {
        const { rerender } = renderTable();
        const status = screen.getAllByRole('status')[0];
        expect(status).toHaveTextContent('');
        rerender(
            <HorizonProvider>
                <Table<Company>
                    caption="Companies"
                    columns={COLUMNS}
                    data={[]}
                    disablePagination
                />
            </HorizonProvider>
        );
        expect(
            within(screen.getByRole('table')).getByText('No results')
        ).toBeVisible();
        expect(status).toHaveTextContent('No results');
        rerender(
            <HorizonProvider>
                <Table<Company>
                    caption="Companies"
                    columns={COLUMNS}
                    data={[]}
                    disablePagination
                    emptyComponent={<strong>Nothing matches</strong>}
                />
            </HorizonProvider>
        );
        expect(screen.getByText('Nothing matches')).toBeVisible();
        const cell = screen.getByText('Nothing matches').closest('td');
        expect(cell).toHaveAttribute('colspan', '5');
    });

    it('error: an alert instead of rows', () => {
        renderTable({ error: 'Could not load companies.' });
        expect(screen.getByRole('alert')).toHaveTextContent(
            'Could not load companies.'
        );
        expect(screen.queryByText('Acme Ltd.')).toBeNull();
    });
});

describe('Table details', () => {
    it('expandable rows (collapseData): a named toggle with aria-expanded', async () => {
        const user = userEvent.setup();
        renderTable({
            data: DATA.map((row, i) =>
                i === 0
                    ? {
                          ...row,
                          rowOptions: { collapseData: <p>Acme history</p> },
                      }
                    : i === 1
                      ? {
                            ...row,
                            rowOptions: {
                                collapseData: <p>Globex history</p>,
                                expanded: true,
                            },
                        }
                      : row
            ),
        });
        const toggle = screen.getByRole('button', {
            name: 'Details Acme Ltd.',
        });
        expect(toggle).toHaveAttribute('aria-expanded', 'false');
        expect(screen.getByText('Acme history')).not.toBeVisible();
        expect(screen.getByText('Globex history')).toBeVisible();
        await user.click(toggle);
        expect(toggle).toHaveAttribute('aria-expanded', 'true');
        expect(screen.getByText('Acme history')).toBeVisible();
        const details = document.getElementById(
            toggle.getAttribute('aria-controls') ?? ''
        );
        expect(details).toContainElement(screen.getByText('Acme history'));
    });

    it('hideBelow columns are hidden on small screens and listed in the row details', async () => {
        const user = userEvent.setup();
        renderTable({
            columns: COLUMNS.map((c) =>
                c.id === 'city'
                    ? { ...c, hideBelow: 'tablet' as const }
                    : c.id === 'risk'
                      ? { ...c, hideBelow: 'laptop' as const }
                      : c
            ),
        });
        const city = screen.getByRole('columnheader', { name: 'City' });
        expect(city).toHaveClass('hz:hidden', 'hz:tablet:table-cell');
        expect(screen.getByRole('columnheader', { name: 'Risk' })).toHaveClass(
            'hz:hidden',
            'hz:laptop:table-cell'
        );
        const toggle = screen.getByRole('button', {
            name: 'Details Globex',
        });
        // The toggle exists only below the widest hideBelow (laptop).
        expect(toggle.closest('td')).toHaveClass('hz:laptop:hidden');
        await user.click(toggle);
        const details = document.getElementById(
            toggle.getAttribute('aria-controls') ?? ''
        ) as HTMLElement;
        const terms = within(details).getAllByRole('term');
        expect(terms.map((t) => t.textContent)).toEqual(['City', 'Risk']);
        expect(within(details).getByText('Tel Aviv')).toBeInTheDocument();
        expect(terms[0]?.parentElement).toHaveClass('hz:tablet:hidden');
    });
});

describe('Table pagination and layout', () => {
    it('Pagination below the table reports (page, currentPage)', async () => {
        const user = userEvent.setup();
        const onPageChange = vi.fn();
        renderTable({
            disablePagination: false,
            page: 2,
            limit: 3,
            totalCount: 30,
            onPageChange,
            tableActions: <button type="button">Export</button>,
            paginationProps: { showRowsPerPage: true, showTotalItems: true },
        });
        expect(
            screen.getByRole('navigation', { name: 'Pagination: Companies' })
        ).toHaveTextContent('4–6 of 30');
        await user.click(screen.getByRole('button', { name: 'Next page' }));
        expect(onPageChange).toHaveBeenCalledWith(3, 2);
        expect(screen.getByRole('button', { name: 'Export' })).toBeVisible();
        expect(
            screen.getByRole('combobox', { name: 'Rows per page' })
        ).toBeVisible();
    });

    it('disablePagination hides the page buttons; rows-per-page alone still shows', () => {
        renderTable({ paginationProps: { showRowsPerPage: true } });
        expect(screen.queryByRole('button', { name: 'Next page' })).toBeNull();
        expect(
            screen.getByRole('combobox', { name: 'Rows per page' })
        ).toBeVisible();
    });

    it('stacked layout labels each value; striped rows; density', () => {
        renderTable({
            responsive: 'stack',
            striped: true,
            density: 'comfortable',
        });
        const city = within(rowOf('Acme Ltd.'))
            .getByText('Haifa')
            .closest('td');
        expect(city).toHaveAttribute('data-label', 'City');
        expect(table()).toHaveAttribute('data-density', 'comfortable');
        expect(table()).toHaveAttribute('data-responsive', 'stack');
        // Explicit roles survive the block/grid display below tablet.
        expect(table()).toHaveAttribute('role', 'table');
        expect(rowOf('Acme Ltd.')).toHaveAttribute('role', 'row');
        expect(city).toHaveAttribute('role', 'cell');
        expect(
            screen.getByRole('rowheader', { name: 'Acme Ltd.' })
        ).toHaveAttribute('role', 'rowheader');
        expect(
            screen.getByRole('columnheader', { name: /^City/ })
        ).toHaveAttribute('role', 'columnheader');
        const cellsOf = (name: string) =>
            within(rowOf(name)).getByText(
                name === 'Globex' ? 'Tel Aviv' : 'Haifa'
            );
        expect(cellsOf('Globex').closest('td')?.className).toContain(
            'color-mix(in_srgb,var(--muted)_30%'
        );
        expect(cellsOf('Acme Ltd.').closest('td')).toHaveClass(
            'hz:bg-background'
        );
    });

    it('a footer row, hidden header, ref and data-did on the wrapper', () => {
        const ref = createRef<HTMLDivElement>();
        renderTable({
            ref,
            hideHeader: true,
            'data-did': 'companies',
            className: 'custom',
            footerRow: (
                <>
                    <TableCell>Total</TableCell>
                    <TableCell colSpan={4}>3</TableCell>
                </>
            ),
        });
        expect(screen.queryAllByRole('columnheader')).toHaveLength(0);
        expect(ref.current).toHaveAttribute('data-did', 'companies');
        expect(ref.current).toHaveClass('custom');
        expect(screen.getByText('Total').closest('tfoot')).not.toBeNull();
    });

    it('drops x-core props with a warning (loader, MuiTableProps, MuiPaginationProps, column settings)', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const legacy = {
            loader: false,
            MuiTableProps: { stickyHeader: true },
            MuiPaginationProps: { showRowsPerPage: true },
            showColumnSettings: true,
            headerBackgroundColor: '#fff',
        } as unknown as Partial<TableProps<Company>>;
        const { container } = renderTable(legacy);
        const wrapper = container.querySelector('[data-table-wrapper]');
        expect(wrapper).not.toHaveAttribute('loader');
        expect(wrapper).not.toHaveAttribute('muitableprops');
        expect(warn).toHaveBeenCalledWith(
            expect.stringContaining('"loader" is not supported')
        );
        expect(warn).toHaveBeenCalledWith(
            expect.stringContaining('"MuiPaginationProps"')
        );
    });

    it('unported column types fall back to text with a warning', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        renderTable({
            columns: [
                { id: 'name', label: 'Name' },
                { id: 'risk', label: 'Risk', type: 'label' },
            ],
        });
        expect(within(rowOf('Acme Ltd.')).getByText('High')).toBeVisible();
        expect(warn).toHaveBeenCalledWith(
            expect.stringContaining('column type "label" is not ported')
        );
    });

    it('renders without a provider', () => {
        render(
            <Table<Company> columns={COLUMNS} data={DATA} disablePagination />
        );
        expect(
            screen.getByRole('rowheader', { name: 'Acme Ltd.' })
        ).toBeVisible();
    });
});

describe('Table primitives', () => {
    it('compose a custom table; TableHead onSort renders a button and aria-sort', async () => {
        const user = userEvent.setup();
        const onSort = vi.fn();
        render(
            <HorizonProvider>
                <TableRoot>
                    <TableCaption hidden>Totals</TableCaption>
                    <TableHeader>
                        <TableRow>
                            <TableHead onSort={onSort} sortDirection="desc">
                                Region
                            </TableHead>
                            <TableHead align="end">Amount</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        <TableRow selected>
                            <TableCell rowHeader>North</TableCell>
                            <TableCell numeric>1,200</TableCell>
                        </TableRow>
                    </TableBody>
                </TableRoot>
            </HorizonProvider>
        );
        const t = screen.getByRole('table', { name: 'Totals' });
        expect(screen.getByText('Totals')).toHaveClass('hz:sr-only');
        const region = within(t).getByRole('columnheader', { name: 'Region' });
        expect(region).toHaveAttribute('aria-sort', 'descending');
        await user.click(within(region).getByRole('button'));
        expect(onSort).toHaveBeenCalledTimes(1);
        expect(screen.getByText('1,200')).toHaveClass('hz:tabular-nums');
        expect(screen.getByText('North')).toHaveClass('hz:bg-accent');
    });

    it('unknown density/responsive fall back with a warning', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        render(
            <TableRoot
                {...({ density: 'small', responsive: 'cards' } as object)}
            >
                <TableBody>
                    <TableRow>
                        <TableCell>x</TableCell>
                    </TableRow>
                </TableBody>
            </TableRoot>
        );
        expect(screen.getByRole('table')).toHaveAttribute(
            'data-density',
            'compact'
        );
        expect(warn).toHaveBeenCalledWith(
            expect.stringContaining('unknown density "small"')
        );
    });
});

describe('Table performance', () => {
    it('renders 500 rows x 5 columns within budget (jsdom)', () => {
        const rows: TableCellData<Company>[] = Array.from(
            { length: 500 },
            (_, i) => ({
                id: i,
                rowData: {
                    name: `Company ${i}`,
                    city: 'Haifa',
                    employees: i,
                    founded: '2001-01-05',
                    risk: { label: 'Low', color: 'success' },
                },
            })
        );
        const start = performance.now();
        renderTable({ data: rows });
        const elapsed = performance.now() - start;
        expect(within(table()).getAllByRole('row')).toHaveLength(501);
        // jsdom is far slower than a browser (the browser story budgets
        // 500 rows at 400ms); this guards against accidental quadratic work.
        expect(elapsed).toBeLessThan(6000);
    });
});
