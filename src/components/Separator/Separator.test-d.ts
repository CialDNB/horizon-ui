import type { ComponentRef } from 'react';
import type { Separator, SeparatorProps } from '.';

export const decorative: SeparatorProps = { 'data-did': 'rule' };
export const semantic: SeparatorProps = {
    orientation: 'vertical',
    decorative: false,
};

export const ref: ComponentRef<typeof Separator> | null =
    null as HTMLDivElement | null;

// @ts-expect-error a separator has no children (no text divider in x-core usage)
export const children: SeparatorProps = { children: 'or' };

// @ts-expect-error the role follows `decorative`
export const role: SeparatorProps = { role: 'separator' };

// @ts-expect-error MUI `flexItem`: vertical separators always stretch
export const flexItem: SeparatorProps = { flexItem: true };

// @ts-expect-error orientation is horizontal or vertical
export const diagonal: SeparatorProps = { orientation: 'diagonal' };
