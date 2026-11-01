import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { forwardRef, type ButtonHTMLAttributes, type MouseEvent } from 'react';
import { cn } from '../../lib/cn';
import type { DnbBase } from '../../types/DnbBase';

/** Props for {@link Button}. */
export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
    DnbBase & {
        /**
         * Visual style. `primary` is the main action of a view (one per area),
         * `secondary` an alternative, `tertiary` a low-emphasis action,
         * `destructive` an irreversible one, `ghost` a neutral toolbar action,
         * `link` a text action that reads as a link.
         * @default 'primary'
         */
        variant?: ButtonVariant;
        /**
         * Size. Mobile and touch pointers always get at least a 44px target;
         * from `tablet` with a fine pointer the heights are 32/36/44px.
         * @default 'md'
         */
        size?: ButtonSize;
        /**
         * Shows a spinner in place of the label (the label keeps the width and
         * the accessible name), sets `aria-busy` and `aria-disabled`, and
         * blocks `onClick`. The button stays focusable so focus is not lost.
         * @default false
         */
        loading?: boolean;
        /**
         * Renders the single child element (for example a router link) with
         * the button styles and props instead of a `<button>`. The loading
         * spinner is not rendered in this mode; `aria-busy` still is.
         * @default false
         */
        asChild?: boolean;
        /**
         * Stretches the button to the full width of its container.
         * @default false
         */
        fullWidth?: boolean;
    };

const buttonStyles = cva(
    [
        'hz:relative hz:inline-flex hz:max-w-full hz:min-w-0 hz:items-center hz:justify-center',
        'hz:rounded-lg hz:border hz:border-transparent hz:text-center hz:text-balance hz:wrap-anywhere',
        'hz:cursor-pointer hz:select-none hz:no-underline hz:underline-offset-4',
        'hz:transition hz:duration-fast hz:ease-standard',
        // Focus ring and busy cursor are also written as state variants so they
        // out-rank Bootstrap reboot's `button:focus` (0,1,1) and
        // `[type="button"]:not(:disabled)` (0,2,0) when a legacy host loads
        // styles.unlayered.css (ADR 0001). The unconditional `outline-ring`
        // stays so the colour does not transition in on focus.
        'hz:outline-ring hz:focus:outline-none hz:focus-visible:outline-2 hz:focus-visible:outline-offset-2 hz:focus-visible:outline-solid hz:focus-visible:outline-ring',
        'hz:active:scale-[0.98]',
        'hz:[&_svg]:pointer-events-none hz:[&_svg]:shrink-0',
        'hz:inactive:cursor-not-allowed hz:inactive:text-muted-foreground hz:inactive:no-underline hz:inactive:active:scale-100',
        'hz:aria-busy:not-disabled:cursor-progress hz:aria-busy:active:scale-100',
        // With asChild on an <a>, a host `a:hover { color; text-decoration }`
        // (0,1,1) beats plain utilities, so every variant states its hover
        // colour and decoration (0,2,0), for hover and touch (sticky) hover.
        'hz:hover:no-underline hz:touch-hover:no-underline',
    ],
    {
        variants: {
            variant: {
                primary:
                    'hz:bg-primary hz:text-primary-foreground hz:hover:bg-primary-hover hz:hover:text-primary-foreground hz:touch-hover:text-primary-foreground hz:inactive:bg-muted',
                secondary:
                    'hz:border-primary hz:bg-transparent hz:text-primary hz:hover:bg-primary hz:hover:text-primary-foreground hz:touch-hover:text-primary hz:inactive:border-input hz:inactive:bg-transparent',
                tertiary:
                    'hz:bg-transparent hz:text-primary hz:hover:text-primary hz:hover:underline hz:touch-hover:text-primary',
                destructive:
                    'hz:bg-destructive hz:text-destructive-foreground hz:hover:bg-destructive-hover hz:hover:text-destructive-foreground hz:touch-hover:text-destructive-foreground hz:inactive:bg-muted',
                ghost: 'hz:bg-transparent hz:text-foreground hz:hover:bg-accent hz:hover:text-accent-foreground hz:touch-hover:text-foreground hz:inactive:bg-transparent',
                // No inline padding, so min-w-11 keeps a 44px target for short labels.
                link: 'hz:min-w-11 hz:bg-transparent hz:text-primary hz:underline hz:hover:text-primary hz:hover:underline hz:hover:decoration-2 hz:touch-hover:text-primary hz:touch-hover:underline',
            },
            size: {
                sm: 'hz:min-h-11 hz:gap-1 hz:px-4 hz:py-1 hz:text-label-sm hz:tablet:pointer-fine:min-h-8 hz:[&_svg]:size-4',
                md: 'hz:min-h-11 hz:gap-2 hz:px-5 hz:py-1 hz:text-label-md hz:tablet:pointer-fine:min-h-9 hz:[&_svg]:size-4',
                lg: 'hz:min-h-12 hz:gap-2 hz:px-6 hz:py-2 hz:text-label-lg hz:tablet:pointer-fine:min-h-11 hz:[&_svg]:size-5',
            },
            fullWidth: {
                true: 'hz:w-full',
                false: '',
            },
        },
        compoundVariants: [{ variant: 'link', class: 'hz:px-0' }],
        defaultVariants: {
            variant: 'primary',
            size: 'md',
            fullWidth: false,
        },
    }
);

