/*
 * Based on shadcn/ui Table (registry 2025): composable parts over native
 * table elements. Horizon additions: density, zebra, row states, sticky
 * header/column, a horizontal scroll container with edge shadows and a
 * stacked-card layout below `tablet` (`responsive="stack"`). The data-driven
 * `Table` (port of x-core `Table`, x-core 2.2.30) is built on these parts.
 */
import { ArrowDownIcon } from '@phosphor-icons/react/dist/csr/ArrowDown';
import { ArrowUpIcon } from '@phosphor-icons/react/dist/csr/ArrowUp';
import { CaretUpDownIcon } from '@phosphor-icons/react/dist/csr/CaretUpDown';
import { cva } from 'class-variance-authority';
import {
    createContext,
    forwardRef,
    useCallback,
    useContext,
    useEffect,
    useId,
    useLayoutEffect,
    useMemo,
    useState,
    type CSSProperties,
    type HTMLAttributes,
    type Ref,
    type ReactNode,
    type TdHTMLAttributes,
    type ThHTMLAttributes,
} from 'react';
import { cn } from '../../lib/cn';
import { resolveOption } from '../../lib/options';
import { composeRefs } from '../../primitives';
import type { DnbBase } from '../../types/DnbBase';
import type { Order } from './Table.types';

const useIsomorphicLayoutEffect =
    typeof document === 'undefined' ? useEffect : useLayoutEffect;

/** Row height and cell padding. */
export type TableDensity = 'compact' | 'comfortable';

/**
 * Small-screen pattern below `tablet`: `scroll` keeps the grid and scrolls
 * sideways (edge shadows show there is more); `stack` turns each row into a
 * card of label/value pairs.
 */
export type TableResponsive = 'scroll' | 'stack';

/** Horizontal alignment of a cell (logical: mirrors under RTL). */
export type TableAlign = 'start' | 'center' | 'end';

const densities: readonly TableDensity[] = ['compact', 'comfortable'];
const responsives: readonly TableResponsive[] = ['scroll', 'stack'];

type TableContextValue = {
    density: TableDensity;
    responsive: TableResponsive;
    stickyHeader: boolean;
    captionId: string;
    setHasCaption: (has: boolean) => void;
};

const TableContext = createContext<TableContextValue>({
    density: 'compact',
    responsive: 'scroll',
    stickyHeader: false,
    captionId: '',
    setHasCaption: () => undefined,
});

type Section = 'head' | 'body' | 'foot';
const SectionContext = createContext<Section>('body');

type RowState = {
    selected: boolean;
    hoverable: boolean;
    stripe: boolean;
};
const RowContext = createContext<RowState>({
    selected: false,
    hoverable: false,
    stripe: false,
});

/* ---------------------------------------------------------------- styles */

// Complete literals: the Tailwind scanner only compiles classes it can see.
const alignClass: Record<TableAlign, string> = {
    start: 'hz:text-start',
    center: 'hz:text-center',
    end: 'hz:text-end',
};

const cellPadding: Record<TableDensity, string> = {
    // x-core rows were 38px (12px text): 14px text + 12px block padding.
    compact: 'hz:px-3 hz:py-3 hz:text-body-secondary',
    comfortable: 'hz:px-4 hz:py-4 hz:text-body-default',
};

const headPadding: Record<TableDensity, string> = {
    compact: 'hz:px-3 hz:py-2',
    comfortable: 'hz:px-4 hz:py-3',
};

/*
 * Row surfaces are painted on the cells (opaque, so a sticky cell hides what
 * scrolls under it). Zebra and hover are sRGB mixes, which is what the
 * contrast test composites (`over()` in src/tokens/contrast.test.ts). On
 * tinted rows text switches to accent-foreground: dnb `foreground` and il
 * `muted-foreground` (#64748B) fall below 4.5:1 on any tint.
 */
const surface = {
    rest: 'hz:bg-background',
    stripe: 'hz:bg-[color-mix(in_srgb,var(--muted)_30%,var(--background))]',
    hover: 'hz:group-hover/row:bg-[color-mix(in_srgb,var(--accent)_50%,var(--background))] hz:group-hover/row:text-accent-foreground',
    selected: 'hz:bg-accent hz:text-accent-foreground',
} as const;

