// src/tokens/zIndex.ts
// Stacking order for horizon overlays. Every layer sits above MUI's modal
// (1300, x-core dialogs in customer360), so a horizon overlay opened from
// inside an MUI dialog is not hidden behind it. A dialog stays below the
// dropdown/popover/tooltip layers so those open over it.

/** z-index per overlay layer (emitted as `--z-<name>` on `.hz-root`). */
export const zIndex = {
    dialog: 1350,
    dropdown: 1400,
    popover: 1450,
    tooltip: 1500,
    toast: 1600,
} as const;
