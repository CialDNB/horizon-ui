import { EnvelopeSimpleIcon } from '@phosphor-icons/react/dist/csr/EnvelopeSimple';
import { MagnifyingGlassIcon } from '@phosphor-icons/react/dist/csr/MagnifyingGlass';
import { PaperPlaneRightIcon } from '@phosphor-icons/react/dist/csr/PaperPlaneRight';
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
import { IconButton } from '../IconButton';
import { Input, type InputProps } from '.';

const sizes = ['sm', 'md', 'lg'] as const satisfies readonly NonNullable<
    InputProps['size']
>[];
const column = { display: 'grid', gap: 12, maxInlineSize: 360 } as const;

const meta = {
    title: 'Components/Input',
    component: Input,
    parameters: {
        layout: 'padded',
        docs: {
            description: {
                component: [
                    'Single-line text field. Ported from x-core `TextField` and `TextInput`: the label, helper text and error message move to `FormField` (which also wires `id`, `aria-describedby`, `aria-invalid` and `aria-required`). Native `type` variants (text, email, number, search, password ...), sizes, `startAdornment`/`endAdornment`, `clearable` (x-core TextInput), `loading` (x-core `isLoading`).',
                    '',
                    '**Sizes (px).** Mobile and touch pointers: sm 44, md 44, lg 48 tall with 16px text (no iOS zoom). Tablet and up with a fine pointer: sm 32, md 40, lg 48; sm/md text 14px.',
                    '',
                    '**States.** Rest: 1px `control-border` ring (3:1). Hover (pointer): primary. Focus: 2px `ring`. Invalid: destructive ring plus a warning icon (not colour alone). Disabled: `muted` fill. Read-only: rest ring without the hover change, focusable. Radius 20px (x-core).',
                    '',
                    '`className` styles the field box; `ref`, `data-did` and every other attribute go to the `<input>`. Number spin buttons are hidden in every browser.',
                ].join('\n'),
            },
        },
    },
    args: { 'aria-label': 'Company name', placeholder: 'Acme Ltd.' },
    argTypes: {
        size: { control: 'inline-radio', options: sizes },
        startAdornment: { control: false },
        endAdornment: { control: false },
    },
    render: (args) => (
        <div style={column}>
            <Input {...args} />
        </div>
    ),
} satisfies Meta<typeof Input>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Controls playground. */
export const Playground: Story = {};

/** Every size. */
export const Sizes: Story = {
    render: () => (
        <div style={column}>
            {sizes.map((size) => (
                <Input
                    key={size}
                    size={size}
                    aria-label={`Size ${size}`}
                    placeholder={`Size ${size}`}
                />
            ))}
        </div>
    ),
};

/** Rest, filled, invalid, disabled, read-only, loading. */
export const States: Story = {
    render: () => (
        <div style={column}>
            <Input aria-label="Rest" placeholder="Placeholder" />
            <Input aria-label="Filled" defaultValue="Acme Ltd." />
            <Input aria-label="Invalid" defaultValue="acme@" invalid />
            <Input aria-label="Disabled" defaultValue="Acme Ltd." disabled />
            <Input aria-label="Read-only" defaultValue="514201234" readOnly />
            <Input aria-label="Loading" defaultValue="Acm" loading />
        </div>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(
            canvas.getByRole('textbox', { name: 'Invalid' })
        ).toHaveAttribute('aria-invalid', 'true');
        await expect(
            canvas.getByRole('textbox', { name: 'Disabled' })
        ).toBeDisabled();
    },
};

/** Icons, units and an action button as adornments. */
export const Adornments: Story = {
    render: () => (
        <div style={column}>
            <Input
                type="email"
                aria-label="Email"
                placeholder="name@company.com"
                startAdornment={<EnvelopeSimpleIcon aria-hidden="true" />}
            />
            <Input
                type="number"
                aria-label="Amount"
                defaultValue={1200}
                endAdornment="USD"
            />
            <Input
                aria-label="Message"
                placeholder="Write a message"
                endAdornment={
                    <IconButton variant="ghost" size="sm" aria-label="Send">
                        <PaperPlaneRightIcon />
                    </IconButton>
                }
            />
        </div>
    ),
};

