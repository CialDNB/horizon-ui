/*
 * Based on shadcn/ui Button `size="icon"` (registry 2025); no separate shadcn
 * component. Native <button> or Radix Slot (`asChild`), sharing the Button
 * conventions. Replaces x-core `IconButton` (MUI IconButton wrapper) and the
 * compact form of `ActionIconButton`, x-core 2.2.30.
 */
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import {
    forwardRef,
    type ButtonHTMLAttributes,
    type MouseEvent,
    type ReactNode,
} from 'react';
import { cn } from '../../lib/cn';
import { resolveOption, warnOnce } from '../../lib/options';
import { anchorGuard } from '../../primitives';
import { Spinner } from '../Spinner';
import type { DnbBase } from '../../types/DnbBase';

const iconButtonStyles = cva(
    [
        'hz:relative hz:inline-flex hz:shrink-0 hz:items-center hz:justify-center hz:p-0 hz:align-middle',
        'hz:rounded-full hz:border hz:border-transparent hz:leading-none',
        'hz:cursor-pointer hz:select-none hz:no-underline',
        'hz:transition hz:duration-fast hz:ease-standard',
        // As Button: the ring is also written as state variants so it out-ranks
        // Bootstrap reboot's `button:focus` (0,1,1) in styles.unlayered.css.
        'hz:outline-ring hz:focus:outline-none hz:focus-visible:outline-2 hz:focus-visible:outline-offset-2 hz:focus-visible:outline-solid hz:focus-visible:outline-ring',
        'hz:active:scale-[0.98]',
        // Bootstrap reboot sets `svg { vertical-align: middle }`: set here so the
        // icon box is the same with or without it (it is a flex item).
        'hz:[&_svg]:pointer-events-none hz:[&_svg]:shrink-0 hz:[&_svg]:align-middle',
        'hz:inactive:cursor-not-allowed hz:inactive:text-muted-foreground hz:inactive:active:scale-100',
        'hz:aria-busy:not-disabled:cursor-progress hz:aria-busy:active:scale-100',
    ],
    {
        variants: {
            variant: {
                primary: `hz:bg-primary hz:text-primary-foreground hz:hover:bg-primary-hover hz:inactive:bg-muted ${anchorGuard('primary-foreground')}`,
                secondary: `hz:border-primary hz:bg-transparent hz:text-primary hz:hover:bg-primary hz:inactive:border-input hz:inactive:bg-transparent ${anchorGuard('primary', { hover: 'primary-foreground' })}`,
                // Button's tertiary underlines on hover; an icon has no text
                // to underline, so it tints to `accent` like ghost.
                tertiary: `hz:bg-transparent hz:text-primary hz:hover:bg-accent hz:inactive:bg-transparent ${anchorGuard('primary', { hover: 'accent-foreground' })}`,
                destructive: `hz:bg-destructive hz:text-destructive-foreground hz:hover:bg-destructive-hover hz:inactive:bg-muted ${anchorGuard('destructive-foreground')}`,
                ghost: `hz:bg-transparent hz:text-foreground hz:hover:bg-accent hz:inactive:bg-transparent ${anchorGuard('foreground', { hover: 'accent-foreground' })}`,
            },
            // Square boxes: 44/44/48 at mobile and on touch pointers (the box
            // is the target); 32/36/44 from tablet with a fine pointer, as
            // Button's heights. Icons 16/20/24.
            size: {
                sm: 'hz:size-11 hz:tablet:pointer-fine:size-8 hz:[&_svg]:size-4',
                md: 'hz:size-11 hz:tablet:pointer-fine:size-9 hz:[&_svg]:size-5',
                lg: 'hz:size-12 hz:tablet:pointer-fine:size-11 hz:[&_svg]:size-6',
            },
        },
        defaultVariants: { variant: 'primary', size: 'md' },
    }
);

/** Options accepted by {@link iconButtonVariants}: `variant`, `size`. */
export type IconButtonVariantOptions = VariantProps<typeof iconButtonStyles>;

/** Visual style of an {@link IconButton}. */
export type IconButtonVariant = NonNullable<
    IconButtonVariantOptions['variant']
>;

/** Size of an {@link IconButton}. */
export type IconButtonSize = NonNullable<IconButtonVariantOptions['size']>;

const iconButtonVariantNames: readonly IconButtonVariant[] = [
    'primary',
    'secondary',
    'tertiary',
    'destructive',
    'ghost',
];
const iconButtonSizes: readonly IconButtonSize[] = ['sm', 'md', 'lg'];
const spinnerSize = { sm: 'sm', md: 'md', lg: 'lg' } as const;

