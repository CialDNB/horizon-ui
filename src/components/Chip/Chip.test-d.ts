import type { ComponentRef } from 'react';
import type { Chip, ChipProps } from '.';

export const full: ChipProps = {
    label: 'Germany',
    variant: 'success',
    appearance: 'outline',
    size: 'sm',
    icon: null,
    onClick: () => undefined,
    onDelete: () => undefined,
    removeLabel: 'Remove country Germany',
    disabled: false,
    'data-did': 'country-chip',
};

export const ref: ComponentRef<typeof Chip> | null =
    null as HTMLSpanElement | null;

// @ts-expect-error label is required: it names the chip and its remove button
export const noLabel: ChipProps = { variant: 'info' };

// @ts-expect-error the label is text (it also builds `Remove <label>`)
export const nodeLabel: ChipProps = { label: { text: 'Germany' } };

// @ts-expect-error x-core palette colours are not tones ('grey' is now 'neutral')
export const greyChip: ChipProps = { label: 'x', variant: 'grey' };

// @ts-expect-error x-core `variant="filled"` is now `appearance="soft"`
export const filled: ChipProps = { label: 'x', appearance: 'filled' };

// @ts-expect-error x-core size names are not accepted ('small' is now 'sm')
export const small: ChipProps = { label: 'x', size: 'small' };
