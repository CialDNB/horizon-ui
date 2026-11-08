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
import { FormField } from '../FormField';
import { SearchBar } from '.';

const column = { display: 'grid', gap: 16, maxInlineSize: 360 } as const;

const meta = {
    title: 'Components/SearchBar',
    component: SearchBar,
    parameters: {
        layout: 'padded',
        docs: {
            description: {
                component: [
                    'A search field in a `role="search"` landmark: a search button at the start, a clear button while there is text, Enter to search, an optional spinner. Built on Input (same sizes, states and FormField wiring). Ported from x-core `SearchBarV2`: `searchValue` becomes `value`, `onSearchChange` becomes `onValueChange`, `onSearch` kept (Enter, the search button, and `""` after clearing, as x-core), `loader` becomes `loading`, `hasError` becomes `invalid`; `label`/`helperText` move to FormField; `iconSize` dropped. No debounce (x-core has none): debounce in `onValueChange` if a call site needs it.',
                    '',
                    "The landmark takes the field's `aria-label` as its name (or `landmarkLabel`), so several search bars on one page stay distinguishable.",
                ].join('\n'),
            },
        },
    },
    args: {
        'aria-label': 'Search companies',
        placeholder: 'Search by name, registration or DUNS',
        onSearch: fn(),
    },
    render: (args) => (
        <div style={column}>
            <SearchBar {...args} />
        </div>
    ),
} satisfies Meta<typeof SearchBar>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Controls playground. */
export const Playground: Story = {};

function ControlledDemo() {
    const [value, setValue] = useState('Acme');
    const [searched, setSearched] = useState('');
    return (
        <div style={column}>
            <SearchBar
                aria-label="Search tags"
                value={value}
                onValueChange={setValue}
                onSearch={setSearched}
            />
            <p style={{ margin: 0 }} data-testid="searched">
                Searched: {searched || '(nothing)'}
            </p>
        </div>
    );
}

/** Enter searches; the clear button empties and searches with "". */
export const Searching: Story = {
    render: () => <ControlledDemo />,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const box = canvas.getByRole('searchbox');
        await userEvent.click(box);
        await userEvent.keyboard(' Ltd{Enter}');
        await expect(canvas.getByTestId('searched')).toHaveTextContent(
            'Acme Ltd'
        );
        await userEvent.click(canvas.getByRole('button', { name: 'Clear' }));
        await expect(box).toHaveValue('');
        await expect(box).toHaveFocus();
    },
};

/** Sizes and states. */
export const States: Story = {
    render: () => (
        <div style={column}>
            {(['sm', 'md', 'lg'] as const).map((size) => (
                <SearchBar
                    key={size}
                    size={size}
                    aria-label={`Search ${size}`}
                    placeholder={`Size ${size}`}
                />
            ))}
            <SearchBar aria-label="Search with text" defaultValue="Acme" />
            <SearchBar
                aria-label="Search loading"
                defaultValue="Acme"
                loading
            />
            <SearchBar aria-label="Search invalid" defaultValue="%%" invalid />
            <SearchBar
                aria-label="Search disabled"
                defaultValue="Acme"
                disabled
            />
        </div>
    ),
};

/** In a FormField (x-core `label` / `helperText`). */
export const WithFormField: Story = {
    render: () => (
        <div style={column}>
            <FormField
                label="Find a company"
                description="Name, registration number or DUNS"
            >
                <SearchBar placeholder="Search" />
            </FormField>
        </div>
    ),
};

/** Long text scrolls inside the field; the buttons keep their size. */
export const LongText: Story = {
    render: () => (
        <div style={{ ...column, maxInlineSize: 240 }}>
            <SearchBar
                aria-label="Long search"
                defaultValue="Very Long International Trading Company Limited Partnership Holdings"
            />
        </div>
    ),
};

/** Right-to-left: the search button at the inline start (right). */
export const RTL: Story = {
    globals: { direction: 'rtl' },
    render: () => (
        <div style={column}>
            <SearchBar
                aria-label="חיפוש"
                defaultValue="אקמי"
                data-testid="rtl"
            />
        </div>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const box = canvas.getByTestId('rtl');
        const search = canvas.getByRole('button', { name: 'Search' });
        const clear = canvas.getByRole('button', { name: 'Clear' });
        await expect(search.getBoundingClientRect().left).toBeGreaterThan(
            box.getBoundingClientRect().left
        );
        await expect(clear.getBoundingClientRect().right).toBeLessThanOrEqual(
            box.getBoundingClientRect().left
        );
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
                    <div style={column}>
                        <SearchBar
                            aria-label={`${brand} empty`}
                            placeholder="Search"
                        />
                        <SearchBar
                            aria-label={`${brand} filled`}
                            defaultValue="Acme"
                        />
                    </div>
                </HorizonProvider>
            ))}
        </div>
    ),
};

