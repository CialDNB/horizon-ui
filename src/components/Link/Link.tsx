/*
 * No shadcn base (shadcn/ui has no Link; it styles anchors with
 * `buttonVariants({ variant: 'link' })`). Native <a> or Radix Slot
 * (`asChild`, for router links). Replaces x-core `Link` (Typography module,
 * MUI Link wrapper, x-core 2.2.30) and ad-hoc `Typography component="a"` /
 * MUI `Link` anchors in customer360.
 */
import { ArrowSquareOutIcon } from '@phosphor-icons/react/dist/csr/ArrowSquareOut';
import { Slot, Slottable } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import {
    forwardRef,
    type AnchorHTMLAttributes,
    type MouseEvent,
    type ReactNode,
} from 'react';
import { cn } from '../../lib/cn';
import { omitLegacyProps, resolveOption } from '../../lib/options';
import { anchorGuard, blockedClick } from '../../primitives';
import type { DnbBase } from '../../types/DnbBase';

const linkStyles = cva(
    [
        'hz:cursor-pointer hz:rounded-xs hz:bg-transparent hz:underline-offset-2 hz:wrap-anywhere',
        'hz:transition-colors hz:duration-fast hz:ease-standard',
        // As Button: the ring is also written as state variants, and mouse
        // focus has none, whatever host focus rules exist (ADR 0001).
        'hz:outline-ring hz:focus:outline-none hz:focus-visible:outline-2 hz:focus-visible:outline-offset-2 hz:focus-visible:outline-solid hz:focus-visible:outline-ring',
        // Disabled (aria-disabled, no href): muted, no underline. `inactive:`
        // matches `[aria-disabled='true']:not([aria-busy='true'])`, so these
        // are (0,3,0) and out-rank Bootstrap's `a:not([href]):hover { color:
        // inherit }` (0,2,1) and the hover classes, in every state.
        'hz:inactive:cursor-not-allowed hz:inactive:text-muted-foreground hz:inactive:no-underline hz:inactive:decoration-auto',
    ],
    {
        variants: {
            variant: {
                // In running text: always underlined (WCAG 1.4.1, colour is
                // not the only cue), thicker on hover; type is inherited.
                inline: `hz:text-primary hz:underline hz:hover:decoration-2 hz:active:text-primary-hover ${anchorGuard('primary', { hover: 'primary-hover', underline: true })}`,
                // On its own (lists, cards, "View all"): semibold label type,
                // underline on pointer hover, 44px target at mobile.
                standalone: `hz:inline-flex hz:gap-1 hz:min-h-11 hz:min-w-11 hz:items-center hz:font-semibold hz:text-primary hz:no-underline hz:active:text-primary-hover hz:tablet:pointer-fine:min-h-0 hz:tablet:pointer-fine:min-w-0 ${anchorGuard('primary', { hover: 'primary-hover', hoverUnderline: true })}`,
                // Takes the surrounding colour (titles, table cells); underline
                // on pointer hover. Not for links inside sentences.
                subtle: `hz:text-inherit hz:no-underline ${anchorGuard('inherit', { hoverUnderline: true })}`,
            },
            size: {
                sm: '',
                md: '',
            },
        },
        compoundVariants: [
            { variant: 'standalone', size: 'sm', class: 'hz:text-label-sm' },
            { variant: 'standalone', size: 'md', class: 'hz:text-label-md' },
        ],
        defaultVariants: { variant: 'inline', size: 'md' },
    }
);

/** Options accepted by {@link linkVariants}: `variant`, `size`. */
export type LinkVariantOptions = VariantProps<typeof linkStyles>;

/** Visual style of a {@link Link}. */
export type LinkVariant = NonNullable<LinkVariantOptions['variant']>;

/** Size of a `standalone` {@link Link}. */
export type LinkSize = NonNullable<LinkVariantOptions['size']>;

const linkVariantNames: readonly LinkVariant[] = [
    'inline',
    'standalone',
    'subtle',
];
const linkSizes: readonly LinkSize[] = ['sm', 'md'];

/**
 * Class string for a Link look, conflict-resolved with `cn()`. Set
 * `aria-disabled="true"` on the element for the disabled look.
 */
export function linkVariants(options?: LinkVariantOptions): string {
    return cn(linkStyles(options));
}

