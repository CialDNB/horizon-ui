import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { HorizonProvider } from '../../provider';
import { ResponsiveSpec } from '../../stories/ResponsiveSpec';
import { storyLayout as layout, viewportStory } from '../../stories/viewports';
import { Button } from '../Button';
import { Tooltip, TooltipProvider } from '.';

const page = within(document.body);
const center = {
    display: 'flex',
    justifyContent: 'center',
    paddingBlock: 64,
} as const;

const tooltipContent = () =>
    document.querySelector<HTMLElement>('[data-tooltip-content]');

/** Closes an open tooltip so the next story starts clean. */
async function closeTooltip() {
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(tooltipContent()).toBeNull());
}

const meta = {
    title: 'Components/Tooltip',
    component: Tooltip,
    subcomponents: { TooltipProvider },
    parameters: {
        layout: 'padded',
        docs: {
            description: {
                component: [
                    'A short text label on hover (after `delayDuration`, 300ms) and on keyboard focus, on Radix Tooltip. Ported from x-core `TooltipV2`: `title` becomes `content`, `placement` becomes logical `side` + `align`, `enterDelay` becomes `delayDuration`, `multipleLine` is the default (wraps at 280px, keeps line breaks).',
                    '',
                    '**Touch:** tooltips never open from touch (no long-press), so a tooltip may only repeat or supplement what is visible, for example the name of an icon button that is already its `aria-label`. Keyboard focus shows it; it is linked to the trigger by `aria-describedby` and Escape closes it.',
                    '',
                    '**Content:** text or simple inline markup. It is not focusable, so no links or buttons inside; use a Popover for rich or interactive content.',
                    '',
                    'Works without any provider; wrap a toolbar in `TooltipProvider` to skip the delay when moving between neighbouring tooltips. Portals into the HorizonProvider root at `--z-tooltip` (1500).',
                ].join('\n'),
            },
        },
    },
    args: {
        content: 'Edit company details',
        children: <Button variant="secondary">Hover or focus me</Button>,
    },
    render: (args) => (
        <div style={center}>
            <Tooltip {...args} />
        </div>
    ),
} satisfies Meta<typeof Tooltip>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Hover or tab to the button. */
export const Playground: Story = {};

/** Open on focus: linked to the trigger by aria-describedby. */
export const KeyboardFocus: Story = {
    play: async ({ canvasElement }) => {
        const trigger = within(canvasElement).getByRole('button');
        await userEvent.tab();
        await expect(trigger).toHaveFocus();
        const tooltip = await page.findByRole('tooltip');
        await expect(trigger).toHaveAccessibleDescription(
            tooltip.textContent ?? ''
        );
        await closeTooltip();
    },
};

/** Four logical sides (start/end follow the direction) and the arrow. */
export const Sides: Story = {
    render: () => (
        <TooltipProvider>
            <div style={{ ...layout.row, ...center }}>
                {(['top', 'bottom', 'start', 'end'] as const).map((side) => (
                    <Tooltip
                        key={side}
                        side={side}
                        content={`Side ${side}`}
                        showArrow
                    >
                        <Button variant="tertiary">{side}</Button>
                    </Tooltip>
                ))}
            </div>
        </TooltipProvider>
    ),
};

/** Long content wraps at 280px and keeps line breaks (x-core multipleLine). */
export const LongContent: Story = {
    args: {
        defaultOpen: true,
        content:
            'Credit limit recommendation based on the last 12 months of payment behaviour.\nUpdated daily at 06:00.',
    },
    play: async () => {
        const content = await waitFor(() => {
            const el = tooltipContent();
            if (!el) throw new Error('no tooltip');
            return el;
        });
        await expect(content.getBoundingClientRect().width).toBeLessThanOrEqual(
            280
        );
        await closeTooltip();
    },
};

/** Right-to-left: `end` opens to the left of the trigger. */
export const RTL: Story = {
    globals: { direction: 'rtl' },
    args: { content: 'עריכת פרטי חברה', side: 'end', defaultOpen: true },
    play: async ({ canvasElement }) => {
        const trigger = within(canvasElement).getByRole('button');
        const content = await waitFor(() => {
            const el = tooltipContent();
            if (!el) throw new Error('no tooltip');
            return el;
        });
        await waitFor(() =>
            expect(content.getBoundingClientRect().right).toBeLessThanOrEqual(
                trigger.getBoundingClientRect().left
            )
        );
        await closeTooltip();
    },
};

/** All three brands (open). */
export const Brands: Story = {
    render: () => (
        <div style={layout.row}>
            {(['cial', 'dnb', 'il'] as const).map((brand) => (
                <HorizonProvider
                    key={brand}
                    brand={brand}
                    style={{ background: 'var(--background)', padding: 48 }}
                >
                    <Tooltip content={`${brand} tooltip`} defaultOpen>
                        <Button variant="secondary">{brand}</Button>
                    </Tooltip>
                </HorizonProvider>
            ))}
        </div>
    ),
};

