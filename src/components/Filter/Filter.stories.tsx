import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { HorizonProvider } from '../../provider';
import { ResponsiveSpec } from '../../stories/ResponsiveSpec';
import {
    settled,
    storyLayout as layout,
    viewportStory,
    type Viewport,
} from '../../stories/viewports';
import { Filter, type FilterOption, type FilterProps } from '.';

const page = within(document.body);

const OPTIONS: FilterOption[] = [
    { value: 'high', label: 'High' },
    { value: 'medium', label: 'Medium' },
    { value: 'low', label: 'Low' },
    { value: 'info', label: 'Informational only (no action needed)' },
    { value: 'none', label: 'Unrated', disabled: true },
];

function Controlled(props: Partial<FilterProps>) {
    const [value, setValue] = useState<string[]>([...(props.value ?? [])]);
    return (
        <Filter
            label="Severity"
            options={OPTIONS}
            {...props}
            value={value}
            onChange={(next) => {
                setValue(next);
                props.onChange?.(next);
            }}
        />
    );
}

async function closePanel() {
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(page.queryByRole('dialog')).toBeNull());
}

const meta = {
    title: 'Components/Filter',
    component: Filter,
    parameters: {
        layout: 'padded',
        docs: {
            description: {
                component: [
                    'A filter pill that opens a panel of choices (Popover, `role="dialog"` named by the label). `multiple`: check boxes, committed once when the panel closes, or staged until **Apply** with `applyLabel` (**Reset** clears and closes). `single`: radios, picking commits and closes. Optional search field, loading and empty states (`role="status"`), a selected-count bubble (in the accessible name: "Severity, 2 selected") and a `totalCount` bubble. `toggle` makes the pill a pressed/unpressed button without a panel.',
                    '',
                    'Ported from x-core `Filter`: `value`, `onChange`, `label`, `options`, `totalCount`, `loading` kept; `variant` `multiple`/`single` kept, `clean` renders as `single`, `range`/`switch`/`list` not ported (unused in customer360); `enableSearchField` -> `searchable`, `applyButtonText`/`resetButtonText` -> `applyLabel`/`resetLabel`, `disableTotalCountSelected` -> `hideSelectedCount`, `showEndIcond={false}` -> `hideCaret`, `disableMenu` -> `toggle`, `disableFilterIcon` is now the default (`showIcon` opts in), `dataTestId` -> `data-testid`; `menuProps`, `menuHeaderTitle/Icon` dropped.',
                ].join('\n'),
            },
        },
    },
    args: {
        label: 'Severity',
        options: OPTIONS,
        value: [],
        onChange: fn(),
    },
    render: (args) => <Controlled {...args} />,
} satisfies Meta<typeof Filter>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Controls playground. */
export const Playground: Story = {};

/** Multiple choice, committed when the panel closes. */
export const Multiple: Story = {
    play: async ({ canvasElement, args }) => {
        const canvas = within(canvasElement);
        await userEvent.click(canvas.getByRole('button', { name: /Severity/ }));
        await userEvent.click(
            await page.findByRole('checkbox', { name: 'High' })
        );
        await userEvent.click(page.getByRole('checkbox', { name: 'Low' }));
        await closePanel();
        await expect(args.onChange).toHaveBeenLastCalledWith(['high', 'low']);
        await expect(
            canvas.getByRole('button', { name: /Severity/ })
        ).toHaveAccessibleName(/^Severity ?, 2 selected$/);
    },
};

/** Staged with Apply / Clear and a search field (customer360 ComplianceFilterBar). */
export const ApplyAndSearch: Story = {
    args: {
        applyLabel: 'Apply',
        resetLabel: 'Clear',
        searchable: true,
        value: ['medium'],
    },
};

/** Single choice: radios, picking commits and closes. */
export const Single: Story = {
    args: { variant: 'single', label: 'Status', value: ['low'] },
};

/** States: total count, icon, loading, disabled, toggle pills. */
export const States: Story = {
    render: (args) => (
        <div style={layout.row}>
            <Controlled {...args} label="With total" totalCount={12} />
            <Controlled {...args} label="With icon" showIcon value={['high']} />
            <Controlled {...args} label="Loading" loading />
            <Controlled {...args} label="Disabled" disabled value={['high']} />
            <Filter
                {...args}
                label="Toggle off"
                toggle
                value={[]}
                totalCount={3}
            />
            <Filter
                {...args}
                label="Toggle on"
                toggle
                value={['1']}
                totalCount={3}
            />
        </div>
    ),
};

/** A long label truncates; long options wrap in the panel. */
export const LongText: Story = {
    render: (args) => (
        <div style={{ maxInlineSize: 200 }}>
            <Controlled
                {...args}
                label="Business activity and industry classification"
                value={['info']}
            />
        </div>
    ),
};

