/*
 * Shared look of floating overlays (Popover, DropdownMenu, Dialog, Drawer).
 * Surfaces sit on `popover`, are bounded by a 1px `border` ring and a
 * CanvasText border in forced colors (shadows and rings vanish there), and
 * animate opacity and transform only (keyframes in src/styles/index.css).
 */
import { forcedBorder } from './fieldStyles';

/** Floating surface: colours, radius, elevation, boundary. */
export const overlaySurface = `hz:text-start hz:bg-popover hz:text-popover-foreground hz:shadow-3 hz:ring-1 hz:ring-border hz:outline-none ${forcedBorder}`;

/**
 * Small anchored overlays (popover, menu, tooltip): fade + scale from 96%.
 * Each component sets `transform-origin` to its Radix origin variable.
 */
export const anchoredMotion =
    'hz:[--hz-enter-scale:0.96] hz:data-[state=open]:animate-overlay-in hz:data-[state=delayed-open]:animate-overlay-in hz:data-[state=instant-open]:animate-overlay-in hz:data-[state=closed]:animate-overlay-out';

/** Modal scrim behind Dialog and Drawer: `overlay` at 50%, fades. */
export const scrimStyles =
    'hz:fixed hz:inset-0 hz:z-dialog hz:bg-overlay/50 hz:data-[state=open]:animate-overlay-in hz:data-[state=closed]:animate-overlay-out';

/** Panels (Dialog, Drawer): the slower panel curve. */
export const panelMotion =
    'hz:data-[state=open]:animate-panel-in hz:data-[state=closed]:animate-panel-out';

/**
 * Close button in an overlay header: the shared 44px (32px fine pointer)
 * round icon action, muted icon that darkens on hover.
 */
export { inlineActionBase as overlayCloseBase } from './inlineAction';

/** Logical side of an anchored overlay, relative to its trigger. */
export type LogicalSide = 'top' | 'bottom' | 'start' | 'end';
/** Alignment along the side, logical (start = inline start). */
export type LogicalAlign = 'start' | 'center' | 'end';

/**
 * Radix positions with physical sides and alignments; this maps the logical
 * ones for the text direction (`end` is `right` in ltr, `left` in rtl; a
 * `start` alignment on top/bottom is the right edge in rtl).
 */
export function physicalPlacement(
    side: LogicalSide,
    align: LogicalAlign,
    dir: 'ltr' | 'rtl'
): {
    side: 'top' | 'bottom' | 'left' | 'right';
    align: LogicalAlign;
} {
    const rtl = dir === 'rtl';
    if (side === 'start' || side === 'end')
        return {
            side: (side === 'end') !== rtl ? 'right' : 'left',
            align,
        };
    const flip = rtl && align !== 'center';
    return {
        side,
        align: flip ? (align === 'start' ? 'end' : 'start') : align,
    };
}

/**
 * `onEscapeKeyDown` for a Radix layer: calls `handler`, then stops the
 * native event. Radix listens on `document` in the capture phase; React and
 * MUI listen below it (the root container, an MUI Modal's own `onKeyDown`),
 * so without this an Escape that closes a Horizon overlay opened inside an
 * MUI Dialog would close the MUI Dialog too (measured, coexistence harness).
 * Other Radix layers listen on `document` as well and still see the event.
 */
export function containEscape(
    handler?: (event: KeyboardEvent) => void
): (event: KeyboardEvent) => void {
    return (event) => {
        handler?.(event);
        event.stopPropagation();
    };
}
