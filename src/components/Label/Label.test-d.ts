import type { ComponentRef } from 'react';
import type { Label, LabelProps } from '.';

export const full: LabelProps = {
    htmlFor: 'email',
    required: true,
    disabled: false,
    'data-did': 'email-label',
    children: 'Email',
};

export const ref: ComponentRef<typeof Label> | null =
    null as HTMLLabelElement | null;

export const sx: LabelProps = {
    children: 'Email',
    // @ts-expect-error MUI sx is not supported; use className
    sx: { p: 1 },
};
