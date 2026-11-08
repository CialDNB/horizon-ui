import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { resetWarnings } from '../../lib/options';
import { HorizonProvider } from '../../provider';
import { Pagination, paginationItems, type PaginationProps } from '.';

afterEach(() => {
    resetWarnings();
    vi.restoreAllMocks();
});

function Controlled(props: Partial<PaginationProps>) {
    const [page, setPage] = useState(props.page ?? 1);
    const [rows, setRows] = useState(props.rowsPerPage ?? 10);
    return (
        <HorizonProvider>
            <Pagination
                count={120}
                {...props}
                page={page}
                rowsPerPage={rows}
                onPageChange={(next) => {
                    setPage(next);
                    props.onPageChange?.(next);
                }}
                onRowsPerPageChange={(next) => {
                    setRows(next);
                    props.onRowsPerPageChange?.(next);
                }}
            />
        </HorizonProvider>
    );
}

const nav = () => screen.getByRole('navigation', { name: 'Pagination' });
const pageButton = (n: number) =>
    within(nav()).getByRole('button', { name: `Page ${n}` });

describe('paginationItems', () => {
    it('lists every page when they fit', () => {
        expect(paginationItems(1, 5, 1, 1)).toEqual([1, 2, 3, 4, 5]);
    });
    it('ellipsis after the start and before the end (MUI usePagination)', () => {
        expect(paginationItems(6, 12, 1, 1)).toEqual([
            1,
            'start-ellipsis',
            5,
            6,
            7,
            'end-ellipsis',
            12,
        ]);
        expect(paginationItems(1, 12, 2, 1)).toEqual([
            1,
            2,
            3,
            4,
            5,
            6,
            7,
            'end-ellipsis',
            12,
        ]);
        expect(paginationItems(12, 12, 1, 1)).toEqual([
            1,
            'start-ellipsis',
            8,
            9,
            10,
            11,
            12,
        ]);
    });
    it('a single page or none', () => {
        expect(paginationItems(1, 1, 2, 1)).toEqual([1]);
        expect(paginationItems(1, 0, 2, 1)).toEqual([1]);
    });
});

