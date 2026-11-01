import { fontFamily, fontWeight, typeScale } from '../typography';
import type { Brand } from './types';

/** Typography tokens applied per brand. */
export interface BrandTypography {
    fontFamily: string;
    fontWeight: typeof fontWeight;
    typeScale: typeof typeScale;
}

const horizonTypography: BrandTypography = {
    fontFamily,
    fontWeight,
    typeScale,
};

/**
 * Typography per brand. D&B uses the CIAL scale (as in x-core); IL uses the CIAL
 * scale by decision (x-core's IL typography is legacy and excluded from Horizon DS).
 */
export const brandTypography: Record<Brand, BrandTypography> = {
    cial: horizonTypography,
    dnb: horizonTypography,
    il: horizonTypography,
};
