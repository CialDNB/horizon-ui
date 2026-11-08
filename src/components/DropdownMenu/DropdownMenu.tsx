/*
 * Based on shadcn/ui DropdownMenu (registry 2025) on Radix DropdownMenu.
 * No direct x-core equivalent: the menus of x-core AppBarDropdownV2,
 * ProductsDropdownV2, HelpDropdown and SplitButton (MUI Menu/MenuItem with
 * icons, links and selection, x-core 2.2.30) are built on it.
 */
import { CaretRightIcon } from '@phosphor-icons/react/dist/csr/CaretRight';
import { CheckIcon } from '@phosphor-icons/react/dist/csr/Check';
import * as MenuPrimitive from '@radix-ui/react-dropdown-menu';
import {
    createContext,
    forwardRef,
    useContext,
    type ComponentPropsWithoutRef,
    type HTMLAttributes,
    type ReactNode,
} from 'react';
import { cn } from '../../lib/cn';
import { resolveOption } from '../../lib/options';
import {
    anchorGuard,
    anchoredMotion,
    containEscape,
    listItem,
    overlaySurface,
    physicalPlacement,
    type Direction,
    type LogicalAlign,
    type LogicalSide,
} from '../../primitives';
import { useHorizonScope, usePortalContainer } from '../../provider';
import type { DnbBase } from '../../types/DnbBase';
import { separatorVariants } from '../Separator';

const DirContext = createContext<Direction>('ltr');

/** Props for {@link DropdownMenu}. */
export type DropdownMenuProps = ComponentPropsWithoutRef<
    typeof MenuPrimitive.Root
>;

/**
 * Root of a menu of actions or options opened from a button. Arrow keys,
 * Home/End and type-ahead move between items; submenus open toward the
 * inline end (left in rtl). The direction comes from the nearest
 * HorizonProvider unless `dir` is given.
 */
export function DropdownMenu({ dir, ...props }: DropdownMenuProps) {
    const scopeDir = useHorizonScope()?.dir;
    const direction: Direction = dir ?? scopeDir ?? 'ltr';
    return (
        <DirContext.Provider value={direction}>
            <MenuPrimitive.Root {...props} dir={direction} />
        </DirContext.Provider>
    );
}
DropdownMenu.displayName = 'DropdownMenu';

/** Props for {@link DropdownMenuTrigger}. */
export type DropdownMenuTriggerProps = ComponentPropsWithoutRef<
    typeof MenuPrimitive.Trigger
> &
    DnbBase;

/**
 * The button that opens the menu (`aria-haspopup="menu"`, `aria-expanded`).
 * Use `asChild` with a Button or IconButton.
 */
export const DropdownMenuTrigger = forwardRef<
    HTMLButtonElement,
    DropdownMenuTriggerProps
>(function DropdownMenuTrigger(props, ref) {
    return <MenuPrimitive.Trigger {...props} ref={ref} />;
});
DropdownMenuTrigger.displayName = 'DropdownMenuTrigger';

// Mobile: a bottom sheet (base.css pins the Radix positioning wrapper to the
// bottom edge below tablet when `data-hz-menu-sheet` is present), full
// width, 44px rows, sliding up. Tablet+: anchored, scaling in.
const panelStyles = cn(
    'hz:relative hz:z-dropdown hz:flex hz:w-full hz:flex-col hz:overflow-y-auto hz:rounded-t-md hz:p-1 hz:pb-[max(4px,env(safe-area-inset-bottom))]',
    'hz:max-h-[70dvh] hz:[--hz-enter-y:100%]',
    overlaySurface,
    anchoredMotion,
    'hz:tablet:w-auto hz:tablet:min-w-48 hz:tablet:max-w-[min(320px,calc(100vw-16px))] hz:tablet:max-h-(--radix-dropdown-menu-content-available-height) hz:tablet:rounded-sm hz:tablet:pb-1 hz:tablet:[--hz-enter-y:0] hz:tablet:origin-(--radix-dropdown-menu-content-transform-origin)'
);

const sides: readonly LogicalSide[] = ['top', 'bottom', 'start', 'end'];
const aligns: readonly LogicalAlign[] = ['start', 'center', 'end'];

/** Props for {@link DropdownMenuContent}. */
export type DropdownMenuContentProps = Omit<
    ComponentPropsWithoutRef<typeof MenuPrimitive.Content>,
    'side' | 'align'
> &
    DnbBase & {
        /** Side of the trigger from tablet, logical. @default 'bottom' */
        side?: LogicalSide;
        /** Alignment along the side, logical. @default 'start' */
        align?: LogicalAlign;
    };

