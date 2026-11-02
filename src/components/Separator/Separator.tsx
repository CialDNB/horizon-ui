/*
 * Based on shadcn/ui Separator (registry 2025: Radix Separator, orientation +
 * decorative). No Radix dependency: Radix renders the same <div> with
 * role="none" | "separator" + aria-orientation, which this does natively.
 * Replaces x-core `Divider` (MUI Divider wrapper, x-core 2.2.30).
 */
import { cva, type VariantProps } from 'class-variance-authority';
import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '../../lib/cn';
import { omitLegacyProps } from '../../lib/options';
import type { DnbBase } from '../../types/DnbBase';

const separatorStyles = cva('hz:m-0 hz:shrink-0 hz:border-0 hz:bg-border', {
    variants: {
        orientation: {
            horizontal: 'hz:h-px hz:w-full',
            // Stretches to the cross size of a flex or grid row, whatever the
            // row's align-items (MUI `flexItem`).
            vertical: 'hz:w-px hz:self-stretch',
        },
    },
    defaultVariants: { orientation: 'horizontal' },
});

/** Options accepted by {@link separatorVariants}. */
export type SeparatorVariantOptions = VariantProps<typeof separatorStyles>;

/** Direction of a {@link Separator} line. */
export type SeparatorOrientation = NonNullable<
    SeparatorVariantOptions['orientation']
>;

/** Props for {@link Separator}. */
export type SeparatorProps = Omit<
    HTMLAttributes<HTMLDivElement>,
    'children' | 'role'
> &
    DnbBase & {
        /**
         * `horizontal` spans the width of its container; `vertical` spans the
         * height of the flex or grid row it sits in.
         * @default 'horizontal'
         */
        orientation?: SeparatorOrientation;
        /**
         * `true`: purely visual (`role="none"`), skipped by screen readers.
         * `false`: a semantic boundary between groups of content, such as
         * toolbar groups or menu sections (`role="separator"` +
         * `aria-orientation`).
         * @default true
         */
        decorative?: boolean;
    };

/**
 * Class string for a Separator (`orientation`), conflict-resolved with
 * `cn()`.
 */
export function separatorVariants(options?: SeparatorVariantOptions): string {
    return cn(separatorStyles(options));
}

/** x-core / MUI props that are dropped (with a dev warning). */
const legacySeparatorProps = {
    sx: 'use className',
    flexItem: 'built in',
    light: 'not supported',
    textAlign: 'text dividers are not supported',
    variant: 'not supported',
    absolute: 'not supported',
} as const;

/**
 * A 1px line in the `border` token that separates content. Renders a
 * `<div>`, not `<hr>`, so host CSS for `hr` (Bootstrap reboot margins and
 * border) cannot restyle it. No margin of its own: spacing belongs to the
 * layout around it (a flex or grid `gap`).
 */
export const Separator = forwardRef<HTMLDivElement, SeparatorProps>(
    function Separator(
        { orientation = 'horizontal', decorative = true, className, ...props },
        ref
    ) {
        const rest = omitLegacyProps('Separator', props, legacySeparatorProps);
        return (
            <div
                {...rest}
                ref={ref}
                role={decorative ? 'none' : 'separator'}
                aria-orientation={decorative ? undefined : orientation}
                data-orientation={orientation}
                className={cn(separatorStyles({ orientation }), className)}
            />
        );
    }
);
Separator.displayName = 'Separator';
