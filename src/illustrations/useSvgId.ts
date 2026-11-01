import { useId } from 'react';

/**
 * Per-instance prefix for SVG `id`s (clip paths, masks) so the same
 * illustration can render twice on a page without colliding. `useId` output
 * contains characters that are awkward inside `url(#...)`, so it is reduced to
 * `[A-Za-z0-9_-]`.
 */
export function useSvgId(): string {
    return `hz${useId().replace(/[^A-Za-z0-9_-]/g, '')}-`;
}
