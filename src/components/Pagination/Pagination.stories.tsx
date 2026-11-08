import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, fn, userEvent, within } from 'storybook/test';
import { HorizonProvider } from '../../provider';
import { ResponsiveSpec } from '../../stories/ResponsiveSpec';
import {
    storyLayout as layout,
    viewportStory,
    type Viewport,
} from '../../stories/viewports';
import { Pagination, type PaginationProps } from '.';

function Controlled(props: Partial<PaginationProps>) {
    const [page, setPage] = useState(props.page ?? 1);
    const [rows, setRows] = useState(props.rowsPerPage ?? 10);
    return (
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
                setPage(1);
                props.onRowsPerPageChange?.(next);
            }}
        />
    );
}

const meta = {
    title: 'Components/Pagination',
    component: Pagination,
    parameters: {
        layout: 'padded',
        docs: {
            description: {
                component: [
                    'Page navigation: a `nav` landmark with page buttons (`aria-current="page"`), previous/next, optional first/last, range text and a rows-per-page Select. Below `tablet` it collapses to previous, a "Page 2 of 12" indicator and next (44px). Edge buttons are `aria-disabled` and keep focus; a page change is announced once.',
                    '',
                    'Ported from x-core `PaginationV2`: `page` (1-based), `count` (items), `rowsPerPage`, `showRowsPerPage`, `onRowsPerPageChange`, `showFirstButton`, `showLastButton`, `siblingCount`, `boundaryCount`, `showTotalItems` kept; `onChange(event, page)` -> `onPageChange(page)`, `showRowsPerPageOptions` -> `rowsPerPageOptions`, `shouldShow` -> `showPages`; v1 `Pagination` `count` (pages) -> `pageCount`; MUI look props dropped.',
                ].join('\n'),
            },
        },
    },
    args: {
        page: 1,
        count: 120,
        rowsPerPage: 10,
        onPageChange: fn(),
        onRowsPerPageChange: fn(),
    },
    render: (args) => <Controlled {...args} />,
} satisfies Meta<typeof Pagination>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Controls playground. */
export const Playground: Story = {};

/** Everything on: range text, rows per page, first/last. */
export const Full: Story = {
    args: { page: 5, showTotalItems: true, showRowsPerPage: true },
    play: async ({ canvasElement, args }) => {
        const canvas = within(canvasElement);
        await userEvent.click(canvas.getByRole('button', { name: 'Page 6' }));
        await expect(args.onPageChange).toHaveBeenLastCalledWith(6);
        await expect(
            canvas.getByRole('button', { name: 'Page 6' })
        ).toHaveAttribute('aria-current', 'page');
        await expect(canvas.getByRole('status')).toHaveTextContent(
            'Page 6 of 12'
        );
    },
};

/** States: first page, last page, few pages, disabled, no first/last. */
export const States: Story = {
    render: (args) => (
        <div style={layout.stack}>
            <Controlled {...args} page={1} aria-label="First page state" />
            <Controlled {...args} page={12} aria-label="Last page state" />
            <Controlled {...args} count={30} aria-label="Three pages" />
            <Controlled {...args} page={4} disabled aria-label="Disabled" />
            <Controlled
                {...args}
                aria-label="Without first and last"
                page={6}
                showFirstButton={false}
                showLastButton={false}
                siblingCount={1}
            />
        </div>
    ),
};

/** Rows per page only (x-core `shouldShow={false}` with `showRowsPerPage`). */
export const RowsPerPageOnly: Story = {
    args: { showRowsPerPage: true, showPages: false, showTotalItems: true },
};

/** Long numbers keep tabular figures; a long translated label wraps the row. */
export const LongText: Story = {
    args: {
        page: 4821,
        count: 1_234_567,
        rowsPerPage: 25,
        showTotalItems: true,
        showRowsPerPage: true,
        labels: { rowsPerPage: 'Number of companies shown on each page' },
    },
};

/** Right-to-left: arrows mirror, the list runs from the right. */
export const RTL: Story = {
    globals: { direction: 'rtl' },
    args: {
        page: 3,
        showTotalItems: true,
        labels: {
            navigation: 'עימוד',
            first: 'עמוד ראשון',
            previous: 'העמוד הקודם',
            next: 'העמוד הבא',
            last: 'עמוד אחרון',
            page: (n) => `עמוד ${n}`,
            rowsPerPage: 'שורות בעמוד',
            range: (from, to, count) => `${from}–${to} מתוך ${count}`,
            pageIndicator: (page, total) => `עמוד ${page} מתוך ${total}`,
        },
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const next = canvas.getByRole('button', { name: 'העמוד הבא' });
        const previous = canvas.getByRole('button', { name: 'העמוד הקודם' });
        // Previous sits on the right (inline start) and its caret is mirrored.
        await expect(previous.getBoundingClientRect().left).toBeGreaterThan(
            next.getBoundingClientRect().left
        );
        const svg = next.querySelector('svg');
        await expect(svg && getComputedStyle(svg).scale).toBe('-1 1');
    },
};

