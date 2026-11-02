import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { resetWarnings } from '../../lib/options';
import { HorizonProvider } from '../../provider';
import { resetFallbackPortalRoot } from '../../provider/portal-context';
import {
    Popover,
    PopoverAnchor,
    PopoverClose,
    PopoverContent,
    PopoverTrigger,
    type PopoverContentProps,
} from '.';

afterEach(() => {
    resetWarnings();
    resetFallbackPortalRoot();
    vi.restoreAllMocks();
});

function Filters(props: Partial<PopoverContentProps>) {
    return (
        <HorizonProvider>
            <button type="button">Before</button>
            <Popover>
                <PopoverTrigger>Filters</PopoverTrigger>
                <PopoverContent
                    title="Filter companies"
                    footer={<PopoverClose>Apply</PopoverClose>}
                    {...props}
                >
                    <label>
                        Name <input />
                    </label>
                </PopoverContent>
            </Popover>
        </HorizonProvider>
    );
}

const content = () =>
    document.querySelector<HTMLElement>('[data-popover-content]');

describe('Popover', () => {
    it('opens a dialog named by its title, moves focus in, and Escape returns focus', async () => {
        const user = userEvent.setup();
        render(<Filters />);
        const trigger = screen.getByRole('button', { name: 'Filters' });
        expect(trigger).toHaveAttribute('aria-expanded', 'false');
        await user.click(trigger);
        const dialog = await screen.findByRole('dialog', {
            name: 'Filter companies',
        });
        expect(trigger).toHaveAttribute('aria-expanded', 'true');
        expect(trigger.getAttribute('aria-controls')).toBe(dialog.id);
        await waitFor(() =>
            expect(dialog).toContainElement(
                document.activeElement as HTMLElement
            )
        );
        expect(dialog.closest('.hz-root')).not.toBeNull();
        expect(dialog.className).toContain('hz:z-popover');
        await user.keyboard('{Escape}');
        await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
        expect(trigger).toHaveFocus();
    });

    it('closes on an outside click, and from the close button and footer close', async () => {
        const user = userEvent.setup();
        render(<Filters />);
        await user.click(screen.getByRole('button', { name: 'Filters' }));
        await screen.findByRole('dialog');
        await user.click(screen.getByRole('button', { name: 'Before' }));
        await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
        await user.click(screen.getByRole('button', { name: 'Filters' }));
        await user.click(await screen.findByRole('button', { name: 'Close' }));
        await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
        await user.click(screen.getByRole('button', { name: 'Filters' }));
        await user.click(await screen.findByRole('button', { name: 'Apply' }));
        await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    });

    it('hideCloseButton, closeLabel, width and the icon', async () => {
        const user = userEvent.setup();
        render(
            <Filters
                closeLabel="Close filters"
                width={400}
                icon={<svg data-testid="icon" />}
            />
        );
        await user.click(screen.getByRole('button', { name: 'Filters' }));
        await screen.findByRole('button', { name: 'Close filters' });
        expect(content()?.style.getPropertyValue('--hz-popover-width')).toBe(
            '400px'
        );
        expect(screen.getByTestId('icon').parentElement).toHaveAttribute(
            'aria-hidden',
            'true'
        );
    });

    it('without a title it is a plain dialog panel with no close button', async () => {
        const user = userEvent.setup();
        render(
            <HorizonProvider>
                <Popover>
                    <PopoverTrigger>More</PopoverTrigger>
                    <PopoverContent aria-label="More options">
                        Body
                    </PopoverContent>
                </Popover>
            </HorizonProvider>
        );
        await user.click(screen.getByRole('button', { name: 'More' }));
        await screen.findByRole('dialog', { name: 'More options' });
        expect(screen.queryByRole('button', { name: 'Close' })).toBeNull();
    });

    it('defaults to below the trigger, end-aligned (x-core)', async () => {
        render(
            <HorizonProvider>
                <Popover defaultOpen>
                    <PopoverTrigger>A</PopoverTrigger>
                    <PopoverContent aria-label="A">A</PopoverContent>
                </Popover>
            </HorizonProvider>
        );
        await waitFor(() =>
            expect(content()).toHaveAttribute('data-align', 'end')
        );
        expect(content()).toHaveAttribute('data-side', 'bottom');
    });

    it('anchors to PopoverAnchor, forwards ref and data-did, drops x-core props', async () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const ref = createRef<HTMLDivElement>();
        const legacy = { anchorOrigin: { vertical: 'bottom' } } as object;
        const rootLegacy = { anchorEl: null, onClose: () => {} } as object;
        render(
            <HorizonProvider>
                <Popover defaultOpen {...rootLegacy}>
                    <PopoverAnchor data-testid="row">
                        <PopoverTrigger>Open</PopoverTrigger>
                    </PopoverAnchor>
                    <PopoverContent
                        aria-label="Anchored"
                        ref={ref}
                        data-did="pop"
                        {...legacy}
                    >
                        Anchored
                    </PopoverContent>
                </Popover>
            </HorizonProvider>
        );
        await screen.findByRole('dialog', { name: 'Anchored' });
        expect(ref.current).toBe(content());
        expect(ref.current).toHaveAttribute('data-did', 'pop');
        expect(ref.current).not.toHaveAttribute('anchorOrigin');
        for (const name of ['anchorOrigin', 'anchorEl', 'onClose'])
            expect(warn).toHaveBeenCalledWith(
                expect.stringContaining(`x-core prop "${name}"`)
            );
    });

    it('opens outside any HorizonProvider in the styled fallback root', async () => {
        vi.spyOn(console, 'warn').mockImplementation(() => {});
        render(
            <Popover defaultOpen>
                <PopoverTrigger>Alone</PopoverTrigger>
                <PopoverContent aria-label="Alone">Alone</PopoverContent>
            </Popover>
        );
        await screen.findByRole('dialog', { name: 'Alone' });
        expect(content()?.closest('[data-hz-portal-root]')).not.toBeNull();
    });

    it('modal: the rest of the page is hidden from assistive tech while open', async () => {
        render(
            <HorizonProvider>
                <button type="button">Page</button>
                <Popover modal defaultOpen>
                    <PopoverTrigger>Modal</PopoverTrigger>
                    <PopoverContent aria-label="Modal">Modal</PopoverContent>
                </Popover>
            </HorizonProvider>
        );
        await screen.findByRole('dialog', { name: 'Modal' });
        expect(screen.queryByRole('button', { name: 'Page' })).toBeNull();
    });
});
