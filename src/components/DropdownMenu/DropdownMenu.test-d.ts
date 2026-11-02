import type { ComponentRef } from 'react';
import type {
    DropdownMenuContent,
    DropdownMenuContentProps,
    DropdownMenuItemProps,
} from '.';

export const content: DropdownMenuContentProps = {
    side: 'end',
    align: 'center',
    'data-did': 'menu',
};

export const item: DropdownMenuItemProps = {
    icon: null,
    shortcut: 'Ctrl+E',
    destructive: true,
    disabled: false,
    onSelect: (event: Event) => event,
    children: 'Export',
};

export const ref: ComponentRef<typeof DropdownMenuContent> | null =
    null as HTMLDivElement | null;

export const physical: DropdownMenuContentProps = {
    // @ts-expect-error sides are logical (start/end)
    side: 'left',
};

export const muiItem: DropdownMenuItemProps = {
    // @ts-expect-error MUI MenuItem onClick(event) becomes onSelect
    selected: true,
};
