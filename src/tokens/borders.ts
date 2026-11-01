// src/tokens/borders.ts
// DS Reference: Horizon DS — borders-and-dividers.md

/** Border widths. */
export const borderWidth = {
    0: '0px',
    1: '1px',
    2: '2px',
    4: '4px',
    8: '8px',
} as const;

// NOTE: These hex values mirror tokens/colors.ts. If colors.ts is updated,
// update here too — no runtime link exists since this file has no imports.
/** Border colours; hex values mirror colors.ts. */
export const borderColor = {
    subtle: '#E2E8F0', // blueGrey/200
    default: '#CBD5E1', // blueGrey/300 — inputs resting
    strong: '#94A3B8', // blueGrey/400
    inverse: '#0F172A', // blueGrey/900
    focus: '#0050F0', // blue/500
    warning: '#FFA000',
    error: '#E70D32',
    success: '#009688',
} as const;

/** Composite border shorthands. */
export const border = {
    default: `1px solid ${borderColor.default}`, // inputs resting
    focus: `2px solid ${borderColor.focus}`, // all interactive focus
    error: `2px solid ${borderColor.error}`,
    thick: `4px solid ${borderColor.focus}`, // active nav indicator, left accent
    dashed: `1px dashed ${borderColor.default}`, // drop zones
} as const;
