/**
 * Click handler for a control that can be inactive (loading, disabled via
 * `aria-disabled`, an `asChild` link): when `blocked`, the default action
 * (navigation, form submit) is prevented and `onClick` is not called.
 */
export function blockedClick<E extends { preventDefault(): void }>(
    blocked: boolean,
    onClick?: (event: E) => void
): (event: E) => void {
    return (event) => {
        if (blocked) {
            event.preventDefault();
            return;
        }
        onClick?.(event);
    };
}
