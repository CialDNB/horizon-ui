import { useEffect, useLayoutEffect, useState, type RefObject } from 'react';
import { useHorizonScope } from '../provider';

const useIsomorphicLayoutEffect =
    typeof document === 'undefined' ? useEffect : useLayoutEffect;

/** Text direction for Radix primitives (arrow keys, alignment). */
export type Direction = 'ltr' | 'rtl';

/**
 * `dir` when given, otherwise the computed CSS direction of the element's
 * parent once mounted (the provider's `dir`, else `ltr`, before), re-read
 * whenever the nearest HorizonProvider's direction changes. Radix primitives need the direction as a prop
 * for RTL arrow keys; reading it from the DOM works with `HorizonProvider
 * dir="rtl"` and with any `dir="rtl"` ancestor in a host page.
 */
export function useResolvedDir(
    ref: RefObject<HTMLElement | null>,
    dir?: Direction
): Direction {
    // Re-read when the nearest provider's direction changes at runtime.
    const scopeDir = useHorizonScope()?.dir;
    const [resolved, setResolved] = useState<Direction>(
        dir ?? scopeDir ?? 'ltr'
    );
    useIsomorphicLayoutEffect(() => {
        if (dir) {
            setResolved(dir);
            return;
        }
        // The parent, not the element: Radix roots render the `dir` they are
        // given as an attribute, which would echo the initial 'ltr'.
        const el = ref.current?.parentElement;
        if (!el) return;
        const rtl =
            getComputedStyle(el).direction === 'rtl' ||
            el.closest('[dir]')?.getAttribute('dir') === 'rtl';
        setResolved(rtl ? 'rtl' : 'ltr');
    }, [dir, ref, scopeDir]);
    return resolved;
}
