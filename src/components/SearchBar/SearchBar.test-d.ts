import type { ComponentRef } from 'react';
import type { SearchBar, SearchBarProps } from '.';

export const full: SearchBarProps = {
    value: 'acme',
    onValueChange: (value: string) => value,
    onSearch: (value: string) => value,
    loading: true,
    invalid: false,
    size: 'sm',
    searchLabel: 'Search',
    clearLabel: 'Clear',
    landmarkLabel: 'Companies',
    placeholder: 'Search',
    'aria-label': 'Search companies',
    'data-did': 'search',
};

export const ref: ComponentRef<typeof SearchBar> | null =
    null as HTMLInputElement | null;

export const typed: SearchBarProps = {
    // @ts-expect-error SearchBar is always type="search"
    type: 'text',
};

export const xcore: SearchBarProps = {
    // @ts-expect-error x-core searchValue is value
    searchValue: 'a',
};
