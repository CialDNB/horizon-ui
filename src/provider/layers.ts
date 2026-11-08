/*
 * Open modal layers (internal). While a modal is open its content is the
 * only part of the page that is focusable (focus trap) and exposed to
 * assistive tech (the rest is aria-hidden), so page-level overlays that must
 * stay usable, the toast list, portal into the topmost layer instead of the
 * app's provider root. Layers: open Horizon Dialog/Drawer panels, and nested
 * HorizonProviders rendered inside a host dialog (an MUI Dialog's content).
 */

import { isProduction, warnOnce } from '../lib/options';

const stack: HTMLElement[] = [];

/** MUI overlays portal to body at z-index 1300: below an open Horizon modal. */
const MUI_OVERLAY = '.MuiModal-root, .MuiPopover-root, .MuiPopper-root';
let observer: MutationObserver | null = null;

/*
 * Development only: while a Horizon modal is open, watch for an MUI overlay
 * being mounted (a confirmation dialog, Select menu, Popover, Autocomplete
 * list opened from inside it). It would render below the Horizon modal and
 * be inert (modal focus trap, pointer-events). No observer exists while no
 * Horizon modal is open, and none at all in production.
 */
function watchForMuiOverlays() {
    if (observer || isProduction() || typeof MutationObserver === 'undefined')
        return;
    observer = new MutationObserver((records) => {
        for (const record of records)
            for (const node of record.addedNodes)
                if (
                    node instanceof Element &&
                    (node.matches(MUI_OVERLAY) ||
                        node.querySelector(MUI_OVERLAY))
                ) {
                    warnOnce(
                        'An MUI overlay (Dialog/Menu/Popover/Popper) opened while a Horizon Dialog or Drawer is open. It renders below the Horizon modal and cannot be used. Port the overlays opened from a Horizon modal too, or render the MUI one inside it (MUI `container` / `disablePortal`). See docs/architecture/05.'
                    );
                    return;
                }
    });
    observer.observe(document.body, { childList: true, subtree: true });
}

function stopWatching() {
    observer?.disconnect();
    observer = null;
}
const listeners = new Set<() => void>();

function emit() {
    for (const listener of listeners) listener();
}

/** Registers `el` as the topmost layer; returns the unregister function. */
export function registerLayer(
    el: HTMLElement,
    { horizonModal = true }: { horizonModal?: boolean } = {}
): () => void {
    stack.push(el);
    if (horizonModal) {
        modals += 1;
        watchForMuiOverlays();
    }
    emit();
    return () => {
        const i = stack.lastIndexOf(el);
        if (i !== -1) stack.splice(i, 1);
        if (horizonModal) {
            modals -= 1;
            if (modals === 0) stopWatching();
        }
        emit();
    };
}

let modals = 0;

/** Test helper (not public API): whether the dev observer is running. */
export function isWatchingForMuiOverlays(): boolean {
    return observer !== null;
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
