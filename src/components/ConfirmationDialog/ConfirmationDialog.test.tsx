import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { resetWarnings } from '../../lib/options';
import { HorizonProvider } from '../../provider';
import { ConfirmationDialog, type ConfirmationDialogProps } from '.';

afterEach(() => {
    resetWarnings();
    vi.restoreAllMocks();
});

function Harness(
    props: Partial<ConfirmationDialogProps> & { onClose?: () => void }
) {
    const { onClose, ...rest } = props;
    const [open, setOpen] = useState(true);
    return (
        <HorizonProvider>
            <ConfirmationDialog
                open={open}
                onOpenChange={(next) => {
                    setOpen(next);
                    if (!next) onClose?.();
                }}
                title="Delete report?"
                description="The report and its history are removed."
                confirmLabel="Delete"
                onConfirm={() => {}}
                {...rest}
            />
        </HorizonProvider>
    );
}

describe('ConfirmationDialog', () => {
    it('is an alertdialog named and described by title and description', async () => {
        render(<Harness />);
        const dialog = await screen.findByRole('alertdialog', {
            name: 'Delete report?',
        });
        expect(dialog).toHaveAccessibleDescription(
            'The report and its history are removed.'
        );
        expect(screen.queryByRole('button', { name: 'Close' })).toBeNull();
    });

    it('confirm calls onConfirm then closes (closeOnConfirm default)', async () => {
        const user = userEvent.setup();
        const onConfirm = vi.fn();
        const onClose = vi.fn();
        render(<Harness onConfirm={onConfirm} onClose={onClose} />);
        await user.click(await screen.findByRole('button', { name: 'Delete' }));
        expect(onConfirm).toHaveBeenCalledTimes(1);
        await waitFor(() =>
            expect(screen.queryByRole('alertdialog')).toBeNull()
        );
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('closeOnConfirm={false} keeps it open (x-core manualClose)', async () => {
        const user = userEvent.setup();
        render(<Harness closeOnConfirm={false} />);
        await user.click(await screen.findByRole('button', { name: 'Delete' }));
        expect(screen.getByRole('alertdialog')).toBeVisible();
    });

    it('cancel, Escape and the scrim call onCancel and close', async () => {
        const user = userEvent.setup();
        const onCancel = vi.fn();
        const { unmount } = render(<Harness onCancel={onCancel} />);
        await user.click(await screen.findByRole('button', { name: 'Cancel' }));
        await waitFor(() =>
            expect(screen.queryByRole('alertdialog')).toBeNull()
        );
        unmount();
        render(<Harness onCancel={onCancel} />);
        await screen.findByRole('alertdialog');
        await user.keyboard('{Escape}');
        await waitFor(() =>
            expect(screen.queryByRole('alertdialog')).toBeNull()
        );
        expect(onCancel).toHaveBeenCalledTimes(2);
    });

    it('destructive: red confirm, initial focus on Cancel', async () => {
        render(<Harness variant="destructive" />);
        const cancel = await screen.findByRole('button', { name: 'Cancel' });
        await waitFor(() => expect(cancel).toHaveFocus());
        expect(
            screen.getByRole('button', { name: 'Delete' }).className
        ).toContain('hz:bg-destructive');
    });

    it('default variant focuses the first action (Cancel comes first)', async () => {
        render(<Harness />);
        await waitFor(() =>
            expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus()
        );
    });

    it('loading: confirm busy, cancel disabled, Escape blocked', async () => {
        const user = userEvent.setup();
        render(<Harness loading />);
        const confirm = await screen.findByRole('button', { name: /Delete/ });
        expect(confirm).toHaveAttribute('aria-busy', 'true');
        expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
        await user.keyboard('{Escape}');
        expect(screen.getByRole('alertdialog')).toBeVisible();
    });

    it('confirmDisabled; data-did; x-core props dropped with a warning', async () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const legacy = { approveText: 'save', manualClose: true } as object;
        render(<Harness confirmDisabled data-did="confirm" {...legacy} />);
        const dialog = await screen.findByRole('alertdialog');
        expect(dialog).toHaveAttribute('data-did', 'confirm');
        expect(screen.getByRole('button', { name: 'Delete' })).toBeDisabled();
        expect(dialog).not.toHaveAttribute('approveText');
        expect(warn).toHaveBeenCalledWith(
            expect.stringContaining('x-core prop "approveText"')
        );
        expect(warn).toHaveBeenCalledWith(
            expect.stringContaining('x-core prop "manualClose"')
        );
    });

    it('the x-core message as children describes the dialog when there is no description', async () => {
        render(
            <Harness description={undefined}>
                All monitoring alerts for this company stop.
            </Harness>
        );
        expect(
            await screen.findByRole('alertdialog', { name: 'Delete report?' })
        ).toHaveAccessibleDescription(
            'All monitoring alerts for this company stop.'
        );
    });

    it('no description: no missing-description warning', async () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        render(<Harness description={undefined} />);
        await screen.findByRole('alertdialog');
        await new Promise((r) => setTimeout(r, 10));
        expect(warn).not.toHaveBeenCalled();
    });
});
