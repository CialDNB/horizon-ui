/*
 * No shadcn base (shadcn/ui ships no Typography component; native elements).
 * Replaces x-core `Typography` (MUI Typography wrapper, x-core 2.2.30).
 */
import { cva, type VariantProps } from 'class-variance-authority';
import {
    forwardRef,
    type ElementType,
    type HTMLAttributes,
    type ReactNode,
} from 'react';
import { cn } from '../../lib/cn';
import type { DnbBase } from '../../types/DnbBase';

const typographyStyles = cva(
    // Margin, colour and the type utility are always set, so a host's element
    // rules (Bootstrap `h1..h6 { margin-bottom; font-weight; line-height }`,
    // `p { margin-bottom }`) cannot change the look in styles.unlayered.css.
    'hz:m-0 hz:wrap-anywhere',
    {
        variants: {
            variant: {
                // Display and the largest heading step down one size at mobile
                // so long words still fit a 320px viewport.
                'display/xl':
                    'hz:text-heading-xl hz:text-balance hz:tablet:text-display-xl',
                'display/lg':
                    'hz:text-heading-lg hz:text-balance hz:tablet:text-display-lg',
                'heading/xl':
                    'hz:text-heading-lg hz:text-balance hz:tablet:text-heading-xl',
                'heading/lg': 'hz:text-heading-lg hz:text-balance',
                'heading/md': 'hz:text-heading-md hz:text-balance',
                'heading/sm': 'hz:text-heading-sm hz:text-balance',
                'body/lg': 'hz:text-body-lg hz:text-pretty',
                'body/default': 'hz:text-body-default hz:text-pretty',
                'body/secondary': 'hz:text-body-secondary hz:text-pretty',
                caption: 'hz:text-caption',
                micro: 'hz:text-micro',
                'label/sm': 'hz:text-label-sm',
                'label/md': 'hz:text-label-md',
                'label/lg': 'hz:text-label-lg',
            },
            color: {
                foreground: 'hz:text-foreground',
                'muted-foreground': 'hz:text-muted-foreground',
                primary: 'hz:text-primary',
                'primary-foreground': 'hz:text-primary-foreground',
                'neutral-strong': 'hz:text-neutral-strong',
                'info-strong': 'hz:text-info-strong',
                'success-strong': 'hz:text-success-strong',
                'warning-strong': 'hz:text-warning-strong',
                'destructive-strong': 'hz:text-destructive-strong',
                inherit: 'hz:text-inherit',
            },
            weight: {
                regular: 'hz:font-regular',
                medium: 'hz:font-medium',
                semibold: 'hz:font-semibold',
                bold: 'hz:font-bold',
            },
            align: {
                start: 'hz:text-start',
                center: 'hz:text-center',
                end: 'hz:text-end',
            },
        },
        defaultVariants: {
            variant: 'body/default',
            color: 'foreground',
        },
    }
);

/** Options accepted by {@link typographyVariants}. */
export type TypographyVariantOptions = VariantProps<typeof typographyStyles>;

/** A type-scale role (`{role}/{size}`, as in x-core Horizon DS). */
export type TypographyVariant = NonNullable<
    TypographyVariantOptions['variant']
>;

/** Semantic text colour of a {@link Typography}. */
export type TypographyColor = NonNullable<TypographyVariantOptions['color']>;

/** Font-weight override of a {@link Typography}. */
export type TypographyWeight = NonNullable<TypographyVariantOptions['weight']>;

/** Logical text alignment of a {@link Typography}. */
export type TypographyAlign = NonNullable<TypographyVariantOptions['align']>;

/** Props for {@link Typography}. */
export type TypographyProps = Omit<HTMLAttributes<HTMLElement>, 'color'> &
    DnbBase & {
        /**
         * Type-scale role: family, size, line height and weight from the
         * Horizon type scale. `display/xl`, `display/lg` and `heading/xl` step
         * down one size below the `tablet` breakpoint.
         * @default 'body/default'
         */
        variant?: TypographyVariant;
        /**
         * Element or component to render. Defaults to the semantic element of
         * the variant: `h1` for display and `heading/xl`, `h2`..`h4` for
         * `heading/lg`..`heading/sm`, `p` for body, caption and micro, `span`
         * for labels. Changing it never changes the look. (x-core `component`.)
         */
        as?: ElementType;
        /**
         * Semantic text colour. Every option is at least 4.5:1 on `background`
         * in all brands; `primary-foreground` is for text on a `primary`
         * surface. Plain `destructive` and `success` are not offered as text
         * colours (below 4.5:1); use the `-strong` tokens.
         * @default 'foreground'
         */
        color?: TypographyColor;
        /** Overrides the weight of the variant (for x-core `subtitle2`/`h6`-style emphasis). */
        weight?: TypographyWeight;
        /** Logical text alignment (`start`/`end` follow `dir`). Inherited when unset. */
        align?: TypographyAlign;
        /**
         * `true` clips to one line with an ellipsis (the element becomes a
         * block); `2`, `3` or `4` clamp to that many lines. The full text stays
         * in the DOM for screen readers; pass `title` if sighted users need it.
         * (x-core `noWrap`.)
         * @default false
         */
        truncate?: boolean | 2 | 3 | 4;
        /** Text content. */
        children?: ReactNode;
    };

const defaultElement: Record<TypographyVariant, ElementType> = {
    'display/xl': 'h1',
    'display/lg': 'h1',
    'heading/xl': 'h1',
    'heading/lg': 'h2',
    'heading/md': 'h3',
    'heading/sm': 'h4',
    'body/lg': 'p',
    'body/default': 'p',
    'body/secondary': 'p',
    caption: 'p',
    micro: 'p',
    'label/sm': 'span',
    'label/md': 'span',
    'label/lg': 'span',
};

// Complete literals: the Tailwind scanner only compiles classes it can see.
const truncateClass = {
    // text-nowrap replaces the variant's text-pretty/balance (the `text-wrap`
    // shorthand would otherwise reset truncate's `white-space: nowrap`).
    1: 'hz:block hz:min-w-0 hz:truncate hz:text-nowrap',
    2: 'hz:line-clamp-2',
    3: 'hz:line-clamp-3',
    4: 'hz:line-clamp-4',
} as const;

/**
 * Class string for a Typography look (variant, colour, weight, alignment),
 * conflict-resolved with `cn()`. Use it for text that cannot be wrapped in
 * `Typography`.
 */
export function typographyVariants(options?: TypographyVariantOptions): string {
    return cn(typographyStyles(options));
}

/**
 * Text in a Horizon type-scale role. Renders the semantic element for the
 * variant (override with `as`) and sets margin, colour, family, size, line
 * height and weight itself, so global element CSS of a legacy host does not
 * restyle it when `styles.unlayered.css` is used.
 */
export const Typography = forwardRef<HTMLElement, TypographyProps>(
    function Typography(
        {
            variant = 'body/default',
            as,
            color = 'foreground',
            weight,
            align,
            truncate = false,
            className,
            ...rest
        },
        ref
    ) {
        const Component = as ?? defaultElement[variant];
        const lines = truncate === true ? 1 : truncate === false ? 0 : truncate;
        return (
            <Component
                {...rest}
                ref={ref}
                data-variant={variant}
                className={cn(
                    typographyStyles({ variant, color, weight, align }),
                    lines !== 0 && truncateClass[lines],
                    className
                )}
            />
        );
    }
);
Typography.displayName = 'Typography';
