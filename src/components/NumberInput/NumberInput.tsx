/*
 * No shadcn base (shadcn has no number field): Input with the WAI-ARIA
 * spinbutton pattern and stepper buttons. Replaces x-core `NumberInputV2`
 * (`components/inputs`, MUI TextField with arrows, min/max, decimals,
 * thousand separator, x-core 2.2.30); `NumberInput` (v1) is superseded.
 */
import { MinusIcon } from '@phosphor-icons/react/dist/csr/Minus';
import { PlusIcon } from '@phosphor-icons/react/dist/csr/Plus';
import {
    forwardRef,
    useEffect,
    useId,
    useRef,
    useState,
    type ChangeEvent,
    type FocusEvent,
    type KeyboardEvent,
} from 'react';
import { cn } from '../../lib/cn';
import { omitLegacyProps } from '../../lib/options';
import { inlineActionBase, useFormField } from '../../primitives';
import { Input, type InputProps } from '../Input';

/** x-core NumberInput / NumberInputV2 / TextField props that are dropped (dev warning). */
const legacyNumberInputProps = {
    onChange: 'use onValueChange(value)',
    showArrows: 'use showSteppers',
    isLoading: 'use loading',
    handleIncrement: 'use onValueChange (steppers are built in)',
    handleDecrement: 'use onValueChange (steppers are built in)',
    append: 'not supported',
    selectOptions: 'not supported',
    selectValue: 'not supported',
    onSelectChange: 'not supported',
    selectPlaceholder: 'not supported',
    selectedCountry: 'not supported',
    onCountryChange: 'not supported',
    defaultCountry: 'not supported',
    inputLabel: 'use FormField label',
    hiddenLabel: 'use aria-label',
} as const;

/** Props for {@link NumberInput}. */
export type NumberInputProps = Omit<
    InputProps,
    | 'type'
    | 'value'
    | 'defaultValue'
    | 'onChange'
    | 'min'
    | 'max'
    | 'step'
    | 'endAdornment'
    | 'inputMode'
    | 'role'
> & {
    /** The number (controlled); `null` = empty. */
    value?: number | null;
    /** Initial number (uncontrolled). */
    defaultValue?: number | null;
    /**
     * Called with the number while typing (only when it parses and is in
     * range, as x-core), on every step, with the clamped number on blur, and
     * with `null` when emptied.
     */
    onValueChange?: (value: number | null) => void;
    /** Lowest allowed value (`aria-valuemin`; Home jumps here). */
    min?: number;
    /** Highest allowed value (`aria-valuemax`; End jumps here). */
    max?: number;
    /** Arrow keys and steppers change by this; Page Up/Down by 10x. @default 1 */
    step?: number;
    /** Fixed number of decimals after stepping and on blur (x-core `decimalPlaces`). */
    decimalPlaces?: number;
    /** Accept a minus sign. @default true unless `min` is 0 or more */
    allowNegative?: boolean;
    /** Group thousands with "," while displaying (x-core `thousandSeparator`). @default false */
    thousandSeparator?: boolean;
    /** Shows the decrease/increase buttons (x-core `showArrows`). @default true */
    showSteppers?: boolean;
    /** Accessible name of the increase button. Translate it. @default 'Increase' */
    incrementLabel?: string;
    /** Accessible name of the decrease button. Translate it. @default 'Decrease' */
    decrementLabel?: string;
};

const stepper = cn(
    inlineActionBase,
    'hz:text-muted-foreground hz:hover:text-foreground hz:disabled:cursor-not-allowed hz:disabled:text-input hz:[&_svg]:size-4 hz:[&_svg]:align-middle'
);

function clean(text: string, allowNegative: boolean): string {
    let out = text.replace(/,/g, '');
    out = out.replace(allowNegative ? /[^0-9.-]/g : /[^0-9.]/g, '');
    const parts = out.split('.');
    if (parts.length > 2) out = `${parts[0]}.${parts.slice(1).join('')}`;
    if (allowNegative && out.includes('-'))
        out = (out.startsWith('-') ? '-' : '') + out.replace(/-/g, '');
    return out;
}

function parse(text: string): number | null {
    if (text === '' || text === '-' || text === '.' || text === '-.')
        return null;
    const n = Number(text);
    return Number.isFinite(n) ? n : null;
}

/**
 * A number field (`role="spinbutton"` with `aria-valuenow/min/max`):
 * typing keeps only digits, one decimal point and an optional leading minus;
 * ArrowUp/ArrowDown step, Page Up/Down step by 10, Home/End jump to
 * min/max; the stepper buttons (44px at mobile, out of the tab order as the
 * pattern recommends) do the same and disable at the bounds. Out-of-range
 * text is clamped on blur. Built on Input (sizes, states, FormField).
 */
