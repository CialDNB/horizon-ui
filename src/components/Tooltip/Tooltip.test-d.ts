import type { ComponentRef, ReactElement } from 'react';
import type { Tooltip, TooltipProps } from '.';

declare const trigger: ReactElement;

export const full: TooltipProps = {
    content: 'Edit',
    children: trigger,
    side: 'end',
    align: 'start',
    delayDuration: 0,
    showArrow: true,
    disabled: false,
    open: true,
    onOpenChange: (open: boolean) => open,
    dir: 'rtl',
    'data-did': 'tip',
};

export const ref: ComponentRef<typeof Tooltip> | null =
    null as HTMLDivElement | null;

// @ts-expect-error content is required
export const noContent: TooltipProps = { children: trigger };

// @ts-expect-error one trigger element is required
export const noChildren: TooltipProps = { content: 'Edit' };

export const physical: TooltipProps = {
    content: 'Edit',
    children: trigger,
    // @ts-expect-error sides are logical (start/end), not left/right
    side: 'left',
};

export const placement: TooltipProps = {
    content: 'Edit',
    children: trigger,
    // @ts-expect-error x-core placement becomes side + align
    placement: 'bottom-end',
};