/*
 * Every row's first cell reserves a 4px inline-start border (x-core 5px):
 * transparent, primary on a selected row (3:1 on accent). Forced colors
 * turn even a transparent border into CanvasText (alpha is not kept), so
 * there the rest bar is Canvas (invisible on the Canvas cell) and the
 * selected one Highlight.
 */
const firstCellBar =
    'hz:first:border-s-4 hz:first:border-solid hz:first:border-s-transparent hz:forced-colors:first:border-s-[Canvas]';
const selectedBar =
    'hz:first:border-s-primary hz:forced-colors:first:border-s-[Highlight]';

/**
 * Secondary text inside a cell (subtitles, the stacked label): muted at
 * rest, accent-foreground on a hovered or selected row.
 */
export const tableMutedText =
    'hz:text-muted-foreground hz:group-hover/row:text-accent-foreground hz:group-data-[selected]/row:text-accent-foreground';

const tableStyles = cva(
    [
        // border-separate: per-cell borders survive sticky cells (collapsed
        // borders belong to the table and scroll away); restated against
        // Bootstrap's `table { border-collapse: collapse }`.
        'hz:m-0 hz:w-full hz:border-separate hz:border-spacing-0 hz:caption-top hz:text-start hz:text-foreground',
    ],
    {
        variants: {
            responsive: {
                scroll: '',
                stack: 'hz:max-tablet:block',
            },
        },
    }
);

/*
 * `responsive="stack"` restyles table elements as blocks and grids below
 * `tablet`, which drops their table semantics in some browsers; explicit
 * roles keep them (and are harmless above tablet).
 */
const stackRole = (role: string) => ({ role });

/* ------------------------------------------------------------ scroll edges */

type Edges = {
    /** Wider than the scroller (edge shadows). */
    overflowing: boolean;
    /** Scrolls on either axis (a focusable region). */
    scrollable: boolean;
    atStart: boolean;
    atEnd: boolean;
};

/** Watches a horizontal scroller: does it overflow, is it at either end. */
function useScrollEdges(el: HTMLElement | null): Edges {
    const [edges, setEdges] = useState<Edges>({
        overflowing: false,
        scrollable: false,
        atStart: true,
        atEnd: true,
    });
    const measure = useCallback(() => {
        if (!el) return;
        // RTL scrollLeft is 0 at the start and negative towards the end.
        const pos = Math.abs(el.scrollLeft);
        const overflowing = el.scrollWidth - el.clientWidth > 1;
        const next = {
            overflowing,
            scrollable: overflowing || el.scrollHeight - el.clientHeight > 1,
            atStart: pos <= 1,
            atEnd: !overflowing || pos + el.clientWidth >= el.scrollWidth - 1,
        };
        setEdges((prev) =>
            prev.overflowing === next.overflowing &&
            prev.scrollable === next.scrollable &&
            prev.atStart === next.atStart &&
            prev.atEnd === next.atEnd
                ? prev
                : next
        );
    }, [el]);
    useEffect(() => {
        if (!el) return;
        measure();
        el.addEventListener('scroll', measure, { passive: true });
        const observer =
            typeof ResizeObserver === 'undefined'
                ? undefined
                : new ResizeObserver(measure);
        observer?.observe(el);
        const table = el.firstElementChild;
        if (table) observer?.observe(table);
        return () => {
            el.removeEventListener('scroll', measure);
            observer?.disconnect();
        };
    }, [el, measure]);
    return edges;
}

/* ------------------------------------------------------------------ parts */

/** Props for {@link TableRoot}. */
export type TableRootProps = HTMLAttributes<HTMLTableElement> &
    DnbBase & {
        /** Row height and padding: `compact` (x-core, 14px text) or `comfortable` (16px). @default 'compact' */
        density?: TableDensity | undefined;
        /**
         * Pattern below `tablet`: `scroll` (sideways, edge shadows, the
         * scroller is a focusable named region) or `stack` (rows become
         * label/value cards). @default 'scroll'
         */
        responsive?: TableResponsive;
        /** Header cells stick to the top of the scroll area (set `maxBlockSize`). @default false */
        stickyHeader?: boolean;
        /** Maximum height of the scroll area (CSS length or px); it scrolls vertically past it. */
        maxBlockSize?: number | string | undefined;
        /** Name of the scroll region when there is no `TableCaption`. @default 'Table' */
        scrollLabel?: string;
        /** Classes for the outer wrapper (the table's own classes go in `className`). */
        containerClassName?: string;
        /** Ref to the scroll container (for example to scroll it into view). */
        scrollRef?: Ref<HTMLDivElement>;
    };