/** Per-breakpoint specification (Responsive Standard). */
export const Responsive: Story = {
    render: () => (
        <ResponsiveSpec
            caption="Tooltip responsive specification"
            spec={{
                mobile: {
                    size: '12px caption text, 8px 12px padding, max width 280px or the viewport minus 16px (at 320px wide).',
                    density: 'As all breakpoints.',
                    layout: 'Next to the trigger on the requested side; flips and shifts to stay 8px inside the viewport.',
                    contentVisibility:
                        'Wraps; line breaks kept. Not shown for touch input.',
                    interaction:
                        'Touch never opens it (no long-press): content must be available elsewhere (aria-label, visible text). Keyboard focus (external keyboard) shows it; Escape closes.',
                },
                tablet: {
                    size: 'As mobile.',
                    density: 'As mobile.',
                    layout: 'As mobile.',
                    contentVisibility: 'As mobile.',
                    interaction:
                        'Pointer hover opens after 300ms; focus opens at once; Escape or leaving closes.',
                },
                laptop: {
                    size: 'As mobile.',
                    density: 'As mobile.',
                    layout: 'As mobile.',
                    contentVisibility: 'As mobile.',
                    interaction: 'As tablet.',
                    note: 'Identical to tablet: a tooltip is a short label with no layout to adapt.',
                },
                desktop: {
                    size: 'As mobile.',
                    density: 'As mobile.',
                    layout: 'As mobile.',
                    contentVisibility: 'As mobile.',
                    interaction: 'As tablet.',
                    note: 'Identical to tablet.',
                },
            }}
        />
    ),
};

/* ---- Viewport tests ---- */

function Probe() {
    return (
        <div style={center}>
            <Tooltip
                defaultOpen
                content="A long tooltip text that wraps onto several lines rather than running off the edge of the screen."
            >
                <Button variant="secondary" data-testid="trigger">
                    Trigger
                </Button>
            </Tooltip>
        </div>
    );
}

async function assertTooltip() {
    const content = await waitFor(() => {
        const el = tooltipContent();
        if (!el) throw new Error('no tooltip');
        return el;
    });
    const cs = getComputedStyle(content);
    await expect(cs.fontSize).toBe('12px');
    await expect(cs.maxWidth).toBe('280px');
    const rect = content.getBoundingClientRect();
    await expect(rect.width).toBeLessThanOrEqual(280);
    await expect(rect.left).toBeGreaterThanOrEqual(8);
    await expect(rect.right).toBeLessThanOrEqual(window.innerWidth - 8);
    const wrapper = content.closest('[data-radix-popper-content-wrapper]');
    if (!wrapper) throw new Error('no wrapper');
    await expect(getComputedStyle(wrapper).zIndex).toBe('1500');
    await expect(content.closest('.hz-root')).not.toBeNull();
    await closeTooltip();
}

export const OpenMobile: Story = {
    ...viewportStory('mobile', () => <Probe />, assertTooltip),
    name: 'wraps at 280px inside the viewport at mobile',
};
export const OpenTablet: Story = {
    ...viewportStory('tablet', () => <Probe />, assertTooltip),
    name: 'wraps at 280px at tablet',
};
export const OpenLaptop: Story = {
    ...viewportStory('laptop', () => <Probe />, assertTooltip),
    name: 'wraps at 280px at laptop',
};
export const OpenDesktop: Story = {
    ...viewportStory('desktop', () => <Probe />, assertTooltip),
    name: 'wraps at 280px at desktop',
};

/** Surface and text come from the tooltip tokens. */
export const ComputedStyles: Story = {
    name: 'applies the tooltip tokens',
    tags: ['!autodocs', '!dev'],
    render: () => (
        <div style={center}>
            <Tooltip content="Tokens" defaultOpen>
                <Button variant="secondary">Tokens</Button>
            </Tooltip>
            <span
                data-testid="probe"
                style={{
                    color: 'var(--tooltip-foreground)',
                    background: 'var(--tooltip)',
                }}
            />
        </div>
    ),
    play: async ({ canvasElement }) => {
        const probe = getComputedStyle(
            within(canvasElement).getByTestId('probe')
        );
        const content = await waitFor(() => {
            const el = tooltipContent();
            if (!el) throw new Error('no tooltip');
            return el;
        });
        const cs = getComputedStyle(content);
        await expect(cs.backgroundColor).toBe(probe.backgroundColor);
        await expect(cs.color).toBe(probe.color);
        await expect(cs.borderRadius).toBe('4px');
        await closeTooltip();
    },
};