/**
 * Class string for the IconButton look, conflict-resolved with `cn()`. Set
 * `disabled` or `aria-disabled="true"` on the element for the inactive look.
 */
export function iconButtonVariants(options?: IconButtonVariantOptions): string {
    return cn(iconButtonStyles(options));
}

/**
 * An icon-only control has no visible text, so its name is required: either
 * `aria-label` or `aria-labelledby`.
 */
export type IconButtonName =
    | {
          /** Accessible name (translated), for example "Edit email". */
          'aria-label': string;
          /** Id of an element naming the button, instead of `aria-label`. */
          'aria-labelledby'?: string;
      }
    | {
          'aria-label'?: string;
          'aria-labelledby': string;
      };

/** Props for {@link IconButton}. */
export type IconButtonProps = Omit<
    ButtonHTMLAttributes<HTMLButtonElement>,
    'aria-label' | 'aria-labelledby' | 'children' | 'color'
> &
    DnbBase &
    IconButtonName & {
        /**
         * The icon (decorative: it is hidden from assistive technology, the
         * name comes from `aria-label`). Sized by the button. With `asChild`,
         * the single child element (for example a router link) wrapping it.
         */
        children: ReactNode;
        /**
         * Visual style, as {@link Button}. `primary` solid (x-core
         * `color="default"`), `secondary` outlined, `tertiary` primary icon
         * on a transparent surface (x-core `color="primary"`), `destructive`
         * solid, `ghost` neutral toolbar icon.
         * @default 'primary'
         */
        variant?: IconButtonVariant;
        /**
         * Size. Mobile and touch pointers always get at least a 44px square;
         * from `tablet` with a fine pointer it is 32/36/44px.
         * @default 'md'
         */
        size?: IconButtonSize;
        /**
         * Shows a spinner in place of the icon, sets `aria-busy` and
         * `aria-disabled`, and blocks `onClick`. The button stays focusable
         * and keeps its name.
         * @default false
         */
        loading?: boolean;
        /**
         * Renders the single child element (for example a router link) with
         * the IconButton styles and props instead of a `<button>`. Mark the
         * icon inside it `aria-hidden`. No spinner in this mode; `aria-busy`
         * still is set.
         * @default false
         */
        asChild?: boolean;
    };

/**
 * An action shown as an icon only: a native `<button type="button">` (or,
 * with `asChild`, the child element) that must be named with `aria-label`
 * (or `aria-labelledby`). Shares Button's variants, states and focus ring;
 * it is circular. Until Tooltip lands, the name is not shown on hover: pick
 * an icon whose meaning is unambiguous, or use `Button` with a label.
 */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
    function IconButton(
        {
            variant: variantProp,
            size: sizeProp,
            loading = false,
            asChild = false,
            className,
            type,
            disabled = false,
            onClick,
            children,
            ...rest
        },
        ref
    ) {
        // Untyped callers may pass x-core values (`color`-style names).
        const variant = resolveOption(
            'IconButton',
            'variant',
            variantProp,
            iconButtonVariantNames,
            'primary'
        );
        const size = resolveOption(
            'IconButton',
            'size',
            sizeProp,
            iconButtonSizes,
            'md'
        );
        if (!rest['aria-label'] && !rest['aria-labelledby'])
            warnOnce(
                'IconButton: no accessible name. Pass aria-label (or aria-labelledby): an icon alone is not announced.'
            );
        const ariaDisabled =
            rest['aria-disabled'] === true || rest['aria-disabled'] === 'true';
        const blocked = loading || disabled || ariaDisabled;
        // Same blocking as Button (two uses: kept local, extracted at 3+).
        const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
            if (blocked) {
                event.preventDefault();
                return;
            }
            onClick?.(event);
        };
        const shared = {
            ...rest,
            ref,
            className: cn(iconButtonStyles({ variant, size }), className),
            'data-variant': variant,
            'data-size': size,
            'aria-busy': loading || undefined,
            'aria-disabled': loading || ariaDisabled || undefined,
            onClick: handleClick,
        };

        if (asChild)
            return (
                <Slot
                    {...shared}
                    {...(disabled && { 'aria-disabled': true, tabIndex: -1 })}
                >
                    {children}
                </Slot>
            );

        return (
            <button type={type ?? 'button'} disabled={disabled} {...shared}>
                {loading ? (
                    <Spinner
                        aria-hidden="true"
                        size={spinnerSize[size]}
                        tone="inherit"
                    />
                ) : (
                    <span aria-hidden="true" className="hz:inline-flex">
                        {children}
                    </span>
                )}
            </button>
        );
    }
);
IconButton.displayName = 'IconButton';