/**
 * The table and its scroll container. Below `tablet` a wide table scrolls
 * sideways with shadows on the edges that have more content (the scroller is
 * then a focusable `region` named by the caption), or, with
 * `responsive="stack"`, each row becomes a card. Children are the other
 * parts: `TableCaption`, `TableHeader`, `TableBody`, `TableFooter`.
 */
export const TableRoot = forwardRef<HTMLTableElement, TableRootProps>(
    function TableRoot(
        {
            density: densityProp,
            responsive: responsiveProp,
            stickyHeader = false,
            maxBlockSize,
            scrollLabel = 'Table',
            containerClassName,
            scrollRef,
            className,
            children,
            ...props
        },
        ref
    ) {
        const density = resolveOption(
            'Table',
            'density',
            densityProp,
            densities,
            'compact'
        );
        const responsive = resolveOption(
            'Table',
            'responsive',
            responsiveProp,
            responsives,
            'scroll'
        );
        const captionId = useId();
        const [hasCaption, setHasCaption] = useState(false);
        const [scroller, setScroller] = useState<HTMLDivElement | null>(null);
        const setScrollerRef = useMemo(
            () => composeRefs(setScroller, scrollRef),
            [scrollRef]
        );
        const { overflowing, scrollable, atStart, atEnd } =
            useScrollEdges(scroller);

        // The start shadow begins after sticky cells (they never scroll).
        const [stickyWidth, setStickyWidth] = useState(0);
        useIsomorphicLayoutEffect(() => {
            if (!scroller) return;
            const row = scroller.querySelector('tbody > tr');
            const sticky = row
                ? Array.from(
                      row.querySelectorAll<HTMLElement>(
                          ':scope > [data-sticky]'
                      )
                  ).filter(
                      (cell) => getComputedStyle(cell).position === 'sticky'
                  )
                : [];
            const width = sticky.reduce((sum, c) => sum + c.offsetWidth, 0);
            setStickyWidth((prev) => (prev === width ? prev : width));
        });

        const context = useMemo(
            () => ({
                density,
                responsive,
                stickyHeader,
                captionId,
                setHasCaption,
            }),
            [density, responsive, stickyHeader, captionId]
        );
        // Keyboard users scroll a scrolling area by focusing it (axe
        // scrollable-region-focusable); its name is the caption.
        const region = scrollable
            ? {
                  role: 'region',
                  tabIndex: 0,
                  ...(hasCaption
                      ? { 'aria-labelledby': captionId }
                      : { 'aria-label': scrollLabel }),
              }
            : {};
        const edge =
            'hz:pointer-events-none hz:absolute hz:inset-y-0 hz:w-6 hz:from-foreground/15 hz:to-transparent hz:transition-opacity hz:duration-fast hz:ease-standard';

        return (
            <TableContext.Provider value={context}>
                <div
                    data-table=""
                    data-overflowing={overflowing || undefined}
                    className={cn(
                        'hz:relative hz:w-full hz:min-w-0 hz:text-start',
                        containerClassName
                    )}
                    style={
                        {
                            '--hz-table-sticky': `${stickyWidth}px`,
                        } as CSSProperties
                    }
                >
                    <div
                        ref={setScrollerRef}
                        data-table-scroll=""
                        {...region}
                        className={cn(
                            'hz:w-full hz:overflow-x-auto hz:overscroll-x-contain',
                            maxBlockSize !== undefined && 'hz:overflow-y-auto',
                            'hz:outline-ring hz:focus:outline-none hz:focus-visible:outline-2 hz:focus-visible:-outline-offset-2 hz:focus-visible:outline-solid hz:focus-visible:outline-ring'
                        )}
                        style={
                            maxBlockSize === undefined
                                ? undefined
                                : { maxBlockSize }
                        }
                    >
                        <table
                            {...(responsive === 'stack' && stackRole('table'))}
                            {...props}
                            ref={ref}
                            data-density={density}
                            data-responsive={responsive}
                            className={cn(
                                tableStyles({ responsive }),
                                className
                            )}
                        >
                            {children}
                        </table>
                    </div>
                    <span
                        aria-hidden="true"
                        data-scroll-edge="start"
                        className={cn(
                            edge,
                            'hz:start-[var(--hz-table-sticky)] hz:bg-linear-to-r hz:rtl:bg-linear-to-l',
                            atStart ? 'hz:opacity-0' : 'hz:opacity-100'
                        )}
                    />
                    <span
                        aria-hidden="true"
                        data-scroll-edge="end"
                        className={cn(
                            edge,
                            'hz:end-0 hz:bg-linear-to-l hz:rtl:bg-linear-to-r',
                            atEnd ? 'hz:opacity-0' : 'hz:opacity-100'
                        )}
                    />
                </div>
            </TableContext.Provider>
        );
    }
);
TableRoot.displayName = 'TableRoot';

