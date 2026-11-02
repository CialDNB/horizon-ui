/*
 * No shadcn base: shadcn/ui Badge (registry 2025) is a static pill without
 * dot, count or anchor forms. Native <span>s. Replaces x-core `Badge` (MUI
 * Badge wrapper), `BadgeAI` and `AIVerifiedBadge` (x-core 2.2.30).
 */
import { SparkleIcon } from '@phosphor-icons/react/dist/csr/Sparkle';
import { cva, type VariantProps } from 'class-variance-authority';
import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '../../lib/cn';
import { omitLegacyProps, resolveOption } from '../../lib/options';
import { choiceForcedFill } from '../../primitives';
import type { DnbBase } from '../../types/DnbBase';

const badgeStyles = cva(
    'hz:inline-flex hz:max-w-full hz:min-w-0 hz:shrink-0 hz:items-center hz:align-middle hz:whitespace-nowrap',
    {
        variants: {
            variant: {
                neutral: '',
                primary: '',
                info: '',
                success: '',
                warning: '',
                error: '',
                // AI looks are compound variants: they must come after (and so
                // win over, in cn()) the label form's type and colour classes.
                ai: '',
                'ai-verified': '',
                'ai-unverified': '',
            },
            form: {
                // x-core status badge: tone dot + 10px semibold uppercase label.
                label: 'hz:gap-1.5 hz:text-micro hz:font-semibold hz:text-foreground hz:uppercase',
                count: 'hz:h-5 hz:min-w-5 hz:justify-center hz:rounded-full hz:px-1.5 hz:text-label-sm hz:tabular-nums',
                // Tone fill + 1px inset ring in the tone's AA shade: the ring is
                // the 3:1 boundary (WCAG 1.4.11) for light fills (warning, info).
                // Forced colors drop fills and rings: a CanvasText fill that opts out.
                dot: `hz:size-2 hz:rounded-full hz:ring-1 hz:ring-inset ${choiceForcedFill}`,
            },
        },
        compoundVariants: [
            {
                form: 'label',
                variant: 'ai',
                class: 'hz:gap-1 hz:text-label-sm hz:normal-case hz:text-primary',
            },
            {
                form: 'label',
                variant: ['ai-verified', 'ai-unverified'],
                class: 'hz:h-6 hz:gap-1 hz:rounded-full hz:px-2 hz:normal-case hz:ring-1 hz:ring-inset',
            },
            { form: 'label', variant: 'ai-verified', class: 'hz:ring-success' },
            {
                form: 'label',
                variant: 'ai-unverified',
                class: 'hz:ring-destructive',
            },
            {
                form: 'count',
                variant: 'neutral',
                class: 'hz:bg-neutral-strong hz:text-background',
            },
            {
                form: 'count',
                variant: 'primary',
                class: 'hz:bg-primary hz:text-primary-foreground',
            },
            {
                form: 'count',
                variant: 'info',
                class: 'hz:bg-info-strong hz:text-background',
            },
            {
                form: 'count',
                variant: 'success',
                class: 'hz:bg-success-strong hz:text-background',
            },
            {
                form: 'count',
                variant: 'warning',
                class: 'hz:bg-warning-strong hz:text-background',
            },
            {
                form: 'count',
                variant: 'error',
                class: 'hz:bg-destructive-strong hz:text-background',
            },
            {
                form: 'dot',
                variant: 'neutral',
                class: 'hz:bg-muted-foreground hz:ring-neutral-strong',
            },
            {
                form: 'dot',
                variant: 'primary',
                class: 'hz:bg-primary hz:ring-primary',
            },
            {
                form: 'dot',
                variant: 'info',
                class: 'hz:bg-info hz:ring-info-strong',
            },
            {
                form: 'dot',
                variant: 'success',
                class: 'hz:bg-success hz:ring-success-strong',
            },
            {
                form: 'dot',
                variant: 'warning',
                class: 'hz:bg-warning hz:ring-warning-strong',
            },
            {
                form: 'dot',
                variant: 'error',
                class: 'hz:bg-destructive hz:ring-destructive-strong',
            },
        ],
        defaultVariants: { variant: 'primary', form: 'label' },
    }
);