/**
 * The menu (`role="menu"`). A bottom sheet below tablet; from tablet
 * anchored to the trigger (min 192px, max 320px wide). Escape and an
 * outside click close it and return focus to the trigger. Portals into the
 * HorizonProvider root at `--z-dropdown` (1400, above dialogs).
 */
export const DropdownMenuContent = forwardRef<
    HTMLDivElement,
    DropdownMenuContentProps
>(function DropdownMenuContent(
    {
        side: sideProp,
        align: alignProp,
        sideOffset = 4,
        collisionPadding = 8,
        onEscapeKeyDown,
        className,
        ...props
    },
    ref
) {
    const dir = useContext(DirContext);
    const side = resolveOption(
        'DropdownMenuContent',
        'side',
        sideProp,
        sides,
        'bottom'
    );
    const align = resolveOption(
        'DropdownMenuContent',
        'align',
        alignProp,
        aligns,
        'start'
    );
    const placement = physicalPlacement(side, align, dir);
    const container = usePortalContainer();
    if (!container) return null;
    return (
        <MenuPrimitive.Portal container={container}>
            <MenuPrimitive.Content
                {...props}
                ref={ref}
                side={placement.side}
                align={placement.align}
                sideOffset={sideOffset}
                collisionPadding={collisionPadding}
                onEscapeKeyDown={containEscape(onEscapeKeyDown)}
                data-hz-menu-sheet=""
                data-menu-content=""
                className={cn(panelStyles, className)}
            />
        </MenuPrimitive.Portal>
    );
});
DropdownMenuContent.displayName = 'DropdownMenuContent';

// 44px rows at mobile and on touch pointers, 36px with a fine pointer.
const itemBase = cn(
    listItem(),
    'hz:border-0 hz:bg-transparent hz:px-3 hz:text-start hz:no-underline',
    'hz:[&_svg]:size-4 hz:[&_svg]:shrink-0',
    // asChild links: Bootstrap/customer360 `a`, `a:hover`, `a:focus` rules.
    anchorGuard('foreground', { hover: 'accent-foreground' })
);

// Muted on the popover; the highlight colour on a highlighted row (muted
// text on `accent` is below 4.5:1 for il).
const mutedInRow =
    'hz:text-muted-foreground hz:group-data-[highlighted]:text-accent-foreground hz:group-data-[state=open]:text-accent-foreground';

const destructiveItem =
    'hz:text-destructive-strong hz:data-[highlighted]:bg-destructive-subtle hz:data-[highlighted]:text-destructive-strong';

/** Props for {@link DropdownMenuItem}. */
export type DropdownMenuItemProps = ComponentPropsWithoutRef<
    typeof MenuPrimitive.Item
> &
    DnbBase & {
        /** Decorative 16px icon before the label. */
        icon?: ReactNode;
        /** Keyboard shortcut text shown at the end (display only). */
        shortcut?: ReactNode;
        /** Destructive look for delete/remove actions. @default false */
        destructive?: boolean;
    };

/**
 * One action (`role="menuitem"`). `onSelect` runs on click, Enter or Space
 * and closes the menu (call `event.preventDefault()` to keep it open). For
 * navigation use `asChild` with an `<a href>` (or a router Link).
 */
export const DropdownMenuItem = forwardRef<
    HTMLDivElement,
    DropdownMenuItemProps
>(function DropdownMenuItem(
    {
        icon,
        shortcut,
        destructive = false,
        asChild,
        className,
        children,
        ...props
    },
    ref
) {
    const classes = cn(itemBase, destructive && destructiveItem, className);
    if (asChild)
        return (
            <MenuPrimitive.Item
                {...props}
                ref={ref}
                asChild
                className={classes}
                data-destructive={destructive || undefined}
            >
                {children}
            </MenuPrimitive.Item>
        );
    return (
        <MenuPrimitive.Item
            {...props}
            ref={ref}
            className={classes}
            data-destructive={destructive || undefined}
        >
            {icon && (
                <span
                    aria-hidden="true"
                    className={cn('hz:inline-flex', !destructive && mutedInRow)}
                >
                    {icon}
                </span>
            )}
            <span className="hz:min-w-0 hz:flex-1 hz:truncate">{children}</span>
            {shortcut && (
                <DropdownMenuShortcut>{shortcut}</DropdownMenuShortcut>
            )}
        </MenuPrimitive.Item>
    );
});
DropdownMenuItem.displayName = 'DropdownMenuItem';

