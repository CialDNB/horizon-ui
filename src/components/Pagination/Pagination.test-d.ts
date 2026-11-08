import type { ComponentRef } from 'react';
import type { Pagination, PaginationProps } from '.';

export const full: PaginationProps = {
    page: 2,
    count: 120,
    pageCount: 12,
    rowsPerPage: 10,
    onPageChange: (page: number) => page,
    showRowsPerPage: true,
    rowsPerPageOptions: [10, 25],
    onRowsPerPageChange: (rows: number) => rows,
    showFirstButton: false,
    showLastButton: false,
    siblingCount: 1,
    boundaryCount: 1,
    showTotalItems: true,
    showPages: true,
    disabled: false,
    labels: { next: 'Next', page: (n: number) => `Page ${n}` },
    'data-did': 'pager',
};

export const ref: ComponentRef<typeof Pagination> | null =
    null as HTMLElement | null;

// @ts-expect-error page is required (controlled, 1-based)
export const missing: PaginationProps = { count: 10 };

export const muiOnChange: PaginationProps = {
    page: 1,
    // @ts-expect-error MUI onChange(event, page) is replaced by onPageChange(page)
    onChange: (_event: unknown, page: number) => page,
};

export const oldOptions: PaginationProps = {
    page: 1,
    // @ts-expect-error x-core showRowsPerPageOptions is rowsPerPageOptions
    showRowsPerPageOptions: [10],
};
