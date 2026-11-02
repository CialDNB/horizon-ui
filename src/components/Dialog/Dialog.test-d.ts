import type { ComponentRef } from 'react';
import type { DialogContent, DialogContentProps, DialogProps } from '.';

export const content: DialogContentProps = {
    size: 'xl',
    dismissible: false,
    showClose: false,
    closeLabel: 'Close',
    'aria-describedby': undefined,
    'data-did': 'edit',
};

export const root: DialogProps = {
    open: true,
    onOpenChange: (open: boolean) => open,
};

export const ref: ComponentRef<typeof DialogContent> | null =
    null as HTMLDivElement | null;

export const breakpoint: DialogContentProps = {
    // @ts-expect-error sizes are sm/md/lg/xl, not MUI breakpoints
    size: 'tablet',
};

export const legacy: DialogProps = {
    // @ts-expect-error x-core onClose becomes onOpenChange
    onClose: () => undefined,
};