/** All three brands side by side. */
export const Brands: Story = {
    render: (args) => (
        <div style={layout.stack}>
            {(['cial', 'dnb', 'il'] as const).map((brand) => (
                <HorizonProvider
                    key={brand}
                    brand={brand}
                    style={{ background: 'var(--background)', padding: 16 }}
                >
                    <Controlled
                        {...args}
                        page={3}
                        showTotalItems
                        aria-label={`${brand} pagination`}
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
            caption="Pagination responsive specification"
            spec={{
                mobile: {
                    size: '44px previous/next (ghost IconButton sm), 14px text, rows-per-page Select 44px.',
                    density:
                        '4px between buttons; 24px between groups, 8px when wrapped.',
                    layout: 'Previous, "Page 2 of 12" indicator, next (x-core TablePagination at mobile); rows-per-page wraps above when shown. Right-aligned (inline end).',
                    contentVisibility:
                        'Numbered pages, first/last and the range text are hidden; the indicator replaces them.',
                    interaction:
                        'Tap previous/next. Disabled edges stay focusable (aria-disabled). Page changes are announced.',
                },
                tablet: {
                    size: 'Fine pointer: 32px page and arrow buttons, 32px Select. Touch: 44px.',
                    density: '4px between buttons, 24px between groups.',
                    layout: 'Range text, rows per page, first, previous, numbered pages with ellipses (siblingCount 2, boundaryCount 1), next, last in one row; wraps when narrow.',
                    contentVisibility:
                        'Everything shown; the mobile indicator is hidden.',
                    interaction:
                        'Tab through buttons; Enter/Space activate; the current page has aria-current.',
                },
                laptop: {
                    size: 'As tablet.',
                    density: 'As tablet.',
                    layout: 'As tablet.',
                    contentVisibility: 'As tablet.',
                    interaction: 'As tablet.',
                    note: 'Identical to tablet: the row already fits.',
                },
                desktop: {
                    size: 'As tablet.',
                    density: 'As tablet.',
                    layout: 'As tablet.',
                    contentVisibility: 'As tablet.',
                    interaction: 'As tablet.',
                    note: 'Identical to tablet.',
                },
            }}
        />
    ),
};

/* ---- Viewport tests ---- */

const pageButtons = (nav: HTMLElement) =>
    within(nav)
        .queryAllByRole('button', { name: /^Page \d+$/ })
        .filter((b) => b.getBoundingClientRect().width > 0);

async function assertPagination(canvasElement: HTMLElement, vp: Viewport) {
    const nav = within(canvasElement).getByRole('navigation', {
        name: 'Pagination',
    });
    const next = within(nav).getByRole('button', { name: 'Next page' });
    const indicator = nav.querySelector('[data-pagination-indicator]');
    const range = nav.querySelector('[data-pagination-range]');
    const first = nav.querySelector('[data-page-edge="first"]');
    if (!first) throw new Error('no first-page button');
    if (vp === 'mobile') {
        await expect(next.getBoundingClientRect().height).toBe(44);
        await expect(next.getBoundingClientRect().width).toBe(44);
        await expect(pageButtons(nav)).toHaveLength(0);
        await expect(first.getBoundingClientRect().width).toBe(0);
        await expect(indicator?.getBoundingClientRect().width).toBeGreaterThan(
            0
        );
        await expect(range?.getBoundingClientRect().width).toBe(0);
        // No horizontal overflow in a 320px column.
        const box = canvasElement.querySelector<HTMLElement>(
            '[data-testid="narrow"]'
        );
        await expect(box && box.scrollWidth).toBeLessThanOrEqual(320);
    } else {
        await expect(next.getBoundingClientRect().height).toBe(32);
        await expect(pageButtons(nav).length).toBeGreaterThan(4);
        await expect(pageButtons(nav)[0]?.getBoundingClientRect().height).toBe(
            32
        );
        await expect(first.getBoundingClientRect().width).toBe(32);
        await expect(indicator?.getBoundingClientRect().width).toBe(0);
        await expect(range?.getBoundingClientRect().width).toBeGreaterThan(0);
    }
}

function Probe() {
    return (
        <div data-testid="narrow" style={{ inlineSize: 320, maxWidth: '100%' }}>
            <Controlled page={5} showTotalItems showRowsPerPage />
        </div>
    );
}

export const LayoutMobile: Story = {
    ...viewportStory('mobile', () => <Probe />, assertPagination),
    name: 'collapses to previous, indicator and next at mobile',
};
export const LayoutTablet: Story = {
    ...viewportStory(
        'tablet',
        () => <Controlled page={5} showTotalItems />,
        assertPagination
    ),
    name: 'shows numbered 32px pages at tablet',
};
export const LayoutLaptop: Story = {
    ...viewportStory(
        'laptop',
        () => <Controlled page={5} showTotalItems />,
        assertPagination
    ),
    name: 'shows numbered 32px pages at laptop',
};
export const LayoutDesktop: Story = {
    ...viewportStory(
        'desktop',
        () => <Controlled page={5} showTotalItems />,
        assertPagination
    ),
    name: 'shows numbered 32px pages at desktop',
};

/** Current page and hover colours come from the tokens. */
export const ComputedStyles: Story = {
    name: 'applies Horizon tokens to the current page',
    tags: ['!autodocs', '!dev'],
    render: (args) => (
        <div>
            <Controlled {...args} page={2} />
            <span
                data-testid="probe"
                style={{
                    color: 'var(--primary-foreground)',
                    background: 'var(--primary)',
                }}
            />
        </div>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const probe = getComputedStyle(canvas.getByTestId('probe'));
        const current = getComputedStyle(
            canvas.getByRole('button', { name: 'Page 2' })
        );
        await expect(current.backgroundColor).toBe(probe.backgroundColor);
        await expect(current.color).toBe(probe.color);
        await expect(current.borderRadius).toBe('100px');
    },
};
