import {
    act,
    fireEvent,
    render,
    screen,
    waitFor,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { resetWarnings } from '../../lib/options';
import { HorizonProvider } from '../../provider';
import { resetFallbackPortalRoot } from '../../provider/portal-context';
import { resetToasts } from './Toast';
import { ToastProvider, toast, useToast } from '.';

afterEach(() => {
    act(() => resetToasts());
    resetWarnings();
    resetFallbackPortalRoot();
    vi.useRealTimers();
    vi.restoreAllMocks();
});

function App() {
    return (
        <HorizonProvider>
            <ToastProvider />
        </HorizonProvider>
    );
}

const toasts = () =>
    Array.from(document.querySelectorAll<HTMLElement>('[data-toast]'));
// jsdom runs no animations: a closed toast unmounts at once.
const openToasts = () =>
    toasts().filter((t) => t.getAttribute('data-state') === 'open');

describe('Toast', () => {
    it('toast() shows an Alert-styled toast in a labelled region inside the provider root', async () => {
        render(<App />);
        act(() => {
            toast({
                variant: 'success',
                title: 'Saved',
                description: 'The report was saved.',
                'data-did': 'saved',
            });
        });
        const item = await waitFor(() => {
            const [first] = toasts();
            if (!first) throw new Error('no toast');
            return first;
        });
        expect(item).toHaveTextContent('Saved');
        expect(item).toHaveAttribute('data-variant', 'success');
        expect(item).toHaveAttribute('data-did', 'saved');
        const viewport = document.querySelector('[data-toast-viewport]');
        expect(viewport?.closest('.hz-root')).not.toBeNull();
        expect(viewport?.className).toContain('hz:z-toast');
        expect(
            screen.getByRole('region', { name: /Notifications/ })
        ).toBeInTheDocument();
    });

    it('announces once: one live-region copy (polite, assertive for errors); the toast itself is not live', async () => {
        render(<App />);
        act(() => {
            toast({ description: 'Info message' });
            toast({ variant: 'error', description: 'Failed to save' });
        });
        await waitFor(() => expect(toasts()).toHaveLength(2));
        for (const item of toasts()) {
            expect(item).not.toHaveAttribute('aria-live');
            expect(item).not.toHaveAttribute('role');
        }
        const announced = (text: string) =>
            Array.from(
                document.querySelectorAll(
                    '[aria-live="polite"], [aria-live="assertive"]'
                )
            ).filter((el) => el.textContent?.includes(text));
        // Radix fills the announcement on the next frame.
        await waitFor(() => expect(announced('Info message')).toHaveLength(1));
        const info = announced('Info message');
        const error = announced('Failed to save');
        expect(info[0]).toHaveAttribute('aria-live', 'polite');
        expect(error).toHaveLength(1);
        expect(error[0]).toHaveAttribute('aria-live', 'assertive');
        // The inner Alert does not add a second live region.
        expect(screen.queryByRole('alert')).toBeNull();
    });

    it('auto-dismisses after the duration (x-core autoHideDuration)', async () => {
        render(<App />);
        act(() => {
            toast({ description: 'Short', duration: 50 });
        });
        await waitFor(() => expect(toasts()).toHaveLength(1));
        await waitFor(() => expect(openToasts()).toHaveLength(0));
    });

    it('the timer pauses while the pointer is over the toasts', async () => {
        render(<App />);
        // The duration leaves room for the pointer move under load (a 100ms
        // timer raced it: the toast could close before the hover landed).
        // Radix does not start a toast paused, so hover after it appears.
        act(() => {
            toast({ description: 'Hover me', duration: 1000 });
        });
        await waitFor(() => expect(toasts()).toHaveLength(1));
        const viewport = document.querySelector('[data-toast-viewport]');
        if (!viewport) throw new Error('no viewport');
        fireEvent.pointerMove(viewport);
        // Well past the duration: still open while hovered.
        await act(() => new Promise((r) => setTimeout(r, 1300)));
        expect(toasts()[0]).toHaveAttribute('data-state', 'open');
        // Radix listens on the viewport's wrapper (pointerleave does not bubble).
        fireEvent.pointerLeave(viewport.parentElement ?? viewport);
        await waitFor(() => expect(openToasts()).toHaveLength(0));
    });

    it('dismiss button (named), the returned dismiss() and toast.dismiss() close it', async () => {
        const user = userEvent.setup();
        render(<App />);
        act(() => {
            toast({ description: 'One', dismissLabel: 'Close message' });
        });
        await user.click(
            await screen.findByRole('button', { name: 'Close message' })
        );
        await waitFor(() => expect(openToasts()).toHaveLength(0));
        let handle = { id: '', dismiss: () => {} };
        act(() => {
            handle = toast({ description: 'Two', duration: Infinity });
        });
        act(() => handle.dismiss());
        await waitFor(() => expect(openToasts()).toHaveLength(0));
        act(() => {
            toast({ description: 'Three', duration: Infinity });
            toast.dismiss();
        });
        await waitFor(() => expect(openToasts()).toHaveLength(0));
    });

    it('an action runs and closes the toast', async () => {
        const user = userEvent.setup();
        const onClick = vi.fn();
        render(<App />);
        act(() => {
            toast({
                variant: 'warning',
                description: 'Report outdated',
                action: { label: 'Refresh', onClick },
                duration: Infinity,
            });
        });
        await user.click(
            await screen.findByRole('button', { name: 'Refresh' })
        );
        expect(onClick).toHaveBeenCalledTimes(1);
        await waitFor(() => expect(openToasts()).toHaveLength(0));
    });

    it('stacks several toasts; a repeated id replaces instead of stacking (preventDuplicate)', async () => {
        render(<App />);
        act(() => {
            toast({ description: 'A', duration: Infinity });
            toast({ description: 'B', duration: Infinity });
            toast({ id: 'sync', description: 'Syncing 1', duration: Infinity });
            toast({ id: 'sync', description: 'Syncing 2', duration: Infinity });
        });
        await waitFor(() => expect(toasts()).toHaveLength(3));
        expect(toasts()[2]).toHaveTextContent('Syncing 2');
    });

    it('useToast exposes toast and dismiss to components', async () => {
        const user = userEvent.setup();
        function Save() {
            const { toast: show } = useToast();
            return (
                <button
                    type="button"
                    onClick={() => show({ description: 'From hook' })}
                >
                    Save
                </button>
            );
        }
        render(
            <HorizonProvider>
                <ToastProvider>
                    <Save />
                </ToastProvider>
            </HorizonProvider>
        );
        await user.click(screen.getByRole('button', { name: 'Save' }));
        await waitFor(() => expect(toasts()[0]).toHaveTextContent('From hook'));
    });

    it('Escape on a focused toast closes it only (does not reach the page)', async () => {
        const user = userEvent.setup();
        const outer = vi.fn();
        render(
            // eslint-disable-next-line jsx-a11y/no-static-element-interactions -- test: a host's keydown listener
            <div
                onKeyDown={(e) => {
                    if (e.key === 'Escape') outer();
                }}
            >
                <App />
            </div>
        );
        act(() => {
            toast({ description: 'Focus me', duration: Infinity });
        });
        const dismiss = await screen.findByRole('button', { name: 'Dismiss' });
        dismiss.focus();
        await user.keyboard('{Escape}');
        await waitFor(() => expect(openToasts()).toHaveLength(0));
        expect(outer).not.toHaveBeenCalled();
    });

    it('warns when no provider is mounted; unknown x-core variants fall back to info', async () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        act(() => {
            toast({ description: 'Early' });
        });
        expect(warn).toHaveBeenCalledWith(
            expect.stringContaining('no <ToastProvider> is mounted')
        );
        render(<App />);
        const bad = { variant: 'standard' } as object;
        act(() => {
            toast({ description: 'Bad', ...bad });
        });
        await waitFor(() => expect(toasts()).toHaveLength(2));
        expect(toasts()[1]).toHaveAttribute('data-variant', 'info');
        expect(warn).toHaveBeenCalledWith(
            expect.stringContaining('toast: unknown variant "standard"')
        );
    });
});