/** Options accepted by {@link buttonVariants}: `variant`, `size`, `fullWidth`. */
export type ButtonVariantOptions = VariantProps<typeof buttonStyles>;

/** Visual style of a {@link Button}. */
export type ButtonVariant = NonNullable<ButtonVariantOptions['variant']>;

/** Size of a {@link Button}. */
export type ButtonSize = NonNullable<ButtonVariantOptions['size']>;

/**
 * Class string for the Button look. Convention for every component: the
 * exported `*Variants` function wraps the internal cva definition in `cn()`,
 * so its output is already conflict-resolved (for example the `link`
 * compound's `px-0` replaces the size padding). Use it to style an element
 * that cannot be wrapped with `asChild`; set `disabled` or
 * `aria-disabled="true"` on that element for the inactive look.
 */
export function buttonVariants(options?: ButtonVariantOptions): string {
    return cn(buttonStyles(options));
}

/**
 * Triggers an action. Renders a native `<button type="button">` (or, with
 * `asChild`, the child element) styled with Horizon tokens. Put icons in
 * `children` before or after the label; an icon-only button needs
 * `aria-label`.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    function Button(
        {
            variant = 'primary',
            size = 'md',
            loading = false,
            asChild = false,
            fullWidth = false,
            className,
            type,
            disabled = false,
            onClick,
            children,
            ...rest
        },
        ref
    ) {
        const ariaDisabled =
            rest['aria-disabled'] === true || rest['aria-disabled'] === 'true';
        const blocked = loading || disabled || ariaDisabled;
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
            className: cn(
                buttonStyles({ variant, size, fullWidth }),
                className
            ),
            'data-variant': variant,
            'data-size': size,
            'aria-busy': loading || undefined,
            'aria-disabled': loading || ariaDisabled || undefined,
            onClick: handleClick,
        };

        // A child such as <a> has no `disabled`: express it with ARIA, take it
        // out of the tab order, and block activation in handleClick.
        if (asChild) {
            return (
                <Slot
                    {...shared}
                    {...(disabled && {
                        'aria-disabled': true,
                        tabIndex: -1,
                    })}
                >
                    {children}
                </Slot>
            );
        }

        if (asChild) return <Slot {...shared}>{children}</Slot>;

        return (
            <button type={type ?? 'button'} disabled={disabled} {...shared}>
                {loading && (
                    <span
                        aria-hidden="true"
                        className="hz:absolute hz:inset-0 hz:m-auto hz:size-4 hz:animate-spin hz:rounded-full hz:border-2 hz:border-current hz:border-e-transparent"
                    />
                )}
                {/* Wraps the label so loading can hide it (opacity keeps width and name); gap is inherited so icon spacing still comes from the size. */}
                <span
                    className={cn(
                        'hz:inline-flex hz:min-w-0 hz:items-center hz:justify-center hz:[gap:inherit]',
                        loading && 'hz:opacity-0'
                    )}
                >
                    {children}
                </span>
            </button>
        );
    }
);
Button.displayName = 'Button';
