import {
    forwardRef,
    useCallback,
    useState,
    type HTMLAttributes,
    type ReactNode,
    type Ref,
} from 'react';
import { cn } from '../lib/cn';
import { brands, type Brand } from '../tokens';
import type { DnbBase } from '../types/DnbBase';
import { PortalContext } from './portal-context';

/** Props for {@link HorizonProvider}. */
export type HorizonProviderProps = {
    /** Brand theme. Unknown values fall back to `cial`. */
    brand?: Brand;
    /** Text direction. */
    dir?: 'ltr' | 'rtl';
    /** App or subtree to style. */
    children: ReactNode;
} & Omit<HTMLAttributes<HTMLDivElement>, 'dir'> &
    DnbBase;

const isBrand = (value: unknown): value is Brand =>
    typeof value === 'string' && Object.hasOwn(brands, value);

function assignRef<T>(ref: Ref<T> | undefined, value: T | null) {
    if (typeof ref === 'function') ref(value);
    else if (ref) ref.current = value;
}

/**
 * Scope wrapper for horizon-ui: applies `.hz-root`, the brand (`data-brand`)
 * and direction, and exposes its element as the portal container for overlays.
 */
export const HorizonProvider = forwardRef<HTMLDivElement, HorizonProviderProps>(
    function HorizonProvider(
        { brand = 'cial', dir = 'ltr', className, children, ...rest },
        forwardedRef
    ) {
        const [element, setElement] = useState<HTMLDivElement | null>(null);
        const setRef = useCallback(
            (node: HTMLDivElement | null) => {
                setElement(node);
                assignRef(forwardedRef, node);
            },
            [forwardedRef]
        );

        return (
            <div
                {...rest}
                ref={setRef}
                className={cn('hz-root', className)}
                data-brand={isBrand(brand) ? brand : 'cial'}
                dir={dir === 'rtl' ? 'rtl' : 'ltr'}
            >
                <PortalContext.Provider value={element}>
                    {children}
                </PortalContext.Provider>
            </div>
        );
    }
);
HorizonProvider.displayName = 'HorizonProvider';