const indicatorSlot =
    'hz:absolute hz:start-3 hz:inline-flex hz:items-center hz:text-primary';

/** Props for {@link DropdownMenuCheckboxItem}. */
export type DropdownMenuCheckboxItemProps = ComponentPropsWithoutRef<
    typeof MenuPrimitive.CheckboxItem
> &
    DnbBase;

/** An on/off option (`role="menuitemcheckbox"`, `aria-checked`). */
export const DropdownMenuCheckboxItem = forwardRef<
    HTMLDivElement,
    DropdownMenuCheckboxItemProps
>(function DropdownMenuCheckboxItem({ className, children, ...props }, ref) {
    return (
        <MenuPrimitive.CheckboxItem
            {...props}
            ref={ref}
            className={cn(itemBase, 'hz:ps-9', className)}
        >
            <MenuPrimitive.ItemIndicator className={indicatorSlot}>
                <CheckIcon aria-hidden="true" weight="bold" />
            </MenuPrimitive.ItemIndicator>
            <span className="hz:min-w-0 hz:flex-1 hz:truncate">{children}</span>
        </MenuPrimitive.CheckboxItem>
    );
});
DropdownMenuCheckboxItem.displayName = 'DropdownMenuCheckboxItem';

/** Props for {@link DropdownMenuRadioGroup}. */
export type DropdownMenuRadioGroupProps = ComponentPropsWithoutRef<
    typeof MenuPrimitive.RadioGroup
> &
    DnbBase;

/** A single choice among {@link DropdownMenuRadioItem}s (`value`, `onValueChange`). */
export const DropdownMenuRadioGroup = forwardRef<
    HTMLDivElement,
    DropdownMenuRadioGroupProps
>(function DropdownMenuRadioGroup(props, ref) {
    return <MenuPrimitive.RadioGroup {...props} ref={ref} />;
});
DropdownMenuRadioGroup.displayName = 'DropdownMenuRadioGroup';

/** Props for {@link DropdownMenuRadioItem}. */
export type DropdownMenuRadioItemProps = ComponentPropsWithoutRef<
    typeof MenuPrimitive.RadioItem
> &
    DnbBase;

/** One choice of a radio group (`role="menuitemradio"`, `aria-checked`). */
export const DropdownMenuRadioItem = forwardRef<
    HTMLDivElement,
    DropdownMenuRadioItemProps
>(function DropdownMenuRadioItem({ className, children, ...props }, ref) {
    return (
        <MenuPrimitive.RadioItem
            {...props}
            ref={ref}
            className={cn(itemBase, 'hz:ps-9', className)}
        >
            <MenuPrimitive.ItemIndicator className={indicatorSlot}>
                <span className="hz:size-2 hz:rounded-full hz:bg-primary hz:forced-colors:forced-color-adjust-none hz:forced-colors:bg-[CanvasText]" />
            </MenuPrimitive.ItemIndicator>
            <span className="hz:min-w-0 hz:flex-1 hz:truncate">{children}</span>
        </MenuPrimitive.RadioItem>
    );
});
DropdownMenuRadioItem.displayName = 'DropdownMenuRadioItem';

/** Props for {@link DropdownMenuLabel}. */
export type DropdownMenuLabelProps = ComponentPropsWithoutRef<
    typeof MenuPrimitive.Label
> &
    DnbBase;

/** A heading for a group of items (not focusable). */
export const DropdownMenuLabel = forwardRef<
    HTMLDivElement,
    DropdownMenuLabelProps
>(function DropdownMenuLabel({ className, ...props }, ref) {
    return (
        <MenuPrimitive.Label
            {...props}
            ref={ref}
            className={cn(
                'hz:px-3 hz:pt-2 hz:pb-1 hz:text-label-sm hz:text-muted-foreground',
                className
            )}
        />
    );
});
DropdownMenuLabel.displayName = 'DropdownMenuLabel';

/** Props for {@link DropdownMenuGroup}. */
export type DropdownMenuGroupProps = ComponentPropsWithoutRef<
    typeof MenuPrimitive.Group
> &
    DnbBase;

/** Groups items (`role="group"`); name it with `aria-labelledby` to a label. */
export const DropdownMenuGroup = forwardRef<
    HTMLDivElement,
    DropdownMenuGroupProps
>(function DropdownMenuGroup(props, ref) {
    return <MenuPrimitive.Group {...props} ref={ref} />;
});
DropdownMenuGroup.displayName = 'DropdownMenuGroup';

