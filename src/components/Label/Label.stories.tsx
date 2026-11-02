import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { HorizonProvider } from '../../provider';
import { ResponsiveSpec } from '../../stories/ResponsiveSpec';
import { storyLayout as layout, viewportStory } from '../../stories/viewports';
import { Label } from '.';

const meta = {
    title: 'Components/Label',
    component: Label,
    parameters: {
        layout: 'padded',
        docs: {
            description: {
                component:
                    'Visible caption of a form control: a native `<label>` (`htmlFor`). Usually rendered for you by `FormField`. `required` adds a decorative asterisk (the control carries `aria-required`); `disabled` mutes it. Type `label/md` (14/20 semibold) at every breakpoint. Display, margin, colour and weight are set explicitly so host `label` rules (Bootstrap reboot, customer360) cannot restyle it in `styles.unlayered.css`.',
            },
        },
    },
    args: { children: 'Email address', htmlFor: 'label-demo' },
    render: (args) => (
        <div style={{ display: 'grid', gap: 4, maxInlineSize: 320 }}>
            <Label {...args} />
            <input id="label-demo" />
        </div>
    ),
} satisfies Meta<typeof Label>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Controls playground. */
export const Playground: Story = {};

/** Required and disabled. */
export const States: Story = {
    render: () => (
        <div style={layout.stack}>
            <div style={{ display: 'grid', gap: 4 }}>
                <Label htmlFor="req" required>
                    Company name
                </Label>
                <input id="req" aria-required="true" />
            </div>
            <div style={{ display: 'grid', gap: 4 }}>
                <Label htmlFor="off" disabled>
                    Registration number
                </Label>
                <input id="off" disabled />
            </div>
        </div>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(
            canvas.getByRole('textbox', { name: 'Company name' })
        ).toBeInTheDocument();
    },
};

/** Long text wraps; it never overflows at 320px. */
export const LongText: Story = {
    render: () => (
        <div style={{ maxInlineSize: 280, display: 'grid', gap: 4 }}>
            <Label htmlFor="long" required>
                Name of the legal representative authorised to sign on behalf of
                the company
            </Label>
            <input id="long" />
        </div>
    ),
};

/** Right-to-left: the asterisk follows the text end. */
export const RTL: Story = {
    globals: { direction: 'rtl' },
    render: () => (
        <div style={{ display: 'grid', gap: 4, maxInlineSize: 320 }}>
            <Label htmlFor="rtl" required>
                שם החברה
            </Label>
            <input id="rtl" />
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
                        <Label htmlFor={`${brand}-a`} required>
                            {brand} required
                        </Label>
                        <input id={`${brand}-a`} />
                        <Label htmlFor={`${brand}-b`} disabled>
                            {brand} disabled
                        </Label>
                        <input id={`${brand}-b`} disabled />
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
            caption="Label responsive specification"
            spec={{
                mobile: {
                    size: 'label/md: 14px / 20px semibold.',
                    density:
                        'No padding; FormField puts 4px between label and control.',
                    layout: 'Inline-flex above the control; wraps.',
                    contentVisibility:
                        'Full text, never truncated; decorative asterisk after the text when required.',
                    interaction:
                        'Tap focuses (or toggles) the associated control.',
                },
                tablet: {
                    size: 'As mobile.',
                    density: 'As mobile.',
                    layout: 'As mobile.',
                    contentVisibility: 'As mobile.',
                    interaction: 'Click focuses the control.',
                    note: 'Identical at every breakpoint: a caption is read, not operated, and 14px semibold is legible everywhere; the control below it carries the touch sizing.',
                },
                laptop: {
                    size: 'As mobile.',
                    density: 'As mobile.',
                    layout: 'As mobile.',
                    contentVisibility: 'As mobile.',
                    interaction: 'As tablet.',
                    note: 'Identical (see tablet).',
                },
                desktop: {
                    size: 'As mobile.',
                    density: 'As mobile.',
                    layout: 'As mobile.',
                    contentVisibility: 'As mobile.',
                    interaction: 'As tablet.',
                    note: 'Identical (see tablet).',
                },
            }}
        />
    ),
};

/* ---- Viewport tests ---- */

function Probe() {
    return (
        <div style={{ inlineSize: 280 }}>
            <Label htmlFor="probe" required data-testid="label">
                Name of the legal representative authorised to sign
            </Label>
            <input id="probe" />
        </div>
    );
}

async function assertLabel(canvasElement: HTMLElement) {
    const label = within(canvasElement).getByTestId('label');
    const cs = getComputedStyle(label);
    await expect(cs.fontSize).toBe('14px');
    await expect(cs.lineHeight).toBe('20px');
    await expect(cs.fontWeight).toBe('600');
    await expect(cs.marginBottom).toBe('0px');
    await expect(cs.display).toBe('inline-flex');
    // Wraps inside its 280px column instead of overflowing.
    await expect(label.scrollWidth).toBeLessThanOrEqual(280);
}

export const SpecMobile: Story = {
    ...viewportStory('mobile', () => <Probe />, assertLabel),
    name: 'is 14/20 semibold and wraps at mobile',
};
export const SpecTablet: Story = {
    ...viewportStory('tablet', () => <Probe />, assertLabel),
    name: 'is 14/20 semibold and wraps at tablet',
};
export const SpecLaptop: Story = {
    ...viewportStory('laptop', () => <Probe />, assertLabel),
    name: 'is 14/20 semibold and wraps at laptop',
};
export const SpecDesktop: Story = {
    ...viewportStory('desktop', () => <Probe />, assertLabel),
    name: 'is 14/20 semibold and wraps at desktop',
};

/** Colours come from the semantic tokens. */
export const ComputedStyles: Story = {
    name: 'applies Horizon tokens to the label',
    tags: ['!autodocs', '!dev'],
    render: () => (
        <div style={layout.row}>
            <Label data-testid="rest" htmlFor="c1" required>
                Rest
            </Label>
            <input id="c1" />
            <Label data-testid="disabled" htmlFor="c2" disabled>
                Disabled
            </Label>
            <input id="c2" disabled />
            <span
                data-testid="probe"
                style={{
                    color: 'var(--foreground)',
                    background: 'var(--muted-foreground)',
                    borderColor: 'var(--destructive-strong)',
                }}
            />
        </div>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const probe = getComputedStyle(canvas.getByTestId('probe'));
        await expect(getComputedStyle(canvas.getByTestId('rest')).color).toBe(
            probe.color
        );
        await expect(
            getComputedStyle(canvas.getByTestId('disabled')).color
        ).toBe(probe.backgroundColor);
        const star = canvas.getByText('*');
        await expect(getComputedStyle(star).color).toBe(probe.borderTopColor);
    },
};
