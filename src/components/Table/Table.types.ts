import type { ReactNode } from 'react';

/**
 * Built-in cell renderers, by the shape of the row value. Same names and
 * string values as x-core's `ColumnDataType` enum, so
 * `ColumnDataType.chip` and `type: 'chip'` both keep working.
 */
export const ColumnDataType = {
    /** Number, right-aligned (end) with tabular figures; an array shows its length. */
    numeric: 'numeric',
    /** Text, or `{ text, icon }`. The default. */
    text: 'text',
    /** Not ported (x-core rendered `<var>` + Avatar): falls back to text. Use `render`. */
    user: 'user',
    /** One or more e-mail addresses (array or string) as neutral outline Chips. */
    email: 'email',
    /** A Chip: a string, or `{ label, color, variant }` with x-core colours. */
    chip: 'chip',
    /** D-U-N-S number: text. */
    duns: 'duns',
    /** A date (ISO string, `YYYY-MM-DD`, number or Date) as "Jan 05 2026". */
    date: 'date',
    /** A status Badge: `{ label, color }` with x-core colours. */
    status: 'status',
    /** A priority Chip: `low`/`medium`/`high`/`critical`/`non_critical`. */
    priority: 'priority',
    /** `{ title, subtitle }` on two lines. */
    titleSubtitle: 'titleSubtitle',
    /** Not ported (MUI Rating): falls back to text. Use `render`. */
    rating: 'rating',
    /** Not ported (x-core rendered an inert "link"): falls back to text. Use `render` with `Link`. */
    link: 'link',
    /** A Progress bar: a percentage, or `{ percentage, label }`. */
    progress: 'progress',
    /** An AvatarGroup: `[{ alt, src }]` (x-core AvatarData). */
    avatar: 'avatar',
    /** Not ported (interactive label chips): falls back to text. Use `render`. */
    label: 'label',
} as const;

/** A built-in cell renderer name (x-core `ColumnDataType`). */
export type ColumnDataType =
    (typeof ColumnDataType)[keyof typeof ColumnDataType];

/** Sort direction (x-core `Order`). */
export type Order = 'asc' | 'desc';

/** A breakpoint below which a column is hidden (shown in the row details). */
export type ColumnHideBelow = 'tablet' | 'laptop';

/**
 * A row of table data: any object keyed by column id. `object` (not an
 * index-signature record) so interface-typed rows (no index signature)
 * are accepted, as x-core's `{ [key: string]: any }` was.
 */
export type TableRowData = object;

/**
 * One column of a data-driven {@link Table} (x-core `Column`, without the
 * MUI `TableCell` props it extended).
 */
export interface Column<Row extends object = TableRowData> {
    /** Key of the value in each row (a dotted path such as `owner.name` works) and the sort key. */
    id: string;
    /** Header text. Also the label of the value in stacked cards and row details. */
    label: string;
    /** Leaves the column out entirely. */
    hidden?: boolean;
    /**
     * Hides the column below `tablet` or `laptop`. Its value moves into the
     * row details (a "Details" toggle per row), so it stays reachable.
     */
    hideBelow?: ColumnHideBelow;
    /** Accepted for x-core compatibility; column settings are not ported. */
    hideable?: boolean;
    /** No sort button for this column (it is sortable when the table has `onRequestSort`). */
    disableSort?: boolean;
    /** Renders the cell from the row (replaces the built-in renderer). */
    // Method syntax: parameters are checked bivariantly, so an untyped
    // `Column[]` accepts `render: (row: MyRow) => ...` (x-core rows were `any`).
    render?(row: Row): ReactNode;
    /** `data-testid` of each cell, from the row (x-core). */
    dataTestId?(row: Row): string;
    /** Built-in renderer for the value. @default 'text' */
    type?: ColumnDataType;
    /**
     * Keeps the column at the inline start while the table scrolls
     * sideways. Use on the first column.
     */
    sticky?: boolean;
    /** Column width (CSS length or px number). */
    width?: string | number;
    /** Column minimum width (CSS length or px number). */
    minWidth?: string | number;
    /**
     * Cell alignment. `left`/`right` (x-core) are read as `start`/`end` so
     * they mirror under RTL. Numeric columns default to `end`.
     */
    align?: 'start' | 'center' | 'end' | 'left' | 'right';
    /** Decorative icon after the header text. */
    icon?: ReactNode;
    /** Help text, shown in a Tooltip from an info button next to the header. */
    info?: string;
    /** One line with an ellipsis; the full text is in the `title` attribute. */
    truncate?: boolean;
    /**
     * Cells are row headers (`<th scope="row">`): screen readers announce
     * them with every cell of the row. @default true for the first visible column
     */
    rowHeader?: boolean;
}

/** Per-row options (x-core `RowOptions`). */
export interface RowOptions {
    /** No row click and a disabled selection checkbox. */
    disableRowSelect?: boolean;
    /** Expandable content shown under the row (a "Details" toggle). */
    collapseData?: ReactNode;
    /** Details start open. */
    expanded?: boolean;
    /** Accepted for x-core compatibility; the details row spans every column. */
    collapseColspan?: number;
    /** Accepted for x-core compatibility (a hover border colour); not ported: token colours only. */
    statusBorderColor?: string;
    /** `data-testid` of the row. @default `row-${index}` */
    dataTestId?: string;
}

/** One row of a data-driven {@link Table} (x-core `TableCellData`). */
export interface TableCellData<Row extends object = TableRowData> {
    /** Unique row id: React key, selection value, `onRowClick` argument. */
    id: string | number;
    /** The values, keyed by column id. */
    rowData: Row;
    /** Per-row options. */
    rowOptions?: RowOptions;
}
