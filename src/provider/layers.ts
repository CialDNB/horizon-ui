/*
 * Open modal layers (internal). While a modal is open its content is the
 * only part of the page that is focusable (focus trap) and exposed to
 * assistive tech (the rest is aria-hidden), so page-level overlays that must
 * stay usable, the toast list, portal into the topmost layer instead of the
 * app's provider root. Layers: open Horizon Dialog/Drawer panels, and nested
 * HorizonProviders rendered inside a host dialog (an MUI Dialog's content).
 * A layer counts only while it is visible: a host dialog kept mounted while
 * closed (MUI `keepMounted`) stays registered but is skipped.
 */

import { isProduction, warnOnce } from '../lib/options';

const stack: HTMLElement[] = [];
/** The Horizon modal panels among `stack` (the dev MUI-overlay check). */
const modalLayers = new Set<HTMLElement>();

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
                    // Rendered inside the Horizon panel (MUI `container` /
                    // `disablePortal`, the documented fix): fine.
                    ![...modalLayers].some((layer) => layer.contains(node)) &&
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
        modalLayers.add(el);
        modals += 1;
        watchForMuiOverlays();
    }
    emit();
    return () => {
        const i = stack.lastIndexOf(el);
        if (i !== -1) stack.splice(i, 1);
        if (horizonModal) {
            modalLayers.delete(el);
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
/** Hidden host states: MUI keepMounted closed dialogs, inert or aria-hidden subtrees, display/visibility. */
const HIDDEN = '[aria-hidden="true"], [inert], .MuiModal-hidden';

/** Whether `el` is currently out of reach (hidden or inert). */
export function isLayerHidden(el: HTMLElement): boolean {
    if (!el.isConnected || el.closest(HIDDEN)) return true;
    for (let node: Element | null = el; node; node = node.parentElement) {
        const cs = getComputedStyle(node);
        if (cs.display === 'none' || cs.visibility === 'hidden') return true;
    }
    return false;
}

/** The topmost visible layer, or `null` when no modal is open. */
export function topLayer(): HTMLElement | null {
    for (let i = stack.length - 1; i >= 0; i--) {
        const el = stack[i];
        if (el && !isLayerHidden(el)) return el;
    }
    return null;
}

/** Re-evaluates the top layer (a host dialog opened or closed). */
export function notifyLayersChanged(): void {
    emit();
}

const WATCHED = ['class', 'style', 'aria-hidden', 'inert', 'hidden'];

/**
 * Registers a nested provider inside a host dialog as a layer and keeps the
 * registry current while the host shows or hides it: observes the
 * attributes of `el` and its ancestors (a few nodes, no subtree). Returns
 * the cleanup (unregister + disconnect).
 */
export function registerHostLayer(el: HTMLElement): () => void {
    const unregister = registerLayer(el, { horizonModal: false });
    if (typeof MutationObserver === 'undefined') return unregister;
    const watcher = new MutationObserver(emit);
    for (let node: Element | null = el; node; node = node.parentElement)
        watcher.observe(node, { attributes: true, attributeFilter: WATCHED });
    return () => {
        watcher.disconnect();
        unregister();
    };
}

/** Whether any Horizon modal layer is registered (dev checks). */
export function hasLayers(): boolean {
    return stack.length > 0;
}
