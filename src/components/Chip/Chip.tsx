/*
 * No shadcn base (shadcn/ui has no Chip; its Badge is static). Native
 * <span> + <button>s. Replaces x-core `Chip` (MUI Chip wrapper, x-core 2.2.30).
 */
import { XIcon } from '@phosphor-icons/react/dist/csr/X';
import { cva, type VariantProps } from 'class-variance-authority';
import {
    forwardRef,
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
    type HTMLAttributes,
    type KeyboardEvent,
    type MouseEvent,
    type ReactNode,
    type RefObject,
} from 'react';
import { cn } from '../../lib/cn';
import { omitLegacyProps, resolveOption } from '../../lib/options';
import type { DnbBase } from '../../types/DnbBase';

const chipStyles = cva(
    [
        // Pointer layering (a chip is NOT a stacking context): hit areas at
        // z-0; the chip body (::before) at z-1; label, icon and action button
        // at z-2 (so hover shows the label's title and text stays selectable);
        // the remove button and its in-chip hit layer at z-3. 44px hit areas
        // of wrapped neighbours (8px apart) can never take a click inside a
        // chip's own box; only the gap between rows is shared (later wins).
        'hz:relative hz:inline-flex hz:max-w-full hz:min-w-0 hz:items-center hz:gap-1 hz:align-middle',
        'hz:rounded-xs hz:text-label-sm hz:whitespace-nowrap',
        // ::before covers the visual box at z-1: it blocks neighbours' hit
        // areas and is the state layer, a currentColor wash shown while the
        // chip's own button is hovered or pressed (one look for every tone).
        'hz:before:absolute hz:before:inset-0 hz:before:z-1 hz:before:rounded-[inherit] hz:before:bg-current hz:before:opacity-0',
        'hz:before:transition-opacity hz:before:duration-fast hz:before:ease-standard',
        // Focus ring around the whole chip when its main button has keyboard focus.
        'hz:outline-ring hz:has-[[data-chip-action]:focus-visible]:outline-2 hz:has-[[data-chip-action]:focus-visible]:outline-offset-2 hz:has-[[data-chip-action]:focus-visible]:outline-solid',
    ],
    {
        variants: {
            variant: {
                neutral: 'hz:text-neutral-strong',
                primary: 'hz:text-accent-foreground',
                info: 'hz:text-info-strong',
                success: 'hz:text-success-strong',
                warning: 'hz:text-warning-strong',
                error: 'hz:text-destructive-strong',
            },
            appearance: {
                soft: '',
                outline: 'hz:bg-transparent hz:ring-1 hz:ring-inset',
            },
            size: {
                sm: 'hz:h-5 hz:px-1.5 hz:[&_svg]:size-3',
                md: 'hz:h-6 hz:px-2 hz:[&_svg]:size-4',
            },
            interactive: {
                // Hit area: at least 44px wide at mobile and on touch pointers.
                true: 'hz:min-w-11 hz:tablet:pointer-fine:min-w-0 hz:has-[[data-chip-action]:enabled:hover]:before:opacity-8 hz:has-[[data-chip-action]:enabled:active]:before:opacity-12',
                false: '',
            },
            disabled: {
                true: 'hz:bg-muted hz:text-muted-foreground hz:ring-transparent',
                false: '',
            },
        },
        compoundVariants: [
            {
                appearance: 'soft',
                variant: 'neutral',
                class: 'hz:bg-neutral-subtle',
            },
            { appearance: 'soft', variant: 'primary', class: 'hz:bg-accent' },
            { appearance: 'soft', variant: 'info', class: 'hz:bg-info-subtle' },
            {
                appearance: 'soft',
                variant: 'success',
                class: 'hz:bg-success-subtle',
            },
            {
                appearance: 'soft',
                variant: 'warning',
                class: 'hz:bg-warning-subtle',
            },
            {
                appearance: 'soft',
                variant: 'error',
                class: 'hz:bg-destructive-subtle',
            },
            {
                appearance: 'outline',
                variant: 'neutral',
                class: 'hz:ring-input',
            },
            {
                appearance: 'outline',
                variant: 'primary',
                class: 'hz:ring-primary',
            },
            { appearance: 'outline', variant: 'info', class: 'hz:ring-info' },
            {
                appearance: 'outline',
                variant: 'success',
                class: 'hz:ring-success',
            },
            {
                appearance: 'outline',
                variant: 'warning',
                class: 'hz:ring-warning',
            },
            {
                appearance: 'outline',
                variant: 'error',
                class: 'hz:ring-destructive',
            },
        ],
        defaultVariants: {
            variant: 'primary',
            appearance: 'soft',
            size: 'md',
            interactive: false,
            disabled: false,
        },
    }
);

