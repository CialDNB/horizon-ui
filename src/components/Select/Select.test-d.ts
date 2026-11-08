import type { ComponentRef } from 'react';
import type { Select, SelectItemProps, SelectProps } from '.';

export const full: SelectProps = {
    value: 'a',
    onValueChange: (value: string) => value,
    placeholder: 'Pick',
    size: 'sm',
    invalid: false,
    clearable: true,
    clearLabel: 'Clear',
    emptyMessage: 'None',
    name: 'company',
    required: true,
    open: false,
    onOpenChange: (open: boolean) => open,
    dir: 'rtl',
    'aria-label': 'Company',
    'data-did': 'company',
};

export const item: SelectItemProps = { value: 'a', children: 'A' };

export const ref: ComponentRef<typeof Select> | null =
    null as HTMLButtonElement | null;

// @ts-expect-error an option needs a value
export const noValue: SelectItemProps = { children: 'A' };

export const multiple: SelectProps = {
    // @ts-expect-error multiple selection is a Combobox
    multiple: true,
};

export const options: SelectProps = {
    // @ts-expect-error options are SelectItem children
    options: [],
};
