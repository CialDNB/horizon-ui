/*
 * Shared look of text-entry fields (Input, Textarea, Select trigger), so the
 * three cannot drift. The boundary is an inset ring (box-shadow), not a
 * border: host `input`/`button` border rules cannot reach it and adornment
 * buttons get the full 44px height at mobile.
 */

/**
 * Forced colors (Windows High Contrast) drop box-shadows, so the inset ring
 * boundary disappears: a real 1px border in CanvasText replaces it there.
 */
export const forcedBorder =
    'hz:forced-colors:border hz:forced-colors:border-solid hz:forced-colors:border-[CanvasText]';

/** Surface, radius, type colour and motion shared by every field. */
export const fieldBase =
    'hz:relative hz:w-full hz:min-w-0 hz:rounded-lg hz:bg-transparent hz:text-foreground hz:ring-inset hz:transition-[box-shadow,background-color] hz:duration-fast hz:ease-standard ' +
    forcedBorder;

/**
 * Boundary per state. `rest` turns primary on pointer hover (x-core);
 * `invalid` stays destructive; `disabled` sits on `muted`; `readOnly`
 * keeps the rest ring without the hover change.
 * Disabled uses `input` (blueGrey/300): inactive controls are exempt from
 * WCAG 1.4.11, and the muted fill still marks the box.
 */
export const fieldState = {
    rest: 'hz:ring-1 hz:ring-control-border hz:hover:ring-primary',
    invalid: 'hz:ring-1 hz:ring-destructive',
    disabled:
        'hz:cursor-not-allowed hz:bg-muted hz:text-muted-foreground hz:ring-1 hz:ring-input',
    // No hover change (it cannot be edited) and no muted fill: dnb
    // `foreground` on `muted` is 4.34:1.
    readOnly: 'hz:ring-1 hz:ring-control-border',
} as const;

/** A field's visual state. */
export type FieldState = keyof typeof fieldState;

/** Picks the state: disabled beats read-only beats invalid beats rest. */
export function fieldStateOf({
    disabled,
    readOnly,
    invalid,
}: {
    disabled: boolean;
    readOnly: boolean;
    invalid: boolean;
}): FieldState {
    if (disabled) return 'disabled';
    if (readOnly) return 'readOnly';
    return invalid ? 'invalid' : 'rest';
}

/** Text size of a field's text element per size (16px at mobile/touch). */
export const fieldInputText = {
    sm: 'hz:text-body-default hz:tablet:pointer-fine:text-body-secondary',
    md: 'hz:text-body-default hz:tablet:pointer-fine:text-body-secondary',
    lg: 'hz:text-body-default',
} as const;

/**
 * The bare `<input>` inside a field box (Input, Combobox, EmailsField).
 * Every property a host `input` rule touches is set on the element:
 * Bootstrap reboot (margin, font, line-height, search appearance, number
 * spin buttons) and customer360 (`input { font-size }`, `::placeholder`).
 */
export const fieldInputElement = [
    'hz:m-0 hz:h-full hz:min-w-0 hz:flex-1 hz:appearance-none hz:rounded-none hz:border-0 hz:bg-transparent hz:p-0',
    'hz:text-foreground hz:outline-none hz:shadow-none hz:placeholder:text-muted-foreground hz:placeholder:opacity-100',
    'hz:disabled:cursor-not-allowed hz:disabled:text-muted-foreground',
    // The reboot's `[type='search'] { outline-offset: -2px }` (0,1,0) would
    // win when it loads later; `[type]` raises this to 0,2,0.
    'hz:[&[type]]:outline-offset-0',
    // Number spin buttons and the search cancel button are hidden: their
    // look differs per browser; use clearable for clearing.
    'hz:[&::-webkit-inner-spin-button]:m-0 hz:[&::-webkit-inner-spin-button]:appearance-none hz:[&::-webkit-outer-spin-button]:m-0 hz:[&::-webkit-outer-spin-button]:appearance-none hz:[-moz-appearance:textfield]',
    'hz:[&::-webkit-search-cancel-button]:appearance-none hz:[&::-webkit-search-decoration]:appearance-none',
].join(' ');
