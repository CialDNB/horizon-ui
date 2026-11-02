import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import {
    forwardRef,
    type ButtonHTMLAttributes,
    type MouseEvent,
    type ReactNode,
} from 'react';
import { cn } from '../../lib/cn';
import { omitLegacyProps, resolveOption } from '../../lib/options';
import { anchorGuard, blockedClick, buttonTones } from '../../primitives';
import { Spinner } from '../Spinner';
import type { DnbBase } from '../../types/DnbBase';

/** Props for {@link Button}. */
export type ButtonProps = Omit<
    ButtonHTMLAttributes<HTMLButtonElement>,
    'color'
> &
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
        /**
         * Decorative icon before the label (x-core `startIcon`), sized by the
         * button and hidden from assistive technology. Not rendered with
         * `asChild` (put it in the child).
         */
        startIcon?: ReactNode;
        /** Decorative icon after the label (x-core `endIcon`). As `startIcon`. */
        endIcon?: ReactNode;
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
    ],
    {
        variants: {
            variant: {
                primary: buttonTones.primary,
                secondary: buttonTones.secondary,
                tertiary: `hz:bg-transparent hz:text-primary ${anchorGuard('primary', { hoverUnderline: true })}`,
                destructive: buttonTones.destructive,
                ghost: buttonTones.ghost,
                // No inline padding, so min-w-11 keeps a 44px target for short labels.
                link: `hz:min-w-11 hz:bg-transparent hz:text-primary hz:underline hz:hover:decoration-2 ${anchorGuard('primary', { underline: true })}`,
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

const buttonVariantNames: readonly ButtonVariant[] = [
    'primary',
    'secondary',
    'tertiary',
    'destructive',
    'ghost',
    'link',
];
const buttonSizes: readonly ButtonSize[] = ['sm', 'md', 'lg'];

/** x-core ButtonV2 / MUI props that are dropped (with a dev warning). */
const legacyButtonProps = {
    color: 'use variant, e.g. "destructive" for color="error"',
    textColor: 'colour comes from the variant',
    showTextUnderLine: 'variant="tertiary" underlines on hover',
    sx: 'use className',
    disableElevation: 'Button has no elevation',
    disableRipple: 'Button has no ripple',
    endIconAnimation: 'not ported (decorative motion)',
} as const;

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
 *
 * Overriding the text colour with `className`: every variant also sets its
 * hover and touch-hover colour (`hz:hover:text-*`, `hz:touch-hover:text-*`,
 * so a host `a:hover` rule cannot restyle an `asChild` link), and `cn()` keeps
 * those because their variant differs. Pass the same colour for those states
 * too, e.g. `className="hz:text-foreground hz:hover:text-foreground
 * hz:touch-hover:text-foreground"`.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    function Button(
        {
            variant: variantProp,
            size: sizeProp,
            loading = false,
            asChild = false,
            fullWidth = false,
            startIcon,
            endIcon,
            className,
            type,
            disabled = false,
            onClick,
            children,
            ...props
        },
        ref
    ) {
        // Untyped callers (customer360 .jsx) pass x-core ButtonV2 values and
        // MUI props: fall back instead of rendering unstyled, and never leak
        // unknown props to the DOM.
        const variant = resolveOption(
            'Button',
            'variant',
            variantProp,
            buttonVariantNames,
            'primary'
        );
        const size = resolveOption(
            'Button',
            'size',
            sizeProp,
            buttonSizes,
            'md'
        );
        const rest = omitLegacyProps('Button', props, legacyButtonProps);
        const ariaDisabled =
            rest['aria-disabled'] === true || rest['aria-disabled'] === 'true';
        const blocked = loading || disabled || ariaDisabled;
        const handleClick = blockedClick<MouseEvent<HTMLButtonElement>>(
            blocked,
            onClick
        );
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

        return (
            <button type={type ?? 'button'} disabled={disabled} {...shared}>
                {loading && (
                    <Spinner
                        aria-hidden="true"
                        size="sm"
                        tone="inherit"
                        className="hz:absolute hz:inset-0 hz:m-auto"
                    />
                )}
                {/* Wraps the label so loading can hide it (opacity keeps width and name); gap is inherited so icon spacing still comes from the size. */}
                <span
                    className={cn(
                        'hz:inline-flex hz:min-w-0 hz:items-center hz:justify-center hz:[gap:inherit]',
                        loading && 'hz:opacity-0'
                    )}
                >
                    {startIcon && (
                        <span aria-hidden="true" className="hz:inline-flex">
                            {startIcon}
                        </span>
                    )}
                    {children}
                    {endIcon && (
                        <span aria-hidden="true" className="hz:inline-flex">
                            {endIcon}
                        </span>
                    )}
                </span>
            </button>
        );
    }
);
Button.displayName = 'Button';
