// src/tokens/borderRadius.ts
// DS Reference: Horizon DS — border-radius-system.md

/** Radius scale in px. */
export const borderRadius = {
    none: 0,
    xs: 4, // inline badges, small labels
    sm: 8, // tooltips, small chips, tags
    md: 16, // cards, menus, popovers (default container)
    lg: 20, // buttons, inputs, dialogs — all interactive form elements
    xl: 40, // feature cards, hero banners
    full: 100, // chips, badges, FABs, avatars, pill alerts, toggles
} as const;
