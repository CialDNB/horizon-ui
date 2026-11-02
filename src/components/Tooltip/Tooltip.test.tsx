import {
    act,
    fireEvent,
    render,
    screen,
    waitFor,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { resetWarnings } from '../../lib/options';
import { physicalPlacement } from '../../primitives';
import { HorizonProvider } from '../../provider';
import { resetFallbackPortalRoot } from '../../provider/portal-context';
import { Tooltip, TooltipProvider } from '.';

afterEach(() => {
    resetWarnings();
    resetFallbackPortalRoot();
    vi.restoreAllMocks();
});

const visibleTooltip = () =>
    document.querySelector<HTMLElement>('[data-tooltip-content]');

describe('Tooltip', () => {
    it('opens on keyboard focus, is linked by aria-describedby and closes on Escape', async () => {
        const user = userEvent.setup();
        render(
            <HorizonProvider>
                <Tooltip content="Edit company">
                    <button type="button">Edit</button>
                </Tooltip>
            </HorizonProvider>
        );
        await user.tab();
        const trigger = screen.getByRole('button', { name: 'Edit' });
        expect(trigger).toHaveFocus();
        const tooltip = await screen.findByRole('tooltip');
        expect(tooltip).toHaveTextContent('Edit company');
        expect(trigger).toHaveAccessibleDescription('Edit company');
        expect(trigger.getAttribute('aria-describedby')).toBe(tooltip.id);
        await user.keyboard('{Escape}');
        await waitFor(() => expect(screen.queryByRole('tooltip')).toBeNull());
        expect(trigger).toHaveFocus();
    });

    it('opens on mouse hover after the delay, in the provider root above MUI dialogs', async () => {
        const user = userEvent.setup();
        render(
            <HorizonProvider>
                <Tooltip content="Export" delayDuration={0}>
                    <button type="button">Export</button>
                </Tooltip>
            </HorizonProvider>
        );
        await user.hover(screen.getByRole('button'));
        await screen.findByRole('tooltip');
        const content = visibleTooltip();
        expect(content?.closest('.hz-root')).not.toBeNull();
        expect(content?.className).toContain('hz:z-tooltip');
    });

    it('never opens from touch input', async () => {
        render(
            <HorizonProvider>
                <Tooltip content="Touch" delayDuration={0}>
                    <button type="button">Touch</button>
                </Tooltip>
            </HorizonProvider>
        );
        const trigger = screen.getByRole('button');
        fireEvent.pointerMove(trigger, { pointerType: 'touch' });
        fireEvent.pointerDown(trigger, { pointerType: 'touch' });
        await act(() => new Promise((r) => setTimeout(r, 20)));
        expect(screen.queryByRole('tooltip')).toBeNull();
    });

    it('works without a TooltipProvider or HorizonProvider (fallback root, one warning)', async () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        render(
            <Tooltip content="Alone" defaultOpen>
                <button type="button">Alone</button>
            </Tooltip>
        );
        const tooltip = await screen.findByRole('tooltip');
        expect(tooltip).toHaveTextContent('Alone');
        expect(
            visibleTooltip()?.closest('[data-hz-portal-root]')
        ).not.toBeNull();
        expect(warn).toHaveBeenCalledTimes(1);
    });

    it('shares delays under a TooltipProvider', async () => {
        const user = userEvent.setup();
        render(
            <HorizonProvider>
                <TooltipProvider delayDuration={0}>
                    <Tooltip content="First">
                        <button type="button">A</button>
                    </Tooltip>
                </TooltipProvider>
            </HorizonProvider>
        );
        await user.hover(screen.getByRole('button'));
        expect(await screen.findByRole('tooltip')).toHaveTextContent('First');
    });

    it('disabled renders only the trigger', () => {
        render(
            <HorizonProvider>
                <Tooltip content="Hidden" disabled defaultOpen>
                    <button type="button">Plain</button>
                </Tooltip>
            </HorizonProvider>
        );
        expect(screen.queryByRole('tooltip')).toBeNull();
        expect(screen.getByRole('button')).not.toHaveAttribute('data-state');
    });

    it('forwards the ref and data-did to the content, and drops x-core props with a warning', async () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const ref = createRef<HTMLDivElement>();
        const legacy = { title: 'x', placement: 'bottom' } as object;
        render(
            <HorizonProvider>
                <Tooltip
                    content="Ref"
                    defaultOpen
                    ref={ref}
                    data-did="tip"
                    {...legacy}
                >
                    <button type="button">Ref</button>
                </Tooltip>
            </HorizonProvider>
        );
        await screen.findByRole('tooltip');
        expect(ref.current).toBe(visibleTooltip());
        expect(ref.current).toHaveAttribute('data-did', 'tip');
        expect(ref.current).not.toHaveAttribute('title');
        expect(warn).toHaveBeenCalledWith(
            expect.stringContaining('Tooltip: x-core prop "title"')
        );
        expect(warn).toHaveBeenCalledWith(
            expect.stringContaining('Tooltip: x-core prop "placement"')
        );
    });

    it('falls back to bottom/center (x-core default) for unknown side values', async () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const bad = { side: 'bottom-end' } as object;
        render(
            <HorizonProvider>
                <Tooltip content="Fallback" defaultOpen {...bad}>
                    <button type="button">F</button>
                </Tooltip>
            </HorizonProvider>
        );
        await screen.findByRole('tooltip');
        expect(visibleTooltip()).toHaveAttribute('data-side', 'bottom');
        expect(warn).toHaveBeenCalledWith(
            expect.stringContaining('Tooltip: unknown side "bottom-end"')
        );
    });

    it('end side is right in ltr and left in rtl', async () => {
        render(
            <HorizonProvider dir="rtl">
                <Tooltip content="RTL" side="end" defaultOpen>
                    <button type="button">R</button>
                </Tooltip>
            </HorizonProvider>
        );
        await screen.findByRole('tooltip');
        await waitFor(() =>
            expect(visibleTooltip()).toHaveAttribute('data-side', 'left')
        );
    });
});