/** Props for {@link TableCaption}. */
export type TableCaptionProps = HTMLAttributes<HTMLTableCaptionElement> &
    DnbBase & {
        /** Visually hidden (still names the table and its scroll region). @default false */
        hidden?: boolean;
    };

/**
 * The table's name (`<caption>`), above the table. Every property
 * Bootstrap's `caption` rule sets (padding, colour, alignment, side) is
 * restated.
 */
export const TableCaption = forwardRef<
    HTMLTableCaptionElement,
    TableCaptionProps
>(function TableCaption({ hidden = false, className, id, ...props }, ref) {
    const { captionId, setHasCaption } = useContext(TableContext);
    useIsomorphicLayoutEffect(() => {
        setHasCaption(true);
        return () => setHasCaption(false);
    }, [setHasCaption]);
    return (
        <caption
            {...props}
            ref={ref}
            id={id ?? (captionId || undefined)}
            className={cn(
                'hz:caption-top hz:px-0 hz:pt-0 hz:pb-3 hz:text-start hz:text-label-lg hz:text-foreground',
                hidden && 'hz:sr-only',
                className
            )}
        />
    );
});
TableCaption.displayName = 'TableCaption';

/** Props for {@link TableHeader}. */
export type TableHeaderProps = HTMLAttributes<HTMLTableSectionElement> &
    DnbBase;

/** The header section (`<thead>`). */
export const TableHeader = forwardRef<
    HTMLTableSectionElement,
    TableHeaderProps
>(function TableHeader({ className, ...props }, ref) {
    const { responsive } = useContext(TableContext);
    return (
        <SectionContext.Provider value="head">
            <thead
                {...(responsive === 'stack' && stackRole('rowgroup'))}
                {...props}
                ref={ref}
                className={cn(
                    responsive === 'stack' && 'hz:max-tablet:block',
                    className
                )}
            />
        </SectionContext.Provider>
    );
});
TableHeader.displayName = 'TableHeader';

/** Props for {@link TableBody}. */
export type TableBodyProps = HTMLAttributes<HTMLTableSectionElement> & DnbBase;

/** The body section (`<tbody>`). */
export const TableBody = forwardRef<HTMLTableSectionElement, TableBodyProps>(
    function TableBody({ className, ...props }, ref) {
        const { responsive } = useContext(TableContext);
        return (
            <SectionContext.Provider value="body">
                <tbody
                    {...(responsive === 'stack' && stackRole('rowgroup'))}
                    {...props}
                    ref={ref}
                    className={cn(
                        responsive === 'stack' &&
                            'hz:max-tablet:flex hz:max-tablet:flex-col hz:max-tablet:gap-3',
                        className
                    )}
                />
            </SectionContext.Provider>
        );
    }
);
TableBody.displayName = 'TableBody';

/** Props for {@link TableFooter}. */
export type TableFooterProps = HTMLAttributes<HTMLTableSectionElement> &
    DnbBase;

/** The footer section (`<tfoot>`): totals, summaries. Semibold. */
export const TableFooter = forwardRef<
    HTMLTableSectionElement,
    TableFooterProps
>(function TableFooter({ className, ...props }, ref) {
    const { responsive } = useContext(TableContext);
    return (
        <SectionContext.Provider value="foot">
            <tfoot
                {...(responsive === 'stack' && stackRole('rowgroup'))}
                {...props}
                ref={ref}
                className={cn(
                    'hz:font-semibold',
                    responsive === 'stack' && 'hz:max-tablet:block',
                    className
                )}
            />
        </SectionContext.Provider>
    );
});
TableFooter.displayName = 'TableFooter';