// Shared by both buttons. Reboot-proof: `focus:outline-none` (0,2,0) beats
// Bootstrap's `button:focus` ring (0,1,1) in styles.unlayered.css.
const buttonReset =
    'hz:m-0 hz:border-0 hz:bg-transparent hz:p-0 hz:text-inherit hz:cursor-pointer hz:focus:outline-none hz:disabled:cursor-not-allowed';

const actionStyles = cn(
    buttonReset,
    // Above the ::before layer; stretched over the chip's padding (see
    // actionInset) so the whole visual box is the button.
    'hz:relative hz:z-2 hz:inline-flex hz:min-w-0 hz:items-center hz:gap-1 hz:self-stretch',
    // The ring is drawn on the chip; the button's own outline stays off even
    // against Bootstrap's `button:focus { outline: 5px auto }`.
    'hz:focus:outline-0 hz:focus:outline-transparent'
);

// Complete literals: the Tailwind scanner only compiles classes it can see.
const actionInset = {
    sm: { start: 'hz:-ms-1.5 hz:ps-1.5', end: 'hz:-me-1.5 hz:pe-1.5' },
    md: { start: 'hz:-ms-2 hz:ps-2', end: 'hz:-me-2 hz:pe-2' },
} as const;

// Hit layers (z-0, below every chip's visual box), 44px tall at mobile and on
// touch pointers: md 24 + 2 x 10, sm 20 + 2 x 12. From tablet with a fine
// pointer they shrink to the visual box.
const actionHit = {
    sm: 'hz:absolute hz:inset-x-0 hz:-inset-y-3 hz:z-0 hz:cursor-pointer hz:tablet:pointer-fine:inset-y-0',
    md: 'hz:absolute hz:inset-x-0 hz:-inset-y-2.5 hz:z-0 hz:cursor-pointer hz:tablet:pointer-fine:inset-y-0',
} as const;

// 44x44 around the remove icon (md 16px, sm 12px) at mobile and on touch
// pointers, 24x24 from tablet with a fine pointer. Two layers: the full box at
// z-0 (outside the chip it never beats a neighbour's visual box), plus the
// part inside its own chip's height at z-3, above its own chip's body and the
// end of its label (z-2), without reaching any neighbour. The remove button
// itself is z-3 too, later in the DOM, so it stays the hover target.
const removeHit = {
    sm: {
        outer: 'hz:absolute hz:-inset-4 hz:z-0 hz:cursor-pointer hz:tablet:pointer-fine:-inset-1.5',
        inner: 'hz:absolute hz:-inset-x-4 hz:-inset-y-1 hz:z-3 hz:cursor-pointer hz:tablet:pointer-fine:-inset-x-1.5',
    },
    md: {
        outer: 'hz:absolute hz:-inset-3.5 hz:z-0 hz:cursor-pointer hz:tablet:pointer-fine:-inset-1',
        inner: 'hz:absolute hz:-inset-x-3.5 hz:-inset-y-1 hz:z-3 hz:cursor-pointer hz:tablet:pointer-fine:-inset-x-1',
    },
} as const;

const removeStyles = cn(
    buttonReset,
    'hz:relative hz:z-3 hz:inline-flex hz:shrink-0 hz:items-center hz:justify-center hz:rounded-full',
    'hz:transition-colors hz:duration-fast hz:ease-standard hz:hover:bg-current/12 hz:active:bg-current/16',
    // focus-visible:outline-ring (0,2,0) out-ranks Bootstrap's `button:focus`
    // colour (0,1,1) in styles.unlayered.css; outline-ring stays so the colour
    // does not transition in.
    'hz:outline-ring hz:focus-visible:outline-2 hz:focus-visible:outline-offset-0 hz:focus-visible:outline-solid hz:focus-visible:outline-ring'
);

const chipTones: readonly ChipVariant[] = [
    'neutral',
    'primary',
    'info',
    'success',
    'warning',
    'error',
];

/** Options accepted by {@link chipVariants}. */
export type ChipVariantOptions = Omit<
    VariantProps<typeof chipStyles>,
    'interactive' | 'disabled'
>;