/** Props for {@link Link}. */
export type LinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'color'> &
    DnbBase & {
        /**
         * `inline` for links inside running text (underlined, inherits the
         * type), `standalone` for links on their own line (semibold label,
         * underline on hover, 44px target at mobile; x-core `Link`), `subtle`
         * for links that take the surrounding colour (titles, table cells;
         * underline on hover).
         * @default 'inline'
         */
        variant?: LinkVariant;
        /**
         * Type of a `standalone` link: `sm` label/sm 12px, `md` label/md 14px.
         * `inline` and `subtle` inherit the surrounding type.
         * @default 'md'
         */
        size?: LinkSize;
        /**
         * Opens in a new tab: sets `target="_blank"`, adds `noopener
         * noreferrer` to `rel`, appends a visually hidden `externalLabel` and
         * (by default) an external-link icon.
         * @default false
         */
        isExternal?: boolean;
        /**
         * Screen-reader hint appended to external links. Translate it.
         * @default '(opens in new tab)'
         */
        externalLabel?: string;
        /** Shows the decorative external-link icon on `isExternal` links. @default true */
        showExternalIcon?: boolean;
        /**
         * Unavailable: the `href` is removed (`asChild`: kept, but taken out
         * of the tab order and blocked), `aria-disabled="true"` is set and
         * the link is muted. A consumer `aria-disabled="true"` does the same.
         * @default false
         */
        disabled?: boolean;
        /**
         * Renders the single child element (a router `Link`) with the Link
         * styles and props instead of an `<a>`.
         * @default false
         */
        asChild?: boolean;
        /** Link text (and inline content). */
        children?: ReactNode;
    };

/** MUI / x-core Link props that are dropped (with a dev warning). */
const legacyLinkProps = {
    color: 'use variant="subtle" to inherit the colour',
    underline:
        'use variant: "inline" (always) or "standalone"/"subtle" (hover)',
    sx: 'use className',
    component: 'use asChild around the router Link',
    TypographyClasses: 'not supported',
} as const;

/** Merges `extra` tokens into a `rel` value without duplicates. */
function mergeRel(rel: string | undefined, extra: readonly string[]): string {
    return [...new Set([...(rel?.split(/\s+/) ?? []), ...extra])]
        .filter(Boolean)
        .join(' ');
}

/**
 * A navigation link: an `<a>` (or, with `asChild`, a router link) in one of
 * three looks. Colour and decoration are set for every state, so a legacy
 * host's `a`, `a:hover` and `a:not([href])` rules (Bootstrap reboot) do not
 * restyle it with `styles.unlayered.css`. Visited links keep the same colour
 * (product UI). Use `Button` for actions that do not navigate.
 */
export const Link = forwardRef<HTMLAnchorElement, LinkProps>(function Link(
    {
        variant: variantProp,
        size: sizeProp,
        isExternal = false,
        externalLabel = '(opens in new tab)',
        showExternalIcon = true,
        disabled: disabledProp = false,
        asChild = false,
        className,
        href,
        rel,
        target,
        onClick,
        children,
        ...props
    },
    ref
) {
    const rest = omitLegacyProps('Link', props, legacyLinkProps);
    // Untyped callers may pass x-core or MUI values (`size="small"`).
    const variant = resolveOption(
        'Link',
        'variant',
        variantProp,
        linkVariantNames,
        'inline'
    );
    const size = resolveOption('Link', 'size', sizeProp, linkSizes, 'md');
    const disabled =
        disabledProp ||
        rest['aria-disabled'] === true ||
        rest['aria-disabled'] === 'true';
    const handleClick = blockedClick<MouseEvent<HTMLAnchorElement>>(
        disabled,
        onClick
    );
    // The space separates the text from the icon in running text (the
    // standalone flex row uses its gap) and the hint in the accessible name.
    const external = isExternal && (
        <>
            {' '}
            {showExternalIcon && (
                <ArrowSquareOutIcon
                    aria-hidden="true"
                    className="hz:inline hz:size-[1em] hz:shrink-0 hz:align-[-0.125em]"
                />
            )}
            <span className="hz:sr-only">{externalLabel}</span>
        </>
    );
    const shared = {
        ...rest,
        ref,
        className: cn(linkStyles({ variant, size }), className),
        'data-variant': variant,
        'data-size': size,
        onClick: handleClick,
        ...(isExternal
            ? {
                  target: '_blank',
                  rel: mergeRel(rel, ['noopener', 'noreferrer']),
              }
            : { target, rel }),
        ...(disabled && { 'aria-disabled': true as const }),
    };

    if (asChild)
        return (
            <Slot {...shared} {...(disabled && { tabIndex: -1 })}>
                <Slottable>{children}</Slottable>
                {external}
            </Slot>
        );

    // Disabled: no href (not focusable, no navigation, no "open in new tab");
    // role="link" keeps it announced as an unavailable link.
    return (
        <a {...shared} {...(disabled ? { role: 'link' } : { href })}>
            {children}
            {external}
        </a>
    );
});
Link.displayName = 'Link';
