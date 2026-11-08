/*
 * No shadcn base (shadcn has no search field): a composition of Input in a
 * `role="search"` landmark. Replaces x-core `SearchBarV2` (MUI TextField
 * with a search button, clear button and loader, x-core 2.2.30);
 * `SearchBar` (v1) is superseded.
 */
import { MagnifyingGlassIcon } from '@phosphor-icons/react/dist/csr/MagnifyingGlass';
import {
    forwardRef,
    useState,
    type ChangeEvent,
    type KeyboardEvent,
} from 'react';
import { cn } from '../../lib/cn';
import { omitLegacyProps } from '../../lib/options';
import { inlineActionBase } from '../../primitives';
import { Input, type InputProps } from '../Input';

/** x-core SearchBarV2 / TextField props that are dropped (dev warning). */
const legacySearchBarProps = {
    searchValue: 'use value',
    onSearchChange: 'use onValueChange',
    loader: 'use loading',
    hasError: 'use invalid, or FormField error',
    iconSize: 'the icon follows size',
    actions: 'not supported',
    isLabelContainer: 'use FormField',
} as const;

/** Props for {@link SearchBar}. */
export type SearchBarProps = Omit<
    InputProps,
    | 'type'
    | 'value'
    | 'defaultValue'
    | 'onChange'
    | 'clearable'
    | 'startAdornment'
    | 'onClear'
> & {
    /** Search text (controlled; x-core `searchValue`). */
    value?: string;
    /** Initial text (uncontrolled). */
    defaultValue?: string;
    /** Called on every change, with `''` after clearing (x-core `onSearchChange`). */
    onValueChange?: (value: string) => void;
    /**
     * Called with the text on Enter or the search button, and with `''`
     * after clearing (x-core `onSearch`). Nothing is debounced: x-core does
     * not debounce either.
     */
    onSearch?: (value: string) => void;
    /** Accessible name of the search button. @default 'Search' */
    searchLabel?: string;
    /**
     * Name of the `role="search"` landmark. Defaults to the field's
     * `aria-label`, so several search bars on a page stay distinguishable.
     */
    landmarkLabel?: string;
    /** Classes for the landmark wrapper. `className` styles the field box. */
    wrapperClassName?: string;
};

// The search button tucks into the field's start padding, as Input's clear
// button does at the end: 44px at mobile, 32px with a fine pointer.
const searchButton = cn(
    inlineActionBase,
    'hz:-ms-3 hz:text-primary hz:hover:text-primary-hover hz:disabled:cursor-not-allowed hz:disabled:text-muted-foreground hz:tablet:pointer-fine:-ms-2 hz:[&_svg]:size-4 hz:[&_svg]:align-middle'
);

/**
 * A search field: `role="search"` landmark, a search button at the start,
 * a clear button while there is text, Enter to search, and an optional
 * loading spinner. Built on Input (sizes, states, FormField wiring).
 */
export const SearchBar = forwardRef<HTMLInputElement, SearchBarProps>(
    function SearchBar(
        {
            value,
            defaultValue,
            onValueChange,
            onSearch,
            searchLabel = 'Search',
            landmarkLabel,
            wrapperClassName,
            clearLabel = 'Clear',
            disabled,
            onKeyDown,
            'aria-label': ariaLabel,
            ...props
        },
        ref
    ) {
        const rest = omitLegacyProps('SearchBar', props, legacySearchBarProps);
        const [inner, setInner] = useState(defaultValue ?? '');
        const text = value ?? inner;
        const change = (next: string) => {
            if (value === undefined) setInner(next);
            onValueChange?.(next);
        };
        return (
            <div
                role="search"
                aria-label={landmarkLabel ?? ariaLabel}
                className={cn('hz:w-full hz:min-w-0', wrapperClassName)}
                data-search-bar=""
            >
                <Input
                    {...rest}
                    ref={ref}
                    type="search"
                    aria-label={ariaLabel}
                    enterKeyHint="search"
                    disabled={disabled}
                    value={text}
                    clearable
                    clearLabel={clearLabel}
                    onChange={(event: ChangeEvent<HTMLInputElement>) =>
                        change(event.target.value)
                    }
                    onClear={() => onSearch?.('')}
                    onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
                        onKeyDown?.(event);
                        if (event.defaultPrevented || event.key !== 'Enter')
                            return;
                        // Not a form submit: x-core searched in place.
                        event.preventDefault();
                        onSearch?.(text);
                    }}
                    startAdornment={
                        <button
                            type="button"
                            aria-label={searchLabel}
                            disabled={disabled}
                            className={searchButton}
                            data-search-button=""
                            onClick={() => onSearch?.(text)}
                        >
                            <MagnifyingGlassIcon
                                aria-hidden="true"
                                weight="bold"
                            />
                        </button>
                    }
                />
            </div>
        );
    }
);
SearchBar.displayName = 'SearchBar';
