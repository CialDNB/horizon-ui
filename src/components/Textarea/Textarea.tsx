/*
 * Based on shadcn/ui Textarea (registry 2025). Native <textarea>. Replaces
 * x-core `TextArea` (MUI multiline TextField with a custom resize handle,
 * x-core 2.2.30); the label, helper text and error move to `FormField`.
 */
import { cva, type VariantProps } from 'class-variance-authority';
import {
    forwardRef,
    useCallback,
    useLayoutEffect,
    useRef,
    type InputEvent,
    type TextareaHTMLAttributes,
} from 'react';
import { cn } from '../../lib/cn';
import { omitLegacyProps, resolveOption } from '../../lib/options';
import {
    composeRefs,
    fieldBase,
    fieldState,
    fieldStateOf,
    useFieldControl,
} from '../../primitives';
import type { DnbBase } from '../../types/DnbBase';

// Every property a host `textarea` rule touches is set: Bootstrap reboot
// `textarea { overflow: auto; resize: vertical }`, `margin: 0`, font and
// line-height `inherit`.
const textareaStyles = cva(
    [
        fieldBase,
        'hz:m-0 hz:block hz:min-h-11 hz:appearance-none hz:border-0 hz:px-4 hz:py-3 hz:overflow-auto',
        // 16/20 at every breakpoint: multi-line text needs the leading
        // (body/secondary is 14/14) and 16px avoids zoom on iPad too.
        'hz:text-body-default hz:placeholder:text-muted-foreground hz:placeholder:opacity-100 hz:outline-none',
        // Forced colors: the focus ring (a shadow) is gone; outline instead.
        'hz:forced-colors:focus:outline-2 hz:forced-colors:focus:outline-offset-2 hz:forced-colors:focus:outline-solid hz:forced-colors:focus:outline-[Highlight]',
    ],
    {
        variants: {
            state: {
                rest: `${fieldState.rest} hz:focus:ring-2 hz:focus:ring-ring`,
                invalid: `${fieldState.invalid} hz:focus:ring-2`,
                disabled: fieldState.disabled,
                readOnly: `${fieldState.readOnly} hz:focus:ring-2 hz:focus:ring-ring`,
            },
            resize: {
                vertical: 'hz:resize-y',
                none: 'hz:resize-none',
            },
        },
        defaultVariants: { state: 'rest', resize: 'vertical' },
    }
);

/** Options accepted by {@link textareaVariants}: `state`, `resize`. */
export type TextareaVariantOptions = VariantProps<typeof textareaStyles>;

/** Resize handle of a {@link Textarea}. */
export type TextareaResize = NonNullable<TextareaVariantOptions['resize']>;

const resizeOptions: readonly TextareaResize[] = ['vertical', 'none'];

/** Class string for the Textarea look, conflict-resolved with `cn()`. */
export function textareaVariants(options?: TextareaVariantOptions): string {
    return cn(textareaStyles(options));
}

const legacyTextareaProps = {
    label: 'wrap in FormField label',
    helperText: 'use FormField description or error',
    error: 'use invalid, or FormField error',
    fullWidth: 'Textarea is full width by default',
    multiline: 'Textarea is always multi-line',
    minRows: 'use rows',
    maxRows: 'use autoResize with maxRows',
    InputProps: 'not supported',
    inputProps: 'pass the attributes to Textarea directly',
    InputLabelProps: 'use FormField',
    inputRef: 'use ref',
    sx: 'use className',
    variant: 'Textarea has one look',
    hideAdornment: 'not needed',
    leadingAdornment: 'not supported',
    isLabelContainer: 'use FormField',
    characterLimit: 'use maxLength',
    info: 'use FormField description',
} as const;

/** Props for {@link Textarea}. */
export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> &
    DnbBase & {
        /**
         * Invalid look and `aria-invalid`. Inside a `FormField` with an
         * `error` it is set for you.
         * @default false
         */
        invalid?: boolean;
        /**
         * Visible lines before scrolling (or the starting height with
         * `autoResize`).
         * @default 4
         */
        rows?: number;
        /**
         * `vertical` shows the native resize handle (x-core had a custom
         * one); `none` hides it.
         * @default 'vertical'
         */
        resize?: TextareaResize;
        /**
         * Grows with the content (no handle) up to `maxRows`, then scrolls.
         * The height changes instantly, never animated.
         * @default false
         */
        autoResize?: boolean;
        /** Line cap for `autoResize`. Unlimited when omitted. */
        maxRows?: number;
    };

/**
 * A multi-line text field: a native `<textarea>` with the Input look.
 * Name it with `FormField` (or `aria-label`).
 */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
    function Textarea(
        {
            invalid: invalidProp,
            rows = 4,
            resize: resizeProp,
            autoResize = false,
            maxRows,
            className,
            id: idProp,
            disabled: disabledProp,
            readOnly = false,
            required,
            value,
            onInput,
            'aria-describedby': describedByProp,
            ...props
        },
        ref
    ) {
        const rest = omitLegacyProps('Textarea', props, legacyTextareaProps);
        const resizeOption = resolveOption(
            'Textarea',
            'resize',
            resizeProp,
            resizeOptions,
            'vertical'
        );
        const resize = autoResize ? 'none' : resizeOption;
        const control = useFieldControl({
            id: idProp,
            'aria-describedby': describedByProp,
            invalid: invalidProp,
            required,
            disabled: disabledProp,
        });
        const innerRef = useRef<HTMLTextAreaElement>(null);

        const fit = useCallback(() => {
            const el = innerRef.current;
            if (!autoResize || !el) return;
            el.style.height = 'auto';
            const cs = getComputedStyle(el);
            const cap =
                maxRows === undefined
                    ? Infinity
                    : maxRows * parseFloat(cs.lineHeight) +
                      parseFloat(cs.paddingTop) +
                      parseFloat(cs.paddingBottom);
            const height = Math.min(el.scrollHeight, cap);
            el.style.height = `${height}px`;
            el.style.overflowY = el.scrollHeight > cap ? 'auto' : 'hidden';
        }, [autoResize, maxRows]);

        // Controlled value changes (and the first render) refit.
        useLayoutEffect(fit, [fit, value]);

        const handleInput = (event: InputEvent<HTMLTextAreaElement>) => {
            fit();
            onInput?.(event);
        };

        return (
            <textarea
                {...rest}
                ref={composeRefs(ref, innerRef)}
                rows={rows}
                id={control.id}
                value={value}
                onInput={handleInput}
                disabled={control.disabled}
                readOnly={readOnly}
                required={required}
                aria-required={control.required || undefined}
                aria-invalid={control.invalid || undefined}
                aria-describedby={control['aria-describedby']}
                data-resize={resize}
                className={cn(
                    textareaStyles({
                        state: fieldStateOf({
                            disabled: control.disabled,
                            readOnly,
                            invalid: control.invalid,
                        }),
                        resize,
                    }),
                    className
                )}
            />
        );
    }
);
Textarea.displayName = 'Textarea';
