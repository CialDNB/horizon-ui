// src/tokens/spacing.ts
// DS Reference: Horizon DS — Spacing_System_Docs.md
// Base unit: 4px. 1 unit = 4px.

/** Spacing unit in px (4px). */
export const spacingBase = 4; // px

/** Named spacing steps in px, keyed by multiplier of the 4px base. */
export const spacing = {
    1: 4,
    2: 8,
    3: 12,
    4: 16,
    5: 20,
    6: 24,
    7: 28,
    8: 32,
    9: 36,
    10: 40,
    11: 44,
    12: 48,
    13: 52,
    14: 56,
    15: 60,
    16: 64,
    17: 68,
    18: 72,
    19: 76,
    20: 80,
    21: 84,
    22: 88,
    23: 92,
    24: 96,
} as const;

/** Dialog widths in px per size. */
export const dialogWidth = {
    mobile: 312,
    sm: 570,
    md: 600,
    lg: 900,
    xl: 1136,
} as const;
