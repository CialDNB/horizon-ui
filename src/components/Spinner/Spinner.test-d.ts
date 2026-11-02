import type { ComponentRef } from 'react';
import type { Spinner, SpinnerProps } from '.';

export const indeterminate: SpinnerProps = {
    size: 'sm',
    tone: 'inherit',
    label: 'Saving',
    'data-did': 'saving',
};
export const determinate: SpinnerProps = { value: 40, size: 'xl' };
export const decorative: SpinnerProps = { 'aria-hidden': true };

export const ref: ComponentRef<typeof Spinner> | null =
    null as HTMLSpanElement | null;

// @ts-expect-error x-core numeric sizes are size steps now
export const numericSize: SpinnerProps = { size: 24 };

// @ts-expect-error MUI colours are not tones ('secondary')
export const muiColor: SpinnerProps = { tone: 'secondary' };

// @ts-expect-error the role is fixed (progressbar, or none when aria-hidden)
export const role: SpinnerProps = { role: 'status' };

// @ts-expect-error a spinner has no children
export const children: SpinnerProps = { children: 'Loading' };

// @ts-expect-error x-core `variant="determinate"` is expressed by `value`
export const variant: SpinnerProps = { variant: 'determinate' };