/** Options accepted by {@link badgeVariants}. */
export type BadgeVariantOptions = VariantProps<typeof badgeStyles>;

/** Status tone of a {@link Badge}; the only variants with count and dot forms. */
export type BadgeTone =
    'neutral' | 'primary' | 'info' | 'success' | 'warning' | 'error';

/** Variant of a {@link Badge}: a status tone or an AI marker. */
export type BadgeVariant = NonNullable<BadgeVariantOptions['variant']>;

type BadgeBase = Omit<HTMLAttributes<HTMLSpanElement>, 'children'> & DnbBase;

/** A labelled badge: tone dot + label, or an AI marker + label. */
type LabelBadge = {
    /**
     * Status tone (dot + uppercase label, x-core `Badge` with `label`) or an
     * AI marker: `ai` (x-core `BadgeAI`), `ai-verified` / `ai-unverified`
     * (x-core `AIVerifiedBadge` with `isValidated` true / false; give the two
     * states different labels, the colour alone does not say which).
     * @default 'primary'
     */
    variant?: BadgeVariant;
    /** Visible label, read in place by screen readers. */
    children: ReactNode;
    count?: never;
    max?: never;
};

/** A numeric count pill (x-core `badgeContent`). */
type CountBadge = {
    /** Status tone of the count fill. @default 'primary' */
    variant?: BadgeTone;
    /**
     * Number shown in a pill on the tone fill. `0` renders nothing. The number
     * is read as text; add `aria-label` ("3 unread messages") to name it, and
     * `role="status"` only if updates should be announced.
     */
    count: number;
    /** Largest number shown before `{max}+`. @default 999 */
    max?: number;
    children?: never;
};

/** A dot alone: it carries no text, so it must be named. */
type DotBadge = {
    /** Status tone of the dot. @default 'primary' */
    variant?: BadgeTone;
    /** Names the dot (it renders as `role="img"`). */
    'aria-label': string;
    children?: never;
    count?: never;
    max?: never;
};

/** Props for {@link Badge}: a label, a count or a named dot. */
export type BadgeProps = BadgeBase & (LabelBadge | CountBadge | DotBadge);

// Complete literals: the Tailwind scanner only compiles classes it can see.
const labelDot: Record<BadgeTone, string> = {
    neutral: 'hz:bg-muted-foreground hz:ring-neutral-strong',
    primary: 'hz:bg-primary hz:ring-primary',
    info: 'hz:bg-info hz:ring-info-strong',
    success: 'hz:bg-success hz:ring-success-strong',
    warning: 'hz:bg-warning hz:ring-warning-strong',
    error: 'hz:bg-destructive hz:ring-destructive-strong',
};

const badgeVariantNames: readonly BadgeVariant[] = [
    ...(Object.keys(labelDot) as BadgeTone[]),
    'ai',
    'ai-verified',
    'ai-unverified',
];

const isTone = (variant: BadgeVariant): variant is BadgeTone =>
    !variant.startsWith('ai');

/**
 * Class string for a Badge look (variant and form), conflict-resolved with
 * `cn()`.
 */
export function badgeVariants(options?: BadgeVariantOptions): string {
    return cn(badgeStyles(options));
}

function Marker({ variant }: { variant: BadgeVariant }) {
    if (isTone(variant))
        return (
            <span
                aria-hidden="true"
                data-badge-dot=""
                className={cn(
                    'hz:size-2 hz:shrink-0 hz:rounded-full hz:ring-1 hz:ring-inset',
                    choiceForcedFill,
                    labelDot[variant]
                )}
            />
        );
    if (variant === 'ai')
        return (
            <span
                aria-hidden="true"
                data-badge-icon=""
                className="hz:inline-flex hz:size-5 hz:shrink-0 hz:items-center hz:justify-center hz:rounded-full hz:bg-linear-[263deg] hz:from-secondary hz:from-[-5%] hz:to-primary hz:to-[69%] hz:text-primary-foreground hz:[&_svg]:size-3"
            >
                <SparkleIcon weight="fill" />
            </span>
        );
    return (
        <span
            aria-hidden="true"
            data-badge-icon=""
            className={cn(
                'hz:inline-flex hz:shrink-0 hz:[&_svg]:size-3',
                variant === 'ai-verified'
                    ? 'hz:text-success-strong'
                    : 'hz:text-destructive-strong'
            )}
        >
            <SparkleIcon weight="duotone" />
        </span>
    );
}