export const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(
    function NumberInput(
        {
            value,
            defaultValue,
            onValueChange,
            min,
            max,
            step = 1,
            decimalPlaces,
            allowNegative = min === undefined || min < 0,
            thousandSeparator = false,
            showSteppers = true,
            incrementLabel = 'Increase',
            decrementLabel = 'Decrease',
            disabled,
            readOnly,
            id: idProp,
            onKeyDown,
            onBlur,
            ...props
        },
        ref
    ) {
        const rest = omitLegacyProps(
            'NumberInput',
            props,
            legacyNumberInputProps
        );
        const field = useFormField();
        const autoId = useId();
        const id = idProp ?? field?.id ?? autoId;
        const format = (n: number | null): string => {
            if (n === null) return '';
            const fixed =
                decimalPlaces === undefined
                    ? String(n)
                    : n.toFixed(decimalPlaces);
            if (!thousandSeparator) return fixed;
            const [whole = '', fraction] = fixed.split('.');
            const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
            return fraction === undefined ? grouped : `${grouped}.${fraction}`;
        };
        const [text, setText] = useState(() =>
            format(value ?? defaultValue ?? null)
        );
        const current = parse(clean(text, allowNegative));
        // A controlled value changed from outside: show it.
        const lastValue = useRef(value);
        useEffect(() => {
            if (value === undefined || value === lastValue.current) return;
            lastValue.current = value;
            if (value !== current) setText(format(value));
        });

        const inRange = (n: number) =>
            (min === undefined || n >= min) && (max === undefined || n <= max);
        const clamp = (n: number) =>
            Math.min(max ?? Infinity, Math.max(min ?? -Infinity, n));
        const round = (n: number) =>
            decimalPlaces === undefined
                ? Number(n.toFixed(10))
                : Number(n.toFixed(decimalPlaces));
        const commit = (n: number | null) => {
            setText(format(n));
            onValueChange?.(n);
        };
        const inactive = disabled === true || readOnly === true;
        const stepBy = (delta: number) => {
            if (inactive) return;
            commit(clamp(round((current ?? min ?? 0) + delta)));
        };
        const atMax = max !== undefined && current !== null && current >= max;
        const atMin = min !== undefined && current !== null && current <= min;

        const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
            const raw = event.target.value;
            const cleaned = clean(raw, allowNegative);
            const n = parse(cleaned);
            // Keep what is being typed (grouping only re-applied on blur).
            setText(cleaned);
            if (n === null) onValueChange?.(null);
            else if (inRange(n)) onValueChange?.(n);
        };
        const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
            onKeyDown?.(event);
            if (event.defaultPrevented) return;
            const keys: Record<string, () => void> = {
                ArrowUp: () => stepBy(step),
                ArrowDown: () => stepBy(-step),
                PageUp: () => stepBy(step * 10),
                PageDown: () => stepBy(-step * 10),
                ...(min !== undefined && {
                    Home: () => !inactive && commit(min),
                }),
                ...(max !== undefined && {
                    End: () => !inactive && commit(max),
                }),
            };
            const action = keys[event.key];
            if (!action) return;
            event.preventDefault();
            action();
        };
        const handleBlur = (event: FocusEvent<HTMLInputElement>) => {
            onBlur?.(event);
            if (current === null) {
                if (text !== '') setText('');
                return;
            }
            const fixed = clamp(round(current));
            if (fixed !== current) commit(fixed);
            else setText(format(current));
        };

        return (
            <Input
                {...rest}
                ref={ref}
                id={id}
                type="text"
                role="spinbutton"
                inputMode={
                    decimalPlaces === 0 && !allowNegative
                        ? 'numeric'
                        : 'decimal'
                }
                autoComplete="off"
                aria-valuenow={current ?? undefined}
                aria-valuemin={min}
                aria-valuemax={max}
                aria-valuetext={text === '' ? undefined : text}
                disabled={disabled}
                readOnly={readOnly}
                value={text}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                onBlur={handleBlur}
                endAdornment={
                    showSteppers ? (
                        <span
                            className="hz:-me-3 hz:flex hz:items-center hz:tablet:pointer-fine:-me-2"
                            data-number-steppers=""
                        >
                            <button
                                type="button"
                                tabIndex={-1}
                                aria-label={decrementLabel}
                                aria-controls={id}
                                disabled={inactive || atMin}
                                className={stepper}
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => stepBy(-step)}
                            >
                                <MinusIcon aria-hidden="true" weight="bold" />
                            </button>
                            <button
                                type="button"
                                tabIndex={-1}
                                aria-label={incrementLabel}
                                aria-controls={id}
                                disabled={inactive || atMax}
                                className={stepper}
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => stepBy(step)}
                            >
                                <PlusIcon aria-hidden="true" weight="bold" />
                            </button>
                        </span>
                    ) : undefined
                }
            />
        );
    }
);
NumberInput.displayName = 'NumberInput';