/** Per-breakpoint specification (Responsive Standard). */
export const Responsive: Story = {
    render: () => (
        <ResponsiveSpec
            caption="SearchBar responsive specification"
            spec={{
                mobile: {
                    size: 'Field 44px (lg 48px), 16px text (no iOS zoom); search and clear buttons 44px.',
                    density:
                        'As Input: 12-16px inline padding; the buttons tuck into it.',
                    layout: 'Full width of its container (x-core min-width 300px dropped: it overflowed at 320px).',
                    contentVisibility:
                        'Long text scrolls inside the field; the clear button appears only with text.',
                    interaction:
                        'Type, then Enter (the keyboard shows a "search" key) or tap the search button.',
                },
                tablet: {
                    size: 'Fine pointer: sm 32, md 40, lg 48; 14px text (lg 16px); buttons 32px. Touch: mobile sizes.',
                    density: 'As mobile.',
                    layout: 'As mobile.',
                    contentVisibility: 'As mobile.',
                    interaction:
                        'Enter or the search button; Escape is left to the browser (clears type=search in some engines).',
                },
                laptop: {
                    size: 'As tablet.',
                    density: 'As tablet.',
                    layout: 'As tablet.',
                    contentVisibility: 'As tablet.',
                    interaction: 'As tablet.',
                    note: 'Identical to tablet.',
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

const expected = {
    mobile: { field: 44, action: 44, text: '16px' },
    tablet: { field: 40, action: 32, text: '14px' },
    laptop: { field: 40, action: 32, text: '14px' },
    desktop: { field: 40, action: 32, text: '14px' },
} as const;

function Probe() {
    return (
        <div style={{ inlineSize: 320 }}>
            <SearchBar
                aria-label="Probe"
                defaultValue="Acme"
                data-testid="box"
            />
        </div>
    );
}

async function assertSearchBar(canvasElement: HTMLElement, viewport: Viewport) {
    const canvas = within(canvasElement);
    const box = canvas.getByTestId('box');
    const field = box.closest('[data-input-field]');
    if (!field) throw new Error('no field');
    const want = expected[viewport];
    await expect(field.getBoundingClientRect().height, 'field').toBe(
        want.field
    );
    await expect(field.getBoundingClientRect().width).toBe(320);
    await expect(getComputedStyle(box).fontSize).toBe(want.text);
    for (const name of ['Search', 'Clear']) {
        const r = canvas.getByRole('button', { name }).getBoundingClientRect();
        await expect(r.width, `${name} width`).toBe(want.action);
        await expect(r.height, `${name} height`).toBe(want.action);
        // Inside the field box: no overflow at its edges.
        const f = field.getBoundingClientRect();
        await expect(r.left).toBeGreaterThanOrEqual(f.left);
        await expect(r.right).toBeLessThanOrEqual(f.right);
    }
}

export const SizesMobile: Story = {
    ...viewportStory('mobile', () => <Probe />, assertSearchBar),
    name: 'is 44px with 44px buttons and 16px text at mobile',
};
export const SizesTablet: Story = {
    ...viewportStory('tablet', () => <Probe />, assertSearchBar),
    name: 'is 40px with 32px buttons at tablet',
};
export const SizesLaptop: Story = {
    ...viewportStory('laptop', () => <Probe />, assertSearchBar),
    name: 'is 40px with 32px buttons at laptop',
};
export const SizesDesktop: Story = {
    ...viewportStory('desktop', () => <Probe />, assertSearchBar),
    name: 'is 40px with 32px buttons at desktop',
};

/** The search icon uses the primary token. */
export const ComputedStyles: Story = {
    name: 'applies Horizon tokens',
    tags: ['!autodocs', '!dev'],
    render: () => (
        <div style={column}>
            <SearchBar aria-label="Tokens" />
            <span data-testid="probe" style={{ color: 'var(--primary)' }} />
        </div>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const primary = getComputedStyle(canvas.getByTestId('probe')).color;
        await expect(
            getComputedStyle(canvas.getByRole('button', { name: 'Search' }))
                .color
        ).toBe(primary);
    },
};
