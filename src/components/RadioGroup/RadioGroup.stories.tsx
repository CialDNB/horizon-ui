import type { Meta, StoryObj } from '@storybook/react-vite';
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
import { RadioGroup, RadioGroupItem } from '.';

const meta = {
    title: 'Components/RadioGroup',
    component: RadioGroup,
    subcomponents: { RadioGroupItem },
    parameters: {
        layout: 'padded',
        docs: {
            description: {
                component: [
                    'Mutually exclusive options on Radix RadioGroup (roving focus: Tab enters at the checked option, arrow keys move and select, disabled options are skipped; horizontal arrows reverse in RTL). Ported from x-core `RadioGroup` and `Radiov2`: the `options` array becomes `RadioGroupItem` children, `row` becomes `orientation="horizontal"`, `onChange(event, value)` becomes `onValueChange(value)`, `label`/`error`/`errorText` move to `FormField` (which names the group by `aria-labelledby`). Values are strings.',
                    '',
                    '**Look (x-core MUI Radio).** 20px circle (`sm` 16px), 1px `control-border` ring; checked: 2px primary ring with a primary dot. Hover (pointer): primary ring. Focus-visible: 2px `ring` outline around the circle. Invalid: destructive. Disabled: `muted`.',
                    '',
                    '**Targets.** A real 44px box at mobile and on touch pointers (stacked options touch, never overlap); circle + 2px with a fine pointer from tablet. Labels 16/20.',
                ].join('\n'),
            },
        },
    },
    args: { 'aria-label': 'Plan', defaultValue: 'pro' },
    render: (args) => (
        <RadioGroup {...args}>
            <RadioGroupItem value="basic" label="Basic" />
            <RadioGroupItem value="pro" label="Pro" />
            <RadioGroupItem value="team" label="Team (sold out)" disabled />
            <RadioGroupItem value="enterprise" label="Enterprise" />
        </RadioGroup>
    ),
} satisfies Meta<typeof RadioGroup>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Controls playground. */
export const Playground: Story = {};

/** Arrow keys move and select; the disabled option is skipped. */
export const Keyboard: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.tab();
        await expect(canvas.getByRole('radio', { name: 'Pro' })).toHaveFocus();
        // Held, then released: a real key press outlasts the moment Radix
        // moves focus (a timeout), which is when it selects.
        await userEvent.keyboard('{ArrowDown>}');
        await userEvent.keyboard('{/ArrowDown}');
        const enterprise = canvas.getByRole('radio', { name: 'Enterprise' });
        await expect(enterprise).toHaveFocus();
        await expect(enterprise).toBeChecked();
    },
};

/** Horizontal (x-core `row`), small, invalid and disabled groups. */
export const Variants: Story = {
    render: () => (
        <div style={layout.stack}>
            <RadioGroup
                aria-label="Horizontal"
                orientation="horizontal"
                defaultValue="m"
            >
                <RadioGroupItem value="m" label="Monthly" />
                <RadioGroupItem value="q" label="Quarterly" />
                <RadioGroupItem value="y" label="Yearly" />
            </RadioGroup>
            <RadioGroup aria-label="Small" size="sm" defaultValue="a">
                <RadioGroupItem value="a" label="Small A" />
                <RadioGroupItem value="b" label="Small B" />
            </RadioGroup>
            <RadioGroup aria-label="Invalid" invalid>
                <RadioGroupItem value="a" label="Invalid A" />
                <RadioGroupItem value="b" label="Invalid B" />
            </RadioGroup>
            <RadioGroup aria-label="Disabled" disabled defaultValue="a">
                <RadioGroupItem value="a" label="Disabled A" />
                <RadioGroupItem value="b" label="Disabled B" />
            </RadioGroup>
        </div>
    ),
};

/** In a FormField: the label names the group; the error is linked. */
export const WithFormField: Story = {
    render: () => (
        <div style={{ maxInlineSize: 400 }}>
            <FormField
                label="Nature of the commercial relationship"
                description="Used for the credit limit."
                error="Choose one option"
                required
            >
                <RadioGroup>
                    <RadioGroupItem value="supplier" label="Supplier" />
                    <RadioGroupItem value="customer" label="Customer" />
                </RadioGroup>
            </FormField>
        </div>
    ),
    play: async ({ canvasElement }) => {
        await expect(
            within(canvasElement).getByRole('radiogroup', {
                name: 'Nature of the commercial relationship',
            })
        ).toHaveAttribute('aria-invalid', 'true');
    },
};

/** Long labels wrap; horizontal groups wrap onto new rows. */
export const LongText: Story = {
    render: () => (
        <div style={{ maxInlineSize: 280, display: 'grid', gap: 24 }}>
            <RadioGroup aria-label="Long" defaultValue="a">
                <RadioGroupItem
                    value="a"
                    label="Notify the account owner and every follower of the company"
                />
                <RadioGroupItem value="b" label="Only the owner" />
            </RadioGroup>
            <RadioGroup aria-label="Wrap" orientation="horizontal">
                <RadioGroupItem value="1" label="January" />
                <RadioGroupItem value="2" label="February" />
                <RadioGroupItem value="3" label="March" />
                <RadioGroupItem value="4" label="April" />
            </RadioGroup>
        </div>
    ),
};

