import { createContext, useContext, useEffect, useLayoutEffect } from 'react';

const useIsomorphicLayoutEffect =
    typeof document === 'undefined' ? useEffect : useLayoutEffect;

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
    /**
     * A control with its own `id` publishes it here so the label's
     * `htmlFor` follows the real id (`undefined` on unmount).
     */
    registerId: (id: string | undefined) => void;
    /**
     * A choice control with its own visible label (Checkbox/Switch
     * `label`) says so here: the FormField label then becomes a caption
     * instead of a second `<label>` (the control would get two names).
     */
    registerOwnLabel: (ownLabel: boolean) => void;
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
    /** The control renders its own visible label. */
    ownLabel?: boolean | undefined;
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
 * concatenates (the control's ids first). A control's own `id` is
 * published to the FormField so its label follows it.
 */
export function useFieldControl(props: FieldControlInput): FieldControl {
    const field = useFormField();
    const registerId = field?.registerId;
    const registerOwnLabel = field?.registerOwnLabel;
    const ownLabel = props.ownLabel ?? false;
    useIsomorphicLayoutEffect(() => {
        if (!registerId || props.id === undefined) return;
        registerId(props.id);
        return () => registerId(undefined);
    }, [registerId, props.id]);
    useIsomorphicLayoutEffect(() => {
        if (!registerOwnLabel || !ownLabel) return;
        registerOwnLabel(true);
        return () => registerOwnLabel(false);
    }, [registerOwnLabel, ownLabel]);
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