/** Props for {@link DropdownMenuSeparator}. */
export type DropdownMenuSeparatorProps = ComponentPropsWithoutRef<
    typeof MenuPrimitive.Separator
> &
    DnbBase;

/** A divider between groups (Separator's look, `role="separator"`). */
export const DropdownMenuSeparator = forwardRef<
    HTMLDivElement,
    DropdownMenuSeparatorProps
>(function DropdownMenuSeparator({ className, ...props }, ref) {
    return (
        <MenuPrimitive.Separator
            {...props}
            ref={ref}
            className={cn(
                separatorVariants({ orientation: 'horizontal' }),
                'hz:-mx-1 hz:my-1 hz:w-auto',
                className
            )}
        />
    );
});
DropdownMenuSeparator.displayName = 'DropdownMenuSeparator';

/** Props for {@link DropdownMenuShortcut}. */
export type DropdownMenuShortcutProps = HTMLAttributes<HTMLSpanElement> &
    DnbBase;

/** Shortcut text at the end of an item (display only; bind the keys yourself). */
export function DropdownMenuShortcut({
    className,
    ...props
}: DropdownMenuShortcutProps) {
    return (
        <span
            {...props}
            className={cn(
                'hz:ms-auto hz:ps-4 hz:text-caption',
                mutedInRow,
                className
            )}
        />
    );
}
DropdownMenuShortcut.displayName = 'DropdownMenuShortcut';

/** Props for {@link DropdownMenuSub}. */
export type DropdownMenuSubProps = ComponentPropsWithoutRef<
    typeof MenuPrimitive.Sub
>;

/** A nested menu: a {@link DropdownMenuSubTrigger} and its {@link DropdownMenuSubContent}. */
export function DropdownMenuSub(props: DropdownMenuSubProps) {
    return <MenuPrimitive.Sub {...props} />;
}
DropdownMenuSub.displayName = 'DropdownMenuSub';

/** Props for {@link DropdownMenuSubTrigger}. */
export type DropdownMenuSubTriggerProps = ComponentPropsWithoutRef<
    typeof MenuPrimitive.SubTrigger
> &
    DnbBase & {
        /** Decorative 16px icon before the label. */
        icon?: ReactNode;
    };

/**
 * Opens a submenu on hover, ArrowRight (ArrowLeft in rtl), Enter or Space;
 * the caret mirrors under rtl.
 */
export const DropdownMenuSubTrigger = forwardRef<
    HTMLDivElement,
    DropdownMenuSubTriggerProps
>(function DropdownMenuSubTrigger(
    { icon, className, children, ...props },
    ref
) {
    return (
        <MenuPrimitive.SubTrigger
            {...props}
            ref={ref}
            className={cn(
                itemBase,
                'hz:data-[state=open]:bg-accent hz:data-[state=open]:text-accent-foreground',
                className
            )}
        >
            {icon && (
                <span
                    aria-hidden="true"
                    className={cn('hz:inline-flex', mutedInRow)}
                >
                    {icon}
                </span>
            )}
            <span className="hz:min-w-0 hz:flex-1 hz:truncate">{children}</span>
            <CaretRightIcon
                aria-hidden="true"
                className="hz:ms-auto hz:rtl:-scale-x-100"
            />
        </MenuPrimitive.SubTrigger>
    );
});
DropdownMenuSubTrigger.displayName = 'DropdownMenuSubTrigger';

/** Props for {@link DropdownMenuSubContent}. */
export type DropdownMenuSubContentProps = ComponentPropsWithoutRef<
    typeof MenuPrimitive.SubContent
> &
    DnbBase;

/** The nested menu, beside its trigger toward the inline end (a sheet at mobile). */
export const DropdownMenuSubContent = forwardRef<
    HTMLDivElement,
    DropdownMenuSubContentProps
>(function DropdownMenuSubContent(
    {
        className,
        sideOffset = 4,
        collisionPadding = 8,
        onEscapeKeyDown,
        ...props
    },
    ref
) {
    const container = usePortalContainer();
    if (!container) return null;
    return (
        <MenuPrimitive.Portal container={container}>
            <MenuPrimitive.SubContent
                {...props}
                ref={ref}
                sideOffset={sideOffset}
                collisionPadding={collisionPadding}
                onEscapeKeyDown={containEscape(onEscapeKeyDown)}
                data-hz-menu-sheet=""
                data-menu-content=""
                className={cn(panelStyles, className)}
            />
        </MenuPrimitive.Portal>
    );
});
DropdownMenuSubContent.displayName = 'DropdownMenuSubContent';
