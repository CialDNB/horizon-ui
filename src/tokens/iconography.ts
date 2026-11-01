// src/tokens/iconography.ts
// DS Reference: Horizon DS — iconography.md
// Library: @phosphor-icons/react only.
// Weights: Regular (default) | Duotone (empty states only). Never mix in one component.
// Always use the `size` prop — never set width/height via CSS.

/** Icon sizes in px. */
export const iconSize = {
    xs: 16, // inline / body text
    sm: 20, // navigation, buttons, form fields, toast, alert
    md: 24, // card header (default)
    lg: 32, // empty state illustrations (Duotone weight)
} as const;
