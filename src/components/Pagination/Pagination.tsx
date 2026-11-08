/*
 * Based on shadcn/ui Pagination (registry 2025): a `nav` landmark with a list
 * of page buttons, previous and next. Buttons, not links (x-core pages call
 * back, they do not navigate). Replaces x-core `PaginationV2` (MUI Pagination
 * + TablePagination at mobile, x-core 2.2.30); `Pagination` (v1) is
 * superseded and its call sites migrate here.
 */
import { CaretDoubleLeftIcon } from '@phosphor-icons/react/dist/csr/CaretDoubleLeft';
import { CaretDoubleRightIcon } from '@phosphor-icons/react/dist/csr/CaretDoubleRight';
import { CaretLeftIcon } from '@phosphor-icons/react/dist/csr/CaretLeft';
import { CaretRightIcon } from '@phosphor-icons/react/dist/csr/CaretRight';
import { cva } from 'class-variance-authority';
import {
    forwardRef,
    useEffect,
    useId,
    useRef,
    useState,
    type HTMLAttributes,
    type ReactNode,
} from 'react';
import { cn } from '../../lib/cn';
import { omitLegacyProps } from '../../lib/options';
import { IconButton } from '../IconButton';
import { Select, SelectItem } from '../Select';
import type { DnbBase } from '../../types/DnbBase';

/** An entry of {@link paginationItems}: a page number or a gap. */
export type PaginationItem = number | 'start-ellipsis' | 'end-ellipsis';

const range = (start: number, end: number) =>
    Array.from({ length: Math.max(end - start + 1, 0) }, (_, i) => start + i);

/**
 * The page numbers and gaps to show, as MUI `usePagination` computes them
 * (same `siblingCount`/`boundaryCount` meaning, so x-core layouts carry over):
 * `boundaryCount` pages at each end, `siblingCount` pages on each side of
 * `page`, and an ellipsis where pages are skipped. Always at least `[1]`.
 */
export function paginationItems(
    page: number,
    pageCount: number,
    siblingCount: number,
    boundaryCount: number
): PaginationItem[] {
    const count = Math.max(pageCount, 1);
    const startPages = range(1, Math.min(boundaryCount, count));
    const endPages = range(
        Math.max(count - boundaryCount + 1, boundaryCount + 1),
        count
    );
    const siblingsStart = Math.max(
        Math.min(
            page - siblingCount,
            count - boundaryCount - siblingCount * 2 - 1
        ),
        boundaryCount + 2
    );
    const siblingsEnd = Math.min(
        Math.max(page + siblingCount, boundaryCount + siblingCount * 2 + 2),
        (endPages[0] ?? count + 1) - 2
    );
    const items: (PaginationItem | null)[] = [
        ...startPages,
        siblingsStart > boundaryCount + 2
            ? 'start-ellipsis'
            : boundaryCount + 1 < count - boundaryCount
              ? boundaryCount + 1
              : null,
        ...range(siblingsStart, siblingsEnd),
        siblingsEnd < count - boundaryCount - 1
            ? 'end-ellipsis'
            : count - boundaryCount > boundaryCount
              ? count - boundaryCount
              : null,
        ...endPages,
    ];
    return items.filter((item): item is PaginationItem => item !== null);
}

/** Visible and accessible text of a {@link Pagination} (translate per locale). */
export type PaginationLabels = {
    /** Name of the `nav` landmark. @default 'Pagination' */
    navigation: string;
    /** @default 'First page' */
    first: string;
    /** @default 'Previous page' */
    previous: string;
    /** @default 'Next page' */
    next: string;
    /** @default 'Last page' */
    last: string;
    /** Name of a page button (its visible text is the number). @default `Page ${page}` */
    page: (page: number) => string;
    /** Label of the rows-per-page Select. @default 'Rows per page' */
    rowsPerPage: string;
    /** Range text, for example "11–20 of 120". */
    range: (from: number, to: number, count: number) => string;
    /** Page indicator (mobile) and the announcement after a page change. @default `Page ${page} of ${pageCount}` */
    pageIndicator: (page: number, pageCount: number) => string;
};

