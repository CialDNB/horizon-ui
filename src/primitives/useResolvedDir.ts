import { useEffect, useLayoutEffect, useState, type RefObject } from 'react';

const useIsomorphicLayoutEffect =
    typeof document === 'undefined' ? useEffect : useLayoutEffect;

/** Text direction for Radix primitives (arrow keys, alignment). */
export type Direction = 'ltr' | 'rtl';

/**
 * `dir` when given, otherwise the element's computed CSS direction once it
 * is mounted (`ltr` before). Radix primitives need the direction as a prop
 * for RTL arrow keys; reading it from the DOM works with `HorizonProvider
 * dir="rtl"` and with any `dir="rtl"` ancestor in a host page.
 */
export function useResolvedDir(
    ref: RefObject<HTMLElement | null>,
    dir?: Direction
): Direction {
    const [resolved, setResolved] = useState<Direction>(dir ?? 'ltr');
    useIsomorphicLayoutEffect(() => {
        if (dir) {
            setResolved(dir);
            return;
        }
        const el = ref.current;
        if (!el) return;
        const rtl =
            getComputedStyle(el).direction === 'rtl' ||
            el.closest('[dir]')?.getAttribute('dir') === 'rtl';
        setResolved(rtl ? 'rtl' : 'ltr');
    }, [dir, ref]);
    return resolved;
}
