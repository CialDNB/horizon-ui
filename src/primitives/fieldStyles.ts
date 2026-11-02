/*
 * Shared look of text-entry fields (Input, Textarea, Select trigger), so the
 * three cannot drift. The boundary is an inset ring (box-shadow), not a
 * border: host `input`/`button` border rules cannot reach it and adornment
 * buttons get the full 44px height at mobile.
 */

/** Surface, radius, type colour and motion shared by every field. */
export const fieldBase =
    'hz:relative hz:w-full hz:min-w-0 hz:rounded-lg hz:bg-transparent hz:text-foreground hz:ring-inset hz:transition-[box-shadow,background-color] hz:duration-fast hz:ease-standard';

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
