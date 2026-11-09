/*
 * Data-driven table, built on the composable parts in TablePrimitives.tsx
 * (shadcn/ui Table, registry 2025). Replaces x-core `Table` (MUI Table +
 * TableSortLabel + PaginationV2, x-core 2.2.30): same `columns`/`data`
 * contract (`Column`, `TableCellData`, `Order`, `ColumnDataType`), sorting,
 * selection, expandable rows, loading/empty states and pagination.
 */
import { CaretDownIcon } from '@phosphor-icons/react/dist/csr/CaretDown';
import { InfoIcon } from '@phosphor-icons/react/dist/csr/Info';
import {
    forwardRef,
    Fragment,
    useEffect,
    useId,
    useRef,
    useState,
    type HTMLAttributes,
    type KeyboardEvent,
    type MouseEvent,
    type ReactElement,
    type ReactNode,
    type Ref,
} from 'react';
import { cn } from '../../lib/cn';
import { omitLegacyProps } from '../../lib/options';
import { Checkbox } from '../Checkbox';
import { IconButton } from '../IconButton';
import { Pagination, type PaginationProps } from '../Pagination';
import { Tooltip } from '../Tooltip';
import type { DnbBase } from '../../types/DnbBase';
import { isEmptyValue, renderCellValue, valueAt } from './tableCells';
import {
    TableBody,
    TableCaption,
    TableCell,
    TableFooter,
    TableHead,
    TableHeader,
    TableRoot,
    TableRow,
    tableMutedText,
    type TableDensity,
    type TableResponsive,
} from './TablePrimitives';
import type {
    Column,
    ColumnHideBelow,
    Order,
    TableCellData,
    TableRowData,
} from './Table.types';

/** Visible and accessible text of a {@link Table} (translate per locale). */
export type TableLabels = {
    /** Select-all checkbox. @default 'Select all rows' */
    selectAll: string;
    /** Header of the selection column when select-all is off (screen readers). @default 'Selection' */
    selection: string;
    /** Row checkbox name, before the row header text: "Select Acme Ltd.". @default 'Select' */
    selectRow: string;
    /** Details toggle name, before the row header text, and its column header. @default 'Details' */
    details: string;
    /** Announced while loading. @default 'Loading' */
    loading: string;
    /** Empty state text (also announced). @default 'No results' */
    empty: string;
    /** Announced after a sort change. */
    sorted: (column: string, order: Order) => string;
    /** Name of a column's info button. @default `About ${column}` */
    info: (column: string) => string;
};

const defaultLabels: TableLabels = {
    selectAll: 'Select all rows',
    selection: 'Selection',
    selectRow: 'Select',
    details: 'Details',
    loading: 'Loading',
    empty: 'No results',
    sorted: (column, order) =>
        `Sorted by ${column}, ${order === 'asc' ? 'ascending' : 'descending'}`,
    info: (column) => `About ${column}`,
};

/** Table-level pagination options (x-core `MuiPaginationProps`). */
export type TablePaginationOptions = Omit<
    PaginationProps,
    'page' | 'count' | 'pageCount' | 'onPageChange'
>;

/** Props for {@link Table}. */
export type TableProps<Row extends object = TableRowData> = Omit<
    HTMLAttributes<HTMLDivElement>,
    'children'
