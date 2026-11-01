import { borderColor } from '../borders';
import type { SemanticPalette } from './types';

/**
 * IL semantic palette. The x-core IL palette is excluded from Horizon DS token
 * migration and uses its own colour decisions, so values are literal here
 * rather than referencing the shared primitives.
 */
export const il: SemanticPalette = {
    background: '#FAFAFA',
    foreground: '#0F172A',
    primary: '#3F51B5',
    'primary-foreground': '#E8EAF6',
    secondary: '#4FC3F7',
    'secondary-foreground': '#01579B',
    muted: '#F1F5F9',
    'muted-foreground': '#64748B',
    accent: '#C5CAE9',
    'accent-foreground': '#1A237E',
    destructive: '#ED3F48',
    'destructive-foreground': '#FFFFFF',
    success: '#009688',
    warning: '#FFBD28',
    info: '#29B6F6',
    border: borderColor.subtle,
    input: borderColor.default,
    ring: '#3F51B5',
};
