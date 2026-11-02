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
import { Switch } from '.';

const list = { display: 'grid', justifyItems: 'start' } as const;

const meta = {
    title: 'Components/Switch',
    component: Switch,
    parameters: {
        layout: 'padded',
        docs: {
            description: {
                component: [
                    'On/off setting that applies immediately, on Radix Switch (`role="switch"`, Space toggles). Ported from x-core `SwitchV2`: `onChange(event, checked)` becomes `onCheckedChange(checked)`; MUI `FormControlLabel` becomes `label`.',
                    '',
                    '**Look.** Track 40x24 (x-core 42x22), `control-border` fill off (3:1), primary on (`primary-hover` on hover); 20px `background` thumb with elevation 1, moved by transform along the inline axis (mirrored in RTL) with the spring easing, 200ms; reduced motion: instant. Focus-visible: 2px `ring` outline around the track. Invalid: destructive ring. Disabled: `input` / `muted-foreground` fills.',
                    '',
                    '**Target.** 44px square at mobile and on touch pointers; 44x28 with a fine pointer from tablet.',
                ].join('\n'),
            },
        },
    },
    args: { label: 'Auto-renew subscription' },
} satisfies Meta<typeof Switch>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Controls playground. */
export const Playground: Story = {};

/** Off, on, invalid, disabled. */
export const States: Story = {
    render: () => (
        <div style={list}>
            <Switch label="Off" />
            <Switch label="On" defaultChecked />
            <Switch label="Invalid" invalid />
            <Switch label="Disabled off" disabled />
            <Switch label="Disabled on" disabled defaultChecked />
        </div>
    ),
};

/** In a FormField with a description. */
export const WithFormField: Story = {
    render: () => (
        <div style={{ maxInlineSize: 400 }}>
            <FormField
                label="Monitoring alerts"
                description="Email me when the credit score changes."
            >
                <Switch defaultChecked />
            </FormField>
        </div>
    ),
};

/** Long labels wrap next to the switch. */
export const LongText: Story = {
    render: () => (
        <div style={{ maxInlineSize: 280 }}>
            <Switch label="Include subsidiaries and branches in the monitoring report" />
        </div>
    ),
};

/** Right-to-left: the thumb travels to the left when on. */
export const RTL: Story = {
    globals: { direction: 'rtl' },
    render: () => (
        <div style={list}>
            <Switch label="התראות" data-testid="rtl-switch" />
        </div>
    ),
    play: async ({ canvasElement }) => {
        const sw = within(canvasElement).getByTestId('rtl-switch');
        const thumb = sw.querySelector('[data-switch-thumb]');
        if (!thumb) throw new Error('no thumb');
        const before = thumb.getBoundingClientRect().left;
        await userEvent.click(sw);
        await settled(thumb);
        await expect(thumb.getBoundingClientRect().left).toBeLessThan(before);
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
                    <div style={layout.row}>
                        <Switch label={`${brand} off`} />
                        <Switch label={`${brand} on`} defaultChecked />
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
                caption="Switch responsive specification"
                spec={{
                    mobile: {
                        size: 'Track 40x24, thumb 20px; target 44x44; label 16/20.',
                        density:
                            'Stacked switches touch (44px rows); label starts right after the 44px target.',
                        layout: 'Switch then label; the label wraps.',
                        contentVisibility: 'Full label text.',
                        interaction:
                            'Tap the switch or label; Space with a keyboard.',
                    },
                    tablet: {
                        size: 'Fine pointer: target 44x28. Touch (iPad): 44x44.',
                        density: '8px between switch and label.',
                        layout: 'As mobile.',
                        contentVisibility: 'As mobile.',
                        interaction:
                            'Pointer hover darkens the on track; focus-visible ring.',
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

const expectedHeight = { mobile: 44, tablet: 28, laptop: 28, desktop: 28 };

function Probe() {
    return (
        <div style={{ ...list, inlineSize: 320 }} data-testid="probe">
            <Switch label="Alerts" data-testid="sw" />
            <Switch label="A long switch label that wraps onto a second line at 320px" />
        </div>
    );
}

async function assertSwitch(canvasElement: HTMLElement, viewport: Viewport) {
    const canvas = within(canvasElement);
    const sw = canvas.getByTestId('sw');
    const rect = sw.getBoundingClientRect();
    await expect([rect.width, rect.height]).toEqual([
        44,
        expectedHeight[viewport],
    ]);
    const track = sw.firstElementChild?.getBoundingClientRect();
    await expect([track?.width, track?.height]).toEqual([40, 24]);
    const thumb = sw.querySelector('[data-switch-thumb]');
    if (!thumb || !track) throw new Error('no thumb');
    await expect(thumb.getBoundingClientRect().left - track.left).toBe(2);
    await userEvent.click(canvas.getByText('Alerts'));
    await expect(sw).toBeChecked();
    await settled(thumb);
    await expect(thumb.getBoundingClientRect().right).toBe(track.right - 2);
    await expect(canvas.getByTestId('probe').scrollWidth).toBeLessThanOrEqual(
        320
    );
}

export const TargetMobile: Story = {
    ...viewportStory('mobile', () => <Probe />, assertSwitch),
    name: 'has a 44px target at mobile',
};
export const DensityTablet: Story = {
    ...viewportStory('tablet', () => <Probe />, assertSwitch),
    name: 'is 44x28 with a fine pointer at tablet',
};
export const DensityLaptop: Story = {
    ...viewportStory('laptop', () => <Probe />, assertSwitch),
    name: 'is 44x28 with a fine pointer at laptop',
};
export const DensityDesktop: Story = {
    ...viewportStory('desktop', () => <Probe />, assertSwitch),
    name: 'is 44x28 with a fine pointer at desktop',
};

/** Track, thumb, motion and focus ring come from the tokens. */
export const ComputedStyles: Story = {
    name: 'applies Horizon tokens to the switch',
    tags: ['!autodocs', '!dev'],
    render: () => (
        <div style={list}>
            <Switch aria-label="Off" data-testid="off" />
            <Switch aria-label="On" data-testid="on" defaultChecked />
            <span
                data-testid="probe"
                style={{
                    color: 'var(--control-border)',
                    background: 'var(--primary)',
                    borderColor: 'var(--background)',
                    outlineColor: 'var(--ring)',
                }}
            />
        </div>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const probe = getComputedStyle(canvas.getByTestId('probe'));
        const track = (id: string) => {
            const el = canvas.getByTestId(id).firstElementChild;
            if (!el) throw new Error(id);
            return el;
        };
        await expect(getComputedStyle(track('off')).backgroundColor).toBe(
            probe.color
        );
        await expect((await settled(track('on'))).backgroundColor).toBe(
            probe.backgroundColor
        );
        const thumb = canvas
            .getByTestId('on')
            .querySelector('[data-switch-thumb]');
        if (!thumb) throw new Error('no thumb');
        const ts = getComputedStyle(thumb);
        await expect(ts.backgroundColor).toBe(probe.borderTopColor);
        await expect(ts.transitionProperty).toContain('transform');
        await expect(ts.transitionTimingFunction).toBe(
            'cubic-bezier(0.34, 1.56, 0.64, 1)'
        );
        canvas.getByTestId('off').focus();
        const focused = getComputedStyle(track('off'));
        await expect(focused.outlineStyle).toBe('solid');
        await expect(focused.outlineColor).toBe(probe.outlineColor);
    },
};
