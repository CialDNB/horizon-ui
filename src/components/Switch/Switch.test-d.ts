import type { ComponentRef } from 'react';
import type { Switch, SwitchProps } from '.';

export const full: SwitchProps = {
    label: 'Alerts',
    checked: true,
    onCheckedChange: (checked: boolean) => checked,
    invalid: false,
    disabled: false,
    name: 'alerts',
    'data-did': 'alerts',
};

export const ref: ComponentRef<typeof Switch> | null =
    null as HTMLButtonElement | null;

export const onChange: SwitchProps = {
    // @ts-expect-error MUI onChange(event, checked) is onCheckedChange(checked)
    onChange: () => undefined,
};

export const size: SwitchProps = {
    // @ts-expect-error Switch has one size
    size: 'small',
};
