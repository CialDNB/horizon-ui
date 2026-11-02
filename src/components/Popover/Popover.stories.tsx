import { FunnelIcon } from '@phosphor-icons/react/dist/csr/Funnel';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { HorizonProvider } from '../../provider';
import { ResponsiveSpec } from '../../stories/ResponsiveSpec';
import {
    storyLayout as layout,
    settled,
    viewportStory,
    type Viewport,
} from '../../stories/viewports';
import { Button } from '../Button';
import { Checkbox } from '../Checkbox';
import {
    Popover,
    PopoverClose,
    PopoverContent,
    PopoverTrigger,
    type PopoverContentProps,
} from '.';

const page = within(document.body);
const center = {
    display: 'flex',
    justifyContent: 'center',
    paddingBlock: 24,
} as const;

const popoverContent = () =>
    document.querySelector<HTMLElement>('[data-popover-content]');

async function closePopover() {
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(popoverContent()).toBeNull());
}

function FilterPopover(
    props: Partial<PopoverContentProps> & { open?: boolean }
) {
    const { open, ...content } = props;
    return (
        <div style={center}>
            <Popover {...(open !== undefined && { defaultOpen: open })}>
                <PopoverTrigger asChild>
                    <Button variant="secondary" data-testid="trigger">
                        Filters
                    </Button>
                </PopoverTrigger>
                <PopoverContent
                    title="Filter companies"
                    icon={<FunnelIcon />}
                    footer={
                        <>
                            <PopoverClose asChild>
                                <Button variant="tertiary" size="sm">
                                    Cancel
                                </Button>
                            </PopoverClose>
                            <PopoverClose asChild>
                                <Button size="sm">Apply</Button>
                            </PopoverClose>
                        </>
                    }
                    {...content}
                >
                    <div style={{ display: 'grid', gap: 8 }}>
                        <Checkbox label="Active" defaultChecked />
                        <Checkbox label="Prospects" />
                        <Checkbox label="Suspended" />
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
}

const meta = {
    title: 'Components/Popover',
    component: PopoverContent,
    subcomponents: { Popover, PopoverTrigger, PopoverClose },
    parameters: {
        layout: 'padded',
        docs: {
            description: {
                component: [
                    'A floating panel next to its trigger (`role="dialog"`), on Radix Popover. Ported from x-core `PopoverV2`: the `title`, `icon`, `footer` and `hideCloseButton` props move to `PopoverContent`; `anchorEl` + `open` + `onClose` become a `PopoverTrigger` (or `PopoverAnchor`) inside `<Popover open onOpenChange>`; `anchorOrigin`/`transformOrigin` become logical `side`/`align` (default below the trigger, end-aligned, as x-core).',
                    '',
                    'Focus moves into the panel on open and back to the trigger on close; Escape and an outside click close it. Non-modal by default (x-core used a modal MUI Popover; pass `modal` for the same focus trap). Portals into the HorizonProvider root at `--z-popover` (1450).',
                    '',
                    '**Mobile:** 320px wide (x-core 318px), never wider than the viewport minus 16px: wider content becomes a full-width panel with 8px margins, still anchored to the trigger, scrolling inside when it is taller than the space left. Close button 44px at mobile.',
                ].join('\n'),
            },
        },
    },
    render: (args) => <FilterPopover {...args} />,
} satisfies Meta<typeof PopoverContent>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Click the trigger. */
export const Playground: Story = {};

/** Keyboard: Enter opens and focuses inside, Escape returns to the trigger. */
export const Keyboard: Story = {
    play: async ({ canvasElement }) => {
        const trigger = within(canvasElement).getByTestId('trigger');
        trigger.focus();
        await userEvent.keyboard('{Enter}');
        const dialog = await page.findByRole('dialog', {
            name: 'Filter companies',
        });
        await waitFor(() =>
            expect(dialog.contains(document.activeElement)).toBe(true)
        );
        await closePopover();
        await expect(trigger).toHaveFocus();
    },
};

/** Without a title: a plain panel (name it with aria-label). */
export const Plain: Story = {
    render: () => (
        <div style={center}>
            <Popover>
                <PopoverTrigger asChild>
                    <Button variant="tertiary">About this score</Button>
                </PopoverTrigger>
                <PopoverContent aria-label="About this score" showArrow>
                    The score combines payment behaviour, company age and sector
                    risk. It updates every night.
                </PopoverContent>
            </Popover>
        </div>
    ),
};

/** Long content scrolls inside; the title and footer stay. */
export const LongContent: Story = {
    render: () => (
        <div style={center}>
            <Popover>
                <PopoverTrigger asChild>
                    <Button variant="secondary">Changelog</Button>
                </PopoverTrigger>
                <PopoverContent
                    title="A very long title that truncates at the end of the row"
                    footer={<Button size="sm">Done</Button>}
                >
                    {Array.from({ length: 30 }, (_, i) => (
                        <p key={i} style={{ margin: '0 0 8px' }}>
                            Line {i + 1}: Verylongunbrokenwordthatmustwrap
                        </p>
                    ))}
                </PopoverContent>
            </Popover>
        </div>
    ),
};

/** Right-to-left: end-aligned means the trigger's left edge. */
export const RTL: Story = {
    globals: { direction: 'rtl' },
    render: () => <FilterPopover open title="סינון חברות" />,
    play: async ({ canvasElement }) => {
        const trigger = within(canvasElement).getByTestId('trigger');
        const content = await waitFor(() => {
            const el = popoverContent();
            if (!el) throw new Error('no popover');
            return el;
        });
        await settled(content);
        await waitFor(() =>
            expect(
                Math.abs(
                    content.getBoundingClientRect().left -
                        trigger.getBoundingClientRect().left
                )
            ).toBeLessThanOrEqual(1)
        );
        await closePopover();
    },
};

/** Open in all three brands. */
export const Brands: Story = {
    render: () => (
        <div style={layout.stack}>
            {(['cial', 'dnb', 'il'] as const).map((brand) => (
                <HorizonProvider
                    key={brand}
                    brand={brand}
                    style={{ background: 'var(--background)', padding: 16 }}
                >
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="secondary">{brand}</Button>
                        </PopoverTrigger>
                        <PopoverContent title={`${brand} popover`}>
                            Popover body text.
                        </PopoverContent>
                    </Popover>
                </HorizonProvider>
            ))}
        </div>
    ),
};

/** Per-breakpoint specification (Responsive Standard). */
export const Responsive: Story = {
    render: () => (
        <ResponsiveSpec
            caption="Popover responsive specification"
            spec={{
                mobile: {
                    size: 'Width 320px (prop), capped at the viewport minus 16px; title row 48px+, close button 44px; 14px body text.',
                    density: 'Body padding 12px; title row 12px start padding.',
                    layout: 'Anchored below the trigger, end-aligned, flips above when there is no room; content wider than the screen becomes a full-width panel with 8px margins; height capped to the space left, body scrolls.',
                    contentVisibility:
                        'Title truncates; body wraps and scrolls; footer stays visible.',
                    interaction:
                        'Tap to open; tap outside, the close button or a footer action closes.',
                    note: 'Not a bottom sheet: the panel stays next to its trigger so the relation is visible; the width cap removes the overflow case.',
                },
                tablet: {
                    size: 'Width as given (320px default); close button 32px with a fine pointer (44px on touch).',
                    density: 'As mobile.',
                    layout: 'Anchored to the trigger with collision handling (8px from the edges).',
                    contentVisibility: 'As mobile.',
                    interaction:
                        'Click/Enter opens and moves focus inside; Escape, an outside click or a close control closes and returns focus.',
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

const expectedClose = { mobile: 44, tablet: 32, laptop: 32, desktop: 32 };

async function assertPopover(...[, viewport]: [HTMLElement, Viewport]) {
    const content = await waitFor(() => {
        const el = popoverContent();
        if (!el) throw new Error('no popover');
        return el;
    });
    await settled(content);
    const rect = content.getBoundingClientRect();
    // 480px requested: full width minus 16px at mobile, as given from tablet.
    await expect(rect.width).toBe(Math.min(480, window.innerWidth - 16));
    await expect(rect.left).toBeGreaterThanOrEqual(8);
    await expect(rect.right).toBeLessThanOrEqual(window.innerWidth - 8);
    const close = page.getByRole('button', { name: 'Close' });
    await expect(close.getBoundingClientRect().height).toBe(
        expectedClose[viewport]
    );
    const wrapper = content.closest('[data-radix-popper-content-wrapper]');
    if (!wrapper) throw new Error('no wrapper');
    await expect(getComputedStyle(wrapper).zIndex).toBe('1450');
    await expect(getComputedStyle(content).fontSize).toBe('14px');
    await closePopover();
}

const probe = () => <FilterPopover open width={480} />;

export const OpenMobile: Story = {
    ...viewportStory('mobile', probe, assertPopover),
    name: 'caps at the viewport minus 16px with a 44px close at mobile',
};
export const OpenTablet: Story = {
    ...viewportStory('tablet', probe, assertPopover),
    name: 'keeps the given width at tablet',
};
export const OpenLaptop: Story = {
    ...viewportStory('laptop', probe, assertPopover),
    name: 'keeps the given width at laptop',
};
export const OpenDesktop: Story = {
    ...viewportStory('desktop', probe, assertPopover),
    name: 'keeps the given width at desktop',
};

/** Surface colours come from the popover tokens. */
export const ComputedStyles: Story = {
    name: 'applies the popover tokens',
    tags: ['!autodocs', '!dev'],
    render: () => (
        <>
            <FilterPopover open />
            <span
                data-testid="probe"
                style={{
                    color: 'var(--popover-foreground)',
                    background: 'var(--popover)',
                }}
            />
        </>
    ),
    play: async ({ canvasElement }) => {
        const probe = getComputedStyle(
            within(canvasElement).getByTestId('probe')
        );
        const content = await waitFor(() => {
            const el = popoverContent();
            if (!el) throw new Error('no popover');
            return el;
        });
        const cs = getComputedStyle(content);
        await expect(cs.backgroundColor).toBe(probe.backgroundColor);
        await expect(cs.color).toBe(probe.color);
        await expect(cs.borderRadius).toBe('8px');
        await closePopover();
    },
};