> &
    DnbBase & {
        /** Column definitions (x-core `Column`). */
        columns: readonly Column<Row>[];
        /** Rows of the current page (x-core `TableCellData`). */
        data: readonly TableCellData<Row>[];
        /** Table name (`<caption>`); also names the scroll region. Recommended. */
        caption?: ReactNode;
        /** Keeps the caption for screen readers only. @default false */
        hideCaption?: boolean;
        /** Sorted direction of `orderBy`. @default 'asc' */
        order?: Order;
        /** Id of the sorted column. */
        orderBy?: string;
        /**
         * Makes columns sortable (except `disableSort` ones). Called with the
         * column id and the requested direction: the sorted column toggles,
         * another column starts `asc`.
         */
        onRequestSort?: (property: string, order: Order) => void;
        /** Adds a checkbox column. @default false */
        selectable?: boolean;
        /** Ids of the selected rows (x-core `selectedItems`). */
        selectedItems?: readonly (string | number)[];
        /** A row checkbox was toggled. */
        onCheckClick?: (id: string | number) => void;
        /** The select-all checkbox was toggled (x-core). */
        onSelectAllClick?: () => void;
        /** No select-all checkbox. @default false */
        disableSelectAll?: boolean;
        /**
         * Makes rows clickable (pointer, and Enter/Space on a focused row).
         * Clicks on links, buttons and checkboxes inside the row do not
         * count. Rows with `disableRowSelect` are not clickable. The event
         * has `ctrlKey`/`metaKey` for "open in a new tab" (Ctrl+Enter too).
         *
         * Prefer a link in the row header (a column `render` returning a
         * `Link`) when a row opens a page: screen readers announce a named
         * link, while a focusable row (`tr`) has no role or name hint that it
         * acts. Use `onRowClick` for x-core parity or as a pointer shortcut
         * next to such a link.
         */
        onRowClick?(
            id: string | number,
            event?: MouseEvent<unknown> | KeyboardEvent<unknown>
        ): void;
        /** No hover surface on rows. @default false */
        disableRowHover?: boolean;
        /** Skeleton rows, `aria-busy`, "Loading" announced (x-core `loader`). @default false */
        loading?: boolean;
        /** Shown instead of rows when an error is set (`role="alert"`). */
        error?: ReactNode;
        /** Shown when `data` is empty. @default labels.empty */
        emptyComponent?: ReactNode;
        /** Current page, 1-based. @default 1 */
        page?: number;
        /** Rows per page (x-core `limit`). @default 10 */
        limit?: number;
        /** Total rows across pages. @default data.length */
        totalCount?: number;
        /** Called with the requested page and the current one (x-core). */
        onPageChange?: (page: number, currentPage: number) => void;
        /** Hides the page buttons (rows per page and actions stay). @default false */
        disablePagination?: boolean;
        /**
         * Pagination options: `showRowsPerPage`, `onRowsPerPageChange`,
         * `showTotalItems`, `labels` ... (x-core `MuiPaginationProps`). The
         * landmark is named "Pagination: <caption>" when the caption is text.
         */
        paginationProps?: TablePaginationOptions;
        /** Content at the inline start of the pagination row (x-core `tableActions`). */
        tableActions?: ReactNode;
        /** Footer cells (`TableCell`s), rendered in a `<tfoot>` row. */
        footerRow?: ReactNode;
        /** Hides `footerRow`. @default false */
        hideFooter?: boolean;
        /** No header row. @default false */
        hideHeader?: boolean;
        /** Row height and padding. @default 'compact' */
        density?: TableDensity;
        /** Zebra rows. @default false */
        striped?: boolean;
        /**
         * Pattern below `tablet`. `scroll` (default, for wide data tables):
         * sideways scrolling with edge shadows and a sticky first column.
         * `stack` (short key/value tables): each row becomes a card.
         * @default 'scroll'
         */
        responsive?: TableResponsive;
        /** Header sticks while the scroll area scrolls (with `maxBlockSize`). @default false */
        stickyHeader?: boolean;
        /** Maximum height of the scroll area (CSS length or px). */
        maxBlockSize?: number | string;
        /** Text overrides (translations). */
        labels?: Partial<TableLabels>;
    };

/** x-core Table props that are dropped (dev warning). */
const legacyTableProps = {
    loader: 'use loading',
    MuiTableProps: 'stickyHeader -> stickyHeader, sx -> className',
    MuiPaginationProps: 'use paginationProps',
    headerBackgroundColor: 'token colours only',
    hasScrollView: 'scroll shadows are built in',
    showNavigationButtonLeft: 'scroll shadows are built in',
    showNavigationButtonRight: 'scroll shadows are built in',
    showColumnSettings: 'column settings are not ported',
    columnSettingsStorageKey: 'column settings are not ported',
    onColumnSettingsChange: 'column settings are not ported',
    selectedRowsPerPage: 'the select-all state comes from selectedItems',
    disableSearch: 'not used',
    sx: 'use className',
} as const;

