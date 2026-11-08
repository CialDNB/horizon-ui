import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/cn';

/*
 * One row of a list popup (Select option, Combobox option, DropdownMenu
 * item), so the three cannot drift: 44px rows with 16px text at mobile and
 * on touch pointers, 36px / 14px with a fine pointer; the `accent`
 * highlight; a Highlight outline in forced colors (the fill is dropped).
 */
const listItemStyles = cva(
    [
        'hz:group hz:relative hz:m-0 hz:flex hz:min-h-11 hz:w-full hz:cursor-pointer hz:items-center hz:gap-2 hz:rounded-xs hz:py-2 hz:outline-none hz:select-none',
        'hz:text-body-default hz:text-popover-foreground hz:tablet:pointer-fine:min-h-9 hz:tablet:pointer-fine:text-body-secondary',
        'hz:data-[highlighted]:bg-accent hz:data-[highlighted]:text-accent-foreground',
        'hz:forced-colors:data-[highlighted]:outline-2 hz:forced-colors:data-[highlighted]:-outline-offset-2 hz:forced-colors:data-[highlighted]:outline-solid hz:forced-colors:data-[highlighted]:outline-[Highlight]',
    ],
    {
        variants: {
            // Radix rows mark disabled with `data-disabled`; the Combobox
            // option (no Radix) with `aria-disabled`.
            disabledBy: {
                data: 'hz:data-[disabled]:cursor-not-allowed hz:data-[disabled]:text-muted-foreground',
                aria: 'hz:aria-disabled:cursor-not-allowed hz:aria-disabled:text-muted-foreground',
            },
        },
        defaultVariants: { disabledBy: 'data' },
    }
);

/** Options for {@link listItem}. */
export type ListItemOptions = VariantProps<typeof listItemStyles>;

/** Class string of a list-popup row. */
export function listItem(options?: ListItemOptions): string {
    return cn(listItemStyles(options));
}
