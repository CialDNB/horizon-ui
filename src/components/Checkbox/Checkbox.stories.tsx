import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, userEvent, within } from 'storybook/test';
import { HorizonProvider } from '../../provider';
import { ResponsiveSpec } from '../../stories/ResponsiveSpec';
import {
    settled,
    storyLayout as layout,
    viewportStory,
    type Viewport,
} from '../../stories/viewports';
import { FormField } from '../FormField';
import { Checkbox } from '.';

const list = { display: 'grid', justifyItems: 'start' } as const;

const meta = {
    title: 'Components/Checkbox',
    component: Checkbox,
    parameters: {
        layout: 'padded',
        docs: {
            description: {
                component: [
                    'Two-state or mixed choice on Radix Checkbox. Ported from x-core `CheckboxV2` (and v1 `Checkbox` call sites): `onChange(event, checked)` becomes `onCheckedChange(checked)`, `indeterminate` becomes `checked="indeterminate"`, `size="small"` becomes `sm`, and the MUI `FormControlLabel` wrapper becomes the `label` prop.',
                    '',
                    '**Sizes.** Box 16px (`sm`) or 20px (`md`), radius 4px. The target is a real 44px square at mobile and on touch pointers (no overlapping hit layer: stacked options sit 44px apart); with a fine pointer from tablet it is the box plus 2px. Label 16/20, clicking it toggles.',
                    '',
                    '**States.** Unchecked: 1px `control-border` ring (3:1). Hover (pointer): primary ring; checked hover `primary-hover`. Checked/indeterminate: primary fill with a `primary-foreground` mark. Focus-visible: 2px `ring` outline around the box. Invalid: destructive ring. Disabled: `muted`.',
                ].join('\n'),
            },
        },
    },
    args: { label: 'Email me product updates' },
} satisfies Meta<typeof Checkbox>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Controls playground. */
export const Playground: Story = {};

/** Unchecked, checked, indeterminate, invalid, disabled; both sizes. */
export const States: Story = {
    render: () => (
        <div style={layout.stack}>
            {(['md', 'sm'] as const).map((size) => (
                <div key={size} style={list}>
                    <Checkbox size={size} label={`Unchecked ${size}`} />
                    <Checkbox
                        size={size}
                        label={`Checked ${size}`}
                        defaultChecked
                    />
                    <Checkbox
                        size={size}
                        label={`Indeterminate ${size}`}
                        checked="indeterminate"
                    />
                    <Checkbox size={size} label={`Invalid ${size}`} invalid />
                    <Checkbox size={size} label={`Disabled ${size}`} disabled />
                    <Checkbox
                        size={size}
                        label={`Disabled checked ${size}`}
                        disabled
                        defaultChecked
                    />
                </div>
            ))}
        </div>
    ),
};

function SelectAll() {
    const [items, setItems] = useState([true, false, false]);
    const all = items.every(Boolean)
        ? true
        : items.some(Boolean)
          ? 'indeterminate'
          : false;
    return (
        <div style={list}>
            <Checkbox
                label="All regions"
                checked={all}
                onCheckedChange={(c) => setItems(items.map(() => c === true))}
            />
            {['North', 'Center', 'South'].map((name, i) => (
                <Checkbox
                    key={name}
                    label={name}
                    checked={items[i]}
                    onCheckedChange={(c) =>
                        setItems(
                            items.map((v, j) => (j === i ? c === true : v))
                        )
                    }
                    style={{ marginInlineStart: 24 }}
                />
            ))}
        </div>
    );
}

/** Select-all with a mixed parent. */
export const Indeterminate: Story = {
    render: () => <SelectAll />,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const all = canvas.getByRole('checkbox', { name: 'All regions' });
        await expect(all).toHaveAttribute('aria-checked', 'mixed');
        await userEvent.click(all);
        await expect(
            canvas.getByRole('checkbox', { name: 'South' })
        ).toBeChecked();
    },
};

/** In a FormField: error and description reach the checkbox. */
export const WithFormField: Story = {
    render: () => (
        <div style={{ maxInlineSize: 400 }}>
            <FormField
                label="Terms"
                description="You can withdraw consent at any time."
                error="Accept the terms to continue"
                required
            >
                <Checkbox label="I accept the terms of service" />
            </FormField>
        </div>
    ),
};

/** Long labels wrap next to the box; the box stays on the first line. */
export const LongText: Story = {
    render: () => (
        <div style={{ maxInlineSize: 280 }}>
            <Checkbox label="Send me a weekly digest of credit-risk changes for every company in my portfolio" />
        </div>
    ),
};

/** Right-to-left: the label is on the left of the box. */
export const RTL: Story = {
    globals: { direction: 'rtl' },
    render: () => (
        <div style={list}>
            <Checkbox label="שלח לי עדכונים" defaultChecked />
            <Checkbox label="בחירה חלקית" checked="indeterminate" />
        </div>
    ),
};

/** All three brands side by side: the a11y check runs contrast on each. */
export const Brands: Story = {
    render: () => (
        <div style={layout.stack}>
            {(['cial', 'dnb', 'il'] as const).map((brand) => (
                <HorizonProvider
                    key={brand}
                    brand={brand}
                    style={{ background: 'var(--background)', padding: 16 }}
                >
                    <div style={layout.row}>
                        <Checkbox label={`${brand} off`} />
                        <Checkbox label={`${brand} on`} defaultChecked />
                        <Checkbox
                            label={`${brand} mixed`}
                            checked="indeterminate"
                        />
                        <Checkbox label={`${brand} invalid`} invalid />
                    </div>
                </HorizonProvider>
            ))}
        </div>
    ),
};

