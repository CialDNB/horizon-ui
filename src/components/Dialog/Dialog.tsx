/*
 * Based on shadcn/ui Dialog (registry 2025) on Radix Dialog: Dialog,
 * DialogTrigger, DialogContent, DialogHeader/Title/Description, DialogBody,
 * DialogFooter, DialogClose. Replaces x-core `DialogV2` (MUI Dialog with
 * `dialogTitle`/`dialogContent`/`dialogActions`, x-core 2.2.30); `Dialog`
 * (v1, plain MUI Dialog) is superseded.
 */
import { XIcon } from '@phosphor-icons/react/dist/csr/X';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { cva, type VariantProps } from 'class-variance-authority';
import {
    forwardRef,
    useEffect,
    useRef,
    type ComponentPropsWithoutRef,
    type HTMLAttributes,
} from 'react';
import { cn } from '../../lib/cn';
import { omitLegacyProps, resolveOption, warnOnce } from '../../lib/options';
import {
    composeRefs,
    containEscape,
    overlayCloseBase,
    overlaySurface,
    panelMotion,
    scrimStyles,
} from '../../primitives';
import { usePortalContainer } from '../../provider';
import type { DnbBase } from '../../types/DnbBase';

/** x-core DialogV2 / MUI Dialog props that are dropped (dev warning). */
const legacyDialogProps = {
    onClose: 'use onOpenChange(false)',
    dialogTitle: 'use DialogHeader + DialogTitle',
    dialogContent: 'use DialogBody',
    dialogActions: 'use DialogFooter',
    isStickyHeader: 'the header always stays',
    isStickyFooter: 'the footer always stays',
    maxWidth: 'use DialogContent size',
    fullWidth: 'DialogContent fills up to its size',
    fullScreen: 'full screen at mobile by default',
    scroll: 'DialogBody scrolls',
    transitionDirection: 'not supported',
    TransitionComponent: 'not supported',
    TransitionComponentProps: 'not supported',
    TransitionProps: 'not supported',
    PaperProps: 'use DialogContent className',
    dialogContentSx: 'use DialogBody className',
    dialogActionsSx: 'use DialogFooter className',
    sx: 'use DialogContent className',
    keepMounted: 'not supported',
    disablePortal: 'not needed',
    disableEscapeKeyDown: 'use DialogContent dismissible={false}',
} as const;

/** Props for {@link Dialog}. */
export type DialogProps = ComponentPropsWithoutRef<typeof DialogPrimitive.Root>;

/**
 * Root of a modal dialog: holds the open state (`open` + `onOpenChange`, or
 * uncontrolled with a {@link DialogTrigger}).
 */
export function Dialog(props: DialogProps) {
    const rest = omitLegacyProps('Dialog', props, legacyDialogProps);
    return <DialogPrimitive.Root {...rest} />;
}
Dialog.displayName = 'Dialog';

/** Props for {@link DialogTrigger}. */
export type DialogTriggerProps = ComponentPropsWithoutRef<
    typeof DialogPrimitive.Trigger
> &
    DnbBase;

/** Opens the dialog; focus returns to it on close. Use `asChild` with a Button. */
export const DialogTrigger = forwardRef<HTMLButtonElement, DialogTriggerProps>(
    function DialogTrigger(props, ref) {
        return <DialogPrimitive.Trigger {...props} ref={ref} />;
    }
);
DialogTrigger.displayName = 'DialogTrigger';

/** Props for {@link DialogClose}. */
export type DialogCloseProps = ComponentPropsWithoutRef<
    typeof DialogPrimitive.Close
> &
    DnbBase;

/** Closes the dialog (use `asChild` with a footer Button). */
export const DialogClose = forwardRef<HTMLButtonElement, DialogCloseProps>(
    function DialogClose(props, ref) {
        return <DialogPrimitive.Close {...props} ref={ref} />;
    }
);
DialogClose.displayName = 'DialogClose';

// Mobile: full screen (no radius, safe areas in header/footer), sliding up a
// little. Tablet+: centred (inset 0 + auto margins + fit height), up to the
// size's width and the viewport minus 32px each side, scaling in.
const contentStyles = cva(
    [
        'hz:fixed hz:inset-0 hz:z-dialog hz:flex hz:flex-col hz:overflow-hidden hz:text-body-default',
        overlaySurface,
        panelMotion,
        'hz:[--hz-enter-y:24px]',
        'hz:tablet:m-auto hz:tablet:h-fit hz:tablet:max-h-[calc(100dvh-64px)] hz:tablet:w-[calc(100vw-64px)] hz:tablet:rounded-md hz:tablet:[--hz-enter-y:0] hz:tablet:[--hz-enter-scale:0.96]',
    ],
    {
        variants: {
            size: {
                sm: 'hz:tablet:max-w-[570px]',
                md: 'hz:tablet:max-w-[600px]',
                lg: 'hz:tablet:max-w-[900px]',
                xl: 'hz:tablet:max-w-[1136px]',
            },
        },
        defaultVariants: { size: 'md' },
    }
);

