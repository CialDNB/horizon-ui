import type { ComponentRef } from 'react';
import type { Checkbox, CheckboxProps } from '.';

export const full: CheckboxProps = {
    label: 'Accept',
    size: 'sm',
    invalid: false,
    checked: 'indeterminate',
    onCheckedChange: (checked) => {
        const value: boolean | 'indeterminate' = checked;
        return value;
    },
    name: 'accept',
    value: 'yes',
    required: true,
    disabled: false,
    'data-did': 'accept',
};

export const ref: ComponentRef<typeof Checkbox> | null =
    null as HTMLButtonElement | null;

export const onChange: CheckboxProps = {
    // @ts-expect-error MUI onChange(event, checked) is onCheckedChange(checked)
    onChange: () => undefined,
};

export const small: CheckboxProps = {
    // @ts-expect-error x-core 'small' is 'sm'
    size: 'small',
};
