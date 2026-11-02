import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { resetWarnings } from '../../lib/options';
import { HorizonProvider } from '../../provider';
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

afterEach(() => {
    resetWarnings();
    vi.restoreAllMocks();
});

function Actions({
    onSelect = () => {},
    dir,
}: {
    onSelect?: (name: string) => void;
    dir?: 'ltr' | 'rtl';
}) {
    const [compact, setCompact] = useState(false);
    const [sort, setSort] = useState('name');
    return (
        <HorizonProvider {...(dir && { dir })}>
            <DropdownMenu>
                <DropdownMenuTrigger>Actions</DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuGroup aria-labelledby="report-label">
                        <DropdownMenuLabel id="report-label">
                            Report
                        </DropdownMenuLabel>
                        <DropdownMenuItem
                            shortcut="Ctrl+E"
                            onSelect={() => onSelect('export')}
                        >
                            Export
                        </DropdownMenuItem>
                        <DropdownMenuItem disabled>Share</DropdownMenuItem>
                        <DropdownMenuItem asChild>
                            <a href="#history">History</a>
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
                            By name
                        </DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="date">
                            By date
                        </DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                    <DropdownMenuSub>
                        <DropdownMenuSubTrigger>Move to</DropdownMenuSubTrigger>
                        <DropdownMenuSubContent>
                            <DropdownMenuItem>Archive</DropdownMenuItem>
                            <DropdownMenuItem>Trash</DropdownMenuItem>
                        </DropdownMenuSubContent>
                    </DropdownMenuSub>
                    <DropdownMenuItem
                        destructive
                        onSelect={() => onSelect('delete')}
                    >
                        Delete
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </HorizonProvider>
    );
}

describe('DropdownMenu', () => {
    it('trigger opens a menu with items, a labelled group, checkbox and radio items', async () => {
        const user = userEvent.setup();
        render(<Actions />);
        const trigger = screen.getByRole('button', { name: 'Actions' });
        expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
        await user.click(trigger);
        const menu = await screen.findByRole('menu');
        expect(trigger).toHaveAttribute('aria-expanded', 'true');
        expect(menu.closest('.hz-root')).not.toBeNull();
        expect(menu.className).toContain('hz:z-dropdown');
        expect(screen.getByRole('group', { name: 'Report' })).toBeVisible();
        expect(
            screen.getByRole('menuitem', { name: /Export/ })
        ).toHaveTextContent('Ctrl+E');
        expect(screen.getByRole('menuitem', { name: 'Share' })).toHaveAttribute(
            'aria-disabled',
            'true'
        );
        expect(
            screen.getByRole('menuitemcheckbox', { name: 'Compact rows' })
        ).toHaveAttribute('aria-checked', 'false');
        expect(
            screen.getByRole('menuitemradio', { name: 'By name' })
        ).toHaveAttribute('aria-checked', 'true');
        expect(screen.getByRole('separator')).toBeInTheDocument();
        expect(screen.getByRole('menuitem', { name: 'History' }).tagName).toBe(
            'A'
        );
    });

    it('keyboard: Enter opens on the first item, arrows skip disabled, Home/End, type-ahead, Enter selects and returns focus', async () => {
        const user = userEvent.setup();
        const onSelect = vi.fn();
        render(<Actions onSelect={onSelect} />);
        const trigger = screen.getByRole('button', { name: 'Actions' });
        trigger.focus();
        await user.keyboard('{Enter}');
        await waitFor(() =>
            expect(
                screen.getByRole('menuitem', { name: /Export/ })
            ).toHaveFocus()
        );
        await user.keyboard('{ArrowDown}');
        expect(screen.getByRole('menuitem', { name: 'History' })).toHaveFocus();
        await user.keyboard('{End}');
        expect(screen.getByRole('menuitem', { name: 'Delete' })).toHaveFocus();
        await user.keyboard('{Home}');
        expect(screen.getByRole('menuitem', { name: /Export/ })).toHaveFocus();
        await user.keyboard('c');
        expect(
            screen.getByRole('menuitemcheckbox', { name: 'Compact rows' })
        ).toHaveFocus();
        await user.keyboard('{End}{Enter}');
        expect(onSelect).toHaveBeenCalledWith('delete');
        await waitFor(() => expect(screen.queryByRole('menu')).toBeNull());
        expect(trigger).toHaveFocus();
    });

    it('checkbox and radio items toggle; Escape closes and restores focus', async () => {
        const user = userEvent.setup();
        render(<Actions />);
        const trigger = screen.getByRole('button', { name: 'Actions' });
        await user.click(trigger);
        await user.click(
            await screen.findByRole('menuitemcheckbox', {
                name: 'Compact rows',
            })
        );
        await user.click(trigger);
        expect(
            await screen.findByRole('menuitemcheckbox', {
                name: 'Compact rows',
            })
        ).toHaveAttribute('aria-checked', 'true');
        await user.click(
            screen.getByRole('menuitemradio', { name: 'By date' })
        );
        await user.click(trigger);
        expect(
            await screen.findByRole('menuitemradio', { name: 'By date' })
        ).toHaveAttribute('aria-checked', 'true');
        await user.keyboard('{Escape}');
        await waitFor(() => expect(screen.queryByRole('menu')).toBeNull());
        expect(trigger).toHaveFocus();
    });

    it('submenu: ArrowRight opens it in ltr, ArrowLeft in rtl', async () => {
        const user = userEvent.setup();
        const { unmount } = render(<Actions />);
        await user.click(screen.getByRole('button', { name: 'Actions' }));
        await screen.findByRole('menu');
        screen.getByRole('menuitem', { name: 'Move to' }).focus();
        await user.keyboard('{ArrowRight}');
        await waitFor(() =>
            expect(
                screen.getByRole('menuitem', { name: 'Archive' })
            ).toHaveFocus()
        );
        unmount();
        render(<Actions dir="rtl" />);
        await user.click(screen.getByRole('button', { name: 'Actions' }));
        await screen.findByRole('menu');
        screen.getByRole('menuitem', { name: 'Move to' }).focus();
        await user.keyboard('{ArrowRight}');
        expect(screen.queryByRole('menuitem', { name: 'Archive' })).toBeNull();
        await user.keyboard('{ArrowLeft}');
        await waitFor(() =>
            expect(
                screen.getByRole('menuitem', { name: 'Archive' })
            ).toHaveFocus()
        );
    });

    it('destructive item look; ref and data-did; unknown side falls back', async () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const ref = createRef<HTMLDivElement>();
        const bad = { side: 'bottom-end' } as object;
        render(
            <HorizonProvider>
                <DropdownMenu defaultOpen>
                    <DropdownMenuTrigger>Open</DropdownMenuTrigger>
                    <DropdownMenuContent ref={ref} data-did="menu" {...bad}>
                        <DropdownMenuItem destructive>Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </HorizonProvider>
        );
        const menu = await screen.findByRole('menu');
        expect(ref.current).toBe(menu);
        expect(menu).toHaveAttribute('data-did', 'menu');
        expect(menu).toHaveAttribute('data-side', 'bottom');
        expect(
            screen.getByRole('menuitem', { name: 'Delete' }).className
        ).toContain('hz:text-destructive-strong');
        expect(warn).toHaveBeenCalledWith(
            expect.stringContaining('DropdownMenuContent: unknown side')
        );
    });
});
