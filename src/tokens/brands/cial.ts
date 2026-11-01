import {
    amber,
    blue,
    blueGrey,
    common,
    cyan,
    grey,
    lightBlue,
    red,
    teal,
} from '../colors';
import { borderColor } from '../borders';
import type { SemanticPalette } from './types';

/**
 * CIAL semantic palette (default brand), derived from the Horizon DS CIAL palette.
 * Mapping: `<role>.main` -> `<role>`, `<role>.contrastText` -> `<role>-foreground`,
 * `text.primary` -> `foreground`, `background.default` -> `background`.
 * Neutral roles (muted, accent, border, input) are derived, see docs/migration/token-gaps.md.
 */
export const cial: SemanticPalette = {
    background: grey[50],
    foreground: blueGrey[900],
    primary: blue[500],
    'primary-foreground': common.white,
    secondary: cyan[500],
    'secondary-foreground': blueGrey[900],
    muted: blueGrey[100],
    'muted-foreground': blueGrey[600],
    accent: blue[100],
    'accent-foreground': blue[900],
    destructive: red[500],
    'destructive-foreground': common.white,
    success: teal[500],
    warning: amber[500],
    info: lightBlue[600],
    border: borderColor.subtle,
    input: borderColor.default,
    ring: blue[500],
};
