// src/tokens/typography.ts
// DS Reference: Horizon DS — Typography_System_Docs.md
// Base: 16px = 1rem. All values in rem. htmlFontSize = 16.

/** Base font stack. */
export const fontFamily = "'Open Sans', sans-serif";

/** Font sizes in rem keyed by px size (16px root). */
export const fontSize = {
    10: '0.625rem',
    12: '0.75rem',
    14: '0.875rem',
    16: '1rem',
    20: '1.25rem',
    24: '1.5rem',
    28: '1.75rem',
    32: '2rem',
    36: '2.25rem',
    40: '2.5rem',
    44: '2.75rem',
} as const;

/** Line heights in rem keyed by px size (16px root). */
export const lineHeight = {
    10: '0.625rem',
    12: '0.75rem',
    14: '0.875rem',
    16: '1rem',
    20: '1.25rem',
    24: '1.5rem',
    28: '1.75rem',
    32: '2rem',
    36: '2.25rem',
    40: '2.5rem',
    44: '2.75rem',
} as const;

/** Named font weights. */
export const fontWeight = {
    light: 300,
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extraBold: 800,
} as const;

// Semantic scale — domain/size/weight pattern per Horizon DS
// All 4 weight variants available: bold, semibold, regular, light
/**
 * Semantic type scale: 11 roles in `{role}/{size}` notation.
 * Values here are rem (16px root); the generated CSS (`tokens.css`, the
 * `text-<role>` utilities) emits them as px so a 14px host root cannot shrink
 * them (ADR 0001).
 */
export const typeScale = {
    'display/xl': {
        fontSize: fontSize[44],
        lineHeight: lineHeight[44],
        fontWeight: fontWeight.bold,
    },
    'display/lg': {
        fontSize: fontSize[40],
        lineHeight: lineHeight[40],
        fontWeight: fontWeight.bold,
    },
    'heading/xl': {
        fontSize: fontSize[36],
        lineHeight: lineHeight[36],
        fontWeight: fontWeight.bold,
    },
    'heading/lg': {
        fontSize: fontSize[32],
        lineHeight: lineHeight[32],
        fontWeight: fontWeight.bold,
    },
    'heading/md': {
        fontSize: fontSize[28],
        lineHeight: lineHeight[28],
        fontWeight: fontWeight.semibold,
    },
    'heading/sm': {
        fontSize: fontSize[24],
        lineHeight: lineHeight[24],
        fontWeight: fontWeight.bold,
    },
    'body/lg': {
        fontSize: fontSize[20],
        lineHeight: lineHeight[20],
        fontWeight: fontWeight.regular,
    },
    'body/default': {
        fontSize: fontSize[16],
        lineHeight: lineHeight[20],
        fontWeight: fontWeight.regular,
    },
    'body/secondary': {
        fontSize: fontSize[14],
        lineHeight: lineHeight[14],
        fontWeight: fontWeight.regular,
    },
    caption: {
        fontSize: fontSize[12],
        lineHeight: lineHeight[12],
        fontWeight: fontWeight.regular,
    },
    micro: {
        fontSize: fontSize[10],
        lineHeight: lineHeight[10],
        fontWeight: fontWeight.regular,
    },
} as const;
