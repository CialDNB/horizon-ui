import type { ComponentRef } from 'react';
import type { NumberInput, NumberInputProps } from '.';

export const full: NumberInputProps = {
    value: 3,
    onValueChange: (value: number | null) => value,
    min: 0,
    max: 10,
    step: 0.5,
    decimalPlaces: 1,
    allowNegative: false,
    thousandSeparator: true,
    showSteppers: true,
    incrementLabel: 'More',
    decrementLabel: 'Less',
    size: 'sm',
    clearable: true,
    'aria-label': 'Rows',
    'data-did': 'rows',
};

export const empty: NumberInputProps = { value: null };

export const ref: ComponentRef<typeof NumberInput> | null =
    null as HTMLInputElement | null;

// @ts-expect-error the value is a number, not a string
export const text: NumberInputProps = { value: '3' };

// @ts-expect-error NumberInput is always a spinbutton text field
export const typed: NumberInputProps = { type: 'number' };
