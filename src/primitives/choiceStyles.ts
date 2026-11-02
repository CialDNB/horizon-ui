/*
 * Shared layout of choice controls (Checkbox, RadioGroup items, Switch): a
 * real button box as the touch target (no overlapping hit layer) with the
 * visual control centred in it, and a native <label> next to it.
 */

/**
 * The control's button. 44px square at mobile and on touch pointers: the
 * box is the target, it takes layout space, so neighbours (stacked options
 * 44px apart) never overlap. With a fine pointer from tablet it shrinks to
 * the visual size plus a 2px ring gap. Margin, border, padding and the focus
 * outline are reset against Bootstrap's `button` rules and customer360's
 * `button + button` / `button:focus`.
 */
export const choiceTarget =
    'hz:group hz:relative hz:m-0 hz:inline-flex hz:shrink-0 hz:cursor-pointer hz:items-center hz:justify-center hz:rounded-xs hz:border-0 hz:bg-transparent hz:p-0 hz:align-middle hz:outline-none hz:focus:outline-none hz:disabled:cursor-not-allowed';

/**
 * Forced colors: box/circle/track boundaries are shadows or fills, which
 * forced colors removes; a CanvasText border keeps the control visible.
 */
export const choiceForcedBorder =
    'hz:forced-colors:border hz:forced-colors:border-solid hz:forced-colors:border-[CanvasText]';

/**
 * A fill that must stay visible in forced colors (radio dot, switch thumb):
 * opts out of adjustment with a system colour.
 */
export const choiceForcedFill =
    'hz:forced-colors:forced-color-adjust-none hz:forced-colors:bg-[CanvasText]';

/** Focus ring drawn on the visual control (not the 44px target). */
export const choiceFocusRing =
    'hz:outline-ring hz:group-focus-visible:outline-2 hz:group-focus-visible:outline-offset-2 hz:group-focus-visible:outline-solid';

/** Wrapper: control and label side by side, label wraps under itself. */
export const choiceWrapper =
    'hz:m-0 hz:inline-flex hz:max-w-full hz:min-w-0 hz:items-start hz:align-middle hz:tablet:pointer-fine:gap-2';

/**
 * Option label: body/default (16/20) at every breakpoint (wrapped option
 * text needs the leading; x-core FormControlLabel was 14px). Padding centres
 * the first line on the 44px (mobile) or 24px (fine pointer) target. Every
 * property host `label` rules set is restated.
 */
export const choiceLabel =
    'hz:m-0 hz:block hz:min-w-0 hz:cursor-pointer hz:py-3 hz:text-body-default hz:break-words hz:text-foreground hz:select-none hz:tablet:pointer-fine:py-0.5';

/** Muted label of a disabled choice. */
export const choiceLabelDisabled =
    'hz:cursor-not-allowed hz:text-muted-foreground';
