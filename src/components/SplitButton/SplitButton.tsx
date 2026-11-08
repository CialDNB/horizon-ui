/*
 * No shadcn base (shadcn has no split button): a composition of Button and
 * DropdownMenu in a labelled group. Replaces x-core `SplitButton` (MUI
 * ButtonGroup + Popper/MenuList over ButtonV2, x-core 2.2.30).
 */
import { CaretDownIcon } from '@phosphor-icons/react/dist/csr/CaretDown';
import {
    forwardRef,
    useState,
    type HTMLAttributes,
    type ReactNode,
} from 'react';
import { cn } from '../../lib/cn';
import { omitLegacyProps, resolveOption } from '../../lib/options';
import type { DnbBase } from '../../types/DnbBase';
import { Button, type ButtonSize } from '../Button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuTrigger,
} from '../DropdownMenu';

/** One choice: a label, or an object with its own action (extra keys pass through to `onOptionClick`). */
export type SplitButtonOption =
    | string
    | {
          /** Visible text (the main button shows it once chosen). */
          label: string;
          /** Runs when this option is chosen or the main button runs it. */
          onClick?: () => void;
          /** Shown but not selectable. */
          disabled?: boolean;
          /** Other keys (customer360 passes `mode`) reach `onOptionClick`. */
          [key: string]: unknown;
      };

/** Look of a {@link SplitButton}: Button's `primary` or `secondary`. */
export type SplitButtonVariant = 'primary' | 'secondary';

const variants: readonly SplitButtonVariant[] = ['primary', 'secondary'];
const sizes: readonly ButtonSize[] = ['sm', 'md', 'lg'];

/** x-core SplitButton / MUI props that are dropped (dev warning). */
const legacySplitButtonProps = {
    color: 'use variant (primary or secondary)',
    sx: 'use className',
    isHeaderButton: 'customer360 wrapper prop: not needed',
    isSmallScreen: 'customer360 wrapper prop: not needed',
    isMobile: 'customer360 wrapper prop: the menu is a bottom sheet at mobile',
    showTextUnderLine: 'not supported',
} as const;

/** Props for {@link SplitButton}. */
export type SplitButtonProps = Omit<
    HTMLAttributes<HTMLDivElement>,
    'onChange' | 'color'
> &
    DnbBase & {
        /** The choices; the first is selected until another is picked. */
        options: readonly SplitButtonOption[];
        /**
         * Called when an option without its own `onClick` runs (from the
         * menu, or from the main button for the selected option).
         */
        onOptionClick?: (option: SplitButtonOption, index: number) => void;
        /** Fixed main button text instead of the selected option's label (x-core `headline`). */
        headline?: ReactNode;
        /**
         * Look, as Button. x-core `contained` -> `primary`, `outlined` ->
         * `secondary`.
         * @default 'primary'
         */
        variant?: SplitButtonVariant;
        /** Size, as Button (44px tall at mobile). @default 'md' */
        size?: ButtonSize;
        /** Disables both buttons. @default false */
        disabled?: boolean;
        /** Main button spinner; the menu button is disabled meanwhile. @default false */
        loading?: boolean;
        /** Initially selected option index. @default 0 */
        defaultSelectedIndex?: number;
        /** Accessible name of the menu button. Translate it. @default 'More options' */
        menuLabel?: string;
        /** Decorative icon before the main label (x-core forwarded `startIcon`). */
        startIcon?: ReactNode;
    };

const labelOf = (option: SplitButtonOption | undefined) =>
    option === undefined
        ? ''
        : typeof option === 'string'
          ? option
          : option.label;
const disabledOf = (option: SplitButtonOption | undefined) =>
    typeof option === 'object' && option.disabled === true;

// The two buttons share one pill: square inner corners and a 1px divider
// in the foreground colour of the fill (white on primary; the secondary
// border overlaps by 1px). customer360's `button + button { margin-left }`
// loses to the `.hz-root` button reset in styles.unlayered.css (measured).
const mainJoin = 'hz:rounded-e-none';
const menuJoin = {
    primary:
        'hz:rounded-s-none hz:border-s-primary-foreground hz:inactive:border-s-background',
    secondary: 'hz:-ms-px hz:rounded-s-none',
} as const;

/**
 * A main action plus a menu of alternatives (`role="group"`). The main
 * button runs the selected option; the caret opens a menu of all options
 * (`menuitemradio`, the selected one checked); picking one selects it and
 * runs it. The menu is a bottom sheet below tablet.
 */
export const SplitButton = forwardRef<HTMLDivElement, SplitButtonProps>(
    function SplitButton(
        {
            options,
            onOptionClick,
            headline,
            variant: variantProp,
            size: sizeProp,
            disabled = false,
            loading = false,
            defaultSelectedIndex = 0,
            menuLabel = 'More options',
            startIcon,
            className,
            'aria-label': ariaLabel,
            ...props
        },
        ref
    ) {
        const rest = omitLegacyProps(
            'SplitButton',
            props,
            legacySplitButtonProps
        );
        const variant = resolveOption(
            'SplitButton',
            'variant',
            variantProp,
            variants,
            'primary'
        );
        const size = resolveOption(
            'SplitButton',
            'size',
            sizeProp,
            sizes,
            'md'
        );
        const [selected, setSelected] = useState(defaultSelectedIndex);
        const index = selected >= 0 && selected < options.length ? selected : 0;
        const current = options[index];
        const run = (i: number) => {
            const option = options[i];
            if (option === undefined || disabledOf(option)) return;
            if (typeof option === 'object' && option.onClick) option.onClick();
            else onOptionClick?.(option, i);
        };
        const mainLabel = headline ?? labelOf(current);
        return (
            <div
                {...rest}
                ref={ref}
                role="group"
                aria-label={
                    ariaLabel ??
                    (typeof mainLabel === 'string' ? mainLabel : undefined)
                }
                className={cn(
                    'hz:inline-flex hz:max-w-full hz:min-w-0 hz:items-stretch',
                    className
                )}
                data-split-button=""
            >
                <Button
                    variant={variant}
                    size={size}
                    disabled={disabled || disabledOf(current)}
                    loading={loading}
                    startIcon={startIcon}
                    className={mainJoin}
                    onClick={() => run(index)}
                    data-split-main=""
                >
                    {mainLabel}
                </Button>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant={variant}
                            size={size}
                            disabled={disabled || loading}
                            aria-label={menuLabel}
                            className={cn(
                                menuJoin[variant],
                                'hz:min-w-11 hz:px-3 hz:tablet:pointer-fine:min-w-9 hz:tablet:pointer-fine:px-2 hz:[&_svg]:transition-transform hz:[&_svg]:duration-fast hz:data-[state=open]:[&_svg]:rotate-180'
                            )}
                            data-split-menu=""
                        >
                            <CaretDownIcon aria-hidden="true" weight="bold" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuRadioGroup value={String(index)}>
                            {options.map((option, i) => (
                                <DropdownMenuRadioItem
                                    key={`${i}-${labelOf(option)}`}
                                    value={String(i)}
                                    disabled={disabledOf(option)}
                                    onSelect={() => {
                                        setSelected(i);
                                        run(i);
                                    }}
                                >
                                    {labelOf(option)}
                                </DropdownMenuRadioItem>
                            ))}
                        </DropdownMenuRadioGroup>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        );
    }
);
SplitButton.displayName = 'SplitButton';
