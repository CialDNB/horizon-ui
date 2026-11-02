import type { ComponentRef } from 'react';
import type { Badge, BadgeAnchorProps, BadgeProps } from '.';

export const label: BadgeProps = {
    variant: 'warning',
    children: 'Pending',
    'data-did': 'status',
};
export const ai: BadgeProps = {
    variant: 'ai-verified',
    children: 'AI verified',
};
export const count: BadgeProps = { variant: 'error', count: 4, max: 99 };
export const dot: BadgeProps = { variant: 'success', 'aria-label': 'Online' };
export const anchor: BadgeAnchorProps = {
    badge: null,
    overlap: 'circular',
    children: 'AB',
};

export const ref: ComponentRef<typeof Badge> | null =
    null as HTMLSpanElement | null;

// @ts-expect-error a dot with no text must be named with aria-label
export const unnamedDot: BadgeProps = { variant: 'success' };

// @ts-expect-error a count has no label children
export const countWithLabel: BadgeProps = { count: 3, children: 'New' };

// @ts-expect-error AI markers have no count form
export const aiCount: BadgeProps = { variant: 'ai', count: 3 };

// @ts-expect-error x-core MUI colours are not variants ('secondary')
export const muiColor: BadgeProps = { variant: 'secondary', children: 'x' };

// @ts-expect-error BadgeAnchor needs the badge to pin
export const noBadge: BadgeAnchorProps = { children: 'AB' };
