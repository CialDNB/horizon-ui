// src/tokens/colors.ts
// DS Reference: Horizon DS — color-system.md
// RULE: Never reference these primitives directly in components.
// Always use semantic tokens (primary, secondary, etc.) via the palette.

/** Neutral grey scale (50-900). */
export const grey = {
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#EEEEEE',
    300: '#E0E0E0',
    400: '#BDBDBD',
    500: '#9E9E9E',
    600: '#757575',
    700: '#616161',
    800: '#424242',
    900: '#212121',
} as const;

/** Blue scale; blue[500] is the CIAL primary. */
export const blue = {
    50: '#EFF6FF',
    100: '#CEE9FD',
    200: '#BFDBFE',
    300: '#93C5FD',
    400: '#60A5FA',
    500: '#0050F0',
    600: '#2563EB',
    700: '#0039B2',
    800: '#1E40AF',
    900: '#1F3258',
} as const;

/** Indigo scale; indigo[500] is the D&B primary. */
export const indigo = {
    50: '#E8EAF6',
    100: '#C5CAE9',
    200: '#9FA8DA',
    300: '#7986CB',
    400: '#5C6BC0',
    500: '#3F51B5',
    600: '#3949AB',
    700: '#303F9F',
    800: '#283593',
    900: '#1A237E',
} as const;

/** Cyan scale; cyan[500] is the CIAL secondary. */
export const cyan = {
    50: '#E0F7FA',
    100: '#CFFAFE',
    200: '#A5F3FC',
    300: '#67E8F9',
    400: '#22D3EE',
    500: '#00D2FF',
    600: '#04BBE2',
    700: '#0E7490',
    800: '#155E75',
    900: '#164E63',
} as const;

/** Light-blue scale; used for info colours. */
export const lightBlue = {
    50: '#E1F5FE',
    100: '#B3E5FC',
    200: '#81D4FA',
    300: '#4FC3F7',
    400: '#29B6F6',
    500: '#03A9F4',
    600: '#039BE5',
    700: '#0288D1',
    800: '#0277BD',
    900: '#01579B',
} as const;

/** Red scale; used for error/destructive colours. */
export const red = {
    50: '#FFF0F2',
    100: '#FFE4E6',
    200: '#FECDD3',
    300: '#FDA4AF',
    400: '#ED3F48',
    500: '#E70D32',
    600: '#C90A2A',
    700: '#AB0722',
    800: '#9F1239',
    900: '#730314',
} as const;

/** Amber scale; used for warning colours. */
export const amber = {
    50: '#FDF4DB',
    100: '#FEF3C7',
    200: '#FDE68A',
    300: '#FCD34D',
    400: '#FBBF24',
    500: '#FFBD28',
    600: '#FFB300',
    700: '#FFA000',
    800: '#F59E0B',
    900: '#9B5403',
} as const;

/** Teal scale; used for success colours (teal, not green, per DS spec). */
export const teal = {
    50: '#DEFFFC',
    100: '#CCFBF1',
    200: '#99F6E4',
    300: '#5EEAD4',
    400: '#2DD4BF',
    500: '#009688',
    600: '#0D9488',
    700: '#0F766E',
    800: '#115E59',
    900: '#134E4A',
} as const;

/** Green scale. */
export const green = {
    50: '#F0FDF4',
    100: '#DCFCE7',
    200: '#BBF7D0',
    300: '#86EFAC',
    400: '#4ADE80',
    500: '#22C55E',
    600: '#16A34A',
    700: '#15803D',
    800: '#166534',
    900: '#14532D',
} as const;

// NOTE: orange/500 = #FF3700 is vermilion (brand-mandated, immutable)
/** Orange scale; orange[500] is brand vermilion. */
export const orange = {
    50: '#FFF7ED',
    100: '#FFEDD5',
    200: '#FED7AA',
    300: '#FDBA74',
    400: '#FB923C',
    500: '#FF3700',
    600: '#EA580C',
    700: '#C2410C',
    800: '#9A3412',
    900: '#7C2D12',
} as const;

/** Pink scale. */
export const pink = {
    50: '#FDF2F8',
    100: '#FCE7F3',
    200: '#FBCFE8',
    300: '#F9A8D4',
    400: '#F472B6',
    500: '#EC4899',
    600: '#DB2777',
    700: '#BE185D',
    800: '#9D174D',
    900: '#831843',
} as const;

/** Purple scale. */
export const purple = {
    50: '#FAF5FF',
    100: '#F3E8FF',
    200: '#E9D5FF',
    300: '#D8B4FE',
    400: '#C084FC',
    500: '#A855F7',
    600: '#9333EA',
    700: '#7E22CE',
    800: '#6B21A8',
    900: '#581C87',
} as const;

/** Blue-grey scale; text, border and muted surface source. */
export const blueGrey = {
    50: '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    300: '#CBD5E1',
    400: '#94A3B8',
    500: '#64748B',
    600: '#475569',
    700: '#334155',
    800: '#1E293B',
    900: '#0F172A',
} as const;

/** Pure white and black. */
export const common = {
    white: '#FFFFFF',
    black: '#000000',
} as const;

// CIAL-only gradients
/** CIAL-only gradients. */
export const gradients = {
    cial1: 'linear-gradient(135deg, #00D2FF 0%, #0050F0 100%)',
    cial2: 'linear-gradient(135deg, #003BAF 1%, #0050F0 73%, #3779FC 100%)',
} as const;
