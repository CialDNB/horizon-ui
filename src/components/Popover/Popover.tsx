/*
 * Based on shadcn/ui Popover (registry 2025) on Radix Popover, with x-core's
 * card layout (title row with icon and close button, body, footer) built
 * into PopoverContent. Replaces x-core `PopoverV2` (MUI Popover in a Card,
 * x-core 2.2.30); `Popover` (v1) is superseded.
 */
import { XIcon } from '@phosphor-icons/react/dist/csr/X';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import {
    forwardRef,
    useId,
    useRef,
    type ComponentPropsWithoutRef,
    type CSSProperties,
    type ReactNode,
} from 'react';
import { cn } from '../../lib/cn';
import { omitLegacyProps, resolveOption } from '../../lib/options';
import {
    anchoredMotion,
    containEscape,
    ignoreToastPresses,
    overlayCloseBase,
    overlaySurface,
    physicalPlacement,
    useResolvedDir,
    type Direction,
    type LogicalAlign,
    type LogicalSide,
} from '../../primitives';
import { usePortalContainer } from '../../provider';
import type { DnbBase } from '../../types/DnbBase';

/** x-core PopoverV2 / MUI Popover props that are dropped (dev warning). */
const legacyRootProps = {
    anchorEl: 'wrap the anchor in PopoverTrigger or PopoverAnchor',
    onClose: 'use onOpenChange(false)',
    anchorOrigin: 'use PopoverContent side and align',
    transformOrigin: 'use PopoverContent side and align',
    slotProps: 'use PopoverContent className or width',
    sx: 'use PopoverContent className',
    title: 'use PopoverContent title',
    icon: 'use PopoverContent icon',
    footer: 'use PopoverContent footer',
    hideCloseButton: 'use PopoverContent hideCloseButton',
} as const;

const legacyContentProps = {
    anchorOrigin: 'use side and align',
    transformOrigin: 'use side and align',
    slotProps: 'use className or width',
    sx: 'use className',
} as const;

/** Props for {@link Popover}. */
export type PopoverProps = ComponentPropsWithoutRef<
    typeof PopoverPrimitive.Root
>;

/**
 * Root of a popover: holds the open state. Non-modal by default (Tab can
 * leave it, the page stays usable); `modal` traps focus and hides the rest
 * of the page from assistive tech.
 */
export function Popover(props: PopoverProps) {
    const rest = omitLegacyProps('Popover', props, legacyRootProps);
    return <PopoverPrimitive.Root {...rest} />;
}
Popover.displayName = 'Popover';

/** Props for {@link PopoverTrigger}. */
export type PopoverTriggerProps = ComponentPropsWithoutRef<
    typeof PopoverPrimitive.Trigger
> &
    DnbBase;

/**
 * The control that opens the popover (`aria-expanded`, `aria-controls`).
 * Use `asChild` to make a Button or IconButton the trigger.
 */
export const PopoverTrigger = forwardRef<
    HTMLButtonElement,
    PopoverTriggerProps
>(function PopoverTrigger(props, ref) {
    return <PopoverPrimitive.Trigger {...props} ref={ref} />;
});
PopoverTrigger.displayName = 'PopoverTrigger';

/** Props for {@link PopoverAnchor}. */
export type PopoverAnchorProps = ComponentPropsWithoutRef<
    typeof PopoverPrimitive.Anchor
> &
    DnbBase;

/**
 * Positions the popover against another element than the trigger (x-core
 * `anchorEl`), e.g. a whole row while a button inside it opens it.
 */
export const PopoverAnchor = forwardRef<HTMLDivElement, PopoverAnchorProps>(
    function PopoverAnchor(props, ref) {
        return <PopoverPrimitive.Anchor {...props} ref={ref} />;
    }
);
PopoverAnchor.displayName = 'PopoverAnchor';

/** Props for {@link PopoverClose}. */
export type PopoverCloseProps = ComponentPropsWithoutRef<
    typeof PopoverPrimitive.Close
> &
    DnbBase;

/** Closes the popover (use `asChild` with a Button in the footer). */
export const PopoverClose = forwardRef<HTMLButtonElement, PopoverCloseProps>(
    function PopoverClose(props, ref) {
        return <PopoverPrimitive.Close {...props} ref={ref} />;
    }
);
PopoverClose.displayName = 'PopoverClose';

const sides: readonly LogicalSide[] = ['top', 'bottom', 'start', 'end'];
const aligns: readonly LogicalAlign[] = ['start', 'center', 'end'];

/** Props for {@link PopoverContent}. */
export type PopoverContentProps = Omit<
    ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>,
    'side' | 'align' | 'title' | 'asChild' | 'dir'
> &
    DnbBase & {
        /**
         * Side of the trigger, logical (`start`/`end` follow the direction).
         * Flips when there is no room. @default 'bottom'
         */
        side?: LogicalSide;
        /**
         * Alignment along the side, logical. x-core opened at the trigger's
         * end edge. @default 'end'
         */
        align?: LogicalAlign;
        /**
         * Title row (x-core `title`): names the popover dialog
         * (`aria-labelledby`) and holds the close button.
         */
        title?: ReactNode;
        /** Decorative 20px icon before the title (x-core `icon`). */
        icon?: ReactNode;
        /** Footer row under a divider, usually actions (x-core `footer`). */
        footer?: ReactNode;
        /** Hides the close button of the title row. @default false */
        hideCloseButton?: boolean;
        /** Accessible name of the close button. Translate it. @default 'Close' */
        closeLabel?: string;
        /**
         * Width (any CSS width); never wider than the viewport minus 16px.
         * @default '320px' (x-core 318px)
         */
        width?: CSSProperties['width'];
        /** Shows an arrow toward the anchor. @default false */
        showArrow?: boolean;
        /** Direction; read from the DOM when omitted. */
        dir?: Direction;
    };

