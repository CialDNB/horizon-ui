/*
 * Based on shadcn/ui Form's FormItem/FormLabel/FormControl/FormDescription/
 * FormMessage (registry 2025) without its react-hook-form binding: a plain
 * context, so it works with react-hook-form (`register` or `Controller`),
 * Formik or local state. No direct x-core import: replaces the label,
 * helperText and error that x-core TextField/TextInput/TextArea/Select and
 * the MUI FormControl/FormHelperText rendered (x-core 2.2.30).
 */
import { WarningCircleIcon } from '@phosphor-icons/react/dist/csr/WarningCircle';
import {
    forwardRef,
    useId,
    useMemo,
    useState,
    type HTMLAttributes,
    type ReactNode,
} from 'react';
import { cn } from '../../lib/cn';
import { omitLegacyProps } from '../../lib/options';
import { FormFieldContext, type FormFieldContextValue } from '../../primitives';
import { Label, labelVariants } from '../Label';
import type { DnbBase } from '../../types/DnbBase';

const legacyFormFieldProps = {
    helperText: 'use description or error',
    errorText: 'use error',
    fullWidth: 'FormField is full width by default',
    margin: 'use layout spacing',
    sx: 'use className',
    variant: 'FormField has one look',
    color: 'FormField has one look',
    focused: 'not needed',
    hiddenLabel: 'name the control with aria-label instead',
    isLabelContainer: 'the label is always above the control',
    info: 'use description',
} as const;

/** Props for {@link FormField}. */
export type FormFieldProps = Omit<
    HTMLAttributes<HTMLDivElement>,
    'children' | 'id'
> &
    DnbBase & {
        /** Visible label, associated with the control. */
        label: ReactNode;
        /** Help text under the control, linked by `aria-describedby`. */
        description?: ReactNode;
        /**
         * Error message. When set, the control is invalid (`aria-invalid`)
         * and the message is linked by `aria-describedby` and announced once
         * when it appears (`role="alert"`). Omit or pass `undefined` when
         * valid: an empty string still counts as no error.
         */
        error?: ReactNode;
        /** Invalid without a message (the message is shown elsewhere). */
        invalid?: boolean;
        /**
         * Sets `aria-required` on the control and a decorative asterisk on
         * the label. (Native `required` would show browser validation
         * bubbles; pass it to the control yourself if you want them.)
         * @default false
         */
        required?: boolean;
        /** Disables the control and mutes the label. @default false */
        disabled?: boolean;
        /** Id for the control (generated when omitted). */
        id?: string;
        /**
         * One control: Input, Textarea, Select, Checkbox, Switch or
         * RadioGroup (which is named by the label through
         * `aria-labelledby`).
         */
        children: ReactNode;
    };

const hasContent = (node: ReactNode) =>
    node !== undefined && node !== null && node !== false && node !== '';

/**
 * Label, control, description and error message, wired together: the label's
 * `htmlFor`, the control's `id`, `aria-describedby`, `aria-invalid` and
 * `aria-required` are set for you. Stacks vertically with 4px gaps.
 */
export const FormField = forwardRef<HTMLDivElement, FormFieldProps>(
    function FormField(
        {
            label,
            description,
            error,
            invalid,
            required = false,
            disabled = false,
            id: idProp,
            className,
            children,
            ...props
        },
        ref
    ) {
        const rest = omitLegacyProps('FormField', props, legacyFormFieldProps);
        const base = useId();
        // A control's own id (published through context) wins, so the label
        // follows it; then the FormField `id`; then a generated one.
        const [controlId, setControlId] = useState<string>();
        const [ownLabel, setOwnLabel] = useState(false);
        const id = controlId ?? idProp ?? `${base}-control`;
        const labelId = `${base}-label`;
        const descriptionId = hasContent(description)
            ? `${base}-description`
            : undefined;
        const errorId = hasContent(error) ? `${base}-error` : undefined;
        const isInvalid = invalid ?? errorId !== undefined;
        const describedBy =
            [descriptionId, errorId].filter(Boolean).join(' ') || undefined;

        const context = useMemo<FormFieldContextValue>(
            () => ({
                id,
                labelId,
                describedBy,
                invalid: isInvalid,
                required,
                disabled,
                registerId: setControlId,
                registerOwnLabel: setOwnLabel,
            }),
            [id, labelId, describedBy, isInvalid, required, disabled]
        );

        return (
            <div
                {...rest}
                ref={ref}
                className={cn(
                    'hz:m-0 hz:flex hz:min-w-0 hz:flex-col hz:gap-1',
                    className
                )}
                data-invalid={isInvalid || undefined}
                data-disabled={disabled || undefined}
                // A self-labelled choice control keeps the caption as its
                // group context (a screen reader announces "Terms, group").
                {...(ownLabel && {
                    role: 'group',
                    'aria-labelledby': labelId,
                })}
            >
                {ownLabel ? (
                    // The control names itself (Checkbox/Switch `label`):
                    // a caption, not a second <label> for it.
                    <div
                        id={labelId}
                        className={cn(
                            labelVariants({ disabled }),
                            'hz:self-start'
                        )}
                        data-required={required || undefined}
                    >
                        {label}
                        {required && (
                            <span
                                aria-hidden="true"
                                className="hz:text-destructive-strong"
                            >
                                *
                            </span>
                        )}
                    </div>
                ) : (
                    <Label
                        id={labelId}
                        htmlFor={id}
                        required={required}
                        disabled={disabled}
                        className="hz:self-start"
                    >
                        {label}
                    </Label>
                )}
                <FormFieldContext.Provider value={context}>
                    {children}
                </FormFieldContext.Provider>
                {descriptionId && (
                    <p
                        id={descriptionId}
                        className="hz:m-0 hz:p-0 hz:text-caption hz:text-muted-foreground"
                    >
                        {description}
                    </p>
                )}
                {errorId && (
                    // Mounted only while there is an error, so it is
                    // announced when it appears (and when its text
                    // changes), never on unrelated re-renders.
                    <p
                        id={errorId}
                        role="alert"
                        className="hz:m-0 hz:flex hz:items-start hz:gap-1 hz:p-0 hz:text-caption hz:text-destructive-strong"
                    >
                        <WarningCircleIcon
                            aria-hidden="true"
                            className="hz:size-3 hz:shrink-0 hz:align-middle"
                        />
                        <span>{error}</span>
                    </p>
                )}
            </div>
        );
    }
);
FormField.displayName = 'FormField';