function ClearableDemo() {
    const [value, setValue] = useState('Acme');
    return (
        <Input
            type="search"
            aria-label="Search companies"
            startAdornment={<MagnifyingGlassIcon aria-hidden="true" />}
            clearable
            clearLabel="Clear search"
            value={value}
            onChange={(e) => setValue(e.target.value)}
        />
    );
}

/** Clearable (x-core TextInput `clearable`): the button empties and refocuses. */
export const Clearable: Story = {
    render: () => (
        <div style={column}>
            <ClearableDemo />
        </div>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.click(
            canvas.getByRole('button', { name: 'Clear search' })
        );
        const input = canvas.getByRole('searchbox');
        await expect(input).toHaveValue('');
        await expect(input).toHaveFocus();
    },
};

/** Long values scroll inside the field; long placeholders are cut. */
export const LongText: Story = {
    render: () => (
        <div style={{ ...column, maxInlineSize: 280 }}>
            <Input
                aria-label="Long value"
                defaultValue="Very Long International Trading Company Limited Partnership"
                clearable
                startAdornment={<MagnifyingGlassIcon aria-hidden="true" />}
            />
            <Input
                aria-label="Long placeholder"
                placeholder="Search by company name, registration number or contact"
            />
        </div>
    ),
};

/** Right-to-left: adornments and the clear button swap sides. */
export const RTL: Story = {
    globals: { direction: 'rtl' },
    render: () => (
        <div style={column}>
            <Input
                aria-label="חיפוש"
                defaultValue="חברה"
                clearable
                clearLabel="ניקוי"
                startAdornment={<MagnifyingGlassIcon aria-hidden="true" />}
            />
            <Input aria-label="שגיאה" defaultValue="abc" invalid />
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
                    <div style={column}>
                        <Input
                            aria-label={`${brand} rest`}
                            placeholder={`${brand} placeholder`}
                        />
                        <Input
                            aria-label={`${brand} invalid`}
                            defaultValue="acme@"
                            invalid
                        />
                        <Input
                            aria-label={`${brand} disabled`}
                            defaultValue="disabled"
                            disabled
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
        <div style={layout.stack}>
            <ResponsiveSpec
                caption="Input responsive specification"
                spec={{
                    mobile: {
                        size: 'sm/md 44px, lg 48px tall; text 16px (body/default) so iOS does not zoom; clear button 44px square.',
                        density:
                            'Padding 12px (sm) / 16px (md, lg); 8px gap between adornments.',
                        layout: 'Full width of its container (x-core fullWidth); never overflows 320px: long values scroll inside.',
                        contentVisibility:
                            'Long placeholders are cut at the field end; adornments never shrink.',
                        interaction:
                            'Touch: focus ring 2px; the clear button is a full-height target.',
                    },
                    tablet: {
                        size: 'Fine pointer: sm 32, md 40, lg 48px; sm/md text 14px; clear 32px. Touch pointer (iPad): keeps the mobile sizes and 16px text.',
                        density: 'As mobile.',
                        layout: 'As mobile.',
                        contentVisibility: 'As mobile.',
                        interaction:
                            'Pointer: hover turns the ring primary; keyboard: Tab, focus ring.',
                        note: 'Density follows pointer precision (as Button): iPad keeps 16px text to avoid zoom.',
                    },
                    laptop: {
                        size: 'As tablet.',
                        density: 'As tablet.',
                        layout: 'As tablet.',
                        contentVisibility: 'As tablet.',
                        interaction: 'As tablet.',
                        note: 'Identical to tablet: width comes from the form layout, not the field.',
                    },
                    desktop: {
                        size: 'As tablet.',
                        density: 'As tablet.',
                        layout: 'As tablet.',
                        contentVisibility: 'As tablet.',
                        interaction: 'As tablet.',
                        note: 'Identical to tablet (see laptop).',
                    },
                }}
            />
            <Probe />
        </div>
    ),
};

/* ---- Viewport tests (real compiled CSS, Storybook browser project) ---- */

const expected = {
    mobile: { sm: 44, md: 44, lg: 48, text: '16px', clear: 44 },
    tablet: { sm: 32, md: 40, lg: 48, text: '14px', clear: 32 },
    laptop: { sm: 32, md: 40, lg: 48, text: '14px', clear: 32 },
    desktop: { sm: 32, md: 40, lg: 48, text: '14px', clear: 32 },
} as const;