/** Props for {@link TableRow}. */
export type TableRowProps = HTMLAttributes<HTMLTableRowElement> &
    DnbBase & {
        /** Selected look (accent surface, primary bar at the inline start). Set `aria-selected` yourself in a selectable table. @default false */
        selected?: boolean;
        /** Tinted surface on pointer hover (body rows). @default true */
        hoverable?: boolean;
        /** Zebra shading for this row (the data-driven Table sets it on alternate rows when `striped`). @default false */
        stripe?: boolean;
    };

/**
 * A row (`<tr>`). In the body it paints its cells: rest, zebra, hover and
 * selected surfaces; under `responsive="stack"` it is a card below `tablet`.
 */
export const TableRow = forwardRef<HTMLTableRowElement, TableRowProps>(
    function TableRow(
        {
            selected = false,
            hoverable = true,
            stripe = false,
            className,
            ...props
        },
        ref
    ) {
        const section = useContext(SectionContext);
        const { responsive } = useContext(TableContext);
        const state = useMemo(
            () => ({
                selected,
                hoverable: hoverable && section === 'body',
                stripe,
            }),
            [selected, hoverable, section, stripe]
        );
        const stack = responsive === 'stack';
        return (
            <RowContext.Provider value={state}>
                <tr
                    {...(stack && stackRole('row'))}
                    {...props}
                    ref={ref}
                    data-selected={selected || undefined}
                    className={cn(
                        'hz:group/row',
                        // Clickable rows (tabIndex) show the ring inside the scroller.
                        'hz:outline-ring hz:focus:outline-none hz:focus-visible:outline-2 hz:focus-visible:-outline-offset-2 hz:focus-visible:outline-solid hz:focus-visible:outline-ring',
                        stack &&
                            section === 'head' &&
                            'hz:max-tablet:flex hz:max-tablet:flex-wrap hz:max-tablet:items-center hz:max-tablet:gap-2 hz:max-tablet:pb-3',
                        stack &&
                            section !== 'head' &&
                            'hz:max-tablet:block hz:max-tablet:overflow-hidden hz:max-tablet:rounded-sm hz:max-tablet:border hz:max-tablet:border-solid hz:max-tablet:border-border',
                        className
                    )}
                />
            </RowContext.Provider>
        );
    }
);
TableRow.displayName = 'TableRow';

const sortIcon = {
    none: CaretUpDownIcon,
    asc: ArrowUpIcon,
    desc: ArrowDownIcon,
} as const;

/** Props for {@link TableHead}. */
export type TableHeadProps = Omit<
    ThHTMLAttributes<HTMLTableCellElement>,
    'align'
> &
    DnbBase & {
        /** Alignment (numeric columns: `end`). @default 'start' */
        align?: TableAlign;
        /**
         * Makes the header a sort control: a real `<button>` inside the
         * header cell; `aria-sort` is set on the cell when it is the sorted
         * column.
         */
        onSort?: (() => void) | undefined;
        /** The column's current sort direction, or `false` when another column is sorted. @default false */
        sortDirection?: Order | false;
        /** Content after the label, outside the sort button (an info tooltip trigger, an icon). */
        adornment?: ReactNode;
        /** Sticks to the inline start while the table scrolls sideways. @default false */
        sticky?: boolean;
        /** Offset of a sticky cell from the inline start (after a sticky selection column). */
        stickyOffset?: 'none' | 'selection';
        /** Shown in the stacked header bar below `tablet` (`responsive="stack"`). @default true when sortable */
        showWhenStacked?: boolean;
        /** Cell width (CSS length or px). */
        width?: string | number | undefined;
        /** Cell minimum width (CSS length or px). */
        minWidth?: string | number | undefined;
    };

const stickyStart = {
    none: 'hz:sticky hz:start-0 hz:z-1',
    selection: 'hz:sticky hz:start-14 hz:z-1 hz:tablet:pointer-fine:start-10',
} as const;

/**
 * A column header (`<th scope="col">`, or the given `scope`). With `onSort`
 * the label is a button (44px tall at mobile and on touch pointers) with an
 * arrow showing the direction, and the cell carries `aria-sort`.
 */
