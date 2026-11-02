/*
 * Based on shadcn/ui Label (registry 2025) without its Radix Label base: a
 * native <label> (Radix Label only blocks text selection on double click, not
 * worth a dependency). Replaces x-core's internal `shared/inputs/Label` and the
 * MUI `FormLabel`/`InputLabel` that x-core TextField/TextInput/TextArea and
 * RadioGroup render (x-core 2.2.30); no direct x-core import exists.
 */
import { cva } from 'class-variance-authority';
import { forwardRef, type LabelHTMLAttributes } from 'react';
import { cn } from '../../lib/cn';
import { omitLegacyProps } from '../../lib/options';
import type { DnbBase } from '../../types/DnbBase';

// Every property a host `label` rule touches is set here: Bootstrap reboot
// `label { display: inline-block; margin-bottom: .5rem }` and customer360's
// `label { display: block; color; font-weight: bold }` (unlayered build).
const labelStyles = cva(
    'hz:m-0 hz:inline-flex hz:items-baseline hz:gap-0.5 hz:p-0 hz:text-label-md hz:text-foreground hz:break-words',
    {
        variants: {
            disabled: {
                true: 'hz:cursor-not-allowed hz:text-muted-foreground',
                false: '',
            },
        },
        defaultVariants: { disabled: false },
    }
);

/** Options accepted by {@link labelVariants}. */
export type LabelVariantOptions = { disabled?: boolean };

/** Class string for the Label look, conflict-resolved with `cn()`. */
export function labelVariants(options?: LabelVariantOptions): string {
    return cn(labelStyles(options));
}

const legacyLabelProps = {
    sx: 'use className',
    color: 'Label has one colour',
    focused: 'not needed: the control shows focus',
    error: 'show errors with FormField error',
    filled: 'not needed',
    shrink: 'Label is always above the control',
    variant: 'Label has one look',
    component: 'Label is always a <label>',
} as const;

/** Props for {@link Label}. */
export type LabelProps = LabelHTMLAttributes<HTMLLabelElement> &
    DnbBase & {
        /**
         * Shows a decorative asterisk. Mark the control itself as required
         * (`required` / `aria-required`, which FormField does): the asterisk
         * is hidden from assistive technology so the name is read once.
         * @default false
         */
        required?: boolean;
        /**
         * Muted text for a disabled control.
         * @default false
         */
        disabled?: boolean;
    };

/**
 * A visible caption for a form control: a native `<label>`, associated with
 * its control by `htmlFor` (FormField wires it for you).
 */
export const Label = forwardRef<HTMLLabelElement, LabelProps>(function Label(
    { required = false, disabled = false, className, children, ...props },
    ref
) {
    const rest = omitLegacyProps('Label', props, legacyLabelProps);
    return (
        <label
            {...rest}
            ref={ref}
            className={cn(labelStyles({ disabled }), className)}
            data-required={required || undefined}
            data-disabled={disabled || undefined}
        >
            {children}
            {required && (
                <span aria-hidden="true" className="hz:text-destructive-strong">
                    *
                </span>
            )}
        </label>
    );
});
Label.displayName = 'Label';
