import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { resetWarnings } from '../../lib/options';
import { HorizonProvider } from '../../provider';
import { resetFallbackPortalRoot } from '../../provider/portal-context';
import { isWatchingForMuiOverlays } from '../../provider/layers';
import {
    Dialog,
    DialogBody,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    type DialogContentProps,
} from '.';

afterEach(() => {
    resetWarnings();
    resetFallbackPortalRoot();
    vi.restoreAllMocks();
});

function Edit(props: Partial<DialogContentProps>) {
    return (
        <HorizonProvider>
            <button type="button">Page</button>
            <Dialog>
                <DialogTrigger>Edit company</DialogTrigger>
                <DialogContent {...props}>
                    <DialogHeader>
                        <DialogTitle>Edit company</DialogTitle>
                        <DialogDescription>
                            Changes apply to every report.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogBody>
                        <label>
                            Name <input defaultValue="Acme" />
                        </label>
                    </DialogBody>
                    <DialogFooter>
                        <DialogClose>Cancel</DialogClose>
                        <button type="button">Save</button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </HorizonProvider>
    );
}

const panel = () =>
    document.querySelector<HTMLElement>('[data-dialog-content]');

describe('Dialog', () => {
    it('is a modal dialog named and described by its title and description', async () => {
        const user = userEvent.setup();
        render(<Edit />);
        await user.click(screen.getByRole('button', { name: 'Edit company' }));
        const dialog = await screen.findByRole('dialog', {
            name: 'Edit company',
        });
        expect(dialog).toHaveAccessibleDescription(
            'Changes apply to every report.'
        );
        expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(
            'Edit company'
        );
        // The page behind is hidden from assistive tech.
        expect(screen.queryByRole('button', { name: 'Page' })).toBeNull();
        expect(dialog.closest('.hz-root')).not.toBeNull();
        expect(dialog.className).toContain('hz:z-dialog');
        expect(
            document.querySelector('[data-dialog-overlay]')?.className
        ).toContain('hz:z-dialog');
    });

    it('focuses the first field, traps Tab inside, restores focus on Escape', async () => {
        const user = userEvent.setup();
        render(<Edit />);
        const trigger = screen.getByRole('button', { name: 'Edit company' });
        await user.click(trigger);
        const dialog = await screen.findByRole('dialog');
        await waitFor(() =>
            expect(screen.getByRole('textbox', { name: 'Name' })).toHaveFocus()
        );
        for (let i = 0; i < 5; i++) {
            await user.tab();
            expect(dialog).toContainElement(
                document.activeElement as HTMLElement
            );
        }
        await user.keyboard('{Escape}');
        await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
        expect(trigger).toHaveFocus();
    });

    it('closes from the close button, a DialogClose and an outside click', async () => {
        const user = userEvent.setup();
        render(<Edit closeLabel="Close dialog" />);
        const open = () =>
            user.click(screen.getByRole('button', { name: 'Edit company' }));
        await open();
        await user.click(
            await screen.findByRole('button', { name: 'Close dialog' })
        );
        await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
        await open();
        await user.click(await screen.findByRole('button', { name: 'Cancel' }));
        await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
        await open();
        await screen.findByRole('dialog');
        const overlay = document.querySelector('[data-dialog-overlay]');
        if (!overlay) throw new Error('no overlay');
        await user.click(overlay);
        await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    });

    it('dismissible={false}: Escape and outside clicks keep it open, no close button', async () => {
        const user = userEvent.setup();
        render(<Edit dismissible={false} />);
        await user.click(screen.getByRole('button', { name: 'Edit company' }));
        await screen.findByRole('dialog');
        expect(screen.queryByRole('button', { name: 'Close' })).toBeNull();
        await user.keyboard('{Escape}');
        const overlay = document.querySelector('[data-dialog-overlay]');
        if (!overlay) throw new Error('no overlay');
        await user.click(overlay);
        expect(screen.getByRole('dialog')).toBeVisible();
        await user.click(screen.getByRole('button', { name: 'Cancel' }));
        await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    });

    it('Escape does not reach handlers outside the dialog (an enclosing MUI Dialog)', async () => {
        const user = userEvent.setup();
        const outer = vi.fn();
        render(
            // eslint-disable-next-line jsx-a11y/no-static-element-interactions -- test: a host's keydown listener
            <div
                onKeyDown={(e) => {
                    if (e.key === 'Escape') outer();
                }}
            >
                <Edit />
            </div>
        );
        await user.click(screen.getByRole('button', { name: 'Edit company' }));
        await screen.findByRole('dialog');
        await user.keyboard('{Escape}');
        await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
        expect(outer).not.toHaveBeenCalled();
    });

    it('controlled without a DialogTrigger: focus returns to the element that opened it', async () => {
        const user = userEvent.setup();
        function Opener() {
            const [open, setOpen] = useState(false);
            return (
                <HorizonProvider>
                    <button type="button" onClick={() => setOpen(true)}>
                        Open
                    </button>
                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogContent aria-describedby={undefined}>
                            <DialogTitle>No trigger</DialogTitle>
                        </DialogContent>
                    </Dialog>
                </HorizonProvider>
            );
        }
        render(<Opener />);
        const opener = screen.getByRole('button', { name: 'Open' });
        await user.click(opener);
        await screen.findByRole('dialog');
        await user.keyboard('{Escape}');
        await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
        expect(opener).toHaveFocus();
    });

    it('keepMounted: typed text in an uncontrolled field survives close and reopen', async () => {
        const user = userEvent.setup();
        const { unmount } = render(<Edit keepMounted />);
        const trigger = screen.getByRole('button', { name: 'Edit company' });
        await user.click(trigger);
        const field = await screen.findByRole('textbox', { name: 'Name' });
        await user.clear(field);
        await user.type(field, 'Globex');
        await user.keyboard('{Escape}');
        await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
        // Closed: not in the document (nothing hidden stays focusable), and
        // the page is no longer aria-hidden.
        expect(screen.queryByRole('textbox')).toBeNull();
        expect(screen.getByRole('button', { name: 'Page' })).toBeVisible();
        await user.click(trigger);
        expect(
            await screen.findByRole('textbox', { name: 'Name' })
        ).toHaveValue('Globex');
        // Without keepMounted the state is lost.
        unmount();
        render(<Edit />);
        await user.click(screen.getByRole('button', { name: 'Edit company' }));
        const fresh = await screen.findByRole('textbox', { name: 'Name' });
        await user.clear(fresh);
        await user.type(fresh, 'Initech');
        await user.keyboard('{Escape}');
        await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
        await user.click(screen.getByRole('button', { name: 'Edit company' }));
        expect(
            await screen.findByRole('textbox', { name: 'Name' })
        ).toHaveValue('Acme');
    });

    it('keepMounted keeps the name, description and first-field focus', async () => {
        const user = userEvent.setup();
        render(<Edit keepMounted />);
        await user.click(screen.getByRole('button', { name: 'Edit company' }));
        const dialog = await screen.findByRole('dialog', {
            name: 'Edit company',
        });
        expect(dialog).toHaveAccessibleDescription(
            'Changes apply to every report.'
        );
        await waitFor(() =>
            expect(screen.getByRole('textbox', { name: 'Name' })).toHaveFocus()
        );
    });

    it('controlled: onOpenChange receives false on close', async () => {
        const user = userEvent.setup();
        const changes: boolean[] = [];
        function Controlled() {
            const [open, setOpen] = useState(true);
            return (
                <HorizonProvider>
                    <Dialog
                        open={open}
                        onOpenChange={(next) => {
                            changes.push(next);
                            setOpen(next);
                        }}
                    >
                        <DialogContent aria-describedby={undefined}>
                            <DialogTitle>Controlled</DialogTitle>
                        </DialogContent>
                    </Dialog>
                </HorizonProvider>
            );
        }
        render(<Controlled />);
        await screen.findByRole('dialog');
        await user.keyboard('{Escape}');
        await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
        expect(changes).toEqual([false]);
    });

    it('warns once in development when the name or description is missing', async () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        render(
            <HorizonProvider>
                <Dialog defaultOpen>
                    <DialogContent>Untitled</DialogContent>
                </Dialog>
            </HorizonProvider>
        );
        await screen.findByRole('dialog');
        await waitFor(() =>
            expect(warn).toHaveBeenCalledWith(
                expect.stringContaining('DialogContent: no accessible name')
            )
        );
        expect(warn).toHaveBeenCalledWith(
            expect.stringContaining('DialogContent: no description')
        );
    });

    it('does not warn with a title, or a description opt-out', async () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        render(
            <HorizonProvider>
                <Dialog defaultOpen>
                    <DialogContent aria-describedby={undefined}>
                        <DialogTitle>Titled</DialogTitle>
                    </DialogContent>
                </Dialog>
            </HorizonProvider>
        );
        await screen.findByRole('dialog', { name: 'Titled' });
        expect(warn).not.toHaveBeenCalled();
    });

    it('sizes, ref, data-did; unknown x-core values fall back with a warning', async () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const ref = createRef<HTMLDivElement>();
        const legacy = { size: 'tablet' } as object;
        const rootLegacy = { onClose: () => {}, maxWidth: 'md' } as object;
        render(
            <HorizonProvider>
                <Dialog defaultOpen {...rootLegacy}>
                    <DialogContent
                        ref={ref}
                        data-did="edit"
                        aria-describedby={undefined}
                        {...legacy}
                    >
                        <DialogTitle>Sized</DialogTitle>
                    </DialogContent>
                </Dialog>
            </HorizonProvider>
        );
        await screen.findByRole('dialog');
        expect(ref.current).toBe(panel());
        expect(ref.current).toHaveAttribute('data-did', 'edit');
        expect(ref.current).toHaveAttribute('data-size', 'md');
        expect(ref.current?.className).toContain('hz:tablet:max-w-[600px]');
        expect(warn).toHaveBeenCalledWith(
            expect.stringContaining('DialogContent: unknown size "tablet"')
        );
        expect(warn).toHaveBeenCalledWith(
            expect.stringContaining('Dialog: x-core prop "onClose"')
        );
        expect(warn).toHaveBeenCalledWith(
            expect.stringContaining('Dialog: x-core prop "maxWidth"')
        );
    });

    it('opens outside any HorizonProvider in the styled fallback root', async () => {
        vi.spyOn(console, 'warn').mockImplementation(() => {});
        render(
            <Dialog defaultOpen>
                <DialogContent aria-describedby={undefined}>
                    <DialogTitle>Alone</DialogTitle>
                </DialogContent>
            </Dialog>
        );
        await screen.findByRole('dialog', { name: 'Alone' });
        expect(panel()?.closest('[data-hz-portal-root]')).not.toBeNull();
    });

    it('dev: warns once when an MUI overlay mounts while it is open; watches nothing when closed', async () => {
        const user = userEvent.setup();
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        render(<Edit />);
        expect(isWatchingForMuiOverlays()).toBe(false);
        await user.click(screen.getByRole('button', { name: 'Edit company' }));
        await screen.findByRole('dialog');
        expect(isWatchingForMuiOverlays()).toBe(true);
        const mui = document.createElement('div');
        mui.className = 'MuiModal-root MuiDialog-root';
        document.body.append(mui);
        await waitFor(() =>
            expect(warn).toHaveBeenCalledWith(
                expect.stringContaining('An MUI overlay')
            )
        );
        mui.remove();
        await user.keyboard('{Escape}');
        await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
        expect(isWatchingForMuiOverlays()).toBe(false);
    });

    it('dev: no warning for an MUI overlay rendered inside the Horizon panel (container/disablePortal)', async () => {
        const user = userEvent.setup();
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        render(<Edit />);
        await user.click(screen.getByRole('button', { name: 'Edit company' }));
        const dialog = await screen.findByRole('dialog');
        const inside = document.createElement('div');
        inside.className = 'MuiPopover-root';
        dialog.append(inside);
        await new Promise((r) => setTimeout(r, 20));
        expect(warn).not.toHaveBeenCalledWith(
            expect.stringContaining('An MUI overlay')
        );
        inside.remove();
    });
});
