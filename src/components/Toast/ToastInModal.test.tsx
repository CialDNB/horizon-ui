import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { resetWarnings } from '../../lib/options';
import { HorizonProvider } from '../../provider';
import { resetToasts } from './Toast';
import { Dialog, DialogContent, DialogTitle } from '../Dialog';
import { Drawer } from '../Drawer';
import { Popover, PopoverContent, PopoverTrigger } from '../Popover';
import { ToastProvider, toast } from '.';

afterEach(() => {
    act(() => resetToasts());
    resetWarnings();
    vi.restoreAllMocks();
});

const viewport = () => document.querySelector('[data-toast-viewport]');

function showActionToast(onClick = () => {}) {
    act(() => {
        toast({
            description: 'Request sent',
            action: { label: 'Cancel request', onClick },
            duration: Infinity,
        });
    });
}

describe('Toasts while a modal is open', () => {
    it('Horizon Dialog: the list moves into the dialog, its action is reachable and pressing it keeps the dialog open', async () => {
        const user = userEvent.setup();
        const onClick = vi.fn();
        render(
            <HorizonProvider>
                <ToastProvider />
                <Dialog defaultOpen>
                    <DialogContent aria-describedby={undefined}>
                        <DialogTitle>Segment</DialogTitle>
                    </DialogContent>
                </Dialog>
            </HorizonProvider>
        );
        const dialog = await screen.findByRole('dialog', { name: 'Segment' });
        showActionToast(onClick);
        // Role queries skip aria-hidden content: the action is exposed.
        const action = await screen.findByRole('button', {
            name: 'Cancel request',
        });
        expect(dialog).toContainElement(viewport() as HTMLElement);
        // Keyboard: the action is inside the focus trap.
        action.focus();
        expect(action).toHaveFocus();
        await user.click(action);
        expect(onClick).toHaveBeenCalledTimes(1);
        expect(screen.getByRole('dialog', { name: 'Segment' })).toBeVisible();
    });

    it('Escape on a focused toast inside a Horizon Dialog closes the toast, not the dialog', async () => {
        const user = userEvent.setup();
        render(
            <HorizonProvider>
                <ToastProvider />
                <Dialog defaultOpen>
                    <DialogContent aria-describedby={undefined}>
                        <DialogTitle>Segment</DialogTitle>
                    </DialogContent>
                </Dialog>
            </HorizonProvider>
        );
        await screen.findByRole('dialog', { name: 'Segment' });
        showActionToast();
        (await screen.findByRole('button', { name: 'Dismiss' })).focus();
        await user.keyboard('{Escape}');
        await waitFor(() =>
            expect(
                screen.queryByRole('button', { name: 'Cancel request' })
            ).toBeNull()
        );
        expect(screen.getByRole('dialog', { name: 'Segment' })).toBeVisible();
    });

    it('the list returns to the provider root when the dialog closes', async () => {
        const user = userEvent.setup();
        render(
            <HorizonProvider data-testid="app">
                <ToastProvider />
                <Dialog defaultOpen>
                    <DialogContent aria-describedby={undefined}>
                        <DialogTitle>Closing</DialogTitle>
                    </DialogContent>
                </Dialog>
            </HorizonProvider>
        );
        await screen.findByRole('dialog');
        await user.keyboard('{Escape}');
        await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
        expect(viewport()?.closest('.hz-root')).toBe(screen.getByTestId('app'));
    });

    it('Horizon Drawer: toast dismiss is reachable and does not close the drawer', async () => {
        const user = userEvent.setup();
        render(
            <HorizonProvider>
                <ToastProvider />
                <Drawer
                    open
                    onOpenChange={() => {}}
                    title="Tags"
                    content="Body"
                />
            </HorizonProvider>
        );
        const drawer = await screen.findByRole('dialog', { name: 'Tags' });
        showActionToast();
        await user.click(
            await screen.findByRole('button', { name: 'Dismiss' })
        );
        expect(drawer).toBeVisible();
    });

    it('an open Popover stays open when a toast in the page root is pressed', async () => {
        const user = userEvent.setup();
        render(
            <HorizonProvider>
                <ToastProvider />
                <Popover defaultOpen>
                    <PopoverTrigger>Filters</PopoverTrigger>
                    <PopoverContent aria-label="Filters">Body</PopoverContent>
                </Popover>
            </HorizonProvider>
        );
        await screen.findByRole('dialog', { name: 'Filters' });
        showActionToast();
        await user.click(
            await screen.findByRole('button', { name: 'Dismiss' })
        );
        expect(screen.getByRole('dialog', { name: 'Filters' })).toBeVisible();
    });

    it('a nested HorizonProvider inside a host dialog hosts the list', async () => {
        render(
            <HorizonProvider>
                <ToastProvider />
                <div role="dialog" aria-label="Host dialog">
                    <HorizonProvider data-testid="inner">
                        {null}
                    </HorizonProvider>
                </div>
            </HorizonProvider>
        );
        showActionToast();
        await screen.findByRole('button', { name: 'Cancel request' });
        expect(viewport()?.closest('.hz-root')).toBe(
            screen.getByTestId('inner')
        );
    });

    it('warns when two ToastProviders are mounted', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        render(
            <HorizonProvider>
                <ToastProvider />
                <ToastProvider />
            </HorizonProvider>
        );
        expect(warn).toHaveBeenCalledWith(
            expect.stringContaining('More than one <ToastProvider>')
        );
    });
});

