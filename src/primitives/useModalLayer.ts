import { useCallback, useRef } from 'react';
import { registerLayer } from '../provider';

/**
 * Ref callback that registers the element as an open modal layer while it
 * is mounted (Radix mounts Dialog/Drawer content only while open), so the
 * toast list portals into it and stays reachable inside the focus trap.
 */
export function useModalLayer(): (el: HTMLElement | null) => void {
    const cleanup = useRef<(() => void) | null>(null);
    return useCallback((el: HTMLElement | null) => {
        cleanup.current?.();
        cleanup.current = el ? registerLayer(el) : null;
    }, []);
}
