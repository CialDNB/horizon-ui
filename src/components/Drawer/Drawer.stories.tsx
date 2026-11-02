import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { HorizonProvider } from '../../provider';
import { ResponsiveSpec } from '../../stories/ResponsiveSpec';
import {
    settled,
    storyLayout as layout,
    viewportStory,
    type Viewport,
} from '../../stories/viewports';
import { Button } from '../Button';
import { FormField } from '../FormField';
import { Input } from '../Input';
import { Drawer, type DrawerProps } from '.';

const page = within(document.body);
const panel = () =>
    document.querySelector<HTMLElement>('[data-drawer-content]');

function Body({ lines = 0 }: { lines?: number }) {
    return (
        <div style={{ display: 'grid', gap: 16 }}>
            <FormField label="Contact name">
                <Input defaultValue="Dana Levi" />
            </FormField>
            {Array.from({ length: lines }, (_, i) => (
                <p key={i} style={{ margin: 0 }}>
                    Activity {i + 1}: payment received on time.
                </p>
            ))}
        </div>
    );
}

function Demo({
    initiallyOpen = false,
    lines = 0,
    ...props
}: Partial<DrawerProps> & { initiallyOpen?: boolean; lines?: number }) {
    const [open, setOpen] = useState(initiallyOpen);
    return (
        <>
            <Button data-testid="trigger" onClick={() => setOpen(true)}>
                Open details
            </Button>
            <Drawer
                open={open}
                onOpenChange={setOpen}
                title="Company details"
                content={<Body lines={lines} />}
                actions={
                    <>
                        <Button
                            variant="secondary"
                            onClick={() => setOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button onClick={() => setOpen(false)}>Save</Button>
                    </>
                }
                {...props}
            />
        </>
    );
}

async function closeDrawer() {
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(panel()).toBeNull());
}

const meta = {
    title: 'Components/Drawer',
    component: Drawer,
    parameters: {
        layout: 'padded',
        docs: {
            description: {
                component: [
                    'A modal side panel (title, scrolling content, actions), on Radix Dialog. Ported from x-core `DrawerV3`: `isOpen` becomes `open`, `onClose` becomes `onOpenChange(false)`, `direction` becomes the logical `side` (`end` by default, mirrored under rtl by itself); `title`, `content`, `actions`, `width` (default 320px) and `keepMounted` are kept.',
                    '',
                    '**Mobile:** a full-width bottom sheet up to 90% of the screen height (x-core anchored to the bottom below tablet), content scrolls, actions above the safe area. **Tablet+:** full height on the side, `width` wide (customer360 passes e.g. `"90%"`), never wider than the viewport.',
                    '',
                    'Focus is trapped and returns to the control that opened it; Escape, the close button and the scrim close it. `keepMounted` keeps the content (and its state) while closed; closed content is not in the document.',
                ].join('\n'),
            },
        },
    },
    args: {
        open: false,
        onOpenChange: () => {},
        title: 'Company details',
        content: null,
    },
    render: ({ title, side, width }) => (
        <Demo
            title={title}
            {...(side !== undefined && { side })}
            {...(width !== undefined && { width })}
        />
    ),
} satisfies Meta<typeof Drawer>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Click the button. */
export const Playground: Story = {};

/** Opens on the start edge instead. */
export const StartSide: Story = { args: { side: 'start' } };

/** A wide panel (customer360 `width="90%"`). */
export const Wide: Story = { args: { width: '90%' } };

/** Long content scrolls between the title row and the actions. */
export const LongContent: Story = {
    render: () => (
        <Demo
            lines={60}
            title="A long title that wraps onto a second line in a narrow drawer"
        />
    ),
};

/** keepMounted: typed text survives closing and reopening. */
export const KeepMounted: Story = {
    render: () => <Demo keepMounted />,
    play: async ({ canvasElement }) => {
        const trigger = within(canvasElement).getByTestId('trigger');
        await userEvent.click(trigger);
        const input = await page.findByRole('textbox', {
            name: 'Contact name',
        });
        await userEvent.clear(input);
        await userEvent.type(input, 'Omer');
        await closeDrawer();
        await userEvent.click(trigger);
        await expect(
            await page.findByRole('textbox', { name: 'Contact name' })
        ).toHaveValue('Omer');
        await closeDrawer();
    },
};