describe('Pagination', () => {
    it('is a navigation landmark of page buttons; the current one has aria-current', () => {
        render(<Controlled page={3} />);
        expect(nav().tagName).toBe('NAV');
        expect(pageButton(3)).toHaveAttribute('aria-current', 'page');
        expect(pageButton(2)).not.toHaveAttribute('aria-current');
        // 120 items, 10 per page: 12 pages, x-core default siblingCount 2.
        expect(pageButton(12)).toBeInTheDocument();
        expect(within(nav()).getAllByRole('listitem').length).toBeGreaterThan(
            5
        );
    });

    it('page buttons, previous and next report the page (1-based)', async () => {
        const user = userEvent.setup();
        const onPageChange = vi.fn();
        render(<Controlled page={2} onPageChange={onPageChange} />);
        await user.click(pageButton(4));
        expect(onPageChange).toHaveBeenLastCalledWith(4);
        await user.click(screen.getByRole('button', { name: 'Next page' }));
        expect(onPageChange).toHaveBeenLastCalledWith(5);
        await user.click(screen.getByRole('button', { name: 'Previous page' }));
        expect(onPageChange).toHaveBeenLastCalledWith(4);
        await user.click(screen.getByRole('button', { name: 'Last page' }));
        expect(onPageChange).toHaveBeenLastCalledWith(12);
        await user.click(screen.getByRole('button', { name: 'First page' }));
        expect(onPageChange).toHaveBeenLastCalledWith(1);
    });

    it('edges are aria-disabled, keep focus and report nothing', async () => {
        const user = userEvent.setup();
        const onPageChange = vi.fn();
        render(<Controlled page={11} onPageChange={onPageChange} />);
        const next = screen.getByRole('button', { name: 'Next page' });
        await user.click(next);
        expect(onPageChange).toHaveBeenLastCalledWith(12);
        expect(next).toHaveAttribute('aria-disabled', 'true');
        expect(next).not.toBeDisabled();
        expect(next).toHaveFocus();
        await user.click(next);
        expect(onPageChange).toHaveBeenCalledTimes(1);
        expect(
            screen.getByRole('button', { name: 'Last page' })
        ).toHaveAttribute('aria-disabled', 'true');
        expect(
            screen.getByRole('button', { name: 'Previous page' })
        ).not.toHaveAttribute('aria-disabled');
    });

    it('keyboard: Tab reaches the buttons, Enter and Space activate', async () => {
        const user = userEvent.setup();
        const onPageChange = vi.fn();
        render(<Controlled page={1} onPageChange={onPageChange} />);
        pageButton(2).focus();
        await user.keyboard('{Enter}');
        expect(onPageChange).toHaveBeenLastCalledWith(2);
        await user.tab();
        expect(pageButton(3)).toHaveFocus();
        await user.keyboard(' ');
        expect(onPageChange).toHaveBeenLastCalledWith(3);
    });

    it('shows the range text and the mobile page indicator', () => {
        render(<Controlled page={2} showTotalItems />);
        expect(nav()).toHaveTextContent('11–20 of 120');
        expect(nav()).toHaveTextContent('Page 2 of 12');
    });

    it('announces a page change once, not the initial page', () => {
        const { rerender } = render(
            <HorizonProvider>
                <Pagination page={1} count={50} rowsPerPage={10} />
            </HorizonProvider>
        );
        const status = screen.getByRole('status');
        expect(status).toHaveTextContent('');
        rerender(
            <HorizonProvider>
                <Pagination page={2} count={50} rowsPerPage={10} />
            </HorizonProvider>
        );
        expect(status).toHaveTextContent('Page 2 of 5');
        rerender(
            <HorizonProvider>
                <Pagination page={2} count={50} rowsPerPage={10} />
            </HorizonProvider>
        );
        expect(screen.getAllByRole('status')).toHaveLength(1);
    });

    it('pageCount instead of an item count (x-core Pagination v1 `count`)', () => {
        render(
            <HorizonProvider>
                <Pagination page={1} pageCount={4} showTotalItems />
            </HorizonProvider>
        );
        expect(pageButton(4)).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Page 5' })).toBeNull();
        // No item count, so no range text.
        expect(nav()).not.toHaveTextContent(' of 4 ');
        expect(nav()).toHaveTextContent('Page 1 of 4');
    });

    it('rows per page uses Select and reports a number', async () => {
        const user = userEvent.setup();
        const onRowsPerPageChange = vi.fn();
        render(
            <Controlled
                showRowsPerPage
                rowsPerPageOptions={[10, 25, 50]}
                onRowsPerPageChange={onRowsPerPageChange}
            />
        );
        const select = screen.getByRole('combobox', { name: 'Rows per page' });
        expect(select).toHaveTextContent('10');
        await user.click(select);
        await user.click(await screen.findByRole('option', { name: '25' }));
        expect(onRowsPerPageChange).toHaveBeenLastCalledWith(25);
        expect(select).toHaveTextContent('25');
    });

    it('showPages={false} keeps rows per page and hides the buttons (x-core shouldShow)', () => {
        render(<Controlled showRowsPerPage showPages={false} />);
        expect(
            screen.getByRole('combobox', { name: 'Rows per page' })
        ).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Next page' })).toBeNull();
    });

    it('first/last buttons are optional; labels are translatable', () => {
        render(
            <Controlled
                showFirstButton={false}
                showLastButton={false}
                showTotalItems
                labels={{
                    navigation: 'עימוד',
                    next: 'הבא',
                    previous: 'הקודם',
                    page: (n) => `עמוד ${n}`,
                    range: (from, to, count) => `${from}-${to} מתוך ${count}`,
                }}
            />
        );
        const landmark = screen.getByRole('navigation', { name: 'עימוד' });
        expect(within(landmark).getByRole('button', { name: 'הבא' })).toBe(
            screen.getByRole('button', { name: 'הבא' })
        );
        expect(screen.getByRole('button', { name: 'עמוד 2' })).toBeVisible();
        expect(landmark).toHaveTextContent('1-10 מתוך 120');
        expect(screen.queryByRole('button', { name: 'First page' })).toBeNull();
    });

    it('a page out of range clamps; disabled blocks everything', async () => {
        const user = userEvent.setup();
        const onPageChange = vi.fn();
        render(
            <HorizonProvider>
                <Pagination
                    page={40}
                    count={30}
                    rowsPerPage={10}
                    disabled
                    onPageChange={onPageChange}
                />
            </HorizonProvider>
        );
        expect(pageButton(3)).toHaveAttribute('aria-current', 'page');
        await user.click(pageButton(1));
        expect(onPageChange).not.toHaveBeenCalled();
    });

    it('drops x-core props with one warning (onChange, shouldShow, showRowsPerPageOptions, sx)', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const legacy = {
            onChange: () => undefined,
            shouldShow: true,
            showRowsPerPageOptions: [5],
            sx: { p: 1 },
            isTablePagination: true,
        } as unknown as Partial<PaginationProps>;
        render(
            <HorizonProvider>
                <Pagination page={1} count={10} {...legacy} />
            </HorizonProvider>
        );
        expect(nav()).not.toHaveAttribute('sx');
        expect(nav()).not.toHaveAttribute('shouldshow');
        expect(warn).toHaveBeenCalledWith(
            expect.stringContaining('"onChange" is not supported')
        );
        expect(warn).toHaveBeenCalledWith(
            expect.stringContaining('"showRowsPerPageOptions"')
        );
    });

    it('forwards ref, className and data-did to the nav', () => {
        const ref = createRef<HTMLElement>();
        render(
            <HorizonProvider>
                <Pagination
                    ref={ref}
                    page={1}
                    count={10}
                    className="custom"
                    data-did="pager"
                />
            </HorizonProvider>
        );
        expect(ref.current).toBe(nav());
        expect(nav()).toHaveClass('custom');
        expect(nav()).toHaveAttribute('data-did', 'pager');
    });

    it('renders without a provider', () => {
        render(<Pagination page={1} count={30} rowsPerPage={10} />);
        expect(pageButton(1)).toHaveAttribute('aria-current', 'page');
    });
});
