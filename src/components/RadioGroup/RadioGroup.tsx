/*
 * Based on shadcn/ui Radio Group (registry 2025) on Radix RadioGroup, with
 * built-in item labels and 44px targets. Replaces x-core `RadioGroup` (MUI
 * RadioGroup + FormControlLabel with an `options` array) and `Radiov2` (MUI
 * Radio wrapper), x-core 2.2.30; v1 `Radio` is superseded.
 */
import * as RadioGroupPrimitive from '@radix-ui/react-radio-group';
import { cva, type VariantProps } from 'class-variance-authority';
import {
    createContext,
    forwardRef,
    useContext,
    useId,
    useRef,
    type ComponentPropsWithoutRef,
    type ReactNode,
} from 'react';
import { cn } from '../../lib/cn';
import { omitLegacyProps, resolveOption } from '../../lib/options';
import {
    choiceFocusRing,
    choiceLabel,
    choiceLabelDisabled,
    choiceTarget,
    choiceWrapper,
    composeRefs,
    useFieldControl,
    useFormField,
    useResolvedDir,
    type Direction,
} from '../../primitives';
import type { DnbBase } from '../../types/DnbBase';

const radioGroupStyles = cva('hz:m-0 hz:flex hz:min-w-0 hz:p-0', {
    variants: {
        // Vertical items touch at mobile (44px targets, no overlap) and get
        // 4px between them with a fine pointer; horizontal ones wrap.
        orientation: {
            vertical: 'hz:flex-col hz:items-start hz:tablet:pointer-fine:gap-1',
            horizontal: 'hz:flex-row hz:flex-wrap hz:items-start hz:gap-x-4',
        },
    },
    defaultVariants: { orientation: 'vertical' },
});

const itemStyles = cva(choiceTarget, {
    variants: {
        size: {
            sm: 'hz:size-11 hz:tablet:pointer-fine:size-5',
            md: 'hz:size-11 hz:tablet:pointer-fine:size-6',
        },
    },
    defaultVariants: { size: 'md' },
});

// x-core (MUI Radio): a ring that turns primary and 2px when checked, with a
// primary dot.
const circleStyles = cva(
    [
        'hz:flex hz:items-center hz:justify-center hz:rounded-full hz:ring-inset',
        'hz:transition-[box-shadow] hz:duration-fast hz:ease-standard',
        choiceFocusRing,
        'hz:ring-1 hz:group-data-[state=checked]:ring-2',
    ],
    {
        variants: {
            size: { sm: 'hz:size-4', md: 'hz:size-5' },
            state: {
                rest: 'hz:bg-transparent hz:ring-control-border hz:group-hover:ring-primary hz:group-data-[state=checked]:ring-primary',
                invalid: 'hz:bg-transparent hz:ring-destructive',
                disabled: 'hz:bg-muted hz:ring-input',
            },
        },
        defaultVariants: { size: 'md', state: 'rest' },
    }
);

const dotStyles = cva('hz:block hz:rounded-full', {
    variants: {
        size: { sm: 'hz:size-2', md: 'hz:size-2.5' },
        state: {
            rest: 'hz:bg-primary',
            invalid: 'hz:bg-destructive',
            disabled: 'hz:bg-muted-foreground',
        },
    },
    defaultVariants: { size: 'md', state: 'rest' },
});

/** Options accepted by {@link radioGroupVariants}: `orientation`. */
export type RadioGroupVariantOptions = VariantProps<typeof radioGroupStyles>;

/** Layout direction of a {@link RadioGroup}. */
export type RadioGroupOrientation = NonNullable<
    RadioGroupVariantOptions['orientation']
>;

/** Size of the radios in a {@link RadioGroup}. */
export type RadioGroupSize = 'sm' | 'md';

const orientations: readonly RadioGroupOrientation[] = [
    'vertical',
    'horizontal',
];
const radioSizes: readonly RadioGroupSize[] = ['sm', 'md'];

/** Class string for the RadioGroup layout, conflict-resolved with `cn()`. */
export function radioGroupVariants(options?: RadioGroupVariantOptions): string {
    return cn(radioGroupStyles(options));
}

type ItemContext = {
    size: RadioGroupSize;
    state: 'rest' | 'invalid' | 'disabled';
};
const RadioItemContext = createContext<ItemContext>({
    size: 'md',
    state: 'rest',
});

const legacyRadioGroupProps = {
    options: 'render a RadioGroupItem per option',
    row: 'use orientation="horizontal"',
    onChange: 'use onValueChange(value)',
    label: 'wrap in FormField label',
    error: 'use invalid, or FormField error',
    errorText: 'use FormField error',
    other: 'compose a RadioGroupItem and an Input',
    sx: 'use className',
} as const;

const legacyRadioItemProps = {
    onChange: 'use onValueChange on RadioGroup',
    checked: 'use value on RadioGroup',
    color: 'RadioGroupItem has one look',
    sx: 'use className',
    size: 'set size on RadioGroup',
    inputProps: 'not supported',
    disableRipple: 'RadioGroupItem has no ripple',
    control: 'RadioGroupItem is the control',
} as const;