/** x-core / MUI props that are dropped (with a dev warning). */
const legacyBadgeProps = {
    sx: 'use className',
    color: 'use variant',
    badgeContent: 'use count or children',
    invisible: 'render conditionally',
    anchorOrigin: 'use BadgeAnchor',
    overlap: 'use BadgeAnchor overlap',
} as const;

/**
 * Small status indicator. Three forms: a label (tone dot + uppercase label,
 * or an AI marker + label), a count pill (`count`), or a dot alone (needs
 * `aria-label`). Labels are plain text for assistive tech; a badge is not a
 * live region unless you pass `role="status"`. Wrap a control or avatar in
 * {@link BadgeAnchor} to pin a badge to its corner.
 */
export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(function Badge(
    { variant: variantProp, count, max = 999, className, children, ...props },
    ref
) {
    const rest = omitLegacyProps('Badge', props, legacyBadgeProps);
    // Untyped callers may pass x-core/MUI colours (`variant="secondary"`).
    const variant = resolveOption(
        'Badge',
        'variant',
        variantProp,
        badgeVariantNames,
        'primary'
    );
    if (count === 0) return null;
    const form =
        count !== undefined && isTone(variant)
            ? 'count'
            : children === undefined || children === null
              ? 'dot'
              : 'label';
    const label = form === 'label' ? undefined : rest['aria-label'];
    const role = rest.role ?? (label === undefined ? undefined : 'img');
    // A live region announces its content, not its name: with a role other
    // than img, the label is also rendered as screen-reader-only text and the
    // visible number hidden, so exactly one string is read and announced.
    const liveLabel = label !== undefined && role !== 'img';
    return (
        <span
            {...rest}
            role={role}
            ref={ref}
            data-variant={variant}
            className={cn(badgeStyles({ variant, form }), className)}
        >
            {form === 'label' && <Marker variant={variant} />}
            {liveLabel && <span className="hz:sr-only">{label}</span>}
            {form === 'count' && (
                <span aria-hidden={label !== undefined || undefined}>
                    {count !== undefined && count > max ? `${max}+` : count}
                </span>
            )}
            {form === 'label' && (
                <span className="hz:min-w-0 hz:truncate">{children}</span>
            )}
        </span>
    );
});
Badge.displayName = 'Badge';

/** Props for {@link BadgeAnchor}. */
export type BadgeAnchorProps = Omit<
    HTMLAttributes<HTMLSpanElement>,
    'children'
> &
    DnbBase & {
        /** The badge to pin, usually `<Badge count={n} />` or a named dot. */
        badge: ReactNode;
        /**
         * `rectangular` centres the badge on the end corner of the box;
         * `circular` insets it for round children such as avatars (MUI
         * `overlap`).
         * @default 'rectangular'
         */
        overlap?: 'rectangular' | 'circular';
        /** The element the badge sits on. */
        children: ReactNode;
    };

/**
 * Pins a badge to the top end corner of its child (x-core `Badge` wrapping
 * children). The corner follows `dir`. Name the badge (or the child) so the
 * relationship is clear, for example an Inbox button plus a count named
 * "4 unread".
 */
export const BadgeAnchor = forwardRef<HTMLSpanElement, BadgeAnchorProps>(
    function BadgeAnchor(
        { badge, overlap = 'rectangular', className, children, ...rest },
        ref
    ) {
        return (
            <span
                {...rest}
                ref={ref}
                className={cn(
                    'hz:relative hz:inline-flex hz:shrink-0 hz:align-middle',
                    className
                )}
            >
                {children}
                <span
                    data-badge-slot=""
                    className={cn(
                        'hz:absolute hz:z-1 hz:flex hz:-translate-y-1/2 hz:ltr:translate-x-1/2 hz:rtl:-translate-x-1/2',
                        overlap === 'circular'
                            ? 'hz:end-[14%] hz:top-[14%]'
                            : 'hz:end-0 hz:top-0'
                    )}
                >
                    {badge}
                </span>
            </span>
        );
    }
);
BadgeAnchor.displayName = 'BadgeAnchor';
