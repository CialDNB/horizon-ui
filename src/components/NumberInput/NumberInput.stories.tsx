import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, userEvent, within } from 'storybook/test';
import { HorizonProvider } from '../../provider';
import { ResponsiveSpec } from '../../stories/ResponsiveSpec';
import {
    storyLayout as layout,
    viewportStory,
    type Viewport,
} from '../../stories/viewports';
import { FormField } from '../FormField';
import { NumberInput } from '.';

const column = { display: 'grid', gap: 16, maxInlineSize: 320 } as const;

const meta = {
    title: 'Components/NumberInput',
    component: NumberInput,
    parameters: {
        layout: 'padded',
        docs: {
            description: {
                component: [
                    'A number field on the WAI-ARIA spinbutton pattern (`role="spinbutton"`, `aria-valuenow/min/max`), built on Input. Typing keeps digits, one decimal point and a leading minus (no minus when `min >= 0`); ArrowUp/Down step, Page Up/Down step by 10, Home/End jump to min/max; the decrease/increase buttons (44px at mobile, out of the tab order) disable at the bounds. `onValueChange` reports numbers while typing only when they are in range (as x-core NumberInputV2); out-of-range text is clamped on blur.',
                    '',
                    'Ported from x-core `NumberInputV2`: `value`/`onChange(event, number)` become `value`/`onValueChange(number | null)`; `min`, `max`, `decimalPlaces`, `allowNegative`, `thousandSeparator` (",") and `clearable` kept; `showArrows` becomes `showSteppers` (side by side instead of stacked 12px arrows, which were below the 44px target); `isLoading` becomes `loading`; `step` added (v1 had it); the `append` text/country selectors are not ported. Number formatting follows x-core (`.` decimal, `,` grouping), not the locale.',
                ].join('\n'),
            },
        },
    },
    args: { 'aria-label': 'Rows to add', defaultValue: 1, min: 0, max: 50 },
    render: (args) => (
        <div style={column}>
            <NumberInput {...args} />
        </div>
    ),
} satisfies Meta<typeof NumberInput>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Controls playground. */
export const Playground: Story = {};

function ControlledDemo() {
    const [value, setValue] = useState<number | null>(48);
    return (
        <div style={column}>
            <NumberInput
                aria-label="Seats"
                min={0}
                max={50}
                value={value}
                onValueChange={setValue}
            />
            <p style={{ margin: 0 }} data-testid="value">
                Value: {String(value)}
            </p>
        </div>
    );
}

/** Keyboard and steppers; Increase disables at max. */
export const Keyboard: Story = {
    render: () => <ControlledDemo />,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const spin = canvas.getByRole('spinbutton');
        spin.focus();
        await userEvent.keyboard('{ArrowUp}');
        await expect(canvas.getByTestId('value')).toHaveTextContent('49');
        await userEvent.click(canvas.getByRole('button', { name: 'Increase' }));
        await expect(spin).toHaveAttribute('aria-valuenow', '50');
        await expect(
            canvas.getByRole('button', { name: 'Increase' })
        ).toBeDisabled();
        await userEvent.keyboard('{Home}');
        await expect(canvas.getByTestId('value')).toHaveTextContent('0');
    },
};

/** Sizes and states. */
export const States: Story = {
    render: () => (
        <div style={column}>
            {(['sm', 'md', 'lg'] as const).map((size) => (
                <NumberInput
                    key={size}
                    size={size}
                    aria-label={`Size ${size}`}
                    defaultValue={3}
                />
            ))}
            <NumberInput aria-label="Empty" placeholder="Enter a number" />
            <NumberInput aria-label="Invalid" invalid defaultValue={-1} />
            <NumberInput aria-label="Disabled" disabled defaultValue={3} />
            <NumberInput aria-label="Read only" readOnly defaultValue={3} />
            <NumberInput aria-label="Clearable" clearable defaultValue={3} />
            <NumberInput
                aria-label="No steppers"
                showSteppers={false}
                defaultValue={3}
            />
        </div>
    ),
};

/** Decimals, grouping and a step (x-core decimalPlaces / thousandSeparator). */
export const Formatting: Story = {
    render: () => (
        <div style={column}>
            <NumberInput
                aria-label="Amount"
                thousandSeparator
                decimalPlaces={2}
                defaultValue={1234567.5}
            />
            <NumberInput
                aria-label="Rate"
                step={0.25}
                decimalPlaces={2}
                min={0}
                max={5}
                defaultValue={1}
            />
            <NumberInput aria-label="Delta" defaultValue={-12} />
        </div>
    ),
};

