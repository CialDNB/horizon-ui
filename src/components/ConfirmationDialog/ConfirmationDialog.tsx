/*
 * No shadcn base (shadcn's AlertDialog is a separate Radix package): a
 * preset composition of Dialog with `role="alertdialog"`. Replaces x-core
 * `ConfirmationDialog` (MUI Dialog with approve/cancel Buttons, x-core
 * 2.2.30).
 */
import { forwardRef, type MouseEvent, type ReactNode } from 'react';
import { omitLegacyProps, resolveOption } from '../../lib/options';
import type { DnbBase } from '../../types/DnbBase';
import { Button } from '../Button';
import {
    Dialog,
    DialogBody,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    type DialogSize,
} from '../Dialog';

/** Tone of a {@link ConfirmationDialog}'s confirm action. */
export type ConfirmationDialogVariant = 'default' | 'destructive';

const variants: readonly ConfirmationDialogVariant[] = [
    'default',
    'destructive',
];

/** x-core ConfirmationDialog props that are dropped (dev warning). */
const legacyConfirmationProps = {
    onClose: 'use onOpenChange(false) / onCancel',
    onSubmit: 'use onConfirm',
    approveText: 'use confirmLabel',
    cancelText: 'use cancelLabel',
    color: 'use variant="destructive" for destructive actions',
    submitColor: 'use variant',
    cancelColor: 'not supported',
    submitVariant: 'not supported',
    cancelVariant: 'not supported',
    submitLoading: 'use loading',
    submitDisabled: 'use confirmDisabled',
    cancelLoading: 'not supported',
    cancelDisabled: 'loading disables cancel',
    manualClose: 'use closeOnConfirm={false}',
    maxWidth: 'use size',
    fullScreen: 'full screen at mobile by default',
    sx: 'use className',
} as const;

/** Props for {@link ConfirmationDialog}. */
export type ConfirmationDialogProps = DnbBase & {
    /** Open state (controlled). */
    open: boolean;
    /** Called with `false` when it should close (cancel, Escape, scrim, after confirm). */
    onOpenChange: (open: boolean) => void;
    /** The question or action being confirmed; names the dialog. */
    title: ReactNode;
    /** Supporting text; describes the dialog. */
    description?: ReactNode;
    /** Extra content under the description (x-core `children`). */
    children?: ReactNode;
    /** Confirm button text. Translate it. @default 'Confirm' */
    confirmLabel?: ReactNode;
    /** Cancel button text. Translate it. @default 'Cancel' */
    cancelLabel?: ReactNode;
    /** Called when the confirm button is pressed. */
    onConfirm: (event: MouseEvent<HTMLButtonElement>) => void;
    /** Called when the user cancels (button, Escape or scrim). */
    onCancel?: () => void;
    /**
     * `destructive` gives the confirm button the destructive look. Initial
     * focus is always on Cancel (the first action), so Enter never confirms
     * by accident.
     * @default 'default'
     */
    variant?: ConfirmationDialogVariant;
    /**
     * The confirm action is running: its button shows a spinner and cancel,
     * Escape and the scrim are blocked until it ends.
     * @default false
     */
    loading?: boolean;
    /** Disables the confirm button. @default false */
    confirmDisabled?: boolean;
    /**
     * Closes after `onConfirm` (x-core default). `false` keeps it open, e.g.
     * to close after an async request (x-core `manualClose`).
     * @default true
     */
    closeOnConfirm?: boolean;
    /** Width from tablet. @default 'sm' */
    size?: DialogSize;
    /** Classes for the dialog panel. */
    className?: string;
};

/**
 * A blocking question with Confirm and Cancel (`role="alertdialog"`). Cancel
 * sits before Confirm (at mobile, stacked under it); Escape and the scrim
 * cancel unless `loading`.
 */
export const ConfirmationDialog = forwardRef<
    HTMLDivElement,
    ConfirmationDialogProps
>(function ConfirmationDialog(
    {
        open,
        onOpenChange,
        title,
        description,
        children,
        confirmLabel = 'Confirm',
        cancelLabel = 'Cancel',
        onConfirm,
        onCancel,
        variant: variantProp,
        loading = false,
        confirmDisabled = false,
        closeOnConfirm = true,
        size = 'sm',
        className,
        ...props
    },
    ref
) {
    const rest = omitLegacyProps(
        'ConfirmationDialog',
        props,
        legacyConfirmationProps
    );
    const variant = resolveOption(
        'ConfirmationDialog',
        'variant',
        variantProp,
        variants,
        'default'
    );
    const cancel = () => {
        onCancel?.();
        onOpenChange(false);
    };
    return (
        <Dialog
            open={open}
            onOpenChange={(next) => {
                if (!next) cancel();
            }}
        >
            <DialogContent
                {...rest}
                ref={ref}
                role="alertdialog"
                size={size}
                dismissible={!loading}
                showClose={false}
                {...(description === undefined && {
                    'aria-describedby': undefined,
                })}
                {...(className !== undefined && { className })}
            >
                <DialogHeader className="hz:pe-4 hz:tablet:pe-6">
                    <DialogTitle>{title}</DialogTitle>
                    {description !== undefined && (
                        <DialogDescription>{description}</DialogDescription>
                    )}
                </DialogHeader>
                {children !== undefined && <DialogBody>{children}</DialogBody>}
                <DialogFooter>
                    <Button
                        variant="secondary"
                        disabled={loading}
                        onClick={cancel}
                    >
                        {cancelLabel}
                    </Button>
                    <Button
                        variant={
                            variant === 'destructive'
                                ? 'destructive'
                                : 'primary'
                        }
                        loading={loading}
                        disabled={confirmDisabled}
                        onClick={(event) => {
                            onConfirm(event);
                            if (closeOnConfirm) onOpenChange(false);
                        }}
                    >
                        {confirmLabel}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
});
ConfirmationDialog.displayName = 'ConfirmationDialog';
