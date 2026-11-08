/*
 * No shadcn base (shadcn's Drawer is vaul, a bottom sheet only): Radix
 * Dialog styled as a side panel. Port of x-core `DrawerV3` (MUI Drawer
 * content panel, x-core 2.2.30), mapped separately from the navigation
 * drawer `DrawerV2` (NavigationDrawer).
 */
import { XIcon } from '@phosphor-icons/react/dist/csr/X';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { cva, type VariantProps } from 'class-variance-authority';
import {
    forwardRef,
    useRef,
    type CSSProperties,
    type HTMLAttributes,
    type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../lib/cn';
import { omitLegacyProps, resolveOption } from '../../lib/options';
import {
    composeRefs,
    containEscape,
    overlayCloseBase,
    overlaySurface,
    panelMotion,
    scrimStyles,
    useKeptContent,
    useModalLayer,
} from '../../primitives';
import { usePortalContainer } from '../../provider';
import type { DnbBase } from '../../types/DnbBase';

// Mobile: a full-width bottom sheet (x-core anchors bottom below tablet),
// up to 90% of the viewport, sliding up. Tablet+: full-height side panel on
// the logical side, `width` wide, sliding in from that edge (mirrored rtl).
const drawerStyles = cva(
    [
        'hz:fixed hz:inset-x-0 hz:bottom-0 hz:z-dialog hz:flex hz:max-h-[90dvh] hz:w-full hz:flex-col hz:overflow-hidden hz:rounded-t-md hz:text-body-default',
        overlaySurface,
        panelMotion,
        'hz:[--hz-enter-y:100%]',
        'hz:tablet:inset-y-0 hz:tablet:max-h-none hz:tablet:w-(--hz-drawer-width) hz:tablet:max-w-full hz:tablet:rounded-none hz:tablet:[--hz-enter-y:0]',
    ],
    {
        variants: {
            side: {
                end: 'hz:tablet:start-auto hz:tablet:end-0 hz:tablet:[--hz-enter-x:100%] hz:tablet:rtl:[--hz-enter-x:-100%]',
                start: 'hz:tablet:start-0 hz:tablet:end-auto hz:tablet:[--hz-enter-x:-100%] hz:tablet:rtl:[--hz-enter-x:100%]',
            },
        },
        defaultVariants: { side: 'end' },
    }
);

/** Options accepted by {@link drawerVariants}: `side`. */
export type DrawerVariantOptions = VariantProps<typeof drawerStyles>;

/** Logical side a {@link Drawer} opens on from tablet. */
export type DrawerSide = NonNullable<DrawerVariantOptions['side']>;

const drawerSides: readonly DrawerSide[] = ['end', 'start'];

/** Class string for the drawer panel, conflict-resolved with `cn()`. */
export function drawerVariants(options?: DrawerVariantOptions): string {
    return cn(drawerStyles(options));
}

/** x-core DrawerV3 props that are dropped (dev warning). */
const legacyDrawerProps = {
    isOpen: 'use open',
    onClose: 'use onOpenChange(false)',
    direction: 'use side (logical; mirrors under rtl by itself)',
    sx: 'use className',
} as const;

/** Props for {@link Drawer}. */
export type DrawerProps = Omit<
    HTMLAttributes<HTMLDivElement>,
    'title' | 'content' | 'dir'
> &
    DnbBase & {
        /** Panel title; names the drawer (`aria-labelledby`). */
        title: string;
        /** The panel body; scrolls inside. */
        content: ReactNode;
        /** Actions under the body, usually Buttons (x-core `actions`). */
        actions?: ReactNode;
        /** Open state (x-core `isOpen`). */
        open: boolean;
        /** Called with `false` on close: button, Escape, scrim (x-core `onClose`). */
        onOpenChange: (open: boolean) => void;
        /**
         * Edge it opens from at tablet+, logical: `end` is the right edge in
         * ltr and the left edge in rtl (x-core always used the right edge).
         * A bottom sheet at mobile.
         * @default 'end'
         */
        side?: DrawerSide;
        /**
         * Panel width from tablet (any CSS width: `480`, `'40rem'`,
         * `'90%'`), never wider than the viewport. Full width at mobile.
         * @default '320px'
         */
        width?: CSSProperties['width'];
        /**
         * Keeps `content` mounted while closed, so its state (form input,
         * scroll position of inner lists) survives closing. Read once, on
         * mount (toggling it later has no effect). While closed the content
         * lives in a detached element: anything that measures layout there
         * (charts) sees 0 until the drawer opens.
         * @default false
         */
        keepMounted?: boolean;
        /** Accessible name of the close button. Translate it. @default 'Close' */
        closeLabel?: string;
    };

/**
 * A modal side panel for secondary tasks (details, filters, edit forms):
 * title row with close button, scrolling content, optional actions. Focus is
 * trapped and returns on close; Escape, the close button and the scrim
 * close it. Portals into the HorizonProvider root at `--z-dialog` (1350).
 */
export const Drawer = forwardRef<HTMLDivElement, DrawerProps>(function Drawer(
    {
        title,
        content,
        actions,
        open,
        onOpenChange,
        side: sideProp,
        width = '320px',
        keepMounted = false,
        closeLabel = 'Close',
        className,
        style,
        ...props
    },
    ref
) {
    const rest = omitLegacyProps('Drawer', props, legacyDrawerProps);
    const side = resolveOption('Drawer', 'side', sideProp, drawerSides, 'end');
    const container = usePortalContainer();
    const { keeper, attach: attachKeeper } = useKeptContent(keepMounted);
    const openerRef = useRef<Element | null>(null);
    const layerRef = useModalLayer();
    return (
        <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
            {keeper && createPortal(content, keeper)}
            {container && (
                <DialogPrimitive.Portal container={container}>
                    <DialogPrimitive.Overlay
                        className={scrimStyles}
                        data-drawer-overlay=""
                    />
                    <DialogPrimitive.Content
                        aria-describedby={undefined}
                        {...rest}
                        ref={composeRefs(ref, layerRef)}
                        onEscapeKeyDown={containEscape()}
                        onOpenAutoFocus={() => {
                            openerRef.current = document.activeElement;
                        }}
                        onCloseAutoFocus={(event) => {
                            const opener = openerRef.current;
                            if (
                                opener instanceof HTMLElement &&
                                opener.isConnected
                            ) {
                                event.preventDefault();
                                opener.focus();
                            }
                        }}
                        style={
                            {
                                '--hz-drawer-width':
                                    typeof width === 'number'
                                        ? `${width}px`
                                        : width,
                                ...style,
                            } as CSSProperties
                        }
                        data-side={side}
                        data-drawer-content=""
                        className={cn(drawerStyles({ side }), className)}
                    >
                        <div className="hz:flex hz:min-h-14 hz:shrink-0 hz:items-center hz:gap-2 hz:border-0 hz:border-b hz:border-solid hz:border-border hz:ps-4 hz:pe-2">
                            <DialogPrimitive.Title className="hz:m-0 hz:min-w-0 hz:flex-1 hz:p-0 hz:text-label-lg hz:text-foreground hz:break-words">
                                {title}
                            </DialogPrimitive.Title>
                            <DialogPrimitive.Close
                                aria-label={closeLabel}
                                className={cn(
                                    overlayCloseBase,
                                    'hz:text-muted-foreground hz:hover:text-foreground hz:[&_svg]:size-5'
                                )}
                            >
                                <XIcon aria-hidden="true" />
                            </DialogPrimitive.Close>
                        </div>
                        <div
                            ref={keeper ? attachKeeper : undefined}
                            data-drawer-body=""
                            className="hz:min-h-0 hz:flex-1 hz:overflow-y-auto hz:p-4 hz:break-words"
                        >
                            {!keeper && content}
                        </div>
                        {actions !== undefined && actions !== null && (
                            <div
                                data-drawer-actions=""
                                className="hz:flex hz:shrink-0 hz:flex-wrap hz:items-center hz:justify-end hz:gap-2 hz:border-0 hz:border-t hz:border-solid hz:border-border hz:px-4 hz:pt-3 hz:pb-[max(12px,env(safe-area-inset-bottom))]"
                            >
                                {actions}
                            </div>
                        )}
                    </DialogPrimitive.Content>
                </DialogPrimitive.Portal>
            )}
        </DialogPrimitive.Root>
    );
});
Drawer.displayName = 'Drawer';
