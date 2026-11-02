import type { ToastHandle, ToastOptions, ToastProviderProps } from '.';
import { toast } from '.';

export const full: ToastOptions = {
    description: 'Saved',
    title: 'Done',
    variant: 'error',
    action: {
        label: 'Undo',
        onClick: () => undefined,
        altText: 'Undo in history',
    },
    duration: Infinity,
    id: 'save',
    dismissLabel: 'Dismiss',
    'data-did': 'saved',
};

export const handle: ToastHandle = toast(full);

export const provider: ToastProviderProps = { duration: 3000, label: 'Alerts' };

export const severity: ToastOptions = {
    // @ts-expect-error x-core color becomes variant
    color: 'error',
};

export const noLabel: ToastOptions = {
    // @ts-expect-error an action needs a label
    action: { onClick: () => undefined },
};
