/*
 * Based on shadcn/ui Input (registry 2025), extended with a field box for
 * adornments, clear and loading (no shadcn equivalent). Native <input>.
 * Replaces x-core `TextField` (MUI TextField wrapper) and `TextInput`
 * (x-core 2.2.30); the label, helper text and error message move to
 * `FormField`.
 */
import { WarningCircleIcon } from '@phosphor-icons/react/dist/csr/WarningCircle';
import { XIcon } from '@phosphor-icons/react/dist/csr/X';
import { cva, type VariantProps } from 'class-variance-authority';
import {
    forwardRef,
    useRef,
    useState,
    type ChangeEvent,
    type InputHTMLAttributes,
    type ReactNode,
} from 'react';
import { cn } from '../../lib/cn';
import { omitLegacyProps, resolveOption } from '../../lib/options';
import {
    composeRefs,
    fieldBase,
    fieldState,
    fieldStateOf,
    useFieldControl,
} from '../../primitives';
import { Spinner } from '../Spinner';
import type { DnbBase } from '../../types/DnbBase';

const inputStyles = cva(
    [
        fieldBase,
        'hz:flex hz:items-center hz:gap-2',
        // The text size lives on the <input> (see inputText): host rules
        // (`input { font-size: 14px }`) target the element, not the box.
    ],
    {
        variants: {
            // Mobile and touch pointers: at least 44px tall with 16px text
            // (no iOS zoom on focus). Tablet and up with a fine pointer:
            // sm 32, md 40 (x-core TextInput default), lg 48.
            size: {
                sm: 'hz:h-11 hz:px-3 hz:tablet:pointer-fine:h-8',
                md: 'hz:h-11 hz:px-4 hz:tablet:pointer-fine:h-10',
                lg: 'hz:h-12 hz:px-4',
            },
            state: {
                rest: `${fieldState.rest} hz:has-[>input:focus]:ring-2 hz:has-[>input:focus]:ring-ring`,
                invalid: `${fieldState.invalid} hz:has-[>input:focus]:ring-2`,
                disabled: fieldState.disabled,
                readOnly: `${fieldState.readOnly} hz:has-[>input:focus]:ring-2 hz:has-[>input:focus]:ring-ring`,
            },
        },
        defaultVariants: { size: 'md', state: 'rest' },
    }
);

const inputText = {
    sm: 'hz:text-body-default hz:tablet:pointer-fine:text-body-secondary',
    md: 'hz:text-body-default hz:tablet:pointer-fine:text-body-secondary',
    lg: 'hz:text-body-default',
} as const;

// Every property a host `input` rule touches is set on the element:
// Bootstrap reboot (margin, font, line-height, search appearance, number
// spin buttons) and customer360 (`input { font-size }`, `::placeholder`).
const inputElement = [
    'hz:m-0 hz:h-full hz:min-w-0 hz:flex-1 hz:appearance-none hz:rounded-none hz:border-0 hz:bg-transparent hz:p-0',
    'hz:text-foreground hz:outline-none hz:shadow-none hz:placeholder:text-muted-foreground hz:placeholder:opacity-100',
    'hz:disabled:cursor-not-allowed hz:disabled:text-muted-foreground',
    // The reboot's `[type='search'] { outline-offset: -2px }` (0,1,0) would
    // win when it loads later; `[type]` raises this to 0,2,0.
    'hz:[&[type]]:outline-offset-0',
    // Number spin buttons and the search cancel button are hidden: their
    // look differs per browser; use clearable for clearing.
    'hz:[&::-webkit-inner-spin-button]:m-0 hz:[&::-webkit-inner-spin-button]:appearance-none hz:[&::-webkit-outer-spin-button]:m-0 hz:[&::-webkit-outer-spin-button]:appearance-none hz:[-moz-appearance:textfield]',
    'hz:[&::-webkit-search-cancel-button]:appearance-none hz:[&::-webkit-search-decoration]:appearance-none',
].join(' ');