const defaultLabels: PaginationLabels = {
    navigation: 'Pagination',
    first: 'First page',
    previous: 'Previous page',
    next: 'Next page',
    last: 'Last page',
    page: (page) => `Page ${page}`,
    rowsPerPage: 'Rows per page',
    range: (from, to, count) => `${from}–${to} of ${count}`,
    pageIndicator: (page, pageCount) => `Page ${page} of ${pageCount}`,
};

const pageButtonStyles = cva(
    [
        // Margin and border restated: Bootstrap reboot and customer360
        // (`button + button`, `button:focus`) style every button.
        'hz:m-0 hz:inline-flex hz:items-center hz:justify-center hz:rounded-full hz:border-0 hz:px-2 hz:align-middle',
        'hz:h-11 hz:min-w-11 hz:tablet:pointer-fine:h-8 hz:tablet:pointer-fine:min-w-8',
        'hz:cursor-pointer hz:text-body-secondary hz:tabular-nums hz:select-none',
        'hz:transition-colors hz:duration-fast hz:ease-standard',
        'hz:outline-ring hz:focus:outline-none hz:focus-visible:outline-2 hz:focus-visible:outline-offset-2 hz:focus-visible:outline-solid hz:focus-visible:outline-ring',
        'hz:inactive:cursor-not-allowed',
    ],
    {
        variants: {
            current: {
                false: 'hz:bg-transparent hz:text-foreground hz:hover:bg-accent hz:hover:text-accent-foreground hz:inactive:bg-transparent hz:inactive:text-muted-foreground',
                // Forced colors drop the fill: Highlight keeps the current page visible.
                true: 'hz:bg-primary hz:font-semibold hz:text-primary-foreground hz:hover:bg-primary-hover hz:forced-colors:forced-color-adjust-none hz:forced-colors:bg-[Highlight] hz:forced-colors:text-[HighlightText]',
            },
        },
        defaultVariants: { current: false },
    }
);

/** x-core PaginationV2 / MUI Pagination props that are dropped (dev warning). */
const legacyPaginationProps = {
    onChange: 'use onPageChange(page)',
    shouldShow: 'use showPages',
    showRowsPerPageOptions: 'use rowsPerPageOptions',
    isTablePagination: 'the compact layout applies below tablet',
    children: 'Pagination renders its own items',
    color: 'Pagination has one look',
    variant: 'Pagination has one look',
    shape: 'Pagination has one look',
    size: 'Pagination has one size per breakpoint',
    sx: 'use className',
    renderItem: 'not supported',
    getItemAriaLabel: 'use labels',
    hidePrevButton: 'not supported',
    hideNextButton: 'not supported',
    defaultPage: 'controlled only: pass page',
} as const;

/** Props for {@link Pagination}. */
export type PaginationProps = Omit<
    HTMLAttributes<HTMLElement>,
    'onChange' | 'children'
> &
    DnbBase & {
        /** Current page, 1-based (x-core). Clamped to the page range. */
        page: number;
        /**
         * Total number of items (x-core `PaginationV2` `count`); pages are
         * `ceil(count / rowsPerPage)`. Gives the range text.
         */
        count?: number;
        /**
         * Number of pages, when the item count is unknown (x-core v1
         * `Pagination` `count`). Ignored when `count` is set.
         */
        pageCount?: number;
        /** Items per page. @default 25 */
        rowsPerPage?: number;
        /** Called with the requested page (1-based). Replaces MUI `onChange(event, page)`. */
        onPageChange?: (page: number) => void;
        /** Shows the rows-per-page Select. @default false */
        showRowsPerPage?: boolean;
        /** Rows-per-page choices (x-core `showRowsPerPageOptions`). @default [10, 25, 50, 100] */
        rowsPerPageOptions?: readonly number[];
        /** Called with the chosen number of rows per page. */
        onRowsPerPageChange?: (rowsPerPage: number) => void;
        /** First-page button (from tablet). @default true */
        showFirstButton?: boolean;
        /** Last-page button (from tablet). @default true */
        showLastButton?: boolean;
        /** Pages shown on each side of the current one (from tablet). @default 2 */
        siblingCount?: number;
        /** Pages always shown at each end (from tablet). @default 1 */
        boundaryCount?: number;
        /** Range text ("11–20 of 120", needs `count`; from tablet). @default false */
        showTotalItems?: boolean;
        /**
         * Page buttons. `false` keeps only the range text and rows-per-page
         * (x-core `shouldShow={false}`). @default true
         */
        showPages?: boolean;
        /** Blocks every control (they stay focusable, `aria-disabled`). @default false */
        disabled?: boolean;
        /** Text overrides (translations). */
        labels?: Partial<PaginationLabels>;
    };

