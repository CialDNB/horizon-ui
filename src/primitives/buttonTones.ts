import { anchorGuard } from './anchorGuard';

/**
 * Colour classes shared by Button and IconButton (rest, hover, inactive and
 * the anchorGuard hover/touch-hover/focus states), so the two cannot drift.
 * `tertiary` and `link` differ between them and stay in each component.
 */
export const buttonTones = {
    primary: `hz:bg-primary hz:text-primary-foreground hz:hover:bg-primary-hover hz:inactive:bg-muted ${anchorGuard('primary-foreground')}`,
    secondary: `hz:border-primary hz:bg-transparent hz:text-primary hz:hover:bg-primary hz:inactive:border-input hz:inactive:bg-transparent ${anchorGuard('primary', { hover: 'primary-foreground' })}`,
    destructive: `hz:bg-destructive hz:text-destructive-foreground hz:hover:bg-destructive-hover hz:inactive:bg-muted ${anchorGuard('destructive-foreground')}`,
    ghost: `hz:bg-transparent hz:text-foreground hz:hover:bg-accent hz:inactive:bg-transparent ${anchorGuard('foreground', { hover: 'accent-foreground' })}`,
} as const;
