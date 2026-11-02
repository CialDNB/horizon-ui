/*
 * No shadcn base (shadcn moved to sonner): Radix Toast with an imperative
 * store, each toast rendered as a Horizon Alert. Replaces x-core `Snackbar`
 * (`SnackbarAlert` + `useSnackbar` on notistack, x-core 2.2.30) and
 * customer360's `useSimpleSnackbar` wrapper.
 */
import * as ToastPrimitive from '@radix-ui/react-toast';
import { useEffect, useSyncExternalStore, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../lib/cn';
import { resolveOption, warnOnce } from '../../lib/options';
import { forcedBorder } from '../../primitives';
import { usePortalContainer } from '../../provider';
import { Alert } from '../Alert';
import { Button } from '../Button';
import type { DnbBase } from '../../types/DnbBase';

/** Tone of a toast (x-core Snackbar `color`). */
export type ToastVariant = 'info' | 'success' | 'warning' | 'error';

const toastVariants: readonly ToastVariant[] = [
    'info',
    'success',
    'warning',
    'error',
];

/** An action button inside a toast (customer360 `actionTitle` + `onActionClick`). */
export type ToastAction = {
    /** Button text. */
    label: string;
    /** Runs on click; the toast closes afterwards. */
    onClick: () => void;
    /**
     * How to do the same without the toast, for screen readers (Radix
     * `altText`), e.g. "Open Reports to undo". @default label
     */
    altText?: string;
};

/** Options for {@link toast}. */
export type ToastOptions = DnbBase & {
    /** The message (customer360 `text`). */
    description?: ReactNode;
    /** Short summary above the message (customer360 `title`). */
    title?: ReactNode;
    /**
     * Tone. `error` is announced assertively (interrupts), the others
     * politely. @default 'info'
     */
    variant?: ToastVariant;
    /** One action button. */
    action?: ToastAction;
    /**
     * Ms before it closes by itself (x-core `autoHideDuration`); the timer
     * pauses while the pointer is over the toasts, while one has focus, and
     * while the window is in the background. `Infinity` keeps it until
     * dismissed. @default the provider's `duration` (5000)
     */
    duration?: number;
    /**
     * Stable id: a toast with the same id that is still shown is replaced
     * instead of stacking a second one (x-core `preventDuplicate`).
     */
    id?: string;
    /** Accessible name of the dismiss button. Translate it. @default 'Dismiss' */
    dismissLabel?: string;
};

/** What {@link toast} returns. */
export type ToastHandle = {
    /** The toast's id. */
    id: string;
    /** Closes this toast (customer360's returned `handleClose`). */
    dismiss: () => void;
};

type Entry = ToastOptions & { id: string; open: boolean };

let entries: readonly Entry[] = [];
let mounted = 0;
let counter = 0;
const listeners = new Set<() => void>();

function emit(next: readonly Entry[]) {
    entries = next;
    for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
}

const snapshot = () => entries;
const serverSnapshot = (): readonly Entry[] => [];

// Closed toasts leave the store after their exit animation (<= 200ms).
const REMOVE_AFTER_MS = 1000;

function dismissToast(id?: string) {
    const closing = entries.filter(
        (entry) => entry.open && (id === undefined || entry.id === id)
    );
    if (closing.length === 0) return;
    emit(
        entries.map((entry) =>
            closing.includes(entry) ? { ...entry, open: false } : entry
        )
    );
    const closed = new Set(closing.map((entry) => entry.id));
    setTimeout(() => {
        emit(entries.filter((entry) => entry.open || !closed.has(entry.id)));
    }, REMOVE_AFTER_MS);
}

/**
 * Shows a toast and returns its id and a `dismiss` function. Works from
 * anywhere (event handlers, request callbacks); a {@link ToastProvider} must
 * be mounted to display it.
 */
export function toast(options: ToastOptions): ToastHandle {
    if (mounted === 0)
        warnOnce(
            'toast() was called but no <ToastProvider> is mounted; the toast shows once one mounts.'
        );
    const id = options.id ?? `hz-toast-${++counter}`;
    const entry: Entry = { ...options, id, open: true };
    const existing = entries.some((e) => e.id === id);
    emit(
        existing
            ? entries.map((e) => (e.id === id ? entry : e))
            : [...entries, entry]
    );
    return { id, dismiss: () => dismissToast(id) };
}

/** Closes the toast with `id`, or every toast without an id. */
toast.dismiss = dismissToast;

/** Test helper (not public API): removes every toast. */
export function resetToasts(): void {
    emit([]);
}

/**
 * `toast` and `dismiss` for components, plus the toasts currently shown
 * (read-only).
 */
export function useToast(): {
    toast: typeof toast;
    dismiss: (id?: string) => void;
    toasts: readonly { id: string; open: boolean }[];
} {
    const toasts = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
    return { toast, dismiss: dismissToast, toasts };
}

/** Props for {@link ToastProvider}. */
export type ToastProviderProps = {
    /** The app (or nothing: the provider can sit beside it). */
    children?: ReactNode;
    /** Default ms before a toast closes. @default 5000 (x-core/customer360) */
    duration?: number;
    /**
     * Name of the notifications region, announced when it is reached with
     * F8. Translate it. @default 'Notifications'
     */
    label?: string;
    /** Classes for the toast list (the viewport). */
    className?: string;
};

const viewportStyles = cn(
    // Restated list reset: Bootstrap's reboot styles `ol` (margin, padding).
    'hz:fixed hz:inset-x-0 hz:bottom-0 hz:z-toast hz:m-0 hz:text-start hz:flex hz:max-h-dvh hz:list-none hz:flex-col hz:items-stretch hz:gap-2 hz:p-4 hz:pb-[max(16px,env(safe-area-inset-bottom))] hz:outline-none',
    'hz:tablet:mx-auto hz:tablet:w-full hz:tablet:max-w-[432px]',
    'hz:laptop:start-auto hz:laptop:end-0 hz:laptop:mx-0 hz:laptop:max-w-[448px] hz:laptop:p-6'
);

const toastStyles = cn(
    'hz:pointer-events-auto hz:rounded-md hz:text-start hz:shadow-3',
    forcedBorder,
    'hz:[--hz-enter-y:16px] hz:data-[state=open]:animate-panel-in hz:data-[state=closed]:animate-overlay-out',
    // Swipe toward the inline end follows the finger; Radix sets the offsets.
    'hz:data-[swipe=move]:translate-x-(--radix-toast-swipe-move-x) hz:data-[swipe=cancel]:translate-x-0 hz:data-[swipe=cancel]:transition-transform hz:data-[swipe=cancel]:duration-fast'
);

/**
 * Renders the toasts. Mount once, inside the app's HorizonProvider (the list
 * portals into it at `--z-toast`, 1600, above MUI dialogs). Bottom centre at
 * mobile and tablet, bottom end from laptop. F8 moves focus to the list;
 * hovering or focusing it pauses the timers; swipe toward the inline end
 * or the dismiss button closes a toast. Each toast is announced once
 * (Radix: one live-region copy, assertive for `error`).
 */
export function ToastProvider({
    children,
    duration = 5000,
    label = 'Notifications',
    className,
}: ToastProviderProps) {
    const items = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
    const container = usePortalContainer();
    useEffect(() => {
        mounted += 1;
        return () => {
            mounted -= 1;
        };
    }, []);
    const rtl = container?.closest('[dir]')?.getAttribute('dir') === 'rtl';
    return (
        <ToastPrimitive.Provider
            duration={duration}
            label={label}
            swipeDirection={rtl ? 'left' : 'right'}
        >
            {children}
            {items.map((item) => (
                <ToastItem key={item.id} item={item} />
            ))}
            {container &&
                createPortal(
                    <ToastPrimitive.Viewport
                        className={cn(viewportStyles, className)}
                        data-toast-viewport=""
                    />,
                    container
                )}
        </ToastPrimitive.Provider>
    );
}
ToastProvider.displayName = 'ToastProvider';

function ToastItem({ item }: { item: Entry }) {
    const variant = resolveOption(
        'toast',
        'variant',
        item.variant,
        toastVariants,
        'info'
    );
    const close = () => dismissToast(item.id);
    return (
        <ToastPrimitive.Root
            open={item.open}
            onOpenChange={(open) => {
                if (!open) close();
            }}
            // Radix handles Escape in the toast's React onKeyDown: stop the
            // synthetic event so an enclosing MUI Modal does not close too.
            onKeyDown={(event) => {
                if (event.key === 'Escape') event.stopPropagation();
            }}
            type={variant === 'error' ? 'foreground' : 'background'}
            {...(item.duration !== undefined && { duration: item.duration })}
            className={toastStyles}
            data-variant={variant}
            data-toast=""
            {...(item['data-did'] !== undefined && {
                'data-did': item['data-did'],
            })}
        >
            <Alert
                role="none"
                variant={variant}
                title={item.title}
                onDismiss={close}
                dismissLabel={item.dismissLabel ?? 'Dismiss'}
                action={
                    item.action && (
                        <ToastPrimitive.Action
                            altText={item.action.altText ?? item.action.label}
                            asChild
                        >
                            <Button
                                variant="tertiary"
                                size="sm"
                                onClick={item.action.onClick}
                            >
                                {item.action.label}
                            </Button>
                        </ToastPrimitive.Action>
                    )
                }
            >
                {item.description}
            </Alert>
        </ToastPrimitive.Root>
    );
}