const pageCountOf = (
    count: number | undefined,
    pageCount: number | undefined,
    rowsPerPage: number
) => {
    if (count !== undefined)
        return rowsPerPage > 0 && count > 0
            ? Math.ceil(count / rowsPerPage)
            : 1;
    return Math.max(Math.floor(pageCount ?? 1), 1);
};

/**
 * Page navigation for a list or table: a `nav` landmark (`aria-label`) with
 * numbered page buttons (`aria-current="page"` on the current one),
 * previous/next and optional first/last, a range text and a rows-per-page
 * Select. Below `tablet` it collapses to previous, a "Page 2 of 12"
 * indicator and next, all 44px. Edge buttons are `aria-disabled` (they keep
 * focus). A page change is announced once in a polite status region.
 * Arrows mirror under RTL.
 */
export const Pagination = forwardRef<HTMLElement, PaginationProps>(
    function Pagination(
        {
            page: pageProp,
            count,
            pageCount: pageCountProp,
            rowsPerPage = 25,
            onPageChange,
            showRowsPerPage = false,
            rowsPerPageOptions = [10, 25, 50, 100],
            onRowsPerPageChange,
            showFirstButton = true,
            showLastButton = true,
            siblingCount = 2,
            boundaryCount = 1,
            showTotalItems = false,
            showPages = true,
            disabled = false,
            labels: labelsProp,
            className,
            ...props
        },
        ref
    ) {
        const rest = omitLegacyProps(
            'Pagination',
            props,
            legacyPaginationProps
        );
        const labels = { ...defaultLabels, ...labelsProp };
        const pageCount = pageCountOf(count, pageCountProp, rowsPerPage);
        const page = Math.min(
            Math.max(Math.floor(pageProp) || 1, 1),
            pageCount
        );
        const rowsLabelId = useId();

        // Announce a page change (not the first render) once.
        const [announcement, setAnnouncement] = useState('');
        const shownPage = useRef(page);
        useEffect(() => {
            if (shownPage.current === page) return;
            shownPage.current = page;
            setAnnouncement(labels.pageIndicator(page, pageCount));
            // Only a page change announces; `labels` (a new object each
            // render) is read at that moment.
        }, [page, pageCount]);

        const go = (target: number) => {
            if (disabled || target === page) return;
            onPageChange?.(target);
        };

        const edge = (
            key: string,
            label: string,
            icon: ReactNode,
            target: number,
            blocked: boolean,
            fromTablet = false
        ) => (
            <li
                key={key}
                className={cn(
                    'hz:m-0 hz:flex hz:p-0',
                    fromTablet && 'hz:hidden hz:tablet:flex'
                )}
            >
                <IconButton
                    variant="ghost"
                    size="sm"
                    aria-label={label}
                    aria-disabled={blocked || disabled || undefined}
                    data-page-edge={key}
                    className="hz:m-0 hz:rtl:[&_svg]:-scale-x-100"
                    onClick={() => go(target)}
                >
                    {icon}
                </IconButton>
            </li>
        );

        const from = count ? (page - 1) * rowsPerPage + 1 : 0;
        const to = count ? Math.min(page * rowsPerPage, count) : 0;

        return (
            <nav
                {...rest}
                ref={ref}
                aria-label={rest['aria-label'] ?? labels.navigation}
                data-pagination=""
                className={cn(
                    // text-start: Bootstrap's `body { text-align: left }` is inherited (wrong under RTL).
                    'hz:flex hz:flex-wrap hz:items-center hz:justify-end hz:gap-x-6 hz:gap-y-2 hz:text-start hz:text-body-secondary hz:text-foreground',
                    className
                )}
            >
                {showTotalItems && count !== undefined && (
                    <p
                        data-pagination-range=""
                        className="hz:m-0 hz:hidden hz:tabular-nums hz:tablet:block"
                    >
                        {labels.range(from, to, count)}
                    </p>
                )}
                {showRowsPerPage && (
                    <div className="hz:flex hz:items-center hz:gap-2">
                        <span
                            id={rowsLabelId}
                            className="hz:whitespace-nowrap hz:text-muted-foreground"
                        >
                            {labels.rowsPerPage}
                        </span>
                        <div className="hz:w-20">
                            <Select
                                size="sm"
                                aria-labelledby={rowsLabelId}
                                value={String(rowsPerPage)}
                                disabled={disabled}
                                onValueChange={(value) =>
                                    onRowsPerPageChange?.(Number(value))
                                }
                            >
                                {rowsPerPageOptions.map((option) => (
                                    <SelectItem
                                        key={option}
                                        value={String(option)}
                                    >
                                        {option}
                                    </SelectItem>
                                ))}
                            </Select>
                        </div>
                    </div>
                )}
                {showPages && (
                    <ul className="hz:m-0 hz:flex hz:list-none hz:items-center hz:gap-1 hz:p-0">
                        {showFirstButton &&
                            edge(
                                'first',
                                labels.first,
                                <CaretDoubleLeftIcon />,
                                1,
                                page <= 1,
                                true
                            )}
                        {edge(
                            'previous',
                            labels.previous,
                            <CaretLeftIcon />,
                            page - 1,
                            page <= 1
                        )}
                        <li
                            data-pagination-indicator=""
                            className="hz:m-0 hz:px-2 hz:tabular-nums hz:whitespace-nowrap hz:tablet:hidden"
                        >
                            {labels.pageIndicator(page, pageCount)}
                        </li>
                        {paginationItems(
                            page,
                            pageCount,
                            siblingCount,
                            boundaryCount
                        ).map((item) =>
                            typeof item === 'number' ? (
                                <li
                                    key={item}
                                    className="hz:m-0 hz:hidden hz:p-0 hz:tablet:flex"
                                >
                                    <button
                                        type="button"
                                        aria-label={labels.page(item)}
                                        aria-current={
                                            item === page ? 'page' : undefined
                                        }
                                        aria-disabled={disabled || undefined}
                                        className={pageButtonStyles({
                                            current: item === page,
                                        })}
                                        onClick={() => go(item)}
                                    >
                                        {item}
                                    </button>
                                </li>
                            ) : (
                                <li
                                    key={item}
                                    aria-hidden="true"
                                    className="hz:m-0 hz:hidden hz:min-w-6 hz:justify-center hz:p-0 hz:text-muted-foreground hz:tablet:flex"
                                >
                                    …
                                </li>
                            )
                        )}
                        {edge(
                            'next',
                            labels.next,
                            <CaretRightIcon />,
                            page + 1,
                            page >= pageCount
                        )}
                        {showLastButton &&
                            edge(
                                'last',
                                labels.last,
                                <CaretDoubleRightIcon />,
                                pageCount,
                                page >= pageCount,
                                true
                            )}
                    </ul>
                )}
                <span role="status" className="hz:sr-only">
                    {announcement}
                </span>
            </nav>
        );
    }
);
Pagination.displayName = 'Pagination';