const adornment =
    'hz:flex hz:shrink-0 hz:items-center hz:text-muted-foreground hz:[&>svg]:size-4 hz:[&>svg]:align-middle';

// A 44px target at mobile (32px with a fine pointer from tablet) that
// reaches into the field padding; the icon is 16px. `m-0` first: host
// `button + button { margin-left }` and the reboot's `button { margin: 0 }`.
const clearButton = [
    'hz:m-0 hz:-me-3 hz:inline-flex hz:size-11 hz:shrink-0 hz:cursor-pointer hz:items-center hz:justify-center hz:rounded-full hz:border-0 hz:bg-transparent hz:p-0 hz:text-muted-foreground',
    'hz:tablet:pointer-fine:-me-2 hz:tablet:pointer-fine:size-8',
    'hz:transition-colors hz:duration-fast hz:ease-standard hz:hover:text-foreground',
    'hz:focus:outline-none hz:focus-visible:outline-2 hz:focus-visible:-outline-offset-2 hz:focus-visible:outline-solid hz:focus-visible:outline-ring',
    'hz:[&_svg]:size-4 hz:[&_svg]:align-middle',
].join(' ');

/** Options accepted by {@link inputVariants}: `size`, `state`. */
export type InputVariantOptions = VariantProps<typeof inputStyles>;

/** Size of an {@link Input}. */
export type InputSize = NonNullable<InputVariantOptions['size']>;

const inputSizes: readonly InputSize[] = ['sm', 'md', 'lg'];

/** Class string for the Input field box, conflict-resolved with `cn()`. */
export function inputVariants(options?: InputVariantOptions): string {
    return cn(inputStyles(options));
}

/** x-core TextField / TextInput / MUI props that are dropped (dev warning). */
const legacyInputProps = {
    label: 'wrap in FormField label',
    helperText: 'use FormField description or error',
    error: 'use invalid, or FormField error',
    success: 'not supported',
    fullWidth: 'Input is full width by default',
    InputProps: 'use startAdornment / endAdornment',
    inputProps: 'pass the attributes to Input directly',
    InputLabelProps: 'use FormField',
    FormHelperTextProps: 'use FormField',
    inputRef: 'use ref',
    sx: 'use className',
    variant: 'Input has one look',
    margin: 'use layout spacing',
    color: 'Input has one look',
    multiline: 'use Textarea',
    minRows: 'use Textarea',
    maxRows: 'use Textarea',
    rows: 'use Textarea',
    characterLimit: 'use maxLength (and FormField description for a counter)',
    mask: 'not supported yet',
    definitions: 'not supported yet',
    hideAdornment: 'not needed',
    leadingAdornment: 'use startAdornment',
    isLabelContainer: 'use FormField',
    isLoading: 'use loading',
    info: 'use FormField description',
    append: 'not supported',
} as const;

/** Props for {@link Input}. */
export type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> &
    DnbBase & {
        /**
         * Height and text size. Mobile and touch pointers: 44px (lg 48px)
         * with 16px text; from `tablet` with a fine pointer sm 32, md 40,
         * lg 48px (sm/md 14px text).
         * @default 'md'
         */
        size?: InputSize;
        /**
         * Invalid look and `aria-invalid`, plus a warning icon (not colour
         * alone). Inside a `FormField` with an `error` it is set for you.
         * @default false
         */
        invalid?: boolean;
        /** Content before the text (icon, prefix). Decorative icons need `aria-hidden`. */
        startAdornment?: ReactNode;
        /** Content after the text (icon, unit, an `IconButton size="sm"`). */
        endAdornment?: ReactNode;
        /**
         * Shows a clear button while the input has a value. It empties the
         * input (firing `onChange` with an empty value) and refocuses it.
         * @default false
         */
        clearable?: boolean;
        /** Accessible name of the clear button (translate it). @default 'Clear' */
        clearLabel?: string;
        /** Called after the clear button emptied the input. */
        onClear?: () => void;
        /**
         * Shows a spinner at the end and sets `aria-busy` (for example while
         * suggestions load). The input stays editable.
         * @default false
         */
        loading?: boolean;
        /**
         * Classes for the field box (the visible bordered element). Other
         * attributes, `ref` and `data-did` go to the `<input>`.
         */
        className?: string;
    };

