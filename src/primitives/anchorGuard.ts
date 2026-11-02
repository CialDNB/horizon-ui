/** Semantic text colours an anchor-rendered control can keep on hover. */
export type AnchorTextToken =
    | 'primary'
    | 'primary-hover'
    | 'primary-foreground'
    | 'destructive-foreground'
    | 'accent-foreground'
    | 'foreground'
    | 'inherit';

// Complete literals: the Tailwind scanner only compiles classes it can see.
const HOVER_TEXT: Record<AnchorTextToken, string> = {
    primary: 'hz:hover:text-primary',
    'primary-hover': 'hz:hover:text-primary-hover',
    'primary-foreground': 'hz:hover:text-primary-foreground',
    'destructive-foreground': 'hz:hover:text-destructive-foreground',
    'accent-foreground': 'hz:hover:text-accent-foreground',
    foreground: 'hz:hover:text-foreground',
    inherit: 'hz:hover:text-inherit',
};

const TOUCH_HOVER_TEXT: Record<AnchorTextToken, string> = {
    primary: 'hz:touch-hover:text-primary',
    'primary-hover': 'hz:touch-hover:text-primary-hover',
    'primary-foreground': 'hz:touch-hover:text-primary-foreground',
    'destructive-foreground': 'hz:touch-hover:text-destructive-foreground',
    'accent-foreground': 'hz:touch-hover:text-accent-foreground',
    foreground: 'hz:touch-hover:text-foreground',
    inherit: 'hz:touch-hover:text-inherit',
};

/** Options for {@link anchorGuard}. */
export interface AnchorGuardOptions {
    /** Text colour on pointer hover. @default the rest colour */
    hover?: AnchorTextToken;
    /** Underlined at rest (and so on touch hover). @default false */
    underline?: boolean;
    /** Underlined on pointer hover. @default `underline` */
    hoverUnderline?: boolean;
}

/**
 * Hover and touch-hover text colour and decoration for a control that may
 * render as an `<a>` (`asChild`). A host's `a:hover { color; text-decoration }`
 * (Bootstrap reboot, specificity 0,1,1) beats plain utilities in the unlayered
 * build; these state classes (0,2,0) restate the intended look: `hover:` for
 * pointer devices, `touch-hover:` (sticky `:hover` without hover media) back to
 * the rest look, and `focus:underline` for underlined looks (a host
 * `a:focus { text-decoration: none }`, as in customer360). See ADR 0001.
 */
export function anchorGuard(
    rest: AnchorTextToken,
    {
        hover = rest,
        underline = false,
        hoverUnderline = underline,
    }: AnchorGuardOptions = {}
): string {
    return [
        HOVER_TEXT[hover],
        TOUCH_HOVER_TEXT[rest],
        hoverUnderline ? 'hz:hover:underline' : 'hz:hover:no-underline',
        underline ? 'hz:touch-hover:underline' : 'hz:touch-hover:no-underline',
        // customer360's `a:focus { text-decoration: none }` (0,1,1) would
        // remove the underline of a focused link (its non-colour cue).
        ...(underline ? ['hz:focus:underline'] : []),
    ].join(' ');
}
