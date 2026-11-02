import type { ComponentRef } from 'react';
import type { PopoverContent, PopoverContentProps, PopoverProps } from '.';

export const content: PopoverContentProps = {
    side: 'end',
    align: 'start',
    title: 'Filters',
    icon: null,
    footer: 'Apply',
    hideCloseButton: true,
    closeLabel: 'Close filters',
    width: 400,
    showArrow: true,
    dir: 'rtl',
    'data-did': 'filters',
};

export const root: PopoverProps = {
    open: true,
    onOpenChange: (open: boolean) => open,
    modal: true,
};

export const ref: ComponentRef<typeof PopoverContent> | null =
    null as HTMLDivElement | null;

export const physical: PopoverContentProps = {
    // @ts-expect-error sides are logical (start/end), not left/right
    side: 'right',
};

export const origin: PopoverContentProps = {
    // @ts-expect-error x-core anchorOrigin becomes side + align
    anchorOrigin: { vertical: 'bottom', horizontal: 'right' },
};
