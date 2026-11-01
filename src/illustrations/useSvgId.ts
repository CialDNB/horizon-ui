import { useId } from 'react';

/**
 * Per-instance prefix for SVG `id`s (clip paths, masks) so the same
 * illustration can render twice on a page without colliding. `useId` output
 * contains characters that are awkward inside `url(#...)`, so it is reduced to
 * `[A-Za-z0-9_-]`.
 *
 * Ids are unique within one React root. Two separate roots on the same page
 * (for example two micro-frontends) can produce the same `useId` values unless
 * each root is created with a different `identifierPrefix`.
 */
export function useSvgId(): string {
    return `hz${useId().replace(/[^A-Za-z0-9_-]/g, '')}-`;
}
