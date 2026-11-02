import type { ComponentRef } from 'react';
import type { FormField, FormFieldProps } from '.';

export const full: FormFieldProps = {
    label: 'Email',
    description: 'Work address',
    error: 'Required',
    invalid: true,
    required: true,
    disabled: false,
    id: 'email',
    'data-did': 'email-field',
    children: null,
};

export const ref: ComponentRef<typeof FormField> | null =
    null as HTMLDivElement | null;

// @ts-expect-error a label is required
export const noLabel: FormFieldProps = { children: null };

export const helperText: FormFieldProps = {
    label: 'Email',
    children: null,
    // @ts-expect-error MUI helperText is description / error
    helperText: 'Help',
};
