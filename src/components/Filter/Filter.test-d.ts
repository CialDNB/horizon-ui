import type { ComponentRef } from 'react';
import type { Filter, FilterOption, FilterProps } from '.';

const options: FilterOption[] = [{ value: 'a', label: 'A', disabled: false }];

export const full: FilterProps = {
    value: ['a'],
    onChange: (value: string[]) => value,
    label: 'Severity',
    options,
    variant: 'single',
    totalCount: 4,
    hideSelectedCount: false,
    showIcon: true,
    hideCaret: false,
    searchable: true,
    searchLabel: 'Search',
    applyLabel: 'Apply',
    resetLabel: 'Clear',
    loading: false,
    toggle: false,
    'data-did': 'severity',
};

export const ref: ComponentRef<typeof Filter> | null =
    null as HTMLButtonElement | null;

// @ts-expect-error value, onChange, label and options are required
export const missing: FilterProps = { label: 'X' };

export const range: FilterProps = {
    value: [],
    onChange: () => undefined,
    label: 'X',
    options,
    // @ts-expect-error range filters are not ported
    variant: 'range',
};
