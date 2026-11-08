import type { ComponentRef } from 'react';
import type { SplitButton, SplitButtonOption, SplitButtonProps } from '.';

export const full: SplitButtonProps = {
    options: ['A', { label: 'B', mode: 'v2', disabled: false }],
    onOptionClick: (option: SplitButtonOption, index: number) =>
        `${String(option)}${index}`,
    headline: 'New decision',
    variant: 'secondary',
    size: 'sm',
    disabled: false,
    loading: false,
    defaultSelectedIndex: 1,
    menuLabel: 'More options',
    groupSuffix: 'actions',
    'aria-label': 'New decision',
    'data-did': 'split',
};

export const ref: ComponentRef<typeof SplitButton> | null =
    null as HTMLDivElement | null;

// @ts-expect-error options are required
export const noOptions: SplitButtonProps = {};

export const contained: SplitButtonProps = {
    options: ['A'],
    // @ts-expect-error x-core `contained` is `primary`
    variant: 'contained',
};

// @ts-expect-error an object option needs a label
export const noLabel: SplitButtonOption = { onClick: () => undefined };
