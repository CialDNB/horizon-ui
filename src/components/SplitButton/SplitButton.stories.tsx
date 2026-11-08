import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { HorizonProvider } from '../../provider';
import { ResponsiveSpec } from '../../stories/ResponsiveSpec';
import {
    settled,
    storyLayout as layout,
    viewportStory,
    type Viewport,
} from '../../stories/viewports';
import { SplitButton } from '.';

const page = within(document.body);

const OPTIONS = [
    { label: 'New Decision V1', mode: 'v1' },
    { label: 'New Decision V2', mode: 'v2' },
    { label: 'Import (unavailable)', disabled: true },
];

async function closeMenu() {
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(page.queryByRole('menu')).toBeNull());
}

const meta = {
    title: 'Components/SplitButton',
    component: SplitButton,
    parameters: {
        layout: 'padded',
        docs: {
            description: {
                component: [
                    'A main action plus a menu of alternatives, composed from Button and DropdownMenu in a `role="group"` (named by `aria-label`, else the main label). The main button runs the selected option; the caret button (`aria-haspopup="menu"`, named by `menuLabel`) opens the options as `menuitemradio` items with the selected one checked; picking one selects it and runs it, as x-core. Below tablet the menu is a bottom sheet (customer360 built its own MobileSplitButton sheet for this).',
                    '',
                    'Ported from x-core `SplitButton`: `options`, `onOptionClick(option, index)`, `headline`, `disabled`, `loading`, `size` kept; `variant` contained/outlined becomes `primary`/`secondary`; `color` (incl. `bright`) and `sx` dropped with a dev warning.',
                ].join('\n'),
            },
        },
    },
    args: { options: OPTIONS, onOptionClick: fn() },
} satisfies Meta<typeof SplitButton>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Controls playground. */
export const Playground: Story = {};

/** Variants and sizes. */
export const Variants: Story = {
    render: (args) => (
        <div style={layout.stack}>
            {(['primary', 'secondary'] as const).map((variant) => (
                <div key={variant} style={layout.row}>
                    {(['sm', 'md', 'lg'] as const).map((size) => (
                        <SplitButton
                            key={size}
                            {...args}
                            variant={variant}
                            size={size}
                            aria-label={`${variant} ${size}`}
                        />
                    ))}
                </div>
            ))}
        </div>
    ),
};

/** Disabled and loading. */
export const States: Story = {
    render: (args) => (
        <div style={layout.row}>
            <SplitButton {...args} aria-label="Disabled" disabled />
            <SplitButton
                {...args}
                aria-label="Disabled secondary"
                variant="secondary"
                disabled
            />
            <SplitButton {...args} aria-label="Loading" loading />
        </div>
    ),
};

/** Keyboard: the menu opens from Enter, arrows move, Enter picks and runs. */
export const Keyboard: Story = {
    play: async ({ canvasElement, args }) => {
        const canvas = within(canvasElement);
        const menu = canvas.getByRole('button', { name: 'More options' });
        menu.focus();
        await userEvent.keyboard('{Enter}');
        await page.findByRole('menu');
        await waitFor(() =>
            expect(document.activeElement?.getAttribute('role')).toBe(
                'menuitemradio'
            )
        );
        await userEvent.keyboard('{ArrowDown}{Enter}');
        await waitFor(() => expect(page.queryByRole('menu')).toBeNull());
        await expect(args.onOptionClick).toHaveBeenLastCalledWith(
            OPTIONS[1],
            1
        );
        await expect(
            canvas.getByRole('button', { name: 'New Decision V2' })
        ).toBeVisible();
    },
};

/** A fixed headline (x-core `headline`) and a long label. */
export const LongText: Story = {
    render: (args) => (
        <div style={{ maxInlineSize: 240 }}>
            <SplitButton
                {...args}
                headline="Create a new decision request for this portfolio"
            />
        </div>
    ),
};

