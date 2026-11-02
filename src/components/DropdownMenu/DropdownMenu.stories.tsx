import { ArrowSquareOutIcon } from '@phosphor-icons/react/dist/csr/ArrowSquareOut';
import { CopyIcon } from '@phosphor-icons/react/dist/csr/Copy';
import { DownloadSimpleIcon } from '@phosphor-icons/react/dist/csr/DownloadSimple';
import { TrashIcon } from '@phosphor-icons/react/dist/csr/Trash';
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
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
} from '.';

const page = within(document.body);
const menus = () =>
    Array.from(document.querySelectorAll<HTMLElement>('[data-menu-content]'));

async function closeMenus() {
    await userEvent.keyboard('{Escape}');
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(menus()).toHaveLength(0));
}

function ReportMenu({ open }: { open?: boolean }) {
    const [compact, setCompact] = useState(true);
    const [sort, setSort] = useState('date');
    return (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
            <DropdownMenu {...(open !== undefined && { defaultOpen: open })}>
                <DropdownMenuTrigger asChild>
                    <Button variant="secondary" data-testid="trigger">
                        Report actions
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuGroup aria-labelledby="menu-report">
                        <DropdownMenuLabel id="menu-report">
                            Report
                        </DropdownMenuLabel>
                        <DropdownMenuItem
                            icon={<DownloadSimpleIcon />}
                            shortcut="Ctrl+E"
                        >
                            Export PDF
                        </DropdownMenuItem>
                        <DropdownMenuItem icon={<CopyIcon />}>
                            Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem disabled>
                            Share (no permission)
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                            <a href="#history">
                                <ArrowSquareOutIcon aria-hidden="true" />
                                Open history
                            </a>
                        </DropdownMenuItem>
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator />
                    <DropdownMenuCheckboxItem
                        checked={compact}
                        onCheckedChange={setCompact}
                    >
                        Compact rows
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuRadioGroup
                        value={sort}
                        onValueChange={setSort}
                    >
                        <DropdownMenuRadioItem value="name">
                            Sort by name
                        </DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="date">
                            Sort by date
                        </DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                    <DropdownMenuSeparator />
                    <DropdownMenuSub>
                        <DropdownMenuSubTrigger>Move to</DropdownMenuSubTrigger>
                        <DropdownMenuSubContent>
                            <DropdownMenuItem>Archive</DropdownMenuItem>
                            <DropdownMenuItem>
                                A folder with a very long name that truncates
                            </DropdownMenuItem>
                        </DropdownMenuSubContent>
                    </DropdownMenuSub>
                    <DropdownMenuItem destructive icon={<TrashIcon />}>
                        Delete report
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}

const meta = {
    title: 'Components/DropdownMenu',
    component: DropdownMenuContent,
    subcomponents: {
        DropdownMenu,
        DropdownMenuTrigger,
        DropdownMenuItem,
        DropdownMenuCheckboxItem,
        DropdownMenuRadioItem,
        DropdownMenuLabel,
        DropdownMenuSeparator,
        DropdownMenuSubTrigger,
    },
    parameters: {
        layout: 'padded',
        docs: {
            description: {
                component: [
                    'A menu of actions or options opened from a button, on Radix DropdownMenu. No direct x-core component: it replaces the MUI `Menu`/`MenuItem` inside AppBarDropdownV2, ProductsDropdownV2, HelpDropdown and SplitButton (icons, links, selection).',
                    '',
                    'Items: actions (`onSelect`), links (`asChild` with `<a href>`, guarded against Bootstrap link rules), checkbox and radio items, labels, groups, separators, submenus, shortcut text, destructive and disabled items. Keyboard: Enter/Space/ArrowDown open on the first item, arrows (skipping disabled), Home/End, type-ahead, ArrowRight opens a submenu (ArrowLeft in rtl), Escape closes and returns focus.',
                    '',
                    '**Mobile:** a full-width bottom sheet with 44px rows (up to 70% of the screen, scrolls). **Tablet+:** anchored under the trigger (192-320px wide), 36px rows with a fine pointer. Portals into the HorizonProvider root at `--z-dropdown` (1400, above dialogs).',
                ].join('\n'),
            },
        },
    },
    render: () => <ReportMenu />,
} satisfies Meta<typeof DropdownMenuContent>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Click the trigger. */
export const Playground: Story = {};

/** Keyboard walk through the items and the submenu. */
export const Keyboard: Story = {
    play: async ({ canvasElement }) => {
        const trigger = within(canvasElement).getByTestId('trigger');
        trigger.focus();
        await userEvent.keyboard('{Enter}');
        await waitFor(() =>
            expect(
                page.getByRole('menuitem', { name: /Export PDF/ })
            ).toHaveFocus()
        );
        await userEvent.keyboard('m{ArrowRight}');
        await waitFor(() =>
            expect(
                page.getByRole('menuitem', { name: 'Archive' })
            ).toHaveFocus()
        );
        await closeMenus();
        await waitFor(() => expect(trigger).toHaveFocus());
    },
};

/*
 * While a menu is open Radix aria-hides the rest of the page (modal menu,
 * focus inside it); axe then flags the hidden trigger as focusable
 * (aria-hidden-focus). It cannot take focus while the menu is open, so the
 * rule is off for stories rendered open (as for Select).
 */
const openA11y = {
    a11y: {
        config: { rules: [{ id: 'aria-hidden-focus', enabled: false }] },
    },
};

/** Right-to-left: items align right, the submenu caret points left. */
export const RTL: Story = {
    globals: { direction: 'rtl' },
    parameters: openA11y,
    render: () => <ReportMenu open />,
    play: async () => {
        await page.findByRole('menu');
        await closeMenus();
    },
};

/** Open in all three brands (one at a time). */
export const Brands: Story = {
    render: () => (
        <div style={layout.row}>
            {(['cial', 'dnb', 'il'] as const).map((brand) => (
                <HorizonProvider
                    key={brand}
                    brand={brand}
                    style={{ background: 'var(--background)', padding: 16 }}
                >
                    <ReportMenu />
                </HorizonProvider>
            ))}
        </div>
    ),
};

/** Per-breakpoint specification (Responsive Standard). */
export const Responsive: Story = {
    render: () => (
        <ResponsiveSpec
            caption="DropdownMenu responsive specification"
            spec={{
                mobile: {
                    size: 'Rows 44px, 16px text; icons 16px.',
                    density:
                        'Panel padding 4px (plus the bottom safe area); rows 8px 12px.',
                    layout: 'Bottom sheet: full width at the bottom edge, 16px top radius, up to 70% of the viewport height (scrolls); slides up. A submenu is a sheet over it.',
                    contentVisibility:
                        'Long labels truncate; shortcut text kept.',
                    interaction:
                        'Tap an item; tap outside closes; submenus open on tap.',
                },
                tablet: {
                    size: 'Fine pointer: rows 36px, 14px text. Touch (iPad): mobile sizes.',
                    density: 'As mobile.',
                    layout: 'Anchored under the trigger, start-aligned, 192-320px wide; flips when there is no room; submenus beside their item toward the inline end.',
                    contentVisibility: 'As mobile.',
                    interaction:
                        'Hover highlights; keyboard: arrows, Home/End, type-ahead, ArrowRight/Left for submenus (mirrored in rtl), Escape.',
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

const expectedRow = { mobile: 44, tablet: 36, laptop: 36, desktop: 36 };

async function assertMenu(...[canvas, viewport]: [HTMLElement, Viewport]) {
    const trigger = within(canvas).getByTestId('trigger');
    await userEvent.click(trigger);
    const menu = await page.findByRole('menu');
    await settled(menu);
    const r = menu.getBoundingClientRect();
    const wrapper = menu.closest('[data-radix-popper-content-wrapper]');
    if (!wrapper) throw new Error('no wrapper');
    await expect(getComputedStyle(wrapper).zIndex).toBe('1400');
    const item = page.getByRole('menuitem', { name: 'Duplicate' });
    await expect(item.getBoundingClientRect().height).toBe(
        expectedRow[viewport]
    );
    if (viewport === 'mobile') {
        await expect([
            r.left,
            Math.round(r.right),
            Math.round(r.bottom),
        ]).toEqual([0, window.innerWidth, window.innerHeight]);
        await expect(r.height).toBeLessThanOrEqual(window.innerHeight * 0.7);
    } else {
        const t = trigger.getBoundingClientRect();
        await expect(r.top).toBeGreaterThanOrEqual(t.bottom);
        await expect(Math.abs(r.left - t.left)).toBeLessThanOrEqual(1);
        await expect(r.width).toBeGreaterThanOrEqual(192);
        await expect(r.width).toBeLessThanOrEqual(320);
    }
    await closeMenus();
}

export const OpenMobile: Story = {
    ...viewportStory('mobile', () => <ReportMenu />, assertMenu),
    name: 'is a bottom sheet with 44px rows at mobile',
};
export const OpenTablet: Story = {
    ...viewportStory('tablet', () => <ReportMenu />, assertMenu),
    name: 'is anchored with 36px rows at tablet',
};
export const OpenLaptop: Story = {
    ...viewportStory('laptop', () => <ReportMenu />, assertMenu),
    name: 'is anchored with 36px rows at laptop',
};
export const OpenDesktop: Story = {
    ...viewportStory('desktop', () => <ReportMenu />, assertMenu),
    name: 'is anchored with 36px rows at desktop',
};

/** Under rtl the submenu opens toward the inline end (left). */
export const RTLSubmenu: Story = {
    ...viewportStory(
        'laptop',
        () => <ReportMenu />,
        async (canvas) => {
            await userEvent.click(within(canvas).getByTestId('trigger'));
            const sub = await page.findByRole('menuitem', { name: 'Move to' });
            sub.focus();
            await userEvent.keyboard('{ArrowLeft}');
            await page.findByRole('menuitem', { name: 'Archive' });
            const [root, nested] = menus();
            if (!root || !nested) throw new Error('menus');
            await settled(nested);
            await expect(
                nested.getBoundingClientRect().right
            ).toBeLessThanOrEqual(root.getBoundingClientRect().left + 8);
            await closeMenus();
        }
    ),
    globals: {
        viewport: { value: 'laptop', isRotated: false },
        direction: 'rtl',
    },
    name: 'opens submenus to the left under rtl',
};
