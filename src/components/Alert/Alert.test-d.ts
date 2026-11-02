import type { ComponentRef } from 'react';
import type { Alert, AlertProps } from '.';

export const full: AlertProps = {
    variant: 'warning',
    title: 'Contract expired',
    children: 'Renew to continue.',
    action: null,
    icon: false,
    onDismiss: () => undefined,
    dismissLabel: 'Close',
    role: 'status',
    'data-did': 'contract',
};

export const ref: ComponentRef<typeof Alert> | null =
    null as HTMLDivElement | null;

// @ts-expect-error x-core `severity` is `variant` now
export const severity: AlertProps = { severity: 'error' };

// @ts-expect-error MUI layout variants (standard/inline/filled/footer) are not ported
export const inline: AlertProps = { variant: 'inline' };

// @ts-expect-error x-core `onClose` is `onDismiss`
export const onClose: AlertProps = { onClose: () => undefined };

// @ts-expect-error onDismiss takes no event (the button is internal)
export const dismissArgs: AlertProps = { onDismiss: (id: string) => id };
