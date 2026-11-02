/*
 * Open modal layers (internal). While a modal is open its content is the
 * only part of the page that is focusable (focus trap) and exposed to
 * assistive tech (the rest is aria-hidden), so page-level overlays that must
 * stay usable, the toast list, portal into the topmost layer instead of the
 * app's provider root. Layers: open Horizon Dialog/Drawer panels, and nested
 * HorizonProviders rendered inside a host dialog (an MUI Dialog's content).
 */

const stack: HTMLElement[] = [];
const listeners = new Set<() => void>();

function emit() {
    for (const listener of listeners) listener();
}

/** Registers `el` as the topmost layer; returns the unregister function. */
export function registerLayer(el: HTMLElement): () => void {
    stack.push(el);
    emit();
    return () => {
        const i = stack.lastIndexOf(el);
        if (i !== -1) stack.splice(i, 1);
        emit();
    };
}

/** Subscribes to layer changes (useSyncExternalStore). */
export function subscribeLayers(listener: () => void): () => void {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
}

/** The topmost connected layer, or `null` when no modal is open. */
export function topLayer(): HTMLElement | null {
    for (let i = stack.length - 1; i >= 0; i--) {
        const el = stack[i];
        if (el?.isConnected) return el;
    }
    return null;
}

/** Whether any Horizon modal layer is registered (dev checks). */
export function hasLayers(): boolean {
    return stack.length > 0;
}
