/*
 * No shadcn base (shadcn has no filter pill): Popover + Checkbox /
 * RadioGroup + Input + Button. Replaces x-core `Filter` (MUI Button pill
 * with count badges opening a Menu of checkboxes/radios with search and
 * apply/reset, x-core 2.2.30).
 */
import { CaretDownIcon } from '@phosphor-icons/react/dist/csr/CaretDown';
import { FunnelIcon } from '@phosphor-icons/react/dist/csr/Funnel';
import {
    forwardRef,
    useId,
    useMemo,
    useState,
    type ButtonHTMLAttributes,
} from 'react';
import { cn } from '../../lib/cn';
import { omitLegacyProps, resolveOption, warnOnce } from '../../lib/options';
import type { DnbBase } from '../../types/DnbBase';
import { Button } from '../Button';
import { Checkbox } from '../Checkbox';
import { Input } from '../Input';
import { Popover, PopoverContent, PopoverTrigger } from '../Popover';
import { RadioGroup, RadioGroupItem } from '../RadioGroup';
import { Spinner } from '../Spinner';

/** One choice of a {@link Filter}. */
export type FilterOption = {
    /** The value reported by `onChange`. */
    value: string;
    /** Visible text, matched by the search field. */
    label: string;
    /** Shown but not selectable. */
    disabled?: boolean;
};

/**
 * `multiple` (check boxes; committed on close, or by Apply) or `single`
 * (radio buttons; picking commits and closes). x-core `clean` is `single`.
 */
export type FilterVariant = 'multiple' | 'single';

const variants: readonly FilterVariant[] = ['multiple', 'single'];

/** x-core Filter props that are dropped or renamed (dev warning). */
const legacyFilterProps = {
    applyButtonText: 'use applyLabel',
    resetButtonText: 'use resetLabel',
    enableSearchField: 'use searchable',
    disableFilterIcon: 'the funnel icon is opt-in: use showIcon',
    disableTotalCountSelected: 'use hideSelectedCount',
    showEndIcond: 'use hideCaret',
    disableMenu: 'use toggle (and onClick)',
    dataTestId: 'use data-testid',
    menuHeaderTitle: 'not supported',
    menuHeaderIcon: 'not supported',
    menuProps: 'not supported',
    rangeBounds: 'range filters are not ported',
    sx: 'use className',
} as const;

/** Props for {@link Filter}. */
export type FilterProps = Omit<
    ButtonHTMLAttributes<HTMLButtonElement>,
    'value' | 'onChange' | 'children' | 'type'
> &
    DnbBase & {
        /** Selected values (controlled; x-core `value`). */
        value: readonly string[];
        /** Called with the new selection (x-core `onChange`). */
        onChange: (value: string[]) => void;
        /** Pill text (x-core `label`). */
        label: string;
        /** The choices (x-core `options`). */
        options: readonly FilterOption[];
        /**
         * `multiple` (check boxes) or `single` (radios, commits and closes on
         * pick). x-core `clean` falls back to `single` (no indicator design
         * yet); `range`, `switch`, `list` are not ported.
         * @default 'multiple'
         */
        variant?: FilterVariant;
        /** A number shown after the label (x-core `totalCount`), e.g. matches. */
        totalCount?: number;
        /** Hides the selected-count bubble (x-core `disableTotalCountSelected`). @default false */
        hideSelectedCount?: boolean;
        /** Shows a funnel icon before the label. @default false (customer360 always disabled it) */
        showIcon?: boolean;
        /** Hides the caret (x-core `showEndIcond={false}`). @default false */
        hideCaret?: boolean;
        /** A search field above the options (x-core `enableSearchField`). @default false */
        searchable?: boolean;
        /** Placeholder and name of the search field. @default 'Search' */
        searchLabel?: string;
        /**
         * Stages changes until Apply is pressed (x-core `applyButtonText`).
         * Without it, `multiple` commits when the panel closes.
         */
        applyLabel?: string;
        /** Reset button text, shown with `applyLabel` while something is selected. @default 'Reset' */
        resetLabel?: string;
        /** Options are loading (panel shows a spinner and `loadingMessage`). @default false */
        loading?: boolean;
        /** Announced while loading. @default 'Loading…' */
        loadingMessage?: string;
        /** Shown when the search matches nothing. @default 'No options' */
        emptyMessage?: string;
        /**
         * No panel: the pill is a toggle button (`aria-pressed` = something
         * selected) and `onClick` does the work (x-core `disableMenu`).
         * @default false
         */
        toggle?: boolean;
    };

