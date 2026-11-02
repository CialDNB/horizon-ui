import { createElement, type ComponentRef, type ReactNode } from 'react';
import { Typography, type TypographyProps } from '.';

export const full: TypographyProps<'span'> = {
    variant: 'heading/md',
    as: 'span',
    color: 'muted-foreground',
    weight: 'semibold',
    align: 'center',
    truncate: 2,
    'data-did': 'page-title',
    id: 'title',
};

export const ref: ComponentRef<'p'> | null =
    null as HTMLParagraphElement | null;

// Polymorphic `as`: the element's own props are accepted and checked.
export const link = createElement(Typography<'a'>, {
    as: 'a',
    href: '/reports',
    target: '_blank',
    variant: 'label/md',
});
export const label = createElement(Typography<'label'>, {
    as: 'label',
    htmlFor: 'email',
});
function RouterLink(props: {
    to: string;
    className?: string;
    children?: ReactNode;
}) {
    return createElement(
        'a',
        { href: props.to, className: props.className },
        props.children
    );
}
export const custom = createElement(Typography<typeof RouterLink>, {
    as: RouterLink,
    to: '/home',
    variant: 'body/secondary',
});
export const anchorRef = createElement(Typography<'a'>, {
    as: 'a',
    href: '#',
    ref: { current: null as HTMLAnchorElement | null },
});

// @ts-expect-error href is not a <p> attribute (default element)
export const pHref: TypographyProps = { href: '/x' };

// @ts-expect-error htmlFor is not an <a> attribute
export const aFor: TypographyProps<'a'> = { as: 'a', htmlFor: 'x' };

// @ts-expect-error the custom component requires `to`
export const customMissing: TypographyProps<typeof RouterLink> = {
    as: RouterLink,
};

export const badRef = createElement(Typography<'p'>, {
    // @ts-expect-error a <p> ref cannot be an anchor ref
    ref: { current: null as HTMLAnchorElement | null },
});
