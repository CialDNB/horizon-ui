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
 * `destructive` is red/600 (DS `error.hover`), not red/400: white text on red/400 is 3.88:1 (see token-gaps.md).
 */
export const dnb: SemanticPalette = {
    background: grey[50],
    foreground: blueGrey[500],
    primary: indigo[500],
    'primary-foreground': indigo[50],
    'primary-hover': indigo[700],
    secondary: lightBlue[400],
    'secondary-foreground': cyan[900],
    muted: blueGrey[100],
    'muted-foreground': blueGrey[600],
    accent: indigo[100],
    'accent-foreground': indigo[900],
    destructive: red[600],
    'destructive-foreground': common.white,
    'destructive-hover': red[700],
    success: teal[500],
    warning: amber[600],
    info: lightBlue[300],
    'neutral-subtle': blueGrey[100],
    'neutral-strong': blueGrey[700],
    'info-subtle': lightBlue[50],
    'info-strong': lightBlue[900],
    'success-subtle': teal[100],
    'success-strong': teal[800],
    'warning-subtle': amber[100],
    'warning-strong': amber[900],
    'destructive-subtle': red[100],
    'destructive-strong': red[600],
    border: borderColor.subtle,
    input: borderColor.default,
    ring: indigo[500],
};