function Probe() {
    return (
        <div style={{ ...column, inlineSize: 320, maxInlineSize: 320 }}>
            {sizes.map((size) => (
                <Input
                    key={size}
                    size={size}
                    aria-label={`Probe ${size}`}
                    data-testid={`input-${size}`}
                />
            ))}
            <Input
                aria-label="Probe clear"
                data-testid="input-clear"
                clearable
                defaultValue="Very Long International Trading Company Limited Partnership"
                startAdornment={<MagnifyingGlassIcon aria-hidden="true" />}
            />
        </div>
    );
}

async function assertInput(canvasElement: HTMLElement, viewport: Viewport) {
    const canvas = within(canvasElement);
    const want = expected[viewport];
    for (const size of sizes) {
        const input = canvas.getByTestId(`input-${size}`);
        const box = input.closest('[data-input-field]');
        await expect(box?.getBoundingClientRect().height).toBe(want[size]);
        await expect(getComputedStyle(input).fontSize).toBe(
            size === 'lg' ? '16px' : want.text
        );
    }
    const clear = canvas.getByRole('button', { name: 'Clear' });
    const rect = clear.getBoundingClientRect();
    await expect([rect.width, rect.height]).toEqual([want.clear, want.clear]);
    // The clear button stays inside the field box.
    const field = clear.closest('[data-input-field]');
    if (!field) throw new Error('no field');
    const fieldRect = field.getBoundingClientRect();
    await expect(rect.right).toBeLessThanOrEqual(fieldRect.right);
    // A long value at 320px does not overflow the column.
    await expect(field.scrollWidth).toBeLessThanOrEqual(320);
    await expect(fieldRect.width).toBe(320);
}

export const TargetMobile: Story = {
    ...viewportStory('mobile', () => <Probe />, assertInput),
    name: 'is 44px tall with 16px text at mobile',
};
export const DensityTablet: Story = {
    ...viewportStory('tablet', () => <Probe />, assertInput),
    name: 'is dense with a fine pointer at tablet',
};
export const DensityLaptop: Story = {
    ...viewportStory('laptop', () => <Probe />, assertInput),
    name: 'is dense with a fine pointer at laptop',
};
export const DensityDesktop: Story = {
    ...viewportStory('desktop', () => <Probe />, assertInput),
    name: 'is dense with a fine pointer at desktop',
};

/** Rings, fills and radius come from the tokens. */
export const ComputedStyles: Story = {
    name: 'applies Horizon tokens to the field',
    tags: ['!autodocs', '!dev'],
    render: () => (
        <div style={column}>
            <Input aria-label="Rest" data-testid="rest" placeholder="Hint" />
            <Input aria-label="Invalid" data-testid="invalid" invalid />
            <Input aria-label="Disabled" data-testid="disabled" disabled />
            <span
                data-testid="probe"
                style={{
                    color: 'var(--control-border)',
                    background: 'var(--muted)',
                    borderColor: 'var(--destructive)',
                    outlineColor: 'var(--ring)',
                    caretColor: 'var(--muted-foreground)',
                }}
            />
        </div>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const probe = getComputedStyle(canvas.getByTestId('probe'));
        const box = (id: string) => {
            const el = canvas.getByTestId(id).closest('[data-input-field]');
            if (!el) throw new Error(id);
            return el;
        };
        const rest = getComputedStyle(box('rest'));
        await expect(rest.borderRadius).toBe('20px');
        await expect(rest.boxShadow).toContain(probe.color);
        await expect(rest.boxShadow).toContain('0px 0px 0px 1px');
        await expect(rest.transitionDuration).toContain('0.1s');
        await expect(getComputedStyle(box('invalid')).boxShadow).toContain(
            probe.borderTopColor
        );
        await expect(getComputedStyle(box('disabled')).backgroundColor).toBe(
            probe.backgroundColor
        );
        const placeholder = getComputedStyle(
            canvas.getByTestId('rest'),
            '::placeholder'
        );
        await expect(placeholder.color).toBe(probe.caretColor);
        canvas.getByTestId('rest').focus();
        const focused = await settled(box('rest'));
        await expect(focused.boxShadow).toContain(probe.outlineColor);
        await expect(focused.boxShadow).toContain('0px 0px 0px 2px');
    },
};
