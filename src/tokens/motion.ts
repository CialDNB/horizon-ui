// src/tokens/motion.ts
// DS Reference: Horizon DS — motion-and-animation.md
// RULE: Never animate width/height/top/left — use opacity and transform only.
// RULE: All transitions must respect prefers-reduced-motion (handled in the root stylesheet).

/** Durations in ms. */
export const duration = {
    instant: 0, // no animation
    fast: 100, // hover, focus ring, button press
    normal: 200, // colour change, checkbox, input
    slow: 300, // modal, drawer, dropdown, toast
    slower: 500, // page transitions, onboarding
} as const;

/** Easing curves. */
export const easing = {
    standard: 'cubic-bezier(0.2, 0, 0, 1)', // background movement, colour
    enter: 'cubic-bezier(0, 0, 0.2, 1)', // elements entering viewport
    exit: 'cubic-bezier(0.4, 0, 1, 1)', // elements leaving viewport
    spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)', // toggle, success state
} as const;