export const TableHead = forwardRef<HTMLTableCellElement, TableHeadProps>(
    function TableHead(
        {
            align = 'start',
            onSort,
            sortDirection = false,
            adornment,
            sticky = false,
            stickyOffset = 'none',
            showWhenStacked,
            width,
            minWidth,
            scope = 'col',
            className,
            style,
            children,
            ...props
        },
        ref
    ) {
        const { density, responsive, stickyHeader } = useContext(TableContext);
        const sortable = onSort !== undefined;
        const stack = responsive === 'stack';
        const visibleStacked = showWhenStacked ?? sortable;
        const Icon = sortIcon[sortDirection || 'none'];
        return (
            <th
                {...(stack && stackRole('columnheader'))}
                {...props}
                ref={ref}
                scope={scope}
                aria-sort={
                    sortDirection === 'asc'
                        ? 'ascending'
                        : sortDirection === 'desc'
                          ? 'descending'
                          : undefined
                }
                data-sticky={sticky || undefined}
                style={{ width, minWidth, ...style }}
                className={cn(
                    'hz:border-0 hz:border-b hz:border-solid hz:border-control-border hz:bg-neutral-subtle hz:align-middle hz:whitespace-nowrap hz:text-label-sm hz:text-neutral-strong',
                    firstCellBar,
                    alignClass[align],
                    headPadding[density],
                    sticky && stickyStart[stickyOffset],
                    stickyHeader && 'hz:sticky hz:top-0 hz:z-2',
                    sticky && stickyHeader && 'hz:z-3',
                    stack &&
                        'hz:max-tablet:static hz:max-tablet:block hz:max-tablet:border-0 hz:max-tablet:bg-transparent hz:max-tablet:p-0',
                    stack && !visibleStacked && 'hz:max-tablet:sr-only',
                    className
                )}
            >
                {sortable ? (
                    <span
                        className={cn(
                            'hz:inline-flex hz:max-w-full hz:items-center hz:gap-1',
                            align === 'end' && 'hz:flex-row-reverse',
                            align === 'center' && 'hz:justify-center'
                        )}
                    >
                        <button
                            type="button"
                            onClick={onSort}
                            data-sort-button=""
                            className={cn(
                                // Restated against Bootstrap/customer360 `button` rules.
                                'hz:m-0 hz:-mx-1 hz:inline-flex hz:min-h-11 hz:min-w-0 hz:cursor-pointer hz:items-center hz:gap-1 hz:rounded-xs hz:border-0 hz:bg-transparent hz:px-1 hz:py-0 hz:text-inherit hz:font-[inherit] hz:leading-[inherit] hz:tablet:pointer-fine:min-h-6',
                                align === 'end' && 'hz:flex-row-reverse',
                                // Hover underlines; the colour stays neutral-strong (dnb
                                // foreground is 4.34:1 on neutral-subtle).
                                'hz:hover:underline',
                                'hz:outline-ring hz:focus:outline-none hz:focus-visible:outline-2 hz:focus-visible:outline-offset-0 hz:focus-visible:outline-solid hz:focus-visible:outline-ring',
                                stack &&
                                    'hz:max-tablet:rounded-full hz:max-tablet:border hz:max-tablet:border-solid hz:max-tablet:border-control-border hz:max-tablet:px-3'
                            )}
                        >
                            <span className="hz:truncate">{children}</span>
                            <Icon
                                aria-hidden="true"
                                data-sort-icon={sortDirection || 'none'}
                                className="hz:size-3.5 hz:shrink-0"
                            />
                        </button>
                        {adornment}
                    </span>
                ) : adornment ? (
                    <span
                        className={cn(
                            'hz:inline-flex hz:items-center hz:gap-1',
                            align === 'end' && 'hz:flex-row-reverse'
                        )}
                    >
                        {children}
                        {adornment}
                    </span>
                ) : (
                    children
                )}
            </th>
        );
    }
);
TableHead.displayName = 'TableHead';

/** Props for {@link TableCell}. */
export type TableCellProps = Omit<
    TdHTMLAttributes<HTMLTableCellElement>,
    'align'
