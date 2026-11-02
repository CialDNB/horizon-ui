import type { ComponentRef } from 'react';
import type { IconButton, IconButtonProps } from '.';

export const full: IconButtonProps = {
    'aria-label': 'Edit email',
    variant: 'ghost',
    size: 'sm',
    loading: false,
    asChild: false,
    type: 'submit',
    'data-did': 'edit-email',
    children: null,
};
export const labelledBy: IconButtonProps = {
    'aria-labelledby': 'panel-title',
    children: null,
};

export const ref: ComponentRef<typeof IconButton> | null =
    null as HTMLButtonElement | null;

// @ts-expect-error an icon-only button must be named (aria-label or aria-labelledby)
export const unnamed: IconButtonProps = { children: null };

// @ts-expect-error the icon is required
export const noIcon: IconButtonProps = { 'aria-label': 'Edit' };

// x-core `color` is now `variant`.
export const color: IconButtonProps = {
    'aria-label': 'Edit',
    children: null,
    // @ts-expect-error not a prop
    color: 'error',
};

// x-core size names are not accepted ('small' is now 'sm').
export const badSize: IconButtonProps = {
    'aria-label': 'Edit',
    children: null,
    // @ts-expect-error not an IconButtonSize
    size: 'small',
};

// Tooltips arrive with Tooltip (Task 11); `tooltipInfo` is dropped.
export const tooltip: IconButtonProps = {
    'aria-label': 'Edit',
    children: null,
    // @ts-expect-error not a prop
    tooltipInfo: 'Edit',
};