/** Per-breakpoint specification (Responsive Standard). */
export const Responsive: Story = {
    render: () => (
        <div style={layout.stack}>
            <ResponsiveSpec
                caption="Checkbox responsive specification"
                spec={{
                    mobile: {
                        size: 'Box 20px (sm 16px); target 44px square; label 16/20.',
                        density:
                            'Stacked options 44px apart (the targets touch, never overlap); label starts 12px after the box.',
                        layout: 'Box and label side by side; the label wraps, the box stays on its first line.',
                        contentVisibility: 'Full label text, never truncated.',
                        interaction:
                            'Tap the box or the label; Space toggles with a keyboard.',
                    },
                    tablet: {
                        size: 'Fine pointer: target = box + 2px (24px, sm 20px). Touch pointer (iPad): keeps 44px.',
                        density: '8px between box and label.',
                        layout: 'As mobile.',
                        contentVisibility: 'As mobile.',
                        interaction:
                            'Pointer hover rings the box primary; focus-visible ring.',
                        note: 'Density follows pointer precision, as Button.',
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
            <Probe />
        </div>
    ),
};

/* ---- Viewport tests ---- */

const expected = {
    mobile: { md: 44, sm: 44 },
    tablet: { md: 24, sm: 20 },
    laptop: { md: 24, sm: 20 },
    desktop: { md: 24, sm: 20 },
} as const;

function Probe() {
    return (
        <div style={{ ...list, inlineSize: 320 }} data-testid="list">
            <Checkbox label="First" data-testid="cb-md" />
            <Checkbox label="Second" size="sm" data-testid="cb-sm" />
            <Checkbox label="A third option whose label wraps onto a second line at 320px" />
        </div>
    );
}

async function assertCheckbox(canvasElement: HTMLElement, viewport: Viewport) {
    const canvas = within(canvasElement);
    for (const size of ['md', 'sm'] as const) {
        const target = canvas.getByTestId(`cb-${size}`);
        const rect = target.getBoundingClientRect();
        await expect([rect.width, rect.height]).toEqual([
            expected[viewport][size],
            expected[viewport][size],
        ]);
        const box = target.firstElementChild?.getBoundingClientRect();
        await expect(box?.width).toBe(size === 'md' ? 20 : 16);
    }
    // Stacked targets never overlap.
    const targets = canvas
        .getAllByRole('checkbox')
        .map((t) => t.getBoundingClientRect());
    for (let i = 1; i < targets.length; i++)
        await expect(targets[i]?.top).toBeGreaterThanOrEqual(
            targets[i - 1]?.bottom ?? 0
        );
    const label = canvas.getByText('First');
    await expect(getComputedStyle(label).fontSize).toBe('16px');
    await expect(canvas.getByTestId('list').scrollWidth).toBeLessThanOrEqual(
        320
    );
    // The label toggles.
    await userEvent.click(label);
    await expect(canvas.getByTestId('cb-md')).toBeChecked();
}

export const TargetMobile: Story = {
    ...viewportStory('mobile', () => <Probe />, assertCheckbox),
    name: 'has a 44px target at mobile',
};
export const DensityTablet: Story = {
    ...viewportStory('tablet', () => <Probe />, assertCheckbox),
    name: 'is dense with a fine pointer at tablet',
};
export const DensityLaptop: Story = {
    ...viewportStory('laptop', () => <Probe />, assertCheckbox),
    name: 'is dense with a fine pointer at laptop',
};
export const DensityDesktop: Story = {
    ...viewportStory('desktop', () => <Probe />, assertCheckbox),
    name: 'is dense with a fine pointer at desktop',
};

/** Rings, fills and the focus ring come from the tokens. */
export const ComputedStyles: Story = {
    name: 'applies Horizon tokens to the box',
    tags: ['!autodocs', '!dev'],
    render: () => (
        <div style={list}>
            <Checkbox aria-label="Off" data-testid="off" />
            <Checkbox aria-label="On" data-testid="on" defaultChecked />
            <Checkbox aria-label="Invalid" data-testid="invalid" invalid />
            <span
                data-testid="probe"
                style={{
                    color: 'var(--control-border)',
                    background: 'var(--primary)',
                    borderColor: 'var(--destructive)',
                    outlineColor: 'var(--ring)',
                    caretColor: 'var(--primary-foreground)',
                }}
            />
        </div>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const probe = getComputedStyle(canvas.getByTestId('probe'));
        const box = (id: string) => {
            const el = canvas.getByTestId(id).firstElementChild;
            if (!el) throw new Error(id);
            return el;
        };
        const off = getComputedStyle(box('off'));
        await expect(off.boxShadow).toContain(probe.color);
        await expect(off.borderRadius).toBe('4px');
        const on = await settled(box('on'));
        await expect(on.backgroundColor).toBe(probe.backgroundColor);
        await expect(on.color).toBe(probe.caretColor);
        await expect(getComputedStyle(box('invalid')).boxShadow).toContain(
            probe.borderTopColor
        );
        canvas.getByTestId('off').focus();
        const focused = getComputedStyle(box('off'));
        await expect(focused.outlineStyle).toBe('solid');
        await expect(focused.outlineWidth).toBe('2px');
        await expect(focused.outlineColor).toBe(probe.outlineColor);
    },
};
