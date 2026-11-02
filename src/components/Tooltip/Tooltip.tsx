/*
 * Based on shadcn/ui Tooltip (registry 2025) on Radix Tooltip, folded into
 * one component with a `content` prop (x-core's `title`). Replaces x-core
 * `TooltipV2` (MUI Tooltip, x-core 2.2.30); `Tooltip` (v1) is superseded.
 */
import { Slot } from '@radix-ui/react-slot';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import {
    createContext,
    forwardRef,
    useContext,
    useRef,
    type ComponentPropsWithoutRef,
    type HTMLAttributes,
    type ReactElement,
    type ReactNode,
} from 'react';
import { cn } from '../../lib/cn';
import { omitLegacyProps, resolveOption } from '../../lib/options';
import {
    anchoredMotion,
    containEscape,
    physicalPlacement,
    useResolvedDir,
    type Direction,
    type LogicalAlign,
    type LogicalSide,
} from '../../primitives';
import { useHorizonScope, usePortalContainer } from '../../provider';
import type { DnbBase } from '../../types/DnbBase';

/** Hover delay before a tooltip opens, in ms (customer360's `enterDelay`). */
const DEFAULT_DELAY = 300;

/** Set by {@link TooltipProvider}: a Radix provider is already above. */
const SharedProvider = createContext(false);

/** Props for {@link TooltipProvider}. */
export type TooltipProviderProps = {
    /** Hover delay before opening, in ms. @default 300 */
    delayDuration?: number;
    /**
     * Within this many ms of one tooltip closing, the next opens without
     * the delay (moving along a toolbar). @default 300
     */
    skipDelayDuration?: number;
    children: ReactNode;
};

/**
 * Optional: overrides the tooltip timing for a subtree. HorizonProvider
 * already provides one (300ms delay, 800ms skip window); a Tooltip outside
 * any HorizonProvider brings its own.
 */
export function TooltipProvider({
    delayDuration = DEFAULT_DELAY,
    skipDelayDuration = 300,
    children,
}: TooltipProviderProps) {
    return (
        <TooltipPrimitive.Provider
            delayDuration={delayDuration}
            skipDelayDuration={skipDelayDuration}
        >
            <SharedProvider.Provider value>{children}</SharedProvider.Provider>
        </TooltipPrimitive.Provider>
    );
}
TooltipProvider.displayName = 'TooltipProvider';

/**
 * Passes the trigger props Radix adds on to the child, minus the
 * `aria-describedby` that points at the tooltip (`labelOnly`): the child's
 * own description, if any, is kept by Slot.
 */
const WithoutDescription = forwardRef<
    HTMLElement,
    Omit<HTMLAttributes<HTMLElement>, 'children'> & { children: ReactElement }
>(function WithoutDescription({ children, ...props }, ref) {
    // Only the tooltip's id arrives here (Radix adds it); the child's own
    // aria-describedby is merged by the inner Slot.
    const forwarded = Object.fromEntries(
        Object.entries(props).filter(([key]) => key !== 'aria-describedby')
    );
    return (
        <Slot {...forwarded} ref={ref}>
            {children}
        </Slot>
    );
});

const sides: readonly LogicalSide[] = ['top', 'bottom', 'start', 'end'];
const aligns: readonly LogicalAlign[] = ['start', 'center', 'end'];

/** x-core TooltipV2 / MUI Tooltip props that are dropped (dev warning). */
const legacyTooltipProps = {
    title: 'use content',
    placement: 'use side and align (logical: start/end)',
    enterDelay: 'use delayDuration',
    leaveDelay: 'not supported (closes on leave)',
    onClose: 'use onOpenChange(false)',
    onOpen: 'use onOpenChange(true)',
    arrow: 'use showArrow',
    multipleLine: 'content always wraps at 280px',
    PopperProps: 'not supported',
    componentsProps: 'not supported',
    slotProps: 'not supported',
    sx: 'use className',
    followCursor: 'not supported',
    disableInteractive: 'not supported',
    disableHoverListener: 'use disabled',
    disableFocusListener: 'use disabled',
    disableTouchListener: 'touch never opens tooltips',
} as const;

/** Props for {@link Tooltip}. */
export type TooltipProps = Omit<
    ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>,
    'content' | 'side' | 'align' | 'asChild' | 'children' | 'title'
