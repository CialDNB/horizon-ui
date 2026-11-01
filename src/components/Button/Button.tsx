import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';
import { forwardRef, type ButtonHTMLAttributes, type MouseEvent } from 'react';
import { cn } from '../../lib/cn';
import type { DnbBase } from '../../types/DnbBase';

/** Visual style of a {@link Button}. */
export type ButtonVariant =
    'primary' | 'secondary' | 'tertiary' | 'destructive' | 'ghost' | 'link';

/** Size of a {@link Button}. */
export type ButtonSize = 'sm' | 'md' | 'lg';

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
        'hz:rounded-lg hz:border hz:border-transparent hz:font-semibold hz:text-center hz:text-balance hz:wrap-anywhere',
        'hz:cursor-pointer hz:select-none hz:no-underline hz:underline-offset-4',
        'hz:transition hz:duration-100 hz:ease-standard',
        'hz:focus-visible:outline-2 hz:focus-visible:outline-offset-2 hz:focus-visible:outline-solid hz:outline-ring',
        'hz:active:scale-[0.98]',
        'hz:[&_svg]:pointer-events-none hz:[&_svg]:shrink-0',
        'hz:disabled:cursor-not-allowed hz:disabled:text-muted-foreground hz:disabled:no-underline hz:disabled:active:scale-100',
        'hz:aria-busy:cursor-progress hz:aria-busy:active:scale-100',
    ],
    {
        variants: {
            variant: {
                primary:
                    'hz:bg-primary hz:text-primary-foreground hz:hover:bg-primary-hover hz:disabled:bg-muted',
                secondary:
                    'hz:border-primary hz:bg-transparent hz:text-primary hz:hover:bg-primary hz:hover:text-primary-foreground hz:disabled:border-input hz:disabled:bg-transparent',
                tertiary:
                    'hz:bg-transparent hz:text-primary hz:hover:underline',
                destructive:
                    'hz:bg-destructive hz:text-destructive-foreground hz:hover:bg-destructive-hover hz:disabled:bg-muted',
                ghost: 'hz:bg-transparent hz:text-foreground hz:hover:bg-accent hz:hover:text-accent-foreground hz:disabled:bg-transparent',
                link: 'hz:bg-transparent hz:text-primary hz:underline hz:hover:decoration-2',
            },
            size: {
                sm: 'hz:min-h-11 hz:gap-1 hz:px-4 hz:py-1 hz:text-caption hz:leading-4 hz:tablet:pointer-fine:min-h-8 hz:[&_svg]:size-4',
                md: 'hz:min-h-11 hz:gap-2 hz:px-5 hz:py-1 hz:text-body-secondary hz:leading-5 hz:tablet:pointer-fine:min-h-9 hz:[&_svg]:size-4',
                lg: 'hz:min-h-12 hz:gap-2 hz:px-6 hz:py-2 hz:text-body-default hz:leading-6 hz:tablet:pointer-fine:min-h-11 hz:[&_svg]:size-5',
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

/** Options accepted by {@link buttonVariants}. */
export type ButtonVariantOptions = {
    /** Visual style. @default 'primary' */
    variant?: ButtonVariant | null;
    /** Size. @default 'md' */
    size?: ButtonSize | null;
    /** Full container width. @default false */
    fullWidth?: boolean | null;
};

/**
 * Class string for the Button look, conflict-resolved. Use it to style an
 * element that cannot be wrapped with `asChild`.
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
            onClick,
            children,
            ...rest
        },
        ref
    ) {
        const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
            if (loading) {
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
            'aria-disabled': loading || rest['aria-disabled'],
            onClick: handleClick,
        };

        if (asChild) return <Slot {...shared}>{children}</Slot>;

        return (
            <button type={type ?? 'button'} {...shared}>
                {loading && (
                    <span
                        aria-hidden="true"
                        className="hz:absolute hz:inset-0 hz:m-auto hz:size-4 hz:animate-spin hz:rounded-full hz:border-2 hz:border-current hz:border-e-transparent"
                    />
                )}
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
