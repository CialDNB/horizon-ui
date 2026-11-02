import type { ConfirmationDialogProps } from '.';

export const full: ConfirmationDialogProps = {
    open: true,
    onOpenChange: (open: boolean) => open,
    title: 'Delete?',
    description: 'Gone for good.',
    confirmLabel: 'Delete',
    cancelLabel: 'Keep',
    onConfirm: () => undefined,
    onCancel: () => undefined,
    variant: 'destructive',
    loading: false,
    confirmDisabled: false,
    closeOnConfirm: false,
    size: 'md',
    'data-did': 'delete',
};

// @ts-expect-error title, open, onOpenChange and onConfirm are required
export const missing: ConfirmationDialogProps = { title: 'Delete?' };

export const legacy: ConfirmationDialogProps = {
    ...full,
    // @ts-expect-error x-core onSubmit becomes onConfirm
    onSubmit: () => undefined,
};
