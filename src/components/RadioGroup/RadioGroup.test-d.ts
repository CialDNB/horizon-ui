import type { ComponentRef } from 'react';
import type {
    RadioGroup,
    RadioGroupItem,
    RadioGroupItemProps,
    RadioGroupProps,
} from '.';

export const full: RadioGroupProps = {
    value: 'a',
    onValueChange: (value: string) => value,
    orientation: 'horizontal',
    size: 'sm',
    invalid: false,
    dir: 'rtl',
    name: 'plan',
    required: true,
    'aria-label': 'Plan',
    'data-did': 'plan',
};

export const item: RadioGroupItemProps = { value: 'a', label: 'A' };

export const groupRef: ComponentRef<typeof RadioGroup> | null =
    null as HTMLDivElement | null;
export const itemRef: ComponentRef<typeof RadioGroupItem> | null =
    null as HTMLButtonElement | null;

// @ts-expect-error an item needs a value
export const noValue: RadioGroupItemProps = { label: 'A' };

export const row: RadioGroupProps = {
    // @ts-expect-error x-core row is orientation="horizontal"
    row: true,
};
