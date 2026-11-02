import type { ComponentRef } from 'react';
import type { Input, InputProps } from '.';

export const full: InputProps = {
    type: 'email',
    size: 'lg',
    invalid: true,
    clearable: true,
    clearLabel: 'Clear email',
    onClear: () => undefined,
    loading: false,
    startAdornment: null,
    endAdornment: 'USD',
    placeholder: 'name@company.com',
    'aria-label': 'Email',
    'data-did': 'email',
};

export const ref: ComponentRef<typeof Input> | null =
    null as HTMLInputElement | null;

// x-core size names are not accepted ('small' is now 'sm').
export const badSize: InputProps = {
    // @ts-expect-error not an InputSize
    size: 'small',
};

// The label and helper text move to FormField.
export const helper: InputProps = {
    // @ts-expect-error not a prop
    helperText: 'Required',
};

// The native numeric `size` attribute is replaced by the size scale.
export const nativeSize: InputProps = {
    // @ts-expect-error not an InputSize
    size: 20,
};
