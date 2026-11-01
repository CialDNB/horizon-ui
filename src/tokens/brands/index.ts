import { cial } from './cial';
import { dnb } from './dnb';
import { il } from './il';
import type { Brand, SemanticPalette } from './types';

export { semanticKeys } from './types';
export type { Brand, SemanticKey, SemanticPalette } from './types';
export { brandTypography } from './typography';
export type { BrandTypography } from './typography';

/** Semantic colour map for every brand. */
export const brands: Record<Brand, SemanticPalette> = { cial, dnb, il };