// Pill: 44px at mobile and on touch pointers, 32px with a fine pointer
// (x-core 32px). Soft primary fill, stronger while open or pressed.
const pill = cn(
    'hz:group hz:m-0 hz:inline-flex hz:min-h-11 hz:max-w-full hz:min-w-11 hz:cursor-pointer hz:items-center hz:gap-1.5 hz:rounded-full hz:border-0 hz:bg-accent hz:px-3 hz:text-start hz:text-label-md hz:text-accent-foreground hz:normal-case hz:tablet:pointer-fine:min-h-8',
    // Hover: a primary ring; open or pressed: the primary fill (x-core).
    'hz:ring-inset hz:ring-primary hz:transition-colors hz:duration-fast hz:ease-standard hz:hover:ring-1 hz:data-[state=open]:bg-primary hz:data-[state=open]:text-primary-foreground hz:aria-pressed:bg-primary hz:aria-pressed:text-primary-foreground',
    'hz:outline-ring hz:focus:outline-none hz:focus-visible:outline-2 hz:focus-visible:outline-offset-2 hz:focus-visible:outline-solid hz:focus-visible:outline-ring',
    'hz:disabled:cursor-not-allowed hz:disabled:bg-muted hz:disabled:text-muted-foreground',
    'hz:forced-colors:border hz:forced-colors:border-solid hz:forced-colors:border-[ButtonText]',
    'hz:[&_svg]:size-4 hz:[&_svg]:shrink-0'
);

const bubble =
    'hz:inline-flex hz:h-5 hz:min-w-5 hz:items-center hz:justify-center hz:rounded-full hz:px-1.5 hz:text-label-sm hz:tabular-nums';

// Selected count: primary bubble, inverted on the open/pressed primary fill.
const countBubble = cn(
    bubble,
    'hz:bg-primary hz:text-primary-foreground hz:group-data-[state=open]:bg-primary-foreground hz:group-data-[state=open]:text-primary hz:group-aria-pressed:bg-primary-foreground hz:group-aria-pressed:text-primary'
);

/**
 * A filter pill: the label with a selected-count bubble opens a panel
 * (`role="dialog"` named by the label) with check boxes (`multiple`) or
 * radios (`single`), an optional search field, loading/empty states and
 * optional Apply/Reset. `toggle` makes the pill a pressed/unpressed button
 * without a panel.
 */