> &
    DnbBase & {
        /**
         * The tooltip text (x-core `title`). Plain text or simple inline
         * markup only: it is not focusable, so links and buttons inside it
         * cannot be reached. Never the only place essential information
         * lives (touch devices do not show tooltips).
         */
        content: ReactNode;
        /**
         * The trigger: ONE element that can take focus and forwards its ref
         * (Button, IconButton, a link, or a span with `tabIndex={0}`). A
         * disabled button cannot be hovered or focused: wrap it in a span.
         */
        children: ReactElement;
        /**
         * Side of the trigger, logical (`start`/`end` follow the direction).
         * Flips when there is no room. @default 'bottom' (x-core)
         */
        side?: LogicalSide;
        /** Alignment along the side, logical. @default 'center' */
        align?: LogicalAlign;
        /** Hover delay before opening, in ms. @default 300 */
        delayDuration?: number;
        /** Shows a small arrow toward the trigger. @default false */
        showArrow?: boolean;
        /** Never opens (the trigger renders as is). @default false */
        disabled?: boolean;
        /**
         * The tooltip only shows the trigger's accessible name (an icon
         * button's `aria-label`): it is not also linked as a description, so
         * screen readers do not read the name twice. @default false
         */
        labelOnly?: boolean;
        /** Controlled open state. */
        open?: boolean;
        /** Initial open state. */
        defaultOpen?: boolean;
        /** Called when the tooltip opens or closes. */
        onOpenChange?: (open: boolean) => void;
        /** Direction; read from the DOM when omitted. */
        dir?: Direction;
    };

const contentStyles = cn(
    'hz:relative hz:z-tooltip hz:text-start hz:max-w-[min(280px,calc(100vw-16px))] hz:rounded-xs hz:bg-tooltip hz:px-3 hz:py-2 hz:text-caption hz:text-tooltip-foreground hz:break-words hz:whitespace-pre-line hz:select-none',
    'hz:origin-(--radix-tooltip-content-transform-origin)',
    anchoredMotion,
    // Forced colors drop the dark fill; a border keeps the bubble's edge.
    'hz:forced-colors:border hz:forced-colors:border-solid hz:forced-colors:border-[CanvasText]'
);

/**
 * A short text label shown on hover (after `delayDuration`) and on keyboard
 * focus of its trigger, linked to it by `aria-describedby`; Escape closes it.
 * Touch input never opens it (Radix), so it must only repeat or supplement
 * visible information, e.g. an icon button's name. Portals into the
 * HorizonProvider root at `--z-tooltip` (1500, above MUI dialogs).
 */
export const Tooltip = forwardRef<HTMLDivElement, TooltipProps>(
    function Tooltip(
        {
            content,
            children,
            side: sideProp,
            align: alignProp,
            delayDuration,
            showArrow = false,
            disabled = false,
            labelOnly = false,
            open,
            defaultOpen,
            onOpenChange,
            dir,
            sideOffset = 6,
            collisionPadding = 8,
            className,
            onEscapeKeyDown,
            ...props
        },
        ref
    ) {
        const rest = omitLegacyProps('Tooltip', props, legacyTooltipProps);
        const side = resolveOption(
            'Tooltip',
            'side',
            sideProp,
            sides,
            'bottom'
        );
        const align = resolveOption(
            'Tooltip',
            'align',
            alignProp,
            aligns,
            'center'
        );
        // HorizonProvider renders the app's tooltip provider; only a Tooltip
        // outside any HorizonProvider (already warned by the portal
        // fallback) brings its own.
        const ownProvider = useContext(SharedProvider);
        const scope = useHorizonScope();
        const shared = ownProvider || scope !== null;
        const container = usePortalContainer();
        const anchorRef = useRef<HTMLButtonElement>(null);
        const direction = useResolvedDir(anchorRef, dir);
        if (disabled) return children;
        const placement = physicalPlacement(side, align, direction);

        const tooltip = (
            <TooltipPrimitive.Root
                {...(delayDuration !== undefined && { delayDuration })}
                {...(open !== undefined && { open })}
                {...(defaultOpen !== undefined && { defaultOpen })}
                {...(onOpenChange && { onOpenChange })}
            >
                <TooltipPrimitive.Trigger asChild ref={anchorRef}>
                    {labelOnly ? (
                        <WithoutDescription>{children}</WithoutDescription>
                    ) : (
                        children
                    )}
                </TooltipPrimitive.Trigger>
                {container && (
                    <TooltipPrimitive.Portal container={container}>
                        <TooltipPrimitive.Content
                            {...rest}
                            ref={ref}
                            side={placement.side}
                            align={placement.align}
                            sideOffset={sideOffset}
                            collisionPadding={collisionPadding}
                            onEscapeKeyDown={containEscape(onEscapeKeyDown)}
                            className={cn(contentStyles, className)}
                            data-tooltip-content=""
                        >
                            {content}
                            {showArrow && (
                                <TooltipPrimitive.Arrow
                                    width={12}
                                    height={6}
                                    className="hz:fill-tooltip"
                                />
                            )}
                        </TooltipPrimitive.Content>
                    </TooltipPrimitive.Portal>
                )}
            </TooltipPrimitive.Root>
        );
        if (shared) return tooltip;
        return (
            <TooltipPrimitive.Provider delayDuration={DEFAULT_DELAY}>
                {tooltip}
            </TooltipPrimitive.Provider>
        );
    }
);
Tooltip.displayName = 'Tooltip';
