/*
 * Based on shadcn/ui Checkbox (registry 2025) on Radix Checkbox, with a
 * built-in label and a 44px target. Replaces x-core `CheckboxV2` (MUI
 * Checkbox wrapper, x-core 2.2.30); `Checkbox` (v1) is superseded and its
 * call sites migrate here.
 */
import { CheckIcon } from '@phosphor-icons/react/dist/csr/Check';
import { MinusIcon } from '@phosphor-icons/react/dist/csr/Minus';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { cva, type VariantProps } from 'class-variance-authority';
import {
    forwardRef,
    useId,
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
    useFieldControl,
} from '../../primitives';
import type { DnbBase } from '../../types/DnbBase';

const checkboxStyles = cva(choiceTarget, {
    variants: {
        // Target: 44px at mobile and on touch pointers; the 16/20px box plus
        // a 2px gap with a fine pointer from tablet.
        size: {
            sm: 'hz:size-11 hz:tablet:pointer-fine:size-5',
            md: 'hz:size-11 hz:tablet:pointer-fine:size-6',
        },
    },
    defaultVariants: { size: 'md' },
});

const boxStyles = cva(
    [
        'hz:flex hz:items-center hz:justify-center hz:rounded-xs hz:ring-1 hz:ring-inset',
        'hz:transition-[background-color,box-shadow] hz:duration-fast hz:ease-standard',
        choiceFocusRing,
        // Checked and indeterminate: solid primary with a primary-foreground mark.
        'hz:group-data-[state=checked]:bg-primary hz:group-data-[state=checked]:ring-primary hz:group-data-[state=indeterminate]:bg-primary hz:group-data-[state=indeterminate]:ring-primary hz:text-primary-foreground',
    ],
    {
        variants: {
            size: {
                sm: 'hz:size-4 hz:[&_svg]:size-3',
                md: 'hz:size-5 hz:[&_svg]:size-3.5',
            },
            state: {
                rest: 'hz:bg-transparent hz:ring-control-border hz:group-hover:ring-primary hz:group-data-[state=checked]:group-hover:bg-primary-hover hz:group-data-[state=indeterminate]:group-hover:bg-primary-hover',
                invalid:
                    'hz:bg-transparent hz:ring-destructive hz:group-data-[state=checked]:ring-destructive hz:group-data-[state=indeterminate]:ring-destructive',
                disabled:
                    'hz:bg-muted hz:ring-input hz:group-data-[state=checked]:bg-muted hz:group-data-[state=checked]:ring-input hz:group-data-[state=indeterminate]:bg-muted hz:group-data-[state=indeterminate]:ring-input hz:text-muted-foreground',
            },
        },
        defaultVariants: { size: 'md', state: 'rest' },
    }
);

/** Options accepted by {@link checkboxVariants}: `size`. */
export type CheckboxVariantOptions = VariantProps<typeof checkboxStyles>;

/** Size of a {@link Checkbox}. */
export type CheckboxSize = NonNullable<CheckboxVariantOptions['size']>;

const checkboxSizes: readonly CheckboxSize[] = ['sm', 'md'];

/** Class string for the Checkbox target (the button), conflict-resolved. */
export function checkboxVariants(options?: CheckboxVariantOptions): string {
    return cn(checkboxStyles(options));
}

/** x-core Checkbox/CheckboxV2 (MUI) props that are dropped (dev warning). */
const legacyCheckboxProps = {
    onChange: 'use onCheckedChange(checked)',
    indeterminate: 'use checked="indeterminate"',
    color: 'Checkbox has one look',
    sx: 'use className',
    edge: 'use layout spacing',
    inputProps: 'pass name/value/required to Checkbox',
    inputRef: 'use ref',
    icon: 'Checkbox has one look',
    checkedIcon: 'Checkbox has one look',
    indeterminateIcon: 'Checkbox has one look',
    disableRipple: 'Checkbox has no ripple',
    readOnly: 'not supported: use disabled',
} as const;

/** Props for {@link Checkbox}. */
export type CheckboxProps = Omit<
    ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>,
    'asChild' | 'children' | 'onChange'
> &
    DnbBase & {
        /**
         * Visible label after the box (clicking it toggles). Without it,
         * name the checkbox with `aria-label` or a `FormField`.
         */
        label?: ReactNode;
        /**
         * Box size: 16px (`sm`) or 20px (`md`). The touch target is 44px at
         * mobile and on touch pointers either way.
         * @default 'md'
         */
        size?: CheckboxSize;
        /**
         * Invalid look and `aria-invalid`. Inside a `FormField` with an
         * `error` it is set for you.
         * @default false
         */
        invalid?: boolean;
        /**
         * Classes for the wrapper (box + label). `ref`, `data-did` and other
         * attributes go to the checkbox button.
         */
        className?: string;
    };

/**
 * A two-state (or mixed, `checked="indeterminate"`) choice: Radix Checkbox
 * (`role="checkbox"`, Space toggles) with a 44px target at mobile and an
 * optional label. `onCheckedChange(checked)` replaces MUI's
 * `onChange(event, checked)`.
 */
export const Checkbox = forwardRef<HTMLButtonElement, CheckboxProps>(
    function Checkbox(
        {
            label,
            size: sizeProp,
            invalid: invalidProp,
            className,
            id: idProp,
            disabled: disabledProp,
            required,
            'aria-describedby': describedByProp,
            ...props
        },
        ref
    ) {
        const rest = omitLegacyProps('Checkbox', props, legacyCheckboxProps);
        const size = resolveOption(
            'Checkbox',
            'size',
            sizeProp,
            checkboxSizes,
            'md'
        );
        const control = useFieldControl({
            id: idProp,
            'aria-describedby': describedByProp,
            invalid: invalidProp,
            required,
            disabled: disabledProp,
        });
        const generatedId = useId();
        const id = control.id ?? generatedId;
        const state = control.disabled
            ? 'disabled'
            : control.invalid
              ? 'invalid'
              : 'rest';

        return (
            <span className={cn(choiceWrapper, className)} data-checkbox="">
                <CheckboxPrimitive.Root
                    {...rest}
                    ref={ref}
                    id={id}
                    disabled={control.disabled}
                    required={control.required}
                    aria-invalid={control.invalid || undefined}
                    aria-describedby={control['aria-describedby']}
                    data-size={size}
                    className={checkboxStyles({ size })}
                >
                    <span
                        aria-hidden="true"
                        className={boxStyles({ size, state })}
                    >
                        <CheckboxPrimitive.Indicator
                            forceMount
                            className="hz:flex hz:items-center hz:justify-center hz:data-[state=unchecked]:hidden"
                        >
                            <CheckIcon
                                weight="bold"
                                data-checkbox-icon="checked"
                                className="hz:hidden hz:align-middle hz:group-data-[state=checked]:block"
                            />
                            <MinusIcon
                                weight="bold"
                                data-checkbox-icon="indeterminate"
                                className="hz:hidden hz:align-middle hz:group-data-[state=indeterminate]:block"
                            />
                        </CheckboxPrimitive.Indicator>
                    </span>
                </CheckboxPrimitive.Root>
                {label !== undefined && (
                    <label
                        htmlFor={id}
                        className={cn(
                            choiceLabel,
                            control.disabled && choiceLabelDisabled
                        )}
                    >
                        {label}
                    </label>
                )}
            </span>
        );
    }
);
Checkbox.displayName = 'Checkbox';