/** In a FormField with a description and an error. */
export const WithFormField: Story = {
    render: () => (
        <div style={column}>
            <FormField
                label="Rows to add"
                description="Up to 50 rows"
                error="At least one row"
            >
                <NumberInput min={1} max={50} defaultValue={0} />
            </FormField>
        </div>
    ),
};

/** A long number in a narrow field scrolls; the steppers keep their size. */
export const LongText: Story = {
    render: () => (
        <div style={{ ...column, maxInlineSize: 160 }}>
            <NumberInput
                aria-label="Long"
                thousandSeparator
                defaultValue={123456789012345}
            />
        </div>
    ),
};

/** Right-to-left: steppers at the inline end (left). */
export const RTL: Story = {
    globals: { direction: 'rtl' },
    render: () => (
        <div style={column}>
            <NumberInput aria-label="כמות" defaultValue={3} data-testid="rtl" />
        </div>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const spin = canvas.getByTestId('rtl');
        const up = canvas.getByRole('button', { name: 'Increase' });
        await expect(up.getBoundingClientRect().right).toBeLessThanOrEqual(
            spin.getBoundingClientRect().left
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
                        <NumberInput
                            aria-label={`${brand} value`}
                            defaultValue={7}
                            max={7}
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
            caption="NumberInput responsive specification"
            spec={{
                mobile: {
                    size: 'Field 44px (lg 48px), 16px text; decrease and increase buttons 44px each, side by side.',
                    density: 'As Input; the buttons tuck into the end padding.',
                    layout: 'Full width; the decimal keypad opens (`inputmode="decimal"`, `numeric` for whole non-negative numbers).',
                    contentVisibility:
                        'Long numbers scroll inside the field; the steppers stay visible.',
                    interaction:
                        'Type, or tap the steppers (x-core 12px stacked arrows were below the 44px target).',
                },
                tablet: {
                    size: 'Fine pointer: sm 32, md 40, lg 48; steppers 32px. Touch: mobile sizes.',
                    density: 'As mobile.',
                    layout: 'As mobile.',
                    contentVisibility: 'As mobile.',
                    interaction:
                        'Keyboard: arrows, Page Up/Down, Home/End; steppers by pointer.',
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
        <div style={{ inlineSize: 200 }}>
            <NumberInput
                aria-label="Probe"
                defaultValue={5}
                data-testid="spin"
            />
        </div>
    );
}

async function assertNumberInput(
    canvasElement: HTMLElement,
    viewport: Viewport
) {
    const canvas = within(canvasElement);
    const spin = canvas.getByTestId('spin');
    const field = spin.closest('[data-input-field]');
    if (!field) throw new Error('no field');
    const want = expected[viewport];
    const f = field.getBoundingClientRect();
    await expect(f.height, 'field').toBe(want.field);
    await expect(f.width).toBe(200);
    await expect(getComputedStyle(spin).fontSize).toBe(want.text);
    for (const name of ['Increase', 'Decrease']) {
        const r = canvas.getByRole('button', { name }).getBoundingClientRect();
        await expect(r.width, `${name} width`).toBe(want.action);
        await expect(r.height, `${name} height`).toBe(want.action);
        await expect(r.right).toBeLessThanOrEqual(f.right);
    }
    // The text keeps room to show a value.
    await expect(spin.getBoundingClientRect().width).toBeGreaterThanOrEqual(48);
}

export const SizesMobile: Story = {
    ...viewportStory('mobile', () => <Probe />, assertNumberInput),
    name: 'is 44px with 44px steppers at mobile',
};
export const SizesTablet: Story = {
    ...viewportStory('tablet', () => <Probe />, assertNumberInput),
    name: 'is 40px with 32px steppers at tablet',
};
export const SizesLaptop: Story = {
    ...viewportStory('laptop', () => <Probe />, assertNumberInput),
    name: 'is 40px with 32px steppers at laptop',
};
export const SizesDesktop: Story = {
    ...viewportStory('desktop', () => <Probe />, assertNumberInput),
    name: 'is 40px with 32px steppers at desktop',
};