/** Props for {@link RadioGroup}. */
export type RadioGroupProps = Omit<
    ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>,
    'asChild' | 'orientation' | 'dir' | 'onChange'
> &
    DnbBase & {
        /**
         * `vertical` stacks the options; `horizontal` puts them in a
         * wrapping row (x-core `row`). Arrow keys move along the
         * orientation (and reverse horizontally in RTL).
         * @default 'vertical'
         */
        orientation?: RadioGroupOrientation;
        /**
         * Radio size: 16px (`sm`) or 20px (`md`); targets are 44px at
         * mobile and on touch pointers.
         * @default 'md'
         */
        size?: RadioGroupSize;
        /** Invalid look and `aria-invalid` (set by a FormField `error`). */
        invalid?: boolean;
        /**
         * Text direction for arrow keys. Read from the DOM (HorizonProvider
         * `dir` or any `dir` ancestor) when omitted.
         */
        dir?: Direction;
        /** `RadioGroupItem`s (other content may sit between them). */
        children?: ReactNode;
    };

/**
 * A set of mutually exclusive options: Radix RadioGroup (`role="radiogroup"`,
 * roving focus, arrow keys select). Name it with `FormField` (it becomes
 * `aria-labelledby`) or `aria-label`. `onValueChange(value)` replaces MUI's
 * `onChange(event, value)`; values are strings.
 */
export const RadioGroup = forwardRef<HTMLDivElement, RadioGroupProps>(
    function RadioGroup(
        {
            orientation: orientationProp,
            size: sizeProp,
            invalid: invalidProp,
            dir,
            className,
            id: idProp,
            disabled: disabledProp,
            required,
            'aria-describedby': describedByProp,
            children,
            ...props
        },
        ref
    ) {
        const rest = omitLegacyProps(
            'RadioGroup',
            props,
            legacyRadioGroupProps
        );
        const orientation = resolveOption(
            'RadioGroup',
            'orientation',
            orientationProp,
            orientations,
            'vertical'
        );
        const size = resolveOption(
            'RadioGroup',
            'size',
            sizeProp,
            radioSizes,
            'md'
        );
        const field = useFormField();
        const control = useFieldControl({
            id: idProp,
            'aria-describedby': describedByProp,
            invalid: invalidProp,
            required,
            disabled: disabledProp,
        });
        const rootRef = useRef<HTMLDivElement>(null);
        const direction = useResolvedDir(rootRef, dir);
        const named =
            rest['aria-label'] !== undefined ||
            rest['aria-labelledby'] !== undefined;
        const state = control.disabled
            ? 'disabled'
            : control.invalid
              ? 'invalid'
              : 'rest';

        return (
            <RadioGroupPrimitive.Root
                {...rest}
                ref={composeRefs(ref, rootRef)}
                id={control.id}
                dir={direction}
                orientation={orientation}
                disabled={control.disabled}
                required={control.required}
                aria-labelledby={
                    named ? rest['aria-labelledby'] : field?.labelId
                }
                aria-describedby={control['aria-describedby']}
                aria-invalid={control.invalid || undefined}
                data-orientation={orientation}
                className={cn(radioGroupStyles({ orientation }), className)}
            >
                <RadioItemContext.Provider value={{ size, state }}>
                    {children}
                </RadioItemContext.Provider>
            </RadioGroupPrimitive.Root>
        );
    }
);
RadioGroup.displayName = 'RadioGroup';

/** Props for {@link RadioGroupItem}. */
export type RadioGroupItemProps = Omit<
    ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>,
    'asChild' | 'children' | 'onChange'
> &
    DnbBase & {
        /** The option's value (a string). */
        value: string;
        /**
         * Visible label (clicking it selects). Without it, name the radio
         * with `aria-label`.
         */
        label?: ReactNode;
        /** Classes for the wrapper (radio + label); `ref` goes to the radio. */
        className?: string;
    };

/** One option of a {@link RadioGroup}: a radio with a 44px target and label. */
export const RadioGroupItem = forwardRef<
    HTMLButtonElement,
    RadioGroupItemProps
>(function RadioGroupItem({ label, className, id, disabled, ...props }, ref) {
    const rest = omitLegacyProps('RadioGroupItem', props, legacyRadioItemProps);
    const group = useContext(RadioItemContext);
    const generatedId = useId();
    const itemId = id ?? generatedId;
    const state = disabled ? 'disabled' : group.state;
    return (
        <span className={cn(choiceWrapper, className)} data-radio="">
            <RadioGroupPrimitive.Item
                {...rest}
                ref={ref}
                id={itemId}
                disabled={disabled}
                data-size={group.size}
                className={itemStyles({ size: group.size })}
            >
                <span
                    aria-hidden="true"
                    className={circleStyles({ size: group.size, state })}
                >
                    <RadioGroupPrimitive.Indicator
                        className={dotStyles({ size: group.size, state })}
                    />
                </span>
            </RadioGroupPrimitive.Item>
            {label !== undefined && (
                <label
                    htmlFor={itemId}
                    className={cn(
                        choiceLabel,
                        state === 'disabled' && choiceLabelDisabled
                    )}
                >
                    {label}
                </label>
            )}
        </span>
    );
});
RadioGroupItem.displayName = 'RadioGroupItem';