/** Right-to-left: the menu button at the inline end (left). */
export const RTL: Story = {
    globals: { direction: 'rtl' },
    render: (args) => (
        <SplitButton {...args} options={['החלטה חדשה', 'ייבוא']} />
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const main = canvas.getByRole('button', { name: 'החלטה חדשה' });
        const menu = canvas.getByRole('button', { name: 'More options' });
        await expect(menu.getBoundingClientRect().right).toBeLessThanOrEqual(
            main.getBoundingClientRect().left + 1
        );
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
                        <SplitButton
                            {...args}
                            aria-label={`${brand} primary`}
                        />
                        <SplitButton
                            {...args}
                            variant="secondary"
                            aria-label={`${brand} secondary`}
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
            caption="SplitButton responsive specification"
            spec={{
                mobile: {
                    size: 'Both buttons 44px tall (lg 48px); the menu button at least 44px wide.',
                    density:
                        'Button padding; the menu button 12px inline padding.',
                    layout: 'One pill: square inner corners, 1px divider. The menu is a bottom sheet (full width, 44px rows).',
                    contentVisibility:
                        'A long main label wraps inside the button (Button behaviour).',
                    interaction:
                        'Tap the main action, or the caret for the sheet; tap an option to select and run it.',
                },
                tablet: {
                    size: 'Fine pointer: buttons as Button (sm 32, md 36, lg 44); menu button min 36px wide. Touch: mobile sizes.',
                    density:
                        'Menu button 8px inline padding with a fine pointer.',
                    layout: 'The menu is anchored under the group, aligned to its inline end.',
                    contentVisibility: 'As mobile.',
                    interaction:
                        'Keyboard: Tab to each button; Enter/Space/ArrowDown on the caret open the menu; arrows, Enter, Escape.',
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
    mobile: { height: 44, menuMin: 44, sheet: true },
    tablet: { height: 36, menuMin: 36, sheet: false },
    laptop: { height: 36, menuMin: 36, sheet: false },
    desktop: { height: 36, menuMin: 36, sheet: false },
} as const;

function Probe() {
    return <SplitButton options={OPTIONS} data-testid="group" />;
}

async function assertSplit(canvasElement: HTMLElement, viewport: Viewport) {
    const canvas = within(canvasElement);
    const want = expected[viewport];
    const main = canvas.getByRole('button', { name: 'New Decision V1' });
    const menu = canvas.getByRole('button', { name: 'More options' });
    const m = main.getBoundingClientRect();
    const t = menu.getBoundingClientRect();
    await expect(m.height, 'main').toBe(want.height);
    await expect(t.height, 'menu button').toBe(want.height);
    await expect(t.width).toBeGreaterThanOrEqual(want.menuMin);
    // Joined: no gap, square inner corners.
    await expect(Math.abs(t.left - m.right)).toBeLessThanOrEqual(1);
    await expect(getComputedStyle(main).borderEndEndRadius).toBe('0px');
    await expect(getComputedStyle(menu).borderStartStartRadius).toBe('0px');
    await userEvent.click(menu);
    const list = await page.findByRole('menu');
    await settled(list);
    const r = list.getBoundingClientRect();
    if (want.sheet) {
        await expect(r.width).toBe(window.innerWidth);
        await expect(Math.round(r.bottom)).toBe(window.innerHeight);
        const item = page.getAllByRole('menuitemradio')[0];
        await expect(item?.getBoundingClientRect().height).toBe(44);
    } else {
        await expect(r.top).toBeGreaterThan(t.bottom);
        await expect(Math.abs(r.right - t.right)).toBeLessThanOrEqual(1);
    }
    await closeMenu();
}

export const LayoutMobile: Story = {
    ...viewportStory('mobile', () => <Probe />, assertSplit),
    name: 'is 44px with a bottom-sheet menu at mobile',
};
export const LayoutTablet: Story = {
    ...viewportStory('tablet', () => <Probe />, assertSplit),
    name: 'is 36px with an anchored menu at tablet',
};
export const LayoutLaptop: Story = {
    ...viewportStory('laptop', () => <Probe />, assertSplit),
    name: 'is 36px with an anchored menu at laptop',
};
export const LayoutDesktop: Story = {
    ...viewportStory('desktop', () => <Probe />, assertSplit),
    name: 'is 36px with an anchored menu at desktop',
};

/** The divider uses the fill's foreground token. */
export const ComputedStyles: Story = {
    name: 'draws the divider in the foreground token',
    tags: ['!autodocs', '!dev'],
    render: () => (
        <div>
            <SplitButton options={OPTIONS} />
            <span
                data-testid="probe"
                style={{ color: 'var(--primary-foreground)' }}
            />
        </div>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const fg = getComputedStyle(canvas.getByTestId('probe')).color;
        const menu = canvas.getByRole('button', { name: 'More options' });
        await expect(getComputedStyle(menu).borderInlineStartColor).toBe(fg);
    },
};
