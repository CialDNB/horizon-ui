import type { ComponentRef } from 'react';
import type { Button, ButtonProps } from '.';

export const full: ButtonProps = {
    variant: 'destructive',
    size: 'lg',
    loading: true,
    asChild: false,
    fullWidth: true,
    type: 'submit',
    'data-did': 'checkout-submit',
    'aria-label': 'Delete project',
};

export const ref: ComponentRef<typeof Button> | null =
    null as HTMLButtonElement | null;

// @ts-expect-error unknown variant names are rejected (x-core 'contained' is now 'primary')
export const badVariant: ButtonProps = { variant: 'contained' };

// @ts-expect-error x-core size names are not accepted ('medium' is now 'md')
export const badSize: ButtonProps = { size: 'medium' };

// @ts-expect-error exactOptionalPropertyTypes: pass nothing rather than undefined
export const undefinedVariant: ButtonProps = { variant: undefined };

export const icons: ButtonProps = { startIcon: null, endIcon: 'x' };

// x-core `color` is now `variant` (it was forwarded to the DOM before).
export const color: ButtonProps = {
    // @ts-expect-error not a prop
    color: 'error',
};
