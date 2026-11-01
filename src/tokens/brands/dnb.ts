import {
    amber,
    blueGrey,
    common,
    cyan,
    grey,
    indigo,
    lightBlue,
    red,
    teal,
} from '../colors';
import { borderColor } from '../borders';
import type { SemanticPalette } from './types';

/**
 * D&B semantic palette, derived from the Horizon DS D&B palette.
 * `foreground` follows the DS (text/primary is blueGrey/500 for D&B, lighter than CIAL).
 */
export const dnb: SemanticPalette = {
    background: grey[50],
    foreground: blueGrey[500],
    primary: indigo[500],
    'primary-foreground': indigo[50],
    secondary: lightBlue[400],
    'secondary-foreground': cyan[900],
    muted: blueGrey[100],
    'muted-foreground': blueGrey[600],
    accent: indigo[100],
    'accent-foreground': indigo[900],
    destructive: red[400],
    'destructive-foreground': common.white,
    success: teal[500],
    warning: amber[600],
    info: lightBlue[300],
    border: borderColor.subtle,
    input: borderColor.default,
    ring: indigo[500],
};
