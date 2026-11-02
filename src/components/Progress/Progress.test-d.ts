import type { ComponentRef } from 'react';
import type { Progress, ProgressProps } from '.';

export const labelled: ProgressProps = {
    value: 40,
    label: 'Profile completion',
    showValue: true,
    'data-did': 'profile',
};
export const ariaLabelled: ProgressProps = { 'aria-label': 'Uploading' };
export const byId: ProgressProps = {
    value: 3,
    max: 5,
    'aria-labelledby': 'steps-heading',
    'aria-valuetext': '3 of 5 steps',
    variant: 'neutral',
    size: 'md',
};

export const ref: ComponentRef<typeof Progress> | null =
    null as HTMLDivElement | null;

// @ts-expect-error a progressbar must be named (label, aria-label or aria-labelledby)
export const unnamed: ProgressProps = { value: 10 };

// @ts-expect-error a visible label already names it; aria-label would compete
export const twoNames: ProgressProps = { label: 'A', 'aria-label': 'B' };

// @ts-expect-error MUI `variant="buffer"` is not ported
export const buffer: ProgressProps = { variant: 'buffer', 'aria-label': 'x' };

// @ts-expect-error the role is fixed
export const role: ProgressProps = { role: 'meter', 'aria-label': 'x' };
