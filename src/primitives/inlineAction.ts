import { cn } from '../lib/cn';

/*
 * Small icon actions inside a component (Input and Select clear, Alert
 * dismiss): a real 44px target at mobile and on touch pointers, 32px with a
 * fine pointer from tablet, round, and reset against Bootstrap's `button`
 * rules (margin, radius, `button:focus` outline, restated as focus-visible
 * state classes so they win) and customer360's
 * `button + button`. Chip's remove button is not built on this: it keeps a
 * 20px visual box with separate hit layers inside the chip.
 */

/** Shared base: reset, target sizes, shape, motion and focus ring. */
export const inlineActionBase =
    'hz:m-0 hz:inline-flex hz:shrink-0 hz:cursor-pointer hz:items-center hz:justify-center hz:rounded-full hz:border-0 hz:bg-transparent hz:p-0 hz:size-11 hz:tablet:pointer-fine:size-8 hz:transition-colors hz:duration-fast hz:ease-standard hz:outline-ring hz:focus:outline-none hz:focus-visible:outline-2 hz:focus-visible:-outline-offset-2 hz:focus-visible:outline-solid hz:focus-visible:outline-ring';

/** Clear button of a field: muted 16px icon that darkens on hover. */
export const clearAction = cn(
    inlineActionBase,
    'hz:text-muted-foreground hz:hover:text-foreground hz:[&_svg]:size-4 hz:[&_svg]:align-middle'
);