describe('Tooltip shared timing (HorizonProvider)', () => {
    it('defaults to below the trigger (x-core placement bottom)', async () => {
        render(
            <HorizonProvider>
                <Tooltip content="Below" defaultOpen>
                    <button type="button">B</button>
                </Tooltip>
            </HorizonProvider>
        );
        await screen.findByRole('tooltip');
        expect(visibleTooltip()).toHaveAttribute('data-side', 'bottom');
    });

    it('the second of two adjacent tooltips opens at once within the skip window', async () => {
        vi.useFakeTimers({ shouldAdvanceTime: true });
        const user = userEvent.setup({
            advanceTimers: vi.advanceTimersByTime.bind(vi),
        });
        render(
            <HorizonProvider>
                <Tooltip content="First">
                    <button type="button">One</button>
                </Tooltip>
                <Tooltip content="Second">
                    <button type="button">Two</button>
                </Tooltip>
            </HorizonProvider>
        );
        await user.hover(screen.getByRole('button', { name: 'One' }));
        expect(screen.queryByRole('tooltip')).toBeNull();
        await act(() => vi.advanceTimersByTimeAsync(350));
        expect(await screen.findByRole('tooltip')).toHaveTextContent('First');
        await user.unhover(screen.getByRole('button', { name: 'One' }));
        const two = screen.getByRole('button', { name: 'Two' });
        // Leave the first tooltip's grace area, then move over the second.
        fireEvent.pointerMove(document.body, { clientX: 900, clientY: 900 });
        await act(() => vi.advanceTimersByTimeAsync(50));
        fireEvent.pointerMove(two, { pointerType: 'mouse' });
        // No 300ms wait: the provider is in its skip-delay window.
        await act(() => vi.advanceTimersByTimeAsync(10));
        expect(
            screen.getAllByRole('tooltip').map((t) => t.textContent)
        ).toContain('Second');
        vi.useRealTimers();
    });
});

describe('Tooltip labelOnly', () => {
    it('shows the name without describing the trigger with it again', async () => {
        const user = userEvent.setup();
        render(
            <HorizonProvider>
                <Tooltip content="Edit" labelOnly>
                    <button type="button" aria-label="Edit">
                        E
                    </button>
                </Tooltip>
            </HorizonProvider>
        );
        await user.tab();
        await screen.findByRole('tooltip');
        expect(
            screen.getByRole('button', { name: 'Edit' })
        ).not.toHaveAttribute('aria-describedby');
    });
});

describe('physicalPlacement', () => {
    it('maps logical sides and alignments per direction', () => {
        expect(physicalPlacement('end', 'center', 'ltr').side).toBe('right');
        expect(physicalPlacement('end', 'center', 'rtl').side).toBe('left');
        expect(physicalPlacement('start', 'start', 'ltr').side).toBe('left');
        expect(physicalPlacement('start', 'start', 'rtl').side).toBe('right');
        expect(physicalPlacement('bottom', 'start', 'ltr')).toEqual({
            side: 'bottom',
            align: 'start',
        });
        // floating-ui mirrors alignment itself under rtl: passed through.
        expect(physicalPlacement('bottom', 'start', 'rtl')).toEqual({
            side: 'bottom',
            align: 'start',
        });
        expect(physicalPlacement('top', 'center', 'rtl').align).toBe('center');
    });
});