// Complete literals: the Tailwind scanner only compiles classes it can see.
// `max-tablet:hidden` is not redundant: with `responsive="stack"` cells get
// `max-tablet:grid`/`block`, which would override `hidden` below tablet.
const hideBelowClass: Record<ColumnHideBelow, string> = {
    tablet: 'hz:hidden hz:max-tablet:hidden hz:tablet:table-cell',
    laptop: 'hz:hidden hz:max-tablet:hidden hz:laptop:table-cell',
};
const shownBelowClass: Record<ColumnHideBelow, string> = {
    tablet: 'hz:tablet:hidden',
    laptop: 'hz:laptop:hidden',
};

const alignOf = (column: Column<never>) => {
    switch (column.align) {
        case 'left':
        case 'start':
            return 'start';
        case 'right':
        case 'end':
            return 'end';
        case 'center':
            return 'center';
        default:
            return column.type === 'numeric' ? 'end' : 'start';
    }
};

// Clicks on these inside a row are their own action, not a row click.
const INTERACTIVE =
    'a[href], button, input, select, textarea, label, summary, [role="button"], [role="checkbox"], [role="link"], [role="menuitem"], [contenteditable="true"]';

const textOf = (value: unknown) =>
    typeof value === 'string' || typeof value === 'number'
        ? String(value)
        : undefined;

function useAnnouncement(
    loading: boolean,
    empty: boolean,
    order: Order,
    orderBy: string | undefined,
    sortedLabel: string | undefined,
    labels: TableLabels
) {
    const [message, setMessage] = useState('');
    const last = useRef({ loading, empty, order, orderBy });
    useEffect(() => {
        const prev = last.current;
        last.current = { loading, empty, order, orderBy };
        // Each change is announced once; the first render announces only a load.
        if (loading && !prev.loading) setMessage(labels.loading);
        else if (
            (order !== prev.order || orderBy !== prev.orderBy) &&
            sortedLabel !== undefined
        )
            setMessage(labels.sorted(sortedLabel, order));
        else if (!loading && empty && (!prev.empty || prev.loading))
            setMessage(labels.empty);
        // `labels` is read when something changes; it is not a trigger.
    }, [loading, empty, order, orderBy, sortedLabel]);
    // Announce a table that mounts loading.
    useEffect(() => {
        if (loading) setMessage(labels.loading);
        // Mount only.
    }, []);
    return message;
}