const contentStyles = cn(
    'hz:relative hz:z-popover hz:flex hz:max-h-(--radix-popover-content-available-height) hz:w-(--hz-popover-width) hz:max-w-[calc(100vw-16px)] hz:min-w-45 hz:flex-col hz:overflow-hidden hz:rounded-sm hz:text-body-secondary',
    overlaySurface,
    'hz:origin-(--radix-popover-content-transform-origin)',
    anchoredMotion
);

/**
 * The floating panel (`role="dialog"`): optional title row with icon and
 * close button, a scrollable body (`children`) and an optional footer.
 * Focus moves into it on open and back to the trigger on close; Escape and
 * an outside click close it. Portals into the HorizonProvider root at
 * `--z-popover` (1450, above MUI dialogs).
 */
export const PopoverContent = forwardRef<HTMLDivElement, PopoverContentProps>(
    function PopoverContent(
        {
            side: sideProp,
            align: alignProp,
            title,
            icon,
            footer,
            hideCloseButton = false,
            closeLabel = 'Close',
            width = '320px',
            showArrow = false,
            dir,
            sideOffset = 8,
            collisionPadding = 8,
            onEscapeKeyDown,
            onPointerDownOutside,
            onInteractOutside,
            className,
            style,
            children,
            ...props
        },
        ref
    ) {
        const rest = omitLegacyProps(
            'PopoverContent',
            props,
            legacyContentProps
        );
        const side = resolveOption(
            'PopoverContent',
            'side',
            sideProp,
            sides,
            'bottom'
        );
        const align = resolveOption(
            'PopoverContent',
            'align',
            alignProp,
            aligns,
            'end'
        );
        const container = usePortalContainer();
        const probeRef = useRef<HTMLSpanElement>(null);
        const direction = useResolvedDir(probeRef, dir);
        const placement = physicalPlacement(side, align, direction);
        const titleId = useId();
        const hasTitle = title !== undefined && title !== null;
        return (
            <>
                {/* Reads the trigger side's direction (the content portals away). */}
                <span ref={probeRef} hidden />
                {container && (
                    <PopoverPrimitive.Portal container={container}>
                        <PopoverPrimitive.Content
                            {...(hasTitle && { 'aria-labelledby': titleId })}
                            {...rest}
                            ref={ref}
                            side={placement.side}
                            align={placement.align}
                            sideOffset={sideOffset}
                            collisionPadding={collisionPadding}
                            onEscapeKeyDown={containEscape(onEscapeKeyDown)}
                            onPointerDownOutside={ignoreToastPresses(
                                onPointerDownOutside
                            )}
                            onInteractOutside={ignoreToastPresses(
                                onInteractOutside
                            )}
                            style={
                                {
                                    '--hz-popover-width':
                                        typeof width === 'number'
                                            ? `${width}px`
                                            : width,
                                    ...style,
                                } as CSSProperties
                            }
                            className={cn(contentStyles, className)}
                            data-popover-content=""
                        >
                            {hasTitle && (
                                <div className="hz:flex hz:min-h-12 hz:shrink-0 hz:items-center hz:gap-2 hz:border-0 hz:border-b hz:border-solid hz:border-border hz:ps-3 hz:pe-1">
                                    {icon && (
                                        <span
                                            aria-hidden="true"
                                            className="hz:inline-flex hz:shrink-0 hz:text-primary hz:[&_svg]:size-5"
                                        >
                                            {icon}
                                        </span>
                                    )}
                                    <div
                                        id={titleId}
                                        className="hz:min-w-0 hz:flex-1 hz:truncate hz:text-label-md hz:text-foreground"
                                    >
                                        {title}
                                    </div>
                                    {!hideCloseButton && (
                                        <PopoverPrimitive.Close
                                            aria-label={closeLabel}
                                            className={cn(
                                                overlayCloseBase,
                                                'hz:text-muted-foreground hz:hover:text-foreground hz:[&_svg]:size-5'
                                            )}
                                        >
                                            <XIcon aria-hidden="true" />
                                        </PopoverPrimitive.Close>
                                    )}
                                </div>
                            )}
                            <div
                                data-popover-body=""
                                className="hz:min-h-0 hz:flex-1 hz:overflow-y-auto hz:p-3"
                            >
                                {children}
                            </div>
                            {footer && (
                                <div className="hz:flex hz:min-h-12 hz:shrink-0 hz:flex-wrap hz:items-center hz:justify-end hz:gap-2 hz:border-0 hz:border-t hz:border-solid hz:border-border hz:p-3">
                                    {footer}
                                </div>
                            )}
                            {showArrow && (
                                <PopoverPrimitive.Arrow
                                    width={12}
                                    height={6}
                                    className="hz:fill-popover"
                                />
                            )}
                        </PopoverPrimitive.Content>
                    </PopoverPrimitive.Portal>
                )}
            </>
        );
    }
);
PopoverContent.displayName = 'PopoverContent';
