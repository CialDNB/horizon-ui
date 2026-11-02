import { createContext, useContext } from 'react';

/**
 * What a {@link FormField} tells the control inside it. Internal: the public
 * surface is the FormField component and each control's own props.
 */
export type FormFieldContextValue = {
    /** Id for the control (the label's `htmlFor` points at it). */
    id: string;
    /** Id of the visible label (for group controls named by aria-labelledby). */
    labelId: string;
    /** Ids of the description and error message, when rendered. */
    describedBy: string | undefined;
    /** An error message is shown (or `invalid` was set on the field). */
    invalid: boolean;
    required: boolean;
    disabled: boolean;
};

export const FormFieldContext = createContext<FormFieldContextValue | null>(
    null
);

/** The enclosing FormField's wiring, or `null` outside a FormField. */
export function useFormField(): FormFieldContextValue | null {
    return useContext(FormFieldContext);
}

/** Props a control merges with its FormField (its own props win). */
export type FieldControlInput = {
    id?: string | undefined;
    'aria-describedby'?: string | undefined;
    invalid?: boolean | undefined;
    required?: boolean | undefined;
    disabled?: boolean | undefined;
};

/** Resolved wiring for a control element. */
export type FieldControl = {
    id: string | undefined;
    'aria-describedby': string | undefined;
    invalid: boolean;
    required: boolean;
    disabled: boolean;
};

/**
 * Merges a control's own props with its FormField: the control's `id`,
 * `invalid`, `required` and `disabled` win when set; `aria-describedby`
 * concatenates (the control's ids first).
 */
export function useFieldControl(props: FieldControlInput): FieldControl {
    const field = useFormField();
    const describedBy =
        [props['aria-describedby'], field?.describedBy]
            .filter(Boolean)
            .join(' ') || undefined;
    return {
        id: props.id ?? field?.id,
        'aria-describedby': describedBy,
        invalid: props.invalid ?? field?.invalid ?? false,
        required: props.required ?? field?.required ?? false,
        disabled: props.disabled ?? field?.disabled ?? false,
    };
}
