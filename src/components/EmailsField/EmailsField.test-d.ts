import type { ComponentRef } from 'react';
import type { EmailsField, EmailsFieldProps } from '.';

export const full: EmailsFieldProps = {
    value: ['a@b.co'],
    onValueChange: (emails: string[]) => emails,
    validate: (email: string) => email.endsWith('.com'),
    limit: 3,
    invalidMessage: 'Invalid',
    size: 'lg',
    clearable: true,
    clearLabel: 'Remove all',
    loading: false,
    name: 'emails',
    placeholder: 'Type an email and press Enter',
    'aria-label': 'Recipients',
    'data-did': 'emails',
};

export const ref: ComponentRef<typeof EmailsField> | null =
    null as HTMLInputElement | null;

// @ts-expect-error the value is a list of addresses
export const single: EmailsFieldProps = { value: 'a@b.co' };

export const xcore: EmailsFieldProps = {
    // @ts-expect-error x-core onChange(event, value) is onValueChange(emails)
    onChange: (_e: unknown, v: string[]) => v,
};