describe('Toast layers follow host dialog visibility (closed keepMounted MUI Dialog)', () => {
    function App() {
        return (
            <HorizonProvider data-testid="app">
                <ToastProvider />
                {/* A keepMounted MUI Dialog while closed: still in the DOM,
                    hidden (MUI: aria-hidden + .MuiModal-hidden). */}
                <div
                    className="MuiModal-root MuiModal-hidden"
                    aria-hidden="true"
                    data-testid="mui-root"
                >
                    <div role="dialog" aria-label="Filters">
                        <HorizonProvider data-testid="inner">
                            {null}
                        </HorizonProvider>
                    </div>
                </div>
            </HorizonProvider>
        );
    }
    const hostOf = () => viewport()?.closest('.hz-root');

    it('closed: toasts stay in the app root, visible and reachable', async () => {
        render(<App />);
        showActionToast();
        expect(
            await screen.findByRole('button', { name: 'Cancel request' })
        ).toBeVisible();
        expect(hostOf()).toBe(screen.getByTestId('app'));
    });

    it('opening moves the list into the dialog without losing the toast; closing moves it back', async () => {
        render(<App />);
        showActionToast();
        await screen.findByRole('button', { name: 'Cancel request' });
        const muiRoot = screen.getByTestId('mui-root');
        act(() => {
            muiRoot.classList.remove('MuiModal-hidden');
            muiRoot.removeAttribute('aria-hidden');
        });
        await waitFor(() => expect(hostOf()).toBe(screen.getByTestId('inner')));
        // The toast re-portals into the moved list on the next render.
        expect(
            await screen.findByRole('button', { name: 'Cancel request' })
        ).toBeVisible();
        act(() => {
            muiRoot.classList.add('MuiModal-hidden');
            muiRoot.setAttribute('aria-hidden', 'true');
        });
        await waitFor(() => expect(hostOf()).toBe(screen.getByTestId('app')));
        expect(
            await screen.findByRole('button', { name: 'Cancel request' })
        ).toBeVisible();
    });

    it('disconnects the host observer when the inner provider unmounts', () => {
        const disconnect = vi.spyOn(MutationObserver.prototype, 'disconnect');
        const { unmount } = render(<App />);
        expect(disconnect).not.toHaveBeenCalled();
        unmount();
        expect(disconnect).toHaveBeenCalled();
    });
});
