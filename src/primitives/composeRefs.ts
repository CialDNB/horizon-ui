import type { Ref, RefCallback } from 'react';

/** One ref callback that assigns `node` to every given ref. */
export function composeRefs<T>(
    ...refs: readonly (Ref<T> | undefined)[]
): RefCallback<T> {
    return (node) => {
        for (const ref of refs) {
            if (typeof ref === 'function') ref(node);
            else if (ref) ref.current = node;
        }
    };
}