/** Options accepted by {@link dialogVariants}: `size`. */
export type DialogVariantOptions = VariantProps<typeof contentStyles>;

/** Width of a {@link DialogContent} from tablet (full screen at mobile). */
export type DialogSize = NonNullable<DialogVariantOptions['size']>;

const dialogSizes: readonly DialogSize[] = ['sm', 'md', 'lg', 'xl'];

/** Class string for the dialog panel, conflict-resolved with `cn()`. */
export function dialogVariants(options?: DialogVariantOptions): string {
    return cn(contentStyles(options));
}

/** Props for {@link DialogContent}. */
export type DialogContentProps = ComponentPropsWithoutRef<
    typeof DialogPrimitive.Content
> &
    DnbBase & {
        /**
         * Maximum width from tablet (x-core `dialogWidth` tokens): sm 570,
         * md 600, lg 900, xl 1136px. Full screen at mobile.
         * @default 'md'
         */
        size?: DialogSize;
        /**
         * `false` for blocking confirmations: Escape and outside clicks do
         * not close it and the close button is hidden; only your actions
         * close it.
         * @default true
         */
        dismissible?: boolean;
        /** Shows the close button at the top end. @default true */
        showClose?: boolean;
        /** Accessible name of the close button. Translate it. @default 'Close' */
        closeLabel?: string;
    };

/**
 * The modal panel (`role="dialog"`, `aria-modal`) over a scrim. Needs a
 * {@link DialogTitle} (names it; Radix warns in development when missing)
 * and a {@link DialogDescription} or `aria-describedby={undefined}`. Focus
 * moves to the first focusable element, is trapped inside, and returns to
 * the trigger on close; the page behind cannot scroll and is hidden from
 * assistive tech. Escape and an outside click close it unless
 * `dismissible={false}`. Portals into the HorizonProvider root at
 * `--z-dialog` (1350, above MUI dialogs, below Horizon menus and popovers).
 */
export const DialogContent = forwardRef<HTMLDivElement, DialogContentProps>(
    function DialogContent(
        {
            size: sizeProp,
            dismissible = true,
            showClose = true,
            closeLabel = 'Close',
            onEscapeKeyDown,
            onPointerDownOutside,
            onInteractOutside,
            className,
            children,
            ...props
        },
        ref
    ) {
        const size = resolveOption(
            'DialogContent',
            'size',
            sizeProp,
            dialogSizes,
            'md'
        );
        const container = usePortalContainer();
        const panelRef = useRef<HTMLDivElement>(null);
        const optedOutOfDescription = Object.hasOwn(props, 'aria-describedby');
        // Checked once per opening, after Radix has wired the title and
        // description ids (they register in a later render).
        useEffect(() => {
            const timer = setTimeout(() => {
                const panel = panelRef.current;
                if (!panel) return;
                if (
                    !panel.hasAttribute('aria-label') &&
                    !panel.hasAttribute('aria-labelledby')
                )
                    warnOnce(
                        'DialogContent: no accessible name. Add a DialogTitle (it can be visually hidden) or aria-label.'
                    );
                if (
                    !panel.hasAttribute('aria-describedby') &&
                    !optedOutOfDescription
                )
                    warnOnce(
                        'DialogContent: no description. Add a DialogDescription, or pass aria-describedby={undefined} when there is none.'
                    );
            });
            return () => clearTimeout(timer);
            // Once per mount: the content mounts on each opening.
        }, []);
        if (!container) return null;
        return (
            <DialogPrimitive.Portal container={container}>
                <DialogPrimitive.Overlay
                    className={scrimStyles}
                    data-dialog-overlay=""
                />
                <DialogPrimitive.Content
                    {...props}
                    ref={composeRefs(ref, panelRef)}
                    onEscapeKeyDown={containEscape((event) => {
                        onEscapeKeyDown?.(event);
                        if (!dismissible) event.preventDefault();
                    })}
                    onPointerDownOutside={(event) => {
                        onPointerDownOutside?.(event);
                        if (!dismissible) event.preventDefault();
                    }}
                    onInteractOutside={(event) => {
                        onInteractOutside?.(event);
                        if (!dismissible) event.preventDefault();
                    }}
                    data-size={size}
                    data-dialog-content=""
                    className={cn(contentStyles({ size }), className)}
                >
                    {children}
                    {showClose && dismissible && (
                        <DialogPrimitive.Close
                            aria-label={closeLabel}
                            className={cn(
                                overlayCloseBase,
                                'hz:absolute hz:end-2 hz:top-[max(8px,env(safe-area-inset-top))] hz:text-muted-foreground hz:hover:text-foreground hz:[&_svg]:size-5 hz:tablet:end-3 hz:tablet:top-3'
                            )}
                        >
                            <XIcon aria-hidden="true" />
                        </DialogPrimitive.Close>
                    )}
                </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
        );
    }
);
DialogContent.displayName = 'DialogContent';

