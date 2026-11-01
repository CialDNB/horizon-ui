import type { DnbBase } from './DnbBase';

export const ok: DnbBase = { 'data-did': 'x' };

// @ts-expect-error data-did must be a string, not a number
export const bad: DnbBase = { 'data-did': 1 };