function TableInner<Row extends object = TableRowData>(
    {
        columns,
        data,
        caption,
        hideCaption = false,
        order = 'asc',
        orderBy,
        onRequestSort,
        selectable = false,
        selectedItems,
        onCheckClick,
        onSelectAllClick,
        disableSelectAll = false,
        onRowClick,
        disableRowHover = false,
        loading = false,
        error,
        emptyComponent,
        page = 1,
        limit = 10,
        totalCount,
        onPageChange,
        disablePagination = false,
        paginationProps,
        tableActions,
        footerRow,
        hideFooter = false,
        hideHeader = false,
        density,
        striped = false,
        responsive = 'scroll',
        stickyHeader = false,
        maxBlockSize,
        labels: labelsProp,
        className,
        ...props
    }: TableProps<Row>,
    ref: Ref<HTMLDivElement>
) {
    const rest = omitLegacyProps('Table', props, legacyTableProps);
    const labels = { ...defaultLabels, ...labelsProp };
    const id = useId();
    const scrollRef = useRef<HTMLDivElement>(null);
    const stack = responsive === 'stack';

    const visible = columns.filter((c) => !c.hidden);
    const rowHeaderColumn =
        visible.find((c) => c.rowHeader) ??
        visible.find((c) => c.rowHeader !== false && !c.hideBelow);
    const hidden = visible.filter((c) => c.hideBelow);
    const hasCollapse = data.some((r) => r.rowOptions?.collapseData);
    const hasDetails = hasCollapse || hidden.length > 0;
    // Details toggle and row: always with expandable rows, otherwise only
    // below the widest `hideBelow` breakpoint.
    const detailsShown = hasCollapse
        ? undefined
        : hidden.some((c) => c.hideBelow === 'laptop')
          ? shownBelowClass.laptop
          : shownBelowClass.tablet;
    const anySticky = visible.some((c) => c.sticky);
    // Wide tables keep the row header in view below tablet (and the selection column before it).
    const stickyRowHeader = anySticky ? false : stack ? false : 'mobile';
    const selectionSticky = selectable
        ? anySticky
            ? true
            : stack
              ? false
              : 'mobile'
        : false;
    const columnCount =
        visible.length + (selectable ? 1 : 0) + (hasDetails ? 1 : 0);

    const [open, setOpen] = useState<ReadonlySet<string | number>>(
        () =>
            new Set(data.filter((r) => r.rowOptions?.expanded).map((r) => r.id))
    );
    const toggle = (rowId: string | number) =>
        setOpen((prev) => {
            const next = new Set(prev);
            if (next.has(rowId)) next.delete(rowId);
            else next.add(rowId);
            return next;
        });

    const selected = new Set(selectedItems ?? []);
    const selectableIds = data
        .filter((r) => !r.rowOptions?.disableRowSelect)
        .map((r) => r.id);
    const selectedOnPage = selectableIds.filter((rowId) =>
        selected.has(rowId)
    ).length;
    const allChecked =
        selectableIds.length > 0 && selectedOnPage === selectableIds.length
            ? true
            : selectedOnPage > 0
              ? 'indeterminate'
              : false;

    const sortedColumn = visible.find((c) => c.id === orderBy);
    const announcement = useAnnouncement(
        loading,
        data.length === 0,
        order,
        orderBy,
        sortedColumn?.label,
        labels
    );

    const sortHandler = (column: Column<Row>) =>
        onRequestSort && !column.disableSort
            ? () =>
                  onRequestSort(
                      column.id,
                      orderBy === column.id && order === 'asc' ? 'desc' : 'asc'
                  )
            : undefined;

    const handlePageChange = (next: number) => {
        onPageChange?.(next, page);
        const scroller = scrollRef.current;
        if (scroller && scroller.getBoundingClientRect().top < 0)
            scroller.scrollIntoView?.({ block: 'start' });
    };

    const selectLabelId = `${id}-select`;
    const detailsLabelId = `${id}-details`;
    const rowHeaderId = (index: number) => `${id}-r${index}`;

    const cellContent = (column: Column<Row>, row: Row): ReactNode => {
        if (column.render) return column.render(row);
        const value = valueAt(row, column.id);
        if (isEmptyValue(value)) return '-';
        return renderCellValue(column.type ?? 'text', value, column);
    };

    const header = !hideHeader && (
        <TableHeader>
            <TableRow hoverable={false}>
                {selectable && (
                    <TableHead
                        sticky={selectionSticky === true}
                        showWhenStacked={!disableSelectAll}
                        className={cn(
                            'hz:w-14 hz:px-1.5 hz:tablet:pointer-fine:w-10 hz:tablet:pointer-fine:px-2',
                            selectionSticky === 'mobile' &&
                                'hz:max-tablet:sticky hz:max-tablet:start-0 hz:max-tablet:z-1'
                        )}
                    >
                        {disableSelectAll ? (
                            <span className="hz:sr-only">
                                {labels.selection}
                            </span>
                        ) : (
                            <Checkbox
                                size="sm"
                                aria-label={labels.selectAll}
                                checked={allChecked}
                                disabled={loading || selectableIds.length === 0}
                                onCheckedChange={() => onSelectAllClick?.()}
                            />
                        )}
                    </TableHead>
                )}
                {hasDetails && (
                    <TableHead
                        showWhenStacked={false}
                        className={cn(
                            'hz:w-14 hz:px-1.5 hz:tablet:pointer-fine:w-12',
                            detailsShown
                        )}
                    >
                        <span className="hz:sr-only">{labels.details}</span>
                    </TableHead>
                )}
                {visible.map((column) => {
                    const isRowHeader = column === rowHeaderColumn;
                    return (
                        <TableHead
                            key={column.id}
                            align={alignOf(column as Column<never>)}
                            width={column.width}
                            minWidth={column.minWidth}
                            onSort={sortHandler(column)}
                            sortDirection={
                                orderBy === column.id ? order : false
                            }
                            sticky={column.sticky === true}
                            stickyOffset={selectable ? 'selection' : 'none'}
                            className={cn(
                                isRowHeader &&
                                    stickyRowHeader === 'mobile' &&
                                    (selectable
                                        ? 'hz:max-tablet:sticky hz:max-tablet:start-14 hz:max-tablet:z-1'
                                        : 'hz:max-tablet:sticky hz:max-tablet:start-0 hz:max-tablet:z-1'),
                                column.hideBelow &&
                                    hideBelowClass[column.hideBelow]
                            )}
                            adornment={
                                column.info || column.icon ? (
                                    <>
                                        {column.icon && (
                                            <span
                                                aria-hidden="true"
                                                className="hz:inline-flex hz:[&_svg]:size-4"
                                            >
                                                {column.icon}
                                            </span>
                                        )}
                                        {column.info && (
                                            <Tooltip content={column.info}>
                                                <IconButton
                                                    variant="ghost"
                                                    size="sm"
                                                    aria-label={labels.info(
                                                        column.label
                                                    )}
                                                    className="hz:tablet:pointer-fine:size-6"
                                                >
                                                    <InfoIcon />
                                                </IconButton>
                                            </Tooltip>
                                        )}
                                    </>
                                ) : undefined
                            }
                        >
                            {column.label}
                        </TableHead>
                    );
                })}
            </TableRow>
        </TableHeader>
    );

    const fullRow = (key: string, content: ReactNode, attrs = {}) => (
        <TableRow key={key} hoverable={false}>
            <TableCell
                colSpan={columnCount}
                className="hz:whitespace-normal hz:max-tablet:block"
                {...attrs}
            >
                {content}
            </TableCell>
        </TableRow>
    );

    let body: ReactNode;
    if (loading)
        body = Array.from(
            { length: Math.min(limit > 0 ? limit : 10, 25) },
            (_, index) => (
                <TableRow
                    key={`skeleton-${index}`}
                    hoverable={false}
                    aria-hidden="true"
                    data-skeleton=""
                >
                    {Array.from({ length: columnCount }, (__, cell) => (
                        <TableCell key={cell} className="hz:max-tablet:block">
                            <span className="hz:block hz:h-3 hz:w-full hz:min-w-8 hz:rounded-full hz:bg-border hz:animate-progress-pulse" />
                        </TableCell>
                    ))}
                </TableRow>
            )
        );
    else if (error !== undefined && error !== null && error !== false)
        body = fullRow(
            'error',
            <div
                role="alert"
                className="hz:py-6 hz:text-center hz:text-destructive-strong"
            >
                {error}
            </div>
        );
    else if (data.length === 0)
        body = fullRow(
            'empty',
            <div
                data-table-empty=""
                className="hz:py-6 hz:text-center hz:text-muted-foreground"
            >
                {emptyComponent ?? labels.empty}
            </div>
        );
    else
        body = data.map(({ id: rowId, rowData, rowOptions }, index) => {
            const isSelected = selected.has(rowId);
            const clickable =
                onRowClick !== undefined && !rowOptions?.disableRowSelect;
            const isOpen = open.has(rowId);
            const detailsId = `${id}-d${index}`;
            const headerId = rowHeaderId(index);
            const onClick = (event: MouseEvent<HTMLTableRowElement>) => {
                const hit = (event.target as Element).closest(INTERACTIVE);
                if (hit && event.currentTarget.contains(hit)) return;
                onRowClick?.(rowId, event);
            };
            const onKeyDown = (event: KeyboardEvent<HTMLTableRowElement>) => {
                if (event.target !== event.currentTarget) return;
                if (event.key !== 'Enter' && event.key !== ' ') return;
                event.preventDefault();
                onRowClick?.(rowId, event);
            };
            return (
                <Fragment key={rowId}>
                    {/* A clickable row is focusable and activates with
                        Enter/Space: the keyboard equivalent of the pointer
                        click (x-core rows had none). */}
                    <TableRow
                        selected={isSelected}
                        hoverable={!disableRowHover}
                        stripe={striped && index % 2 === 1}
                        aria-selected={selectable ? isSelected : undefined}
                        data-testid={rowOptions?.dataTestId ?? `row-${index}`}
                        data-clickable={clickable || undefined}
                        {...(clickable && {
                            tabIndex: 0,
                            onClick,
                            onKeyDown,
                        })}
                        className={cn(clickable && 'hz:cursor-pointer')}
                    >
                        {selectable && (
                            <TableCell
                                sticky={selectionSticky === true}
                                className={cn(
                                    'hz:w-14 hz:px-1.5 hz:tablet:pointer-fine:w-10 hz:tablet:pointer-fine:px-2',
                                    selectionSticky === 'mobile' &&
                                        'hz:max-tablet:sticky hz:max-tablet:start-0 hz:max-tablet:z-1'
                                )}
                            >
                                <Checkbox
                                    size="sm"
                                    aria-labelledby={
                                        rowHeaderColumn
                                            ? `${selectLabelId} ${headerId}`
                                            : selectLabelId
                                    }
                                    checked={isSelected}
                                    disabled={rowOptions?.disableRowSelect}
                                    onCheckedChange={() =>
                                        onCheckClick?.(rowId)
                                    }
                                />
                            </TableCell>
                        )}
                        {hasDetails && (
                            <TableCell
                                className={cn(
                                    'hz:w-14 hz:px-1.5 hz:tablet:pointer-fine:w-12',
                                    detailsShown
                                )}
                            >
                                <IconButton
                                    variant="ghost"
                                    size="sm"
                                    aria-labelledby={
                                        rowHeaderColumn
                                            ? `${detailsLabelId} ${headerId}`
                                            : detailsLabelId
                                    }
                                    aria-expanded={isOpen}
                                    aria-controls={detailsId}
                                    data-details-toggle=""
                                    onClick={() => toggle(rowId)}
                                >
                                    <CaretDownIcon
                                        className={cn(
                                            'hz:transition-transform hz:duration-fast hz:ease-standard',
                                            isOpen && 'hz:rotate-180'
                                        )}
                                    />
                                </IconButton>
                            </TableCell>
                        )}
                        {visible.map((column) => {
                            const isRowHeader = column === rowHeaderColumn;
                            const value = column.render
                                ? undefined
                                : valueAt(rowData, column.id);
                            return (
                                <TableCell
                                    key={column.id}
                                    id={isRowHeader ? headerId : undefined}
                                    rowHeader={isRowHeader}
                                    label={column.label}
                                    align={alignOf(column as Column<never>)}
                                    numeric={column.type === 'numeric'}
                                    truncate={column.truncate}
                                    title={
                                        column.truncate
                                            ? textOf(value)
                                            : undefined
                                    }
                                    width={column.width}
                                    minWidth={column.minWidth}
                                    sticky={column.sticky === true}
                                    stickyOffset={
                                        selectable ? 'selection' : 'none'
                                    }
                                    data-testid={
                                        column.dataTestId
                                            ? column.dataTestId(rowData)
                                            : column.id
                                    }
                                    className={cn(
                                        isRowHeader &&
                                            stickyRowHeader === 'mobile' &&
                                            (selectable
                                                ? 'hz:max-tablet:sticky hz:max-tablet:start-14 hz:max-tablet:z-1'
                                                : 'hz:max-tablet:sticky hz:max-tablet:start-0 hz:max-tablet:z-1'),
                                        column.hideBelow &&
                                            hideBelowClass[column.hideBelow]
                                    )}
                                >
                                    {cellContent(column, rowData)}
                                </TableCell>
                            );
                        })}
                    </TableRow>
                    {hasDetails && (
                        <TableRow
                            id={detailsId}
                            hidden={!isOpen}
                            hoverable={false}
                            data-details=""
                            className={cn(
                                !rowOptions?.collapseData && detailsShown
                            )}
                        >
                            <TableCell
                                colSpan={columnCount}
                                className="hz:whitespace-normal hz:max-tablet:block"
                            >
                                {rowOptions?.collapseData}
                                {hidden.length > 0 && (
                                    <dl className="hz:m-0 hz:grid hz:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] hz:gap-x-4 hz:gap-y-2">
                                        {hidden.map((column) => (
                                            <div
                                                key={column.id}
                                                className={cn(
                                                    'hz:contents',
                                                    column.hideBelow &&
                                                        shownBelowClass[
                                                            column.hideBelow
                                                        ]
                                                )}
                                            >
                                                <dt
                                                    className={cn(
                                                        'hz:m-0 hz:text-label-sm',
                                                        tableMutedText
                                                    )}
                                                >
                                                    {column.label}
                                                </dt>
                                                <dd className="hz:m-0">
                                                    {cellContent(
                                                        column,
                                                        rowData
                                                    )}
                                                </dd>
                                            </div>
                                        ))}
                                    </dl>
                                )}
                            </TableCell>
                        </TableRow>
                    )}
                </Fragment>
            );
        });

    // Several tables on a page: each Pagination landmark needs its own name.
    const paginationName =
        paginationProps?.['aria-label'] ??
        (typeof caption === 'string'
            ? `${paginationProps?.labels?.navigation ?? 'Pagination'}: ${caption}`
            : undefined);

    const showPagination =
        tableActions !== undefined ||
        !disablePagination ||
        paginationProps?.showRowsPerPage === true;

    return (
        <div
            {...rest}
            ref={ref}
            data-table-wrapper=""
            className={cn(
                'hz:flex hz:w-full hz:min-w-0 hz:flex-col hz:gap-3 hz:text-start',
                className
            )}
        >
            {/* Name parts for row checkboxes and details toggles. */}
            <span id={selectLabelId} hidden>
                {labels.selectRow}
            </span>
            <span id={detailsLabelId} hidden>
                {labels.details}
            </span>
            <TableRoot
                density={density}
                responsive={responsive}
                stickyHeader={stickyHeader}
                maxBlockSize={maxBlockSize}
                scrollRef={scrollRef}
                aria-busy={loading || undefined}
            >
                {caption !== undefined && caption !== null && (
                    <TableCaption hidden={hideCaption}>{caption}</TableCaption>
                )}
                {header}
                <TableBody>{body}</TableBody>
                {footerRow && !hideFooter && !loading && (
                    <TableFooter>
                        <TableRow hoverable={false}>{footerRow}</TableRow>
                    </TableFooter>
                )}
            </TableRoot>
            <span role="status" className="hz:sr-only">
                {announcement}
            </span>
            {showPagination && (
                <div className="hz:flex hz:flex-wrap hz:items-center hz:justify-between hz:gap-3">
                    <div className="hz:min-w-0">{tableActions}</div>
                    <Pagination
                        page={page}
                        count={totalCount ?? data.length}
                        rowsPerPage={limit}
                        onPageChange={handlePageChange}
                        showPages={!disablePagination}
                        disabled={loading}
                        {...paginationProps}
                        {...(paginationName && {
                            'aria-label': paginationName,
                        })}
                    />
                </div>
            )}
        </div>
    );
}

/**
 * A data table from `columns` and `data` (x-core `Table` contract):
 * built-in cell renderers by `Column.type` or `render`, sortable headers
 * (real buttons, `aria-sort`, the change announced), a selection column
 * with select-all (indeterminate) and `aria-selected` rows, clickable rows
 * (pointer and Enter/Space), expandable rows (`rowOptions.collapseData`),
 * loading (skeleton rows, `aria-busy`), error and empty states, and
 * Pagination. Below `tablet` it scrolls sideways with a sticky first column
 * (`responsive="scroll"`) or stacks rows into cards (`"stack"`); columns
 * with `hideBelow` move into a per-row Details disclosure. For custom
 * layouts compose `TableRoot`, `TableHeader`, `TableRow`, `TableHead`,
 * `TableBody`, `TableCell`, `TableCaption` and `TableFooter` directly.
 */
export const Table = forwardRef(TableInner) as (<
    Row extends object = TableRowData,
>(
    props: TableProps<Row> & { ref?: Ref<HTMLDivElement> }
) => ReactElement | null) & { displayName?: string };
Table.displayName = 'Table';
