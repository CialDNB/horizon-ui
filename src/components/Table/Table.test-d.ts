import type { ComponentRef } from 'react';
import {
    ColumnDataType,
    type Column,
    type Order,
    type Table,
    type TableCellData,
    type TableHead,
    type TableHeadProps,
    type TableProps,
} from '.';

type Row = { name: string; employees: number };

// x-core shapes migrate with the same names.
export const columns: Column<Row>[] = [
    { id: 'name', label: 'Name', sticky: true, width: 200, truncate: true },
    {
        id: 'employees',
        label: 'Employees',
        type: ColumnDataType.numeric,
        align: 'right',
        disableSort: true,
        hideBelow: 'tablet',
        info: 'Full-time',
        render: (row) => row.employees.toFixed(0),
        dataTestId: (row) => `emp-${row.name}`,
    },
];
export const data: TableCellData<Row>[] = [
    {
        id: 1,
        rowData: { name: 'Acme', employees: 3 },
        rowOptions: { collapseData: 'More', expanded: false },
    },
];
export const order: Order = 'desc';
export const typeByString: Column['type'] = 'chip';

export const full: TableProps<Row> = {
    columns,
    data,
    caption: 'Companies',
    order,
    orderBy: 'name',
    onRequestSort: (property: string, next: Order) => [property, next],
    selectable: true,
    selectedItems: [1],
    onCheckClick: (id: string | number) => id,
    onSelectAllClick: () => undefined,
    // x-core callers type the event as a mouse event: still accepted.
    onRowClick: (id: string | number, event?: React.MouseEvent<unknown>) => [
        id,
        event,
    ],
    loading: false,
    page: 1,
    limit: 10,
    totalCount: 30,
    onPageChange: (page: number, current: number) => [page, current],
    paginationProps: { showRowsPerPage: true, rowsPerPageOptions: [10, 25] },
    density: 'comfortable',
    striped: true,
    responsive: 'stack',
    stickyHeader: true,
    maxBlockSize: 320,
    labels: { empty: 'Nothing' },
    'data-did': 'companies',
};

export const ref: ComponentRef<typeof Table> | null =
    null as HTMLDivElement | null;

// @ts-expect-error columns and data are required
export const missing: TableProps<Row> = { caption: 'X' };

export const badColumn: Column<Row> = {
    id: 'name',
    label: 'Name',
    // @ts-expect-error render receives the typed row
    render: (row) => row.missing,
};

export const muiPagination: TableProps<Row> = {
    columns,
    data,
    // @ts-expect-error x-core MuiPaginationProps is paginationProps
    MuiPaginationProps: { showRowsPerPage: true },
};

export const headRef: ComponentRef<typeof TableHead> | null =
    null as HTMLTableCellElement | null;
export const sortHead: TableHeadProps = {
    onSort: () => undefined,
    sortDirection: 'asc',
    align: 'end',
};
// @ts-expect-error alignment is logical: start, center or end
export const badAlign: TableHeadProps = { align: 'left' };

// customer360 patterns (strict): an untyped `Column[]` whose render takes an
// interface-typed row, and interface-typed rowData (no index signature).
interface DecisionRow {
    id: string;
    status: string;
}
export const untypedColumns: Column[] = [
    {
        id: 'status',
        label: 'Status',
        render: (row: DecisionRow) => row.status,
        dataTestId: (row: DecisionRow) => `status-${row.id}`,
    },
];
const decision: DecisionRow = { id: 'd1', status: 'open' };
export const interfaceRows: TableCellData[] = [{ id: 1, rowData: decision }];
export const typedRows: TableCellData<DecisionRow>[] = [
    { id: 1, rowData: decision },
];
// @ts-expect-error rowData must be an object
export const primitiveRow: TableCellData = { id: 1, rowData: 'x' };
