import type { ComponentRef } from 'react';
import type { Typography, TypographyProps } from '.';

export const full: TypographyProps = {
    variant: 'heading/md',
    as: 'span',
    color: 'muted-foreground',
    weight: 'semibold',
    align: 'center',
    truncate: 2,
    'data-did': 'page-title',
    id: 'title',
};

export const ref: ComponentRef<typeof Typography> | null =
    null as HTMLElement | null;

// @ts-expect-error MUI variant names are not accepted ('h1' is now 'heading/xl')
export const muiVariant: TypographyProps = { variant: 'h1' };

// @ts-expect-error MUI palette paths are not colours ('text.secondary' is now 'muted-foreground')
export const muiColor: TypographyProps = { color: 'text.secondary' };

// @ts-expect-error failing-contrast text colours are not offered
export const lowContrast: TypographyProps = { color: 'success' };

// @ts-expect-error only 1-4 lines are supported
export const clamp: TypographyProps = { truncate: 5 };

// @ts-expect-error MUI `sx` is not supported
export const sx: TypographyProps = { sx: { mb: 2 } };