/** Tone of a {@link Chip}. */
export type ChipVariant = NonNullable<ChipVariantOptions['variant']>;

/** Fill style of a {@link Chip}. */
export type ChipAppearance = NonNullable<ChipVariantOptions['appearance']>;

/** Size of a {@link Chip}. */
export type ChipSize = NonNullable<ChipVariantOptions['size']>;

/** Props for {@link Chip}. */
export type ChipProps = Omit<
    HTMLAttributes<HTMLSpanElement>,
    'children' | 'onClick' | 'color'
> &
    DnbBase & {
        /** Visible text. Also names the action button and the remove button. */
        label: string;
        /**
         * Tone. Text uses the tone's `-strong` token (4.5:1 or more on the
         * fill and on `background` in every brand). (x-core `color`.)
         * @default 'primary'
         */
        variant?: ChipVariant;
        /**
         * `soft` is a tinted fill, `outline` a 1px tone ring on a transparent
         * fill. (x-core `variant="filled"` / `"outlined"`.)
         * @default 'soft'
         */
        appearance?: ChipAppearance;
        /**
         * Visual height: `sm` 20px, `md` 24px. Interactive parts keep a 44px hit
         * area at mobile and on touch pointers.
         * @default 'md'
         */
        size?: ChipSize;
        /** Leading icon (decorative; sized by the chip, 16px at `md`, 12px at `sm`). */
        icon?: ReactNode;
        /**
         * Makes the chip an action: the label renders as a `<button>` whose
         * hit area covers the chip. Use for filters and toggles that navigate
         * or apply something; a chip with only `onDelete` stays static.
         */
        onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
        /**
         * Shows a remove button after the label (named by `removeLabel`).
         * Backspace or Delete on the chip's action button also calls it.
         */
        onDelete?: (
            event:
                MouseEvent<HTMLButtonElement> | KeyboardEvent<HTMLButtonElement>
        ) => void;
        /**
         * Accessible name of the remove button.
         * @default `Remove ${label}`
         */
        removeLabel?: string;
        /** Disables the action and remove buttons and shows the muted look. */
        disabled?: boolean;
    };

/**
 * Class string for the chip container (tone, appearance, size), conflict-
 * resolved with `cn()`.
 */
export function chipVariants(options?: ChipVariantOptions): string {
    return cn(chipStyles(options));
}

/**
 * Invisible, pointer-only extension of a button's target area. It is a
 * separate element (not the button's ::after) so it can sit below every
 * chip's visual box. A click on it focuses the button and is forwarded to
 * it; the layer's own click does not bubble, so ancestors see one click.
 */
/** Focus options for a pointer-initiated focus (`focusVisible` is not in TS's DOM lib yet). */
const pointerFocus: FocusOptions & { focusVisible?: boolean } = {
    preventScroll: true,
    focusVisible: false,
};

function HitLayer({
    className,
    target,
    disabled,
}: {
    className: string;
    target: RefObject<HTMLButtonElement | null>;
    disabled: boolean;
}) {
    const ref = useRef<HTMLSpanElement>(null);
    useEffect(() => {
        const layer = ref.current;
        if (!layer) return;
        // Native listener: React's stopPropagation acts at the React root, so
        // native listeners on ancestors (non-React hosts, other roots) would
        // still see the layer click. Stopping it here keeps every ancestor at
        // exactly one click: the forwarded button click, which bubbles.
        const onClick = (event: Event) => {
            event.stopPropagation();
            const button = target.current;
            if (!button || button.disabled) return;
            // Focus as a native mouse click does in Chrome, Edge and Firefox
            // (Safari does not focus buttons on click; we pick the consistent
            // behaviour). Scripted focus would otherwise match :focus-visible
            // and draw the keyboard ring after a mouse click; `focusVisible:
            // false` prevents that where supported (Chromium, Firefox).
            button.focus(pointerFocus);
            button.click();
        };
        layer.addEventListener('click', onClick);
        return () => layer.removeEventListener('click', onClick);
    }, [target]);
    return (
        <span
            ref={ref}
            aria-hidden="true"
            data-chip-hit=""
            className={cn(className, disabled && 'hz:cursor-not-allowed')}
        />
    );
}

