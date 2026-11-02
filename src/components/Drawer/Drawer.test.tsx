import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { resetWarnings } from '../../lib/options';
import { HorizonProvider } from '../../provider';
import { Drawer, type DrawerProps } from '.';

afterEach(() => {
    resetWarnings();
    vi.restoreAllMocks();
});

function Details(props: Partial<DrawerProps>) {
    const [open, setOpen] = useState(false);
    return (
        <HorizonProvider>
            <button type="button" onClick={() => setOpen(true)}>
                Details
            </button>
            <Drawer
                open={open}
                onOpenChange={setOpen}
                title="Company details"
                content={
                    <label>
                        Notes <input />
                    </label>
                }
                actions={
                    <button type="button" onClick={() => setOpen(false)}>
                        Done
                    </button>
                }
                {...props}
            />
        </HorizonProvider>
    );
}

const panel = () =>
    document.querySelector<HTMLElement>('[data-drawer-content]');

describe('Drawer', () => {
    it('is a modal dialog named by its title; focus moves in and returns to the opener', async () => {
        const user = userEvent.setup();
        render(<Details />);
        const opener = screen.getByRole('button', { name: 'Details' });
        await user.click(opener);
        const dialog = await screen.findByRole('dialog', {
            name: 'Company details',
        });
        expect(dialog.closest('.hz-root')).not.toBeNull();
        expect(dialog.className).toContain('hz:z-dialog');
        await waitFor(() =>
            expect(dialog).toContainElement(
                document.activeElement as HTMLElement
            )
        );
        for (let i = 0; i < 4; i++) {
            await user.tab();
            expect(dialog).toContainElement(
                document.activeElement as HTMLElement
            );
        }
        await user.keyboard('{Escape}');
        await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
        expect(opener).toHaveFocus();
    });

    it('closes from the close button, the scrim and its own actions', async () => {
        const user = userEvent.setup();
        render(<Details closeLabel="Close details" />);
        const open = () =>
            user.click(screen.getByRole('button', { name: 'Details' }));
        await open();
        await user.click(
            await screen.findByRole('button', { name: 'Close details' })
        );
        await waitFor(() => expect(panel()).toBeNull());
        await open();
        await screen.findByRole('dialog');
        const scrim = document.querySelector('[data-drawer-overlay]');
        if (!scrim) throw new Error('no scrim');
        await user.click(scrim);
        await waitFor(() => expect(panel()).toBeNull());
        await open();
        await user.click(await screen.findByRole('button', { name: 'Done' }));
        await waitFor(() => expect(panel()).toBeNull());
    });

    it('side and width: logical side and the width variable', async () => {
        const user = userEvent.setup();
        render(<Details side="start" width="90%" />);
        await user.click(screen.getByRole('button', { name: 'Details' }));
        await screen.findByRole('dialog');
        expect(panel()).toHaveAttribute('data-side', 'start');
        expect(panel()?.style.getPropertyValue('--hz-drawer-width')).toBe(
            '90%'
        );
        expect(panel()?.className).toContain('hz:tablet:start-0');
    });

    it('without keepMounted the content state is lost on close', async () => {
        const user = userEvent.setup();
        render(<Details />);
        await user.click(screen.getByRole('button', { name: 'Details' }));
        await user.type(await screen.findByRole('textbox'), 'acme');
        await user.keyboard('{Escape}');
        await waitFor(() => expect(panel()).toBeNull());
        await user.click(screen.getByRole('button', { name: 'Details' }));
        expect(await screen.findByRole('textbox')).toHaveValue('');
    });

    it('keepMounted keeps the content (and its state) while closed', async () => {
        const user = userEvent.setup();
        function Counter() {
            const [n, setN] = useState(0);
            return (
                <button type="button" onClick={() => setN(n + 1)}>
                    Count {n}
                </button>
            );
        }
        render(<Details keepMounted content={<Counter />} />);
        await user.click(screen.getByRole('button', { name: 'Details' }));
        await user.click(
            await screen.findByRole('button', { name: 'Count 0' })
        );
        await user.keyboard('{Escape}');
        await waitFor(() => expect(panel()).toBeNull());
        // Not in the document while closed (no hidden focusable content).
        expect(screen.queryByRole('button', { name: /Count/ })).toBeNull();
        await user.click(screen.getByRole('button', { name: 'Details' }));
        expect(
            await screen.findByRole('button', { name: 'Count 1' })
        ).toBeVisible();
    });

    it('forwards ref and data-did; x-core props are dropped with a warning', async () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const ref = createRef<HTMLDivElement>();
        const legacy = { isOpen: true, direction: 'ltr' } as object;
        render(
            <HorizonProvider>
                <Drawer
                    open
                    onOpenChange={() => {}}
                    title="Ref"
                    content="Body"
                    ref={ref}
                    data-did="drawer"
                    {...legacy}
                />
            </HorizonProvider>
        );
        await screen.findByRole('dialog', { name: 'Ref' });
        expect(ref.current).toBe(panel());
        expect(ref.current).toHaveAttribute('data-did', 'drawer');
        expect(ref.current).not.toHaveAttribute('direction');
        expect(warn).toHaveBeenCalledWith(
            expect.stringContaining('Drawer: x-core prop "isOpen"')
        );
        expect(warn).toHaveBeenCalledWith(
            expect.stringContaining('Drawer: x-core prop "direction"')
        );
    });

    it('unknown side falls back to end with a warning', async () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const bad = { side: 'right' } as object;
        render(
            <HorizonProvider>
                <Drawer
                    open
                    onOpenChange={() => {}}
                    title="Side"
                    content="Body"
                    {...bad}
                />
            </HorizonProvider>
        );
        await screen.findByRole('dialog');
        expect(panel()).toHaveAttribute('data-side', 'end');
        expect(warn).toHaveBeenCalledWith(
            expect.stringContaining('Drawer: unknown side "right"')
        );
    });
});
