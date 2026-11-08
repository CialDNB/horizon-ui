import type { ComponentRef } from 'react';
import type { Combobox, ComboboxOption, ComboboxProps } from '.';

const options: ComboboxOption[] = [{ value: 'a', label: 'A', group: 'G' }];

export const single: ComboboxProps = {
    options,
    value: 'a',
    onValueChange: (value: string | null) => value,
    inputValue: 'A',
    onInputChange: (text, reason) => `${text}${reason}`,
    filter: false,
    optionContent: (option, state) =>
        `${option.label}${state.selected ? ' *' : ''}${state.inputValue}`,
    limit: 50,
    allowCustomValue: true,
    loading: true,
    size: 'sm',
    clearable: true,
    'aria-label': 'Company',
    'data-did': 'company',
};

export const multiple: ComboboxProps = {
    options,
    multiple: true,
    value: ['a'],
    onValueChange: (value: string[]) => value,
};

export const ref: ComponentRef<typeof Combobox> | null =
    null as HTMLInputElement | null;

// @ts-expect-error options are required
export const noOptions: ComboboxProps = { 'aria-label': 'X' };

// @ts-expect-error a single Combobox takes one value, not an array
export const singleArray: ComboboxProps = {
    options,
    value: ['a'],
};

// @ts-expect-error a multiple Combobox takes an array
export const multiString: ComboboxProps = {
    options,
    multiple: true,
    value: 'a',
};

// @ts-expect-error an option needs a label
export const noLabel: ComboboxOption = { value: 'a' };
