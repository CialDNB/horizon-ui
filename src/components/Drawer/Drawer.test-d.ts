import type { ComponentRef } from 'react';
import type { Drawer, DrawerProps } from '.';

export const full: DrawerProps = {
    title: 'Details',
    content: 'Body',
    actions: null,
    open: true,
    onOpenChange: (open: boolean) => open,
    side: 'start',
    width: '90%',
    keepMounted: true,
    closeLabel: 'Close',
    'data-did': 'details',
};

export const ref: ComponentRef<typeof Drawer> | null =
    null as HTMLDivElement | null;

// @ts-expect-error title, content, open and onOpenChange are required
export const missing: DrawerProps = { title: 'Details' };

export const physical: DrawerProps = {
    ...full,
    // @ts-expect-error sides are logical (start/end)
    side: 'right',
};

export const legacy: DrawerProps = {
    ...full,
    // @ts-expect-error x-core isOpen becomes open
    isOpen: true,
};