> &
    DnbBase & {
        /** Alignment (numeric cells: `end`). @default 'start' */
        align?: TableAlign;
        /** Tabular figures and `end` alignment by default. @default false */
        numeric?: boolean;
        /** Renders a row header (`<th scope="row">`) instead of `<td>`. @default false */
        rowHeader?: boolean;
        /**
         * The column's label, shown before the value when rows stack into
         * cards below `tablet` (`responsive="stack"`).
         */
        label?: string | undefined;
        /** One line with an ellipsis. Pass `title` with the full text. @default false */
        truncate?: boolean | undefined;
        /** Sticks to the inline start while the table scrolls sideways. @default false */
        sticky?: boolean;
        /** Offset of a sticky cell from the inline start (after a sticky selection column). @default 'none' */
        stickyOffset?: 'none' | 'selection';
        /** Cell width (CSS length or px). */
        width?: string | number | undefined;
        /** Cell minimum width (CSS length or px). */
        minWidth?: string | number | undefined;
    };

/**
 * A data cell (`<td>`), or a row header (`rowHeader`: `<th scope="row">`).
 * Paints the row's surface (rest, zebra, hover, selected) so sticky cells
 * stay opaque. With `responsive="stack"` it shows `label` before the value
 * below `tablet`.
 */
export const TableCell = forwardRef<HTMLTableCellElement, TableCellProps>(
    function TableCell(
        {
            align: alignProp,
            numeric = false,
            rowHeader = false,
            label,
            truncate = false,
            sticky = false,
            stickyOffset = 'none',
            width,
            minWidth,
            className,
            style,
            children,
            ...props
        },
        ref
    ) {
        const { density, responsive } = useContext(TableContext);
        const section = useContext(SectionContext);
        const row = useContext(RowContext);
        const align = alignProp ?? (numeric ? 'end' : 'start');
        const stack = responsive === 'stack';
        const Cell = rowHeader ? 'th' : 'td';
        const content = truncate ? (
            <span className="hz:block hz:truncate">{children}</span>
        ) : (
            children
        );
        return (
            <Cell
                {...(stack && stackRole(rowHeader ? 'rowheader' : 'cell'))}
                {...props}
                ref={ref}
                {...(rowHeader ? { scope: 'row' } : {})}
                data-sticky={sticky || undefined}
                data-label={stack ? label : undefined}
                style={{
                    width,
                    minWidth,
                    // An ellipsis needs a bounded cell: the width, else 20rem.
                    maxWidth: truncate ? (width ?? '20rem') : undefined,
                    ...style,
                }}
                className={cn(
                    // Weight and alignment restated: `th` is bold and Bootstrap
                    // sets `th { text-align: inherit }`.
                    'hz:border-0 hz:border-b hz:border-solid hz:border-border hz:align-middle hz:font-normal',
                    firstCellBar,
                    row.selected && selectedBar,
                    cellPadding[density],
                    alignClass[align],
                    numeric && 'hz:tabular-nums',
                    'hz:whitespace-nowrap',
                    section === 'foot' && 'hz:font-semibold',
                    row.selected
                        ? surface.selected
                        : cn(
                              row.stripe ? surface.stripe : surface.rest,
                              row.hoverable && surface.hover
                          ),
                    sticky && stickyStart[stickyOffset],
                    stack &&
                        cn(
                            'hz:max-tablet:static hz:max-tablet:block hz:max-tablet:w-auto hz:max-tablet:max-w-none hz:max-tablet:border-b-0 hz:max-tablet:py-1.5 hz:max-tablet:whitespace-normal hz:max-tablet:break-words',
                            label &&
                                !rowHeader &&
                                'hz:max-tablet:grid hz:max-tablet:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] hz:max-tablet:gap-x-3 hz:max-tablet:text-start hz:max-tablet:before:content-[attr(data-label)] hz:max-tablet:before:text-label-sm',
                            label &&
                                !rowHeader &&
                                'hz:max-tablet:before:text-muted-foreground hz:max-tablet:group-hover/row:before:text-accent-foreground hz:max-tablet:group-data-[selected]/row:before:text-accent-foreground',
                            rowHeader &&
                                'hz:max-tablet:pt-3 hz:max-tablet:text-label-md'
                        ),
                    className
                )}
            >
                {stack && label && !rowHeader ? (
                    <span className="hz:min-w-0">{content}</span>
                ) : (
                    content
                )}
            </Cell>
        );
    }
);
TableCell.displayName = 'TableCell';
