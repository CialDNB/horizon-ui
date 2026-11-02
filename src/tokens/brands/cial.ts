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
    'primary-hover': blue[700],
    secondary: cyan[500],
    'secondary-foreground': blueGrey[900],
    muted: blueGrey[100],
    'muted-foreground': blueGrey[600],
    accent: blue[100],
    'accent-foreground': blue[900],
    destructive: red[500],
    'destructive-foreground': common.white,
    'destructive-hover': red[700],
    success: teal[500],
    warning: amber[500],
    info: lightBlue[600],
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
    ring: blue[500],
    // Task 11a: boundary of form controls, 3:1 on background and popover.
    'control-border': blueGrey[500],
    // Task 11a: floating surfaces (Select content); x-core background.paper.
    popover: common.white,
    'popover-foreground': blueGrey[900],
};
