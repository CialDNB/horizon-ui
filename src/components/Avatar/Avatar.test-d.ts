import type { ComponentRef } from 'react';
import type { Avatar, AvatarGroup, AvatarGroupProps, AvatarProps } from '.';

export const full: AvatarProps = {
    src: '/dana.png',
    name: 'Dana Levi',
    alt: '',
    size: 'xl',
    shape: 'rounded',
    tone: 'success',
    'data-did': 'approver',
};
export const group: AvatarGroupProps = {
    max: 4,
    total: 12,
    size: 'md',
    shape: 'circle',
    overflowLabel: (n) => `${n} more`,
    'aria-label': 'Assignees',
};

export const ref: ComponentRef<typeof Avatar> | null =
    null as HTMLSpanElement | null;
export const groupRef: ComponentRef<typeof AvatarGroup> | null =
    null as HTMLDivElement | null;

// @ts-expect-error x-core size names are not accepted ('small' is now 'sm')
export const badSize: AvatarProps = { size: 'small' };

// @ts-expect-error x-core MUI `variant` is now `shape`
export const badVariant: AvatarProps = { variant: 'circular' };

// The custom `{ width, height }` size is dropped (use className).
export const customSize: AvatarProps = {
    // @ts-expect-error not an AvatarSize
    size: { width: '96px', height: '96px' },
};

// @ts-expect-error an avatar is always role="img" or hidden; role is not configurable
export const role: AvatarProps = { role: 'button' };

// @ts-expect-error x-core AvatarGroup `avatars` data array is replaced by children
export const avatars: AvatarGroupProps = { avatars: [] };