/** Right-to-left: the panel aligns to the pill's inline start (right). */
export const RTL: Story = {
    globals: { direction: 'rtl' },
    render: (args) => (
        <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <Controlled {...args} label="חומרה" data-testid="rtl" />
        </div>
    ),
    play: async ({ canvasElement }) => {
        const pill = within(canvasElement).getByTestId('rtl');
        await userEvent.click(pill);
        const panel = await page.findByRole('dialog');
        await settled(panel);
        await waitFor(() =>
            expect(
                Math.abs(
                    panel.getBoundingClientRect().right -
                        pill.getBoundingClientRect().right
                )
            ).toBeLessThanOrEqual(1)
        );
        await closePanel();
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
                    <div style={layout.row}>
                        <Controlled
                            {...args}
                            label={`${brand} filter`}
                            value={['high']}
                            totalCount={7}
                        />
                        <Filter
                            {...args}
                            label={`${brand} on`}
                            toggle
                            value={['1']}
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
            caption="Filter responsive specification"
            spec={{
                mobile: {
                    size: 'Pill 44px tall (x-core 32px), 14px label; options 44px rows (Checkbox/RadioGroup targets).',
                    density:
                        'Pill 12px inline padding, 6px gaps; panel 12px padding.',
                    layout: 'Panel 296px (x-core search width), capped at the viewport minus 16px, anchored under the pill; options scroll after 240px; Apply/Clear in the footer.',
                    contentVisibility:
                        'A long pill label truncates; long options wrap.',
                    interaction:
                        'Tap the pill; tap options; close by tapping outside (commits a multiple filter) or Apply.',
                    note: 'A popover, not a bottom sheet: Popover precedent (Task 11b); the panel is narrow and stays next to its pill in a filter bar.',
                },
                tablet: {
                    size: 'Fine pointer: pill 32px (x-core), options 36px. Touch: mobile sizes.',
                    density: 'As mobile.',
                    layout: 'As mobile.',
                    contentVisibility: 'As mobile.',
                    interaction:
                        'Keyboard: Enter/Space open, focus moves into the panel, Tab through search/options/footer, Escape closes and returns focus.',
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
    mobile: { pill: 44 },
    tablet: { pill: 32 },
    laptop: { pill: 32 },
    desktop: { pill: 32 },
} as const;

function Probe() {
    return (
        <Controlled
            value={['high']}
            searchable
            applyLabel="Apply"
            data-testid="pill"
        />
    );
}

async function assertFilter(canvasElement: HTMLElement, viewport: Viewport) {
    const pill = within(canvasElement).getByTestId('pill');
    const want = expected[viewport];
    await expect(pill.getBoundingClientRect().height, 'pill').toBe(want.pill);
    await userEvent.click(pill);
    const panel = await page.findByRole('dialog', { name: 'Severity' });
    await settled(panel);
    const r = panel.getBoundingClientRect();
    await expect(r.width).toBe(Math.min(296, window.innerWidth - 16));
    await expect(r.right).toBeLessThanOrEqual(window.innerWidth);
    await expect(r.top).toBeGreaterThan(pill.getBoundingClientRect().bottom);
    await expect(getComputedStyle(panel).zIndex).toBe('1450');
    await closePanel();
}

export const LayoutMobile: Story = {
    ...viewportStory('mobile', () => <Probe />, assertFilter),
    name: 'is a 44px pill with a 296px panel at mobile',
};
export const LayoutTablet: Story = {
    ...viewportStory('tablet', () => <Probe />, assertFilter),
    name: 'is a 32px pill with a fine pointer at tablet',
};
export const LayoutLaptop: Story = {
    ...viewportStory('laptop', () => <Probe />, assertFilter),
    name: 'is a 32px pill with a fine pointer at laptop',
};
export const LayoutDesktop: Story = {
    ...viewportStory('desktop', () => <Probe />, assertFilter),
    name: 'is a 32px pill with a fine pointer at desktop',
};

/** Rest, open and pressed colours come from the tokens. */
export const ComputedStyles: Story = {
    name: 'applies Horizon tokens to the pill',
    tags: ['!autodocs', '!dev'],
    render: (args) => (
        <div style={layout.row}>
            <Controlled {...args} data-testid="pill" />
            <Filter
                {...args}
                label="On"
                toggle
                value={['1']}
                data-testid="on"
            />
            <span
                data-testid="probe"
                style={{ color: 'var(--accent)', background: 'var(--primary)' }}
            />
        </div>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const probe = getComputedStyle(canvas.getByTestId('probe'));
        await expect(
            getComputedStyle(canvas.getByTestId('pill')).backgroundColor
        ).toBe(probe.color);
        await expect(
            getComputedStyle(canvas.getByTestId('on')).backgroundColor
        ).toBe(probe.backgroundColor);
    },
};
