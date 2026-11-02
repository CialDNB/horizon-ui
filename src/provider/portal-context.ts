import { createContext, useContext } from 'react';
import type { Brand } from '../tokens';

/**
 * `undefined`: no provider above. `null`: provider mounted its tree but its
 * wrapper element is not attached yet (first render). Otherwise the wrapper.
 */
export const PortalContext = createContext<HTMLElement | null | undefined>(
    undefined
);

/** Brand and direction of the nearest HorizonProvider (internal). */
export type HorizonScope = { brand: Brand; dir: 'ltr' | 'rtl' };

/** `null` outside any provider. Nested providers inherit from it. */
export const HorizonScopeContext = createContext<HorizonScope | null>(null);

/** The nearest provider's brand and direction, or `null` (internal). */
export function useHorizonScope(): HorizonScope | null {
    return useContext(HorizonScopeContext);
}

let fallbackRoot: HTMLElement | null = null;
let warned = false;

function getFallbackRoot(): HTMLElement {
    if (fallbackRoot === null || !fallbackRoot.isConnected) {
        fallbackRoot = document.createElement('div');
        fallbackRoot.className = 'hz-root';
        fallbackRoot.setAttribute('data-brand', 'cial');
        fallbackRoot.setAttribute('dir', 'ltr');
        fallbackRoot.setAttribute('data-hz-portal-root', '');
        document.body.appendChild(fallbackRoot);
    }
    return fallbackRoot;
}

/**
 * Pure resolver behind {@link usePortalContainer}: maps the context value to a
 * portal container. Exported for tests only (not public API).
 */
export function resolvePortalContainer(
    container: HTMLElement | null | undefined
): HTMLElement | null {
    if (container) return container;
    if (container === null || typeof document === 'undefined') return null;
    if (!warned) {
        warned = true;
        console.warn(
            '[horizon-ui] Overlay rendered outside <HorizonProvider>. Using a fallback "cial" portal root; wrap your app in <HorizonProvider> to pick the brand and direction.'
        );
    }
    return getFallbackRoot();
}

/**
 * Element that overlays (dialogs, popovers, tooltips) should portal into, so
 * their content keeps the `.hz-root` scope, brand and direction.
 *
 * Returns `HTMLElement | null`; a non-null value is always attached to the
 * document.
 * - Inside a `HorizonProvider`: `null` during the provider's first render
 *   (its wrapper is not attached yet), then the wrapper element from the next
 *   commit on.
 * - Outside any provider: one lazily created, reused `.hz-root` element on
 *   `document.body` (brand `cial`, `ltr`), plus a single `console.warn` per
 *   page asking the developer to mount `HorizonProvider`.
 * - Without a `document` (server rendering): `null`, never throws.
 *
 * Overlay wrappers must render their Portal only when the value is non-null,
 * so content appears one commit later in the correct container instead of
 * being mounted in a placeholder and remounted.
 */
export function usePortalContainer(): HTMLElement | null {
    return resolvePortalContainer(useContext(PortalContext));
}

/** Test helper (not public API): drops the fallback root and the warn-once flag. */
export function resetFallbackPortalRoot(): void {
    fallbackRoot?.remove();
    fallbackRoot = null;
    warned = false;
}
