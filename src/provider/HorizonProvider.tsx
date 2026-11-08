import {
    forwardRef,
    useCallback,
    useContext,
    useMemo,
    useLayoutEffect,
    useRef,
    useState,
    type HTMLAttributes,
    type ReactNode,
    type Ref,
} from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { cn } from '../lib/cn';
import { brands, type Brand } from '../tokens';
import type { DnbBase } from '../types/DnbBase';
import { registerLayer } from './layers';
import { HorizonScopeContext, PortalContext } from './portal-context';

/** Props for {@link HorizonProvider}. */
export type HorizonProviderProps = {
    /**
     * Brand theme. Omitted: inherited from a parent HorizonProvider (also
     * across React portals, e.g. inside an MUI dialog), else `cial`.
     * Unknown values fall back to `cial`.
     */
    brand?: Brand;
    /**
     * Text direction. Omitted: inherited from a parent HorizonProvider,
     * else `ltr`.
     */
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
 * A nested provider without `brand`/`dir` inherits them from the nearest
 * parent provider, so `<HorizonProvider>` with no props inside an MUI dialog
 * (rendered into `body`, outside the app's `.hz-root`) restores the scope
 * with the app's brand and direction.
 */
export const HorizonProvider = forwardRef<HTMLDivElement, HorizonProviderProps>(
    function HorizonProvider(
        { brand: brandProp, dir: dirProp, className, children, ...rest },
        forwardedRef
    ) {
        const parent = useContext(HorizonScopeContext);
        const brandValue = brandProp ?? parent?.brand ?? 'cial';
        const brand = isBrand(brandValue) ? brandValue : 'cial';
        const dirValue = dirProp ?? parent?.dir ?? 'ltr';
        const dir: 'ltr' | 'rtl' = dirValue === 'rtl' ? 'rtl' : 'ltr';
        const scope = useMemo(() => ({ brand, dir }), [brand, dir]);
        const [element, setElement] = useState<HTMLDivElement | null>(null);
        const nodeRef = useRef<HTMLDivElement | null>(null);
        const syncedRef = useRef(forwardedRef);
        // Stable identity: an inline consumer ref must not detach/reattach
        // (and re-render) this wrapper on every parent render.
        const setRef = useCallback((node: HTMLDivElement | null) => {
            nodeRef.current = node;
            setElement(node);
            assignRef(syncedRef.current, node);
        }, []);
        // A nested provider inside a host dialog (an MUI Dialog's content) is
        // the only usable part of the page while that dialog is open: it
        // becomes a layer so the toast list portals into it.
        const nested = parent !== null;
        useLayoutEffect(() => {
            if (!nested || !element) return;
            if (!element.closest('[role="dialog"], [role="alertdialog"]'))
                return;
            return registerLayer(element, { horizonModal: false });
        }, [nested, element]);
        // Mirror React's ref semantics when the consumer's ref changes.
        useLayoutEffect(() => {
            if (syncedRef.current === forwardedRef) return;
            assignRef(syncedRef.current, null);
            syncedRef.current = forwardedRef;
            assignRef(forwardedRef, nodeRef.current);
        }, [forwardedRef]);

        return (
            <div
                {...rest}
                ref={setRef}
                className={cn('hz-root', className)}
                data-brand={brand}
                dir={dir}
            >
                <HorizonScopeContext.Provider value={scope}>
                    <PortalContext.Provider value={element}>
                        {parent ? (
                            children
                        ) : (
                            // One shared tooltip timing for the app (nested
                            // providers inherit it): 300ms to open, and the
                            // next tooltip opens at once within 800ms (MUI's
                            // hysteresis), e.g. along a toolbar.
                            <TooltipPrimitive.Provider
                                delayDuration={300}
                                skipDelayDuration={800}
                            >
                                {children}
                            </TooltipPrimitive.Provider>
                        )}
                    </PortalContext.Provider>
                </HorizonScopeContext.Provider>
            </div>
        );
    }
);
HorizonProvider.displayName = 'HorizonProvider';
