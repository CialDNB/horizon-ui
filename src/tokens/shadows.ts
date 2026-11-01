// src/tokens/shadows.ts
// DS Reference: Horizon DS — elevation-and-shadow.md
// Shadow color: rgba(31,50,88,0.08) = primary/dark at 8% opacity.

const elevationShadowColor = 'rgba(31,50,88,0.08)';

/** Elevation shadows 1-4 (cards, dropdowns, dialogs, modals). */
export const elevation = {
    1: `0px 1px 3px ${elevationShadowColor}, 0px 1px 6px ${elevationShadowColor}, 0px 2px 1px -1px ${elevationShadowColor}`,
    // elevation 2 uses pure black at 8% (not brand) for stronger mid-range contrast
    2: `0px 1px 18px rgba(0,0,0,0.08), 0px 6px 10px rgba(0,0,0,0.08), 0px 3px 5px -1px rgba(0,0,0,0.08)`,
    3: `0px 4px 20px 3px ${elevationShadowColor}, 0px 11px 15px 1px ${elevationShadowColor}, 0px 6px 7px -4px ${elevationShadowColor}`,
    4: `0px 8px 40px 7px ${elevationShadowColor}, 0px 21px 33px 3px ${elevationShadowColor}, 0px 10px 13px -6px ${elevationShadowColor}`,
} as const;