/** Right-to-left: `end` is the left edge. */
export const RTL: Story = {
    globals: { direction: 'rtl' },
    render: () => <Demo initiallyOpen title="פרטי חברה" />,
};

/** All three brands. */
export const Brands: Story = {
    render: () => (
        <div style={layout.row}>
            {(['cial', 'dnb', 'il'] as const).map((brand) => (
                <HorizonProvider
                    key={brand}
                    brand={brand}
                    style={{ background: 'var(--background)', padding: 16 }}
                >
                    <Demo title={`${brand} drawer`} />
                </HorizonProvider>
            ))}
        </div>
    ),
};

/** Per-breakpoint specification (Responsive Standard). */
export const Responsive: Story = {
    render: () => (
        <ResponsiveSpec
            caption="Drawer responsive specification"
            spec={{
                mobile: {
                    size: 'Full width; up to 90% of the viewport height; title row 56px with a 44px close button.',
                    density:
                        'Body padding 16px; actions 12px top, 12px or the safe area bottom.',
                    layout: 'Bottom sheet with a 16px top radius over a 50% scrim, sliding up; body scrolls; actions in a row at the end.',
                    contentVisibility: 'Title wraps; content scrolls.',
                    interaction:
                        'Close button, an action or a tap on the scrim; focus trapped.',
                },
                tablet: {
                    size: 'Full height; `width` (320px default, any CSS width) capped at the viewport; close 32px with a fine pointer.',
                    density: 'As mobile.',
                    layout: 'Side panel on the logical `side` (end: right in ltr, left in rtl), no radius, sliding in from that edge.',
                    contentVisibility: 'As mobile.',
                    interaction:
                        'Escape, close button, actions or a scrim click; focus returns to the opener.',
                },
                laptop: {
                    size: 'As tablet.',
                    density: 'As tablet.',
                    layout: 'As tablet.',
                    contentVisibility: 'As tablet.',
                    interaction: 'As tablet.',
                    note: "Identical to tablet: the width is the caller's.",
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

async function assertDrawer(...[, viewport]: [HTMLElement, Viewport]) {
    const el = await waitFor(() => {
        const found = panel();
        if (!found) throw new Error('no drawer');
        return found;
    });
    await settled(el);
    const r = el.getBoundingClientRect();
    const close = page.getByRole('button', { name: 'Close' });
    const body = el.querySelector('[data-drawer-body]');
    if (!body) throw new Error('no body');
    await expect(getComputedStyle(el).zIndex).toBe('1350');
    if (viewport === 'mobile') {
        await expect(r.width).toBe(window.innerWidth);
        await expect(Math.round(r.bottom)).toBe(window.innerHeight);
        await expect(r.height).toBeLessThanOrEqual(window.innerHeight * 0.9);
        await expect(close.getBoundingClientRect().height).toBe(44);
    } else {
        await expect(r.width).toBe(480);
        await expect(r.height).toBe(window.innerHeight);
        await expect(Math.round(r.right)).toBe(window.innerWidth);
        await expect(close.getBoundingClientRect().height).toBe(32);
    }
    await expect(body.scrollHeight).toBeGreaterThan(body.clientHeight);
    await closeDrawer();
}

const probe = () => <Demo initiallyOpen width={480} lines={60} />;

export const OpenMobile: Story = {
    ...viewportStory('mobile', probe, assertDrawer),
    name: 'is a full-width bottom sheet at mobile',
};
export const OpenTablet: Story = {
    ...viewportStory('tablet', probe, assertDrawer),
    name: 'is a 480px end panel at tablet',
};
export const OpenLaptop: Story = {
    ...viewportStory('laptop', probe, assertDrawer),
    name: 'is a 480px end panel at laptop',
};
export const OpenDesktop: Story = {
    ...viewportStory('desktop', probe, assertDrawer),
    name: 'is a 480px end panel at desktop',
};

/** Under rtl the end side is the left edge. */
export const RTLTablet: Story = {
    ...viewportStory('tablet', probe, async () => {
        const el = await waitFor(() => {
            const found = panel();
            if (!found) throw new Error('no drawer');
            return found;
        });
        await settled(el);
        await expect(el.getBoundingClientRect().left).toBe(0);
        await closeDrawer();
    }),
    globals: {
        viewport: { value: 'tablet', isRotated: false },
        direction: 'rtl',
    },
    name: 'opens on the left edge under rtl at tablet',
};