/** Right-to-left: labels on the left; ArrowLeft moves forward. */
export const RTL: Story = {
    globals: { direction: 'rtl' },
    render: () => (
        <RadioGroup
            aria-label="תקופה"
            orientation="horizontal"
            defaultValue="m"
        >
            <RadioGroupItem value="m" label="חודשי" />
            <RadioGroupItem value="y" label="שנתי" />
        </RadioGroup>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.tab();
        await userEvent.keyboard('{ArrowLeft>}');
        await userEvent.keyboard('{/ArrowLeft}');
        await expect(canvas.getByRole('radio', { name: 'שנתי' })).toBeChecked();
    },
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
                    <RadioGroup
                        aria-label={brand}
                        orientation="horizontal"
                        defaultValue="b"
                    >
                        <RadioGroupItem value="a" label={`${brand} off`} />
                        <RadioGroupItem value="b" label={`${brand} on`} />
                    </RadioGroup>
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
                caption="RadioGroup responsive specification"
                spec={{
                    mobile: {
                        size: 'Circle 20px (sm 16px); target 44px square; label 16/20.',
                        density:
                            'Vertical options touch (44px rows, no overlap); horizontal options 16px apart.',
                        layout: 'Vertical by default; horizontal rows wrap at 320px.',
                        contentVisibility: 'Full label text, wrapping.',
                        interaction:
                            'Tap the circle or label; arrow keys with a keyboard.',
                    },
                    tablet: {
                        size: 'Fine pointer: target = circle + 2px (24px, sm 20px). Touch (iPad): 44px.',
                        density:
                            'Vertical options 4px apart; 8px between circle and label.',
                        layout: 'As mobile.',
                        contentVisibility: 'As mobile.',
                        interaction:
                            'Pointer hover rings primary; Tab enters at the checked option.',
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
    mobile: { target: 44, gap: 0 },
    tablet: { target: 24, gap: 4 },
    laptop: { target: 24, gap: 4 },
    desktop: { target: 24, gap: 4 },
} as const;

function Probe() {
    return (
        <div style={{ inlineSize: 320 }} data-testid="probe">
            <RadioGroup aria-label="Probe" defaultValue="a">
                <RadioGroupItem value="a" label="Alpha" />
                <RadioGroupItem value="b" label="Beta" />
                <RadioGroupItem
                    value="c"
                    label="A long option label that wraps onto a second line at 320px"
                />
            </RadioGroup>
        </div>
    );
}

async function assertRadio(canvasElement: HTMLElement, viewport: Viewport) {
    const canvas = within(canvasElement);
    const radios = canvas.getAllByRole('radio');
    const rects = radios.map((r) => r.getBoundingClientRect());
    for (const rect of rects)
        await expect([rect.width, rect.height]).toEqual([
            expected[viewport].target,
            expected[viewport].target,
        ]);
    const circle = radios[0]?.firstElementChild?.getBoundingClientRect();
    await expect(circle?.width).toBe(20);
    // Stacked rows: touching at mobile (no overlap), 4px apart with a fine pointer.
    const rows = radios.map((r) =>
        (r.parentElement as HTMLElement).getBoundingClientRect()
    );
    await expect(Math.round((rows[1]?.top ?? 0) - (rows[0]?.bottom ?? 0))).toBe(
        expected[viewport].gap
    );
    await expect(canvas.getByTestId('probe').scrollWidth).toBeLessThanOrEqual(
        320
    );
    await userEvent.click(canvas.getByText('Beta'));
    await expect(radios[1]).toBeChecked();
}

export const TargetMobile: Story = {
    ...viewportStory('mobile', () => <Probe />, assertRadio),
    name: 'has 44px targets that never overlap at mobile',
};
export const DensityTablet: Story = {
    ...viewportStory('tablet', () => <Probe />, assertRadio),
    name: 'is dense with a fine pointer at tablet',
};
export const DensityLaptop: Story = {
    ...viewportStory('laptop', () => <Probe />, assertRadio),
    name: 'is dense with a fine pointer at laptop',
};
export const DensityDesktop: Story = {
    ...viewportStory('desktop', () => <Probe />, assertRadio),
    name: 'is dense with a fine pointer at desktop',
};

/** Rings, dot and focus ring come from the tokens. */
export const ComputedStyles: Story = {
    name: 'applies Horizon tokens to the radios',
    tags: ['!autodocs', '!dev'],
    render: () => (
        <div>
            <RadioGroup aria-label="Tokens" defaultValue="on">
                <RadioGroupItem
                    value="off"
                    aria-label="Off"
                    data-testid="off"
                />
                <RadioGroupItem value="on" aria-label="On" data-testid="on" />
            </RadioGroup>
            <span
                data-testid="probe"
                style={{
                    color: 'var(--control-border)',
                    background: 'var(--primary)',
                    outlineColor: 'var(--ring)',
                }}
            />
        </div>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const probe = getComputedStyle(canvas.getByTestId('probe'));
        const circle = (id: string) => {
            const el = canvas.getByTestId(id).firstElementChild;
            if (!el) throw new Error(id);
            return el;
        };
        const off = getComputedStyle(circle('off'));
        await expect(off.boxShadow).toContain(probe.color);
        await expect(off.boxShadow).toContain('0px 0px 0px 1px');
        const on = await settled(circle('on'));
        await expect(on.boxShadow).toContain(probe.backgroundColor);
        await expect(on.boxShadow).toContain('0px 0px 0px 2px');
        const dot = circle('on').firstElementChild;
        if (!dot) throw new Error('no dot');
        await expect(getComputedStyle(dot).backgroundColor).toBe(
            probe.backgroundColor
        );
        canvas.getByTestId('on').focus();
        const focused = getComputedStyle(circle('on'));
        await expect(focused.outlineStyle).toBe('solid');
        await expect(focused.outlineColor).toBe(probe.outlineColor);
    },
};
