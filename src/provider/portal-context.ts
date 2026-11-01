import { createContext, useContext } from 'react';

/**
 * `undefined`: no provider above. `null`: provider mounted its tree but its
 * wrapper element is not attached yet (first render). Otherwise the wrapper.
 */
export const PortalContext = createContext<HTMLElement | null | undefined>(
    undefined
);

let pendingRoot: HTMLElement | null = null;
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
 * Element that overlays (dialogs, popovers, tooltips) should portal into, so
 * their content keeps the `.hz-root` scope, brand and direction.
 *
 * - Inside a `HorizonProvider`: the provider's wrapper element. During the
 *   provider's very first render the wrapper is not attached yet, so the shared
 *   fallback root is returned (silently); portal content then moves to the
 *   real wrapper on the next render, which happens before any overlay can open.
 * - Outside any provider: one lazily created, reused `.hz-root` element on
 *   `document.body` (brand `cial`, `ltr`), with a single `console.warn` per page
 *   asking the developer to mount `HorizonProvider`.
 *
 * Needs `document`: call it from client-rendered overlay components only.
 */
export function usePortalContainer(): HTMLElement {
    const container = useContext(PortalContext);
    if (container) return container;
    if (container === null) {
        pendingRoot ??= document.createElement('div');
        return pendingRoot;
    }
    if (!warned) {
        warned = true;
        console.warn(
            '[horizon-ui] Overlay rendered outside <HorizonProvider>. Using a fallback "cial" portal root; wrap your app in <HorizonProvider> to pick the brand and direction.'
        );
    }
    return getFallbackRoot();
}

/** Test helper (not public API): drops the fallback root and the warn-once flag. */
export function resetFallbackPortalRoot(): void {
    fallbackRoot?.remove();
    fallbackRoot = null;
    warned = false;
}
