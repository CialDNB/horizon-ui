/** Supported brands. `cial` is the default. */
export type Brand = 'cial' | 'dnb' | 'il';

/** Every semantic colour key a brand must define. Names match shadcn conventions. */
export const semanticKeys = [
    'background',
    'foreground',
    'primary',
    'primary-foreground',
    'primary-hover',
    'secondary',
    'secondary-foreground',
    'muted',
    'muted-foreground',
    'accent',
    'accent-foreground',
    'destructive',
    'destructive-foreground',
    'destructive-hover',
    'success',
    'warning',
    'info',
    'border',
    'input',
    'ring',
] as const;

/** A semantic colour key. */
export type SemanticKey = (typeof semanticKeys)[number];

/** A complete brand colour map, keyed by semantic name, valued by CSS colour. */
export type SemanticPalette = Record<SemanticKey, string>;
