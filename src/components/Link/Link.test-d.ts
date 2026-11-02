import type { ComponentRef } from 'react';
import type { Link, LinkProps } from '.';

export const full: LinkProps = {
    href: '/reports',
    variant: 'standalone',
    size: 'sm',
    isExternal: true,
    externalLabel: '(opens in new tab)',
    showExternalIcon: false,
    disabled: false,
    asChild: false,
    rel: 'nofollow',
    'data-did': 'reports-link',
    children: 'Reports',
};

export const ref: ComponentRef<typeof Link> | null =
    null as HTMLAnchorElement | null;

// x-core size names are not accepted ('small' is now 'sm').
export const badSize: LinkProps = {
    // @ts-expect-error not a LinkSize
    size: 'small',
};

// MUI `underline="hover"` is now `variant="subtle"` / `"standalone"`.
export const underline: LinkProps = {
    // @ts-expect-error not a prop
    underline: 'hover',
};

// MUI/x-core `color` is dropped (variants carry the colour).
export const color: LinkProps = {
    // @ts-expect-error not a prop
    color: 'inherit',
};

// Router links go through asChild, not `component`.
export const component: LinkProps = {
    // @ts-expect-error not a prop
    component: 'a',
};