export const Filter = forwardRef<HTMLButtonElement, FilterProps>(
    function Filter(
        {
            value,
            onChange,
            label,
            options,
            variant: variantProp,
            totalCount,
            hideSelectedCount = false,
            showIcon = false,
            hideCaret = false,
            searchable = false,
            searchLabel = 'Search',
            applyLabel,
            resetLabel = 'Reset',
            loading = false,
            loadingMessage = 'Loading…',
            emptyMessage = 'No options',
            toggle = false,
            disabled,
            'aria-label': ariaLabel,
            className,
            ...props
        },
        ref
    ) {
        const rest = omitLegacyProps('Filter', props, legacyFilterProps);
        // x-core `clean` (single choice without a control) is a single filter.
        const clean = (variantProp as string | undefined) === 'clean';
        if (clean)
            warnOnce(
                'Filter: x-core variant "clean" is rendered as "single" (radios).'
            );
        const variant = resolveOption(
            'Filter',
            'variant',
            clean ? 'single' : variantProp,
            variants,
            'multiple'
        );
        const groupId = useId();
        const [open, setOpen] = useState(false);
        const [staged, setStaged] = useState<string[]>([...value]);
        const [query, setQuery] = useState('');
        const selectedCount = hideSelectedCount ? 0 : value.length;

        const visible = useMemo(() => {
            const q = query.trim().toLowerCase();
            return q === ''
                ? options
                : options.filter((o) => o.label.toLowerCase().includes(q));
        }, [options, query]);

        const same = (a: readonly string[], b: readonly string[]) =>
            a.length === b.length && a.every((v) => b.includes(v));
        const commit = (next: string[]) => {
            if (!same(next, value)) onChange(next);
        };
        const changeOpen = (next: boolean) => {
            if (next) {
                setStaged([...value]);
                setQuery('');
            } else if (variant === 'multiple' && applyLabel === undefined)
                commit(staged);
            setOpen(next);
        };

        const content = (
            <>
                {selectedCount > 0 && (
                    <span
                        aria-hidden="true"
                        className={countBubble}
                        data-filter-count=""
                    >
                        {selectedCount}
                    </span>
                )}
                {totalCount !== undefined && totalCount > 0 && (
                    <span
                        aria-hidden="true"
                        className={cn(
                            bubble,
                            'hz:bg-background hz:text-accent-foreground'
                        )}
                        data-filter-total=""
                    >
                        {totalCount}
                    </span>
                )}
            </>
        );
        const srText = [
            selectedCount > 0 ? `${selectedCount} selected` : '',
            totalCount !== undefined && totalCount > 0
                ? `${totalCount} total`
                : '',
        ]
            .filter(Boolean)
            .join(', ');
        // A caller's aria-label replaces the content: keep the counts in it.
        const labelled =
            ariaLabel !== undefined && srText !== ''
                ? `${ariaLabel}, ${srText}`
                : ariaLabel;

        const pillInner = (
            <>
                {showIcon && <FunnelIcon aria-hidden="true" />}
                <span className="hz:min-w-0 hz:truncate">{label}</span>
                {/* The bubbles are visual; their meaning is read from here. */}
                {srText && <span className="hz:sr-only">, {srText}</span>}
                {content}
                {!hideCaret && !toggle && (
                    <CaretDownIcon
                        aria-hidden="true"
                        className="hz:transition-transform hz:duration-fast hz:group-data-[state=open]:rotate-180"
                    />
                )}
            </>
        );

        if (toggle)
            return (
                <button
                    {...rest}
                    ref={ref}
                    type="button"
                    disabled={disabled}
                    aria-pressed={value.length > 0}
                    aria-label={labelled}
                    className={cn(pill, className)}
                    data-filter=""
                >
                    {pillInner}
                </button>
            );

        const optionsList = loading ? (
            <div
                role="status"
                className="hz:flex hz:min-h-11 hz:items-center hz:gap-2 hz:text-body-secondary hz:text-muted-foreground"
            >
                <Spinner aria-hidden="true" size="sm" tone="muted" />
                {loadingMessage}
            </div>
        ) : visible.length === 0 ? (
            <p
                role="status"
                className="hz:m-0 hz:py-2 hz:text-body-secondary hz:text-muted-foreground"
            >
                {emptyMessage}
            </p>
        ) : variant === 'multiple' ? (
            <div
                role="group"
                aria-label={label}
                className="hz:flex hz:flex-col"
                data-filter-options=""
            >
                {visible.map((o) => (
                    <Checkbox
                        key={o.value}
                        label={o.label}
                        disabled={o.disabled}
                        checked={staged.includes(o.value)}
                        onCheckedChange={(checked) =>
                            setStaged((s) =>
                                checked === true
                                    ? [
                                          ...s.filter((v) => v !== o.value),
                                          o.value,
                                      ]
                                    : s.filter((v) => v !== o.value)
                            )
                        }
                    />
                ))}
            </div>
        ) : (
            <RadioGroup
                aria-label={label}
                value={staged[0] ?? ''}
                onValueChange={(next) => {
                    if (applyLabel !== undefined) setStaged([next]);
                    else {
                        commit([next]);
                        setOpen(false);
                    }
                }}
                data-filter-options=""
            >
                {visible.map((o) => (
                    <RadioGroupItem
                        key={o.value}
                        value={o.value}
                        label={o.label}
                        disabled={o.disabled}
                    />
                ))}
            </RadioGroup>
        );

        return (
            <Popover open={open} onOpenChange={changeOpen}>
                <PopoverTrigger asChild>
                    <button
                        {...rest}
                        ref={ref}
                        type="button"
                        disabled={disabled}
                        aria-haspopup="dialog"
                        aria-label={labelled}
                        className={cn(pill, className)}
                        data-filter=""
                    >
                        {pillInner}
                    </button>
                </PopoverTrigger>
                <PopoverContent
                    align="start"
                    aria-label={label}
                    width="296px"
                    data-filter-panel=""
                    footer={
                        applyLabel !== undefined ? (
                            <>
                                {staged.length > 0 && (
                                    <Button
                                        variant="tertiary"
                                        size="sm"
                                        disabled={loading}
                                        onClick={() => {
                                            setStaged([]);
                                            commit([]);
                                            setOpen(false);
                                        }}
                                    >
                                        {resetLabel}
                                    </Button>
                                )}
                                <Button
                                    size="sm"
                                    disabled={loading || same(staged, value)}
                                    onClick={() => {
                                        commit(staged);
                                        setOpen(false);
                                    }}
                                >
                                    {applyLabel}
                                </Button>
                            </>
                        ) : undefined
                    }
                >
                    <div className="hz:flex hz:flex-col hz:gap-2" id={groupId}>
                        {searchable && (
                            <Input
                                type="search"
                                size="sm"
                                aria-label={searchLabel}
                                placeholder={searchLabel}
                                value={query}
                                disabled={loading}
                                clearable
                                onChange={(e) => setQuery(e.target.value)}
                            />
                        )}
                        <div className="hz:max-h-60 hz:overflow-y-auto">
                            {optionsList}
                        </div>
                    </div>
                </PopoverContent>
            </Popover>
        );
    }
);
Filter.displayName = 'Filter';
