/*
 * Based on shadcn/ui Switch (registry 2025) on Radix Switch, with a built-in
 * label and a 44px target. Replaces x-core `SwitchV2` (MUI Switch wrapper,
 * x-core 2.2.30); `Switch` (v1) is superseded.
 */
import * as SwitchPrimitive from '@radix-ui/react-switch';
import { cva, type VariantProps } from 'class-variance-authority';
import {
    forwardRef,
    useId,
    type ComponentPropsWithoutRef,
    type ReactNode,
} from 'react';
import { cn } from '../../lib/cn';
import { omitLegacyProps } from '../../lib/options';
import {
    choiceFocusRing,
    choiceForcedBorder,
    choiceLabel,
    choiceLabelDisabled,
    choiceTarget,
    choiceWrapper,
    useFieldControl,
} from '../../primitives';
import type { DnbBase } from '../../types/DnbBase';

// Target: 44px square at mobile and on touch pointers; the 40x24 track plus
// 2px with a fine pointer from tablet (44 x 28).
const switchTarget = cn(
    choiceTarget,
    'hz:size-11 hz:rounded-full hz:tablet:pointer-fine:h-7'
);

const trackStyles = cva(
    [
        'hz:relative hz:flex hz:h-6 hz:w-10 hz:shrink-0 hz:items-center hz:rounded-full',
        'hz:transition-colors hz:duration-normal hz:ease-standard',
        choiceFocusRing,
        choiceForcedBorder,
    ],
    {
        variants: {
            // Off: a filled `control-border` track (3:1, x-core blueGrey);
            // on: primary. The thumb is `background` on both (>= 3:1).
            state: {
                rest: 'hz:bg-control-border hz:group-data-[state=checked]:bg-primary hz:group-hover:group-data-[state=checked]:bg-primary-hover',
                invalid:
                    'hz:bg-control-border hz:ring-2 hz:ring-destructive hz:ring-offset-0 hz:group-data-[state=checked]:bg-primary',
                disabled:
                    'hz:bg-input hz:group-data-[state=checked]:bg-muted-foreground',
            },
        },
        defaultVariants: { state: 'rest' },
    }
);

// Moves by transform only, along the inline axis (mirrored under RTL).
const thumbStyles =
    'hz:forced-colors:forced-color-adjust-none hz:forced-colors:bg-[CanvasText] hz:pointer-events-none hz:block hz:size-5 hz:rounded-full hz:bg-background hz:shadow-1 hz:translate-x-0.5 hz:data-[state=checked]:translate-x-4.5 hz:rtl:-translate-x-0.5 hz:rtl:data-[state=checked]:-translate-x-4.5 hz:transition-transform hz:duration-normal hz:ease-spring';

/** Options accepted by {@link switchVariants}: the track `state`. */
export type SwitchVariantOptions = VariantProps<typeof trackStyles>;

/** Class string for the Switch track look, conflict-resolved with `cn()`. */
export function switchVariants(options?: SwitchVariantOptions): string {
    return cn(trackStyles(options));
}

const legacySwitchProps = {
    onChange: 'use onCheckedChange(checked)',
    color: 'Switch has one look',
    size: 'Switch has one size',
    sx: 'use className',
    edge: 'use layout spacing',
    inputProps: 'pass name/value/required to Switch',
    inputRef: 'use ref',
    icon: 'Switch has one look',
    checkedIcon: 'Switch has one look',
    disableRipple: 'Switch has no ripple',
} as const;

/** Props for {@link Switch}. */
export type SwitchProps = Omit<
    ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>,
    'asChild' | 'children' | 'onChange'
> &
    DnbBase & {
        /**
         * Visible label after the switch (clicking it toggles). Without it,
         * name the switch with `aria-label` or a `FormField`.
         */
        label?: ReactNode;
        /** Invalid look and `aria-invalid` (set by a FormField `error`). */
        invalid?: boolean;
        /** Classes for the wrapper; `ref` and `data-did` go to the switch. */
        className?: string;
    };

/**
 * An on/off setting that applies immediately: Radix Switch
 * (`role="switch"`, Space toggles) with a 44px target at mobile. For a choice
 * submitted later with a form, prefer Checkbox. `onCheckedChange(checked)`
 * replaces MUI's `onChange(event, checked)`.
 */
export const Switch = forwardRef<HTMLButtonElement, SwitchProps>(
    function Switch(
        {
            label,
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
        const rest = omitLegacyProps('Switch', props, legacySwitchProps);
        const control = useFieldControl({
            id: idProp,
            'aria-describedby': describedByProp,
            invalid: invalidProp,
            required,
            disabled: disabledProp,
            ownLabel: label !== undefined,
        });
        const generatedId = useId();
        const id = control.id ?? generatedId;
        const state = control.disabled
            ? 'disabled'
            : control.invalid
              ? 'invalid'
              : 'rest';

        return (
            <span className={cn(choiceWrapper, className)} data-switch="">
                <SwitchPrimitive.Root
                    {...rest}
                    ref={ref}
                    id={id}
                    disabled={control.disabled}
                    required={control.required}
                    aria-invalid={control.invalid || undefined}
                    aria-describedby={control['aria-describedby']}
                    className={switchTarget}
                >
                    <span aria-hidden="true" className={trackStyles({ state })}>
                        <SwitchPrimitive.Thumb
                            data-switch-thumb=""
                            className={thumbStyles}
                        />
                    </span>
                </SwitchPrimitive.Root>
                {label !== undefined && (
                    <label
                        htmlFor={id}
                        className={cn(
                            choiceLabel,
                            'hz:tablet:pointer-fine:py-1',
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
Switch.displayName = 'Switch';