function setNativeValue(input: HTMLInputElement, value: string) {
    Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        'value'
    )?.set?.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
}

/**
 * A single-line text field: a native `<input>` in a field box with optional
 * adornments, clear button and loading spinner. Name it with `FormField`
 * (or `aria-label`); inside a FormField it takes the id, description, error
 * and required wiring automatically.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
    {
        size: sizeProp,
        invalid: invalidProp,
        startAdornment,
        endAdornment,
        clearable = false,
        clearLabel = 'Clear',
        onClear,
        loading = false,
        className,
        type = 'text',
        id: idProp,
        disabled: disabledProp,
        readOnly = false,
        required,
        value,
        defaultValue,
        onChange,
        'aria-describedby': describedByProp,
        ...props
    },
    ref
) {
    const rest = omitLegacyProps('Input', props, legacyInputProps);
    const size = resolveOption('Input', 'size', sizeProp, inputSizes, 'md');
    const control = useFieldControl({
        id: idProp,
        'aria-describedby': describedByProp,
        invalid: invalidProp,
        required,
        disabled: disabledProp,
    });
    const inputRef = useRef<HTMLInputElement>(null);
    const controlled = value !== undefined;
    const [uncontrolledFilled, setUncontrolledFilled] = useState(
        () => defaultValue !== undefined && String(defaultValue) !== ''
    );
    const filled = controlled
        ? value !== null && String(value) !== ''
        : uncontrolledFilled;
    const state = fieldStateOf({
        disabled: control.disabled,
        readOnly,
        invalid: control.invalid,
    });
    const showClear = clearable && filled && !control.disabled && !readOnly;

    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
        if (!controlled) setUncontrolledFilled(event.target.value !== '');
        onChange?.(event);
    };
    const clear = () => {
        const input = inputRef.current;
        if (!input) return;
        setNativeValue(input, '');
        input.focus();
        onClear?.();
    };

    return (
        <div
            className={cn(inputStyles({ size, state }), className)}
            data-input-field=""
            data-size={size}
            data-invalid={control.invalid || undefined}
            data-disabled={control.disabled || undefined}
            data-readonly={readOnly || undefined}
        >
            {startAdornment !== undefined && (
                <span className={adornment}>{startAdornment}</span>
            )}
            <input
                {...rest}
                ref={composeRefs(ref, inputRef)}
                type={type}
                id={control.id}
                value={value}
                defaultValue={defaultValue}
                onChange={handleChange}
                disabled={control.disabled}
                readOnly={readOnly}
                required={required}
                aria-required={control.required || undefined}
                aria-invalid={control.invalid || undefined}
                aria-describedby={control['aria-describedby']}
                aria-busy={loading || undefined}
                className={cn(inputElement, inputText[size])}
            />
            {loading && (
                <Spinner
                    aria-hidden="true"
                    size="sm"
                    tone="muted"
                    data-input-loading=""
                />
            )}
            {control.invalid && !loading && (
                <WarningCircleIcon
                    aria-hidden="true"
                    data-input-invalid-icon=""
                    className="hz:size-4 hz:shrink-0 hz:align-middle hz:text-destructive-strong"
                />
            )}
            {showClear && (
                <button
                    type="button"
                    aria-label={clearLabel}
                    className={clearButton}
                    onClick={clear}
                >
                    <XIcon aria-hidden="true" />
                </button>
            )}
            {endAdornment !== undefined && (
                <span className={adornment}>{endAdornment}</span>
            )}
        </div>
    );
});
Input.displayName = 'Input';
