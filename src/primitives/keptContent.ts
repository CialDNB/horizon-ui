import { useCallback, useState } from 'react';

/**
 * `keepMounted` for Radix overlays without `forceMount` (which would keep
 * the focus trap, `aria-hidden` of the page and the scroll lock active
 * while closed): the content is rendered for the component's lifetime into
 * one detached element (a React portal target) that `attach` moves into
 * the open panel. While closed it is not in the document: nothing hidden
 * stays focusable, and anything measured there (charts) measures 0.
 * `enabled` is read once, on mount.
 */
export function useKeptContent(enabled: boolean): {
    /** Portal target for the kept content, or `null` when not enabled. */
    keeper: HTMLElement | null;
    /** Ref callback for the element in the open panel that hosts it. */
    attach: (host: HTMLElement | null) => void;
} {
    const [keeper] = useState(() => {
        if (!enabled || typeof document === 'undefined') return null;
        const el = document.createElement('div');
        // Layout-neutral: its children lay out as children of the host.
        el.style.display = 'contents';
        return el;
    });
    const attach = useCallback(
        (host: HTMLElement | null) => {
            if (host && keeper) host.appendChild(keeper);
        },
        [keeper]
    );
    return { keeper, attach };
}