/** True while the element's text overflows its box (ellipsis is showing). */
function useIsTruncated(label: string) {
    const ref = useRef<HTMLSpanElement>(null);
    const [truncated, setTruncated] = useState(false);
    useLayoutEffect(() => {
        const el = ref.current;
        if (!el) return;
        const check = () => setTruncated(el.scrollWidth > el.clientWidth);
        check();
        if (typeof ResizeObserver === 'undefined') return;
        const observer = new ResizeObserver(check);
        observer.observe(el);
        return () => observer.disconnect();
    }, [label]);
    return [ref, truncated] as const;
}

/** x-core / MUI props that are dropped (with a dev warning). */
const legacyChipProps = {
    sx: 'use className',
    color: 'use variant (tone)',
    avatar: 'pass an icon',
    deleteIcon: 'the remove icon is fixed',
    clickable: 'pass onClick',
} as const;

/**
 * Compact label for a status, category, filter or selected value. Static by
 * default; `onClick` makes it a button and `onDelete` adds a labelled remove
 * button. Long labels truncate with an ellipsis and get a `title` with the
 * full text only while truncated.
 */
export const Chip = forwardRef<HTMLSpanElement, ChipProps>(function Chip(
    {
        label,
        variant: variantProp,
        appearance: appearanceProp,
        size: sizeProp,
        icon,
        onClick,
        onDelete,
        removeLabel,
        disabled = false,
        className,
        ...props
    },
    ref
) {
    const rest = omitLegacyProps('Chip', props, legacyChipProps);
    // Untyped callers may pass x-core values (`size="small"`,
    // `variant="outlined"`); `size` indexes the hit-area records below.
    const variant = resolveOption(
        'Chip',
        'variant',
        variantProp,
        chipTones,
        'primary'
    );
    const appearance = resolveOption(
        'Chip',
        'appearance',
        appearanceProp,
        ['soft', 'outline'],
        'soft'
    );
    const size = resolveOption('Chip', 'size', sizeProp, ['sm', 'md'], 'md');
    const [labelRef, truncated] = useIsTruncated(label);
    const actionRef = useRef<HTMLButtonElement>(null);
    const removeRef = useRef<HTMLButtonElement>(null);
    const text = (
        <span
            ref={labelRef}
            className="hz:relative hz:z-2 hz:min-w-0 hz:truncate"
            title={truncated ? label : undefined}
        >
            {label}
        </span>
    );
    const iconSlot = icon && (
        <span
            aria-hidden="true"
            className="hz:relative hz:z-2 hz:inline-flex hz:shrink-0"
        >
            {icon}
        </span>
    );
    const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
        if (event.key === 'Backspace' || event.key === 'Delete') {
            event.preventDefault();
            onDelete?.(event);
        }
    };

    return (
        <span
            {...rest}
            ref={ref}
            data-variant={variant}
            data-appearance={appearance}
            data-size={size}
            data-disabled={disabled || undefined}
            className={cn(
                chipStyles({
                    variant,
                    appearance,
                    size,
                    interactive: Boolean(onClick),
                    disabled,
                }),
                className
            )}
        >
            {onClick ? (
                <>
                    {/* Pointer-only enlargement of the button below; keyboard
                        and assistive tech use the button itself. */}
                    <HitLayer
                        className={actionHit[size]}
                        target={actionRef}
                        disabled={disabled}
                    />
                    <button
                        ref={actionRef}
                        type="button"
                        data-chip-action=""
                        className={cn(
                            actionStyles,
                            actionInset[size].start,
                            !onDelete && actionInset[size].end
                        )}
                        disabled={disabled}
                        onClick={onClick}
                        onKeyDown={onDelete ? handleKeyDown : undefined}
                    >
                        {iconSlot}
                        {text}
                    </button>
                </>
            ) : (
                <>
                    {iconSlot}
                    {text}
                </>
            )}
            {onDelete && (
                <span
                    data-chip-remove=""
                    className="hz:relative hz:inline-flex hz:shrink-0"
                >
                    <HitLayer
                        className={removeHit[size].outer}
                        target={removeRef}
                        disabled={disabled}
                    />
                    <HitLayer
                        className={removeHit[size].inner}
                        target={removeRef}
                        disabled={disabled}
                    />
                    <button
                        ref={removeRef}
                        type="button"
                        aria-label={removeLabel ?? `Remove ${label}`}
                        className={removeStyles}
                        disabled={disabled}
                        onClick={onDelete}
                    >
                        <XIcon aria-hidden="true" weight="bold" />
                    </button>
                </span>
            )}
        </span>
    );
});
Chip.displayName = 'Chip';