/** Props for {@link DialogHeader}, {@link DialogBody} and {@link DialogFooter}. */
export type DialogSectionProps = HTMLAttributes<HTMLDivElement> & DnbBase;

/**
 * Title and description, above the scrolling body. Leaves room at the end
 * for the close button; respects the top safe area at mobile.
 */
export const DialogHeader = forwardRef<HTMLDivElement, DialogSectionProps>(
    function DialogHeader({ className, ...props }, ref) {
        return (
            <div
                {...props}
                ref={ref}
                className={cn(
                    'hz:flex hz:shrink-0 hz:flex-col hz:gap-1 hz:px-4 hz:pe-14 hz:pt-[max(16px,env(safe-area-inset-top))] hz:pb-2 hz:tablet:px-6 hz:tablet:pe-16 hz:tablet:pt-6',
                    className
                )}
            />
        );
    }
);
DialogHeader.displayName = 'DialogHeader';

/** Props for {@link DialogTitle}. */
export type DialogTitleProps = ComponentPropsWithoutRef<
    typeof DialogPrimitive.Title
> &
    DnbBase;

/** Names the dialog (`aria-labelledby`). Renders an `h2`. */
export const DialogTitle = forwardRef<HTMLHeadingElement, DialogTitleProps>(
    function DialogTitle({ className, ...props }, ref) {
        return (
            <DialogPrimitive.Title
                {...props}
                ref={ref}
                className={cn(
                    // Margin, weight and line height restated: the reboot
                    // and customer360 style h2.
                    'hz:m-0 hz:p-0 hz:text-label-lg hz:text-foreground hz:break-words hz:tablet:text-heading-sm',
                    className
                )}
            />
        );
    }
);
DialogTitle.displayName = 'DialogTitle';

/** Props for {@link DialogDescription}. */
export type DialogDescriptionProps = ComponentPropsWithoutRef<
    typeof DialogPrimitive.Description
> &
    DnbBase;

/** Describes the dialog (`aria-describedby`). Renders a `p`. */
export const DialogDescription = forwardRef<
    HTMLParagraphElement,
    DialogDescriptionProps
>(function DialogDescription({ className, ...props }, ref) {
    return (
        <DialogPrimitive.Description
            {...props}
            ref={ref}
            className={cn(
                'hz:m-0 hz:p-0 hz:text-body-secondary hz:text-muted-foreground',
                className
            )}
        />
    );
});
DialogDescription.displayName = 'DialogDescription';

/** The content; scrolls when the dialog is taller than the viewport. */
export const DialogBody = forwardRef<HTMLDivElement, DialogSectionProps>(
    function DialogBody({ className, ...props }, ref) {
        return (
            <div
                {...props}
                ref={ref}
                data-dialog-body=""
                className={cn(
                    'hz:min-h-0 hz:flex-1 hz:overflow-y-auto hz:px-4 hz:py-2 hz:break-words hz:tablet:px-6',
                    className
                )}
            />
        );
    }
);
DialogBody.displayName = 'DialogBody';

/**
 * Actions, always visible under the body. Mobile: full-width buttons
 * stacked with the primary action on top (put it last in the markup) above
 * the bottom safe area. Tablet+: a row at the end.
 */
export const DialogFooter = forwardRef<HTMLDivElement, DialogSectionProps>(
    function DialogFooter({ className, ...props }, ref) {
        return (
            <div
                {...props}
                ref={ref}
                data-dialog-footer=""
                className={cn(
                    'hz:flex hz:shrink-0 hz:flex-col-reverse hz:gap-2 hz:px-4 hz:pt-3 hz:pb-[max(16px,env(safe-area-inset-bottom))] hz:[&>*]:w-full',
                    'hz:tablet:flex-row hz:tablet:flex-wrap hz:tablet:justify-end hz:tablet:px-6 hz:tablet:pb-6 hz:tablet:[&>*]:w-auto',
                    className
                )}
            />
        );
    }
);
DialogFooter.displayName = 'DialogFooter';
