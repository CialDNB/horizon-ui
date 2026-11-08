/*
 * No shadcn base (shadcn has no tag input): a chip field built from the
 * Combobox field box, Chip and a native input. Replaces x-core
 * `EmailsFieldV2` (MUI Autocomplete freeSolo multiple with chips, x-core
 * 2.2.30); `EmailsField` (v1) is superseded. Not a combobox: there is no
 * list, so the input is a plain textbox (MUI's `role="combobox"` was wrong).
 */
import { WarningCircleIcon } from '@phosphor-icons/react/dist/csr/WarningCircle';
import { XIcon } from '@phosphor-icons/react/dist/csr/X';
import {
    forwardRef,
    useId,
    useRef,
    useState,
    type ClipboardEvent,
    type InputHTMLAttributes,
    type KeyboardEvent,
} from 'react';
import { normalizeEmailInput, validateEmail } from '../../lib/email';
import { cn } from '../../lib/cn';
import { omitLegacyProps, resolveOption } from '../../lib/options';
import {
    clearAction,
    composeRefs,
    fieldInputElement,
    fieldInputText,
    fieldStateOf,
    useFieldControl,
} from '../../primitives';
import type { DnbBase } from '../../types/DnbBase';
import { Chip } from '../Chip';
import { comboboxVariants, type ComboboxSize } from '../Combobox';
import { Spinner } from '../Spinner';

const sizes: readonly ComboboxSize[] = ['sm', 'md', 'lg'];

/** Keys that commit the typed address (x-core). */
const COMMIT_KEYS = new Set(['Enter', ',', ';', ' ']);

/** x-core EmailsField(V2) / MUI props that are dropped (dev warning). */
const legacyEmailsFieldProps = {
    onChange: 'use onValueChange(emails)',
    emailValidationFunc: 'use validate',
    AutocompleteProps: 'not supported',
    TextFieldProps: 'use FormField label and the field props',
    label: 'wrap in FormField label',
    labelContainer: 'wrap in FormField label',
    helperText: 'use FormField description or error',
    error: 'use invalid, or FormField error',
    info: 'use FormField description',
    isLoading: 'use loading',
    endAdornment: 'not supported',
    sx: 'use className',
} as const;

/** Props for {@link EmailsField}. */
export type EmailsFieldProps = Omit<
    InputHTMLAttributes<HTMLInputElement>,
    'value' | 'defaultValue' | 'onChange' | 'size' | 'type' | 'children'
> &
    DnbBase & {
        /** Added addresses (controlled). */
        value?: readonly string[];
        /** Initial addresses (uncontrolled). */
        defaultValue?: readonly string[];
        /** Called with the new list after an add, a paste, a removal or clearing. */
        onValueChange?: (emails: string[]) => void;
        /**
         * Accepts an address (x-core `emailValidationFunc`). The text is
         * normalized first ("Name <a@b.c>", invisible characters, case).
         * @default validateEmail (the x-core rule)
         */
        validate?: (email: string) => boolean;
        /** Most addresses allowed; a counter shows "n / limit". */
        limit?: number;
        /** Shown (and announced) when the typed text is not an address. @default 'Enter a valid email address' */
        invalidMessage?: string;
        /** Height and text size, as Input (the field grows with its chips). @default 'md' */
        size?: ComboboxSize;
        /** Invalid look and `aria-invalid` (set by a FormField `error`). */
        invalid?: boolean;
        /** Shows a clear-all button while addresses are present. @default false */
        clearable?: boolean;
        /** Accessible name of the clear-all button. @default 'Clear all' */
        clearLabel?: string;
        /** Status text after an added address (translate it). @default 'added' */
        addedAnnouncement?: string;
        /** Status text after a removed address (translate it). @default 'removed' */
        removedAnnouncement?: string;
        /** Spinner and `aria-busy`. @default false */
        loading?: boolean;
        /** Form field name: one hidden input per address. */
        name?: string;
        /** Classes for the field box. Other attributes go to the `<input>`. */
        className?: string;
    };

/**
 * Collects email addresses as removable Chips. Enter on an EMPTY input is
 * not swallowed, so the enclosing form (e.g. in a dialog) submits; x-core
 * always prevented it. Invalid parts of a pasted list stay in the input
 * with the error message instead of being dropped. Additions and removals
 * are announced in a polite status region.
 * Enter, comma, semicolon,
 * space and leaving the field add the typed address when it is valid;
 * pasting a list ("a@x.com, b@y.com; Name <c@z.com>") adds every valid one;
 * an invalid address stays in the input with an error message; Backspace
 * in the empty input removes the last chip; duplicates are ignored.
 */
export const EmailsField = forwardRef<HTMLInputElement, EmailsFieldProps>(
    function EmailsField(
        {
            value: valueProp,
            defaultValue,
            onValueChange,
            validate = validateEmail,
            limit,
            invalidMessage = 'Enter a valid email address',
            size: sizeProp,
            invalid: invalidProp,
            clearable = false,
            clearLabel = 'Clear all',
            loading = false,
            addedAnnouncement = 'added',
            removedAnnouncement = 'removed',
            name,
            form,
            className,
            id: idProp,
            disabled: disabledProp,
            required,
            placeholder,
            'aria-describedby': describedByProp,
            onKeyDown,
            onBlur,
            onPaste,
            ...props
        },
        ref
    ) {
        const rest = omitLegacyProps(
            'EmailsField',
            props,
            legacyEmailsFieldProps
        );
        const size = resolveOption(
            'EmailsField',
            'size',
            sizeProp,
            sizes,
            'md'
        );
        const autoId = useId();
        const messageId = `${autoId}-message`;
        const counterId = `${autoId}-counter`;
        const validLimit = limit !== undefined && limit > 0 ? limit : undefined;
        const [typedInvalid, setTypedInvalid] = useState(false);
        const control = useFieldControl({
            id: idProp,
            'aria-describedby':
                [
                    describedByProp,
                    typedInvalid ? messageId : undefined,
                    validLimit !== undefined ? counterId : undefined,
                ]
                    .filter(Boolean)
                    .join(' ') || undefined,
            invalid: invalidProp,
            required,
            disabled: disabledProp,
        });
        const inputRef = useRef<HTMLInputElement>(null);
        const [inner, setInner] = useState<string[]>(() => [
            ...(defaultValue ?? []),
        ]);
        const emails = valueProp !== undefined ? [...valueProp] : inner;
        const [text, setText] = useState('');
        // Additions and removals are spoken (chips change silently).
        const [announcement, setAnnouncement] = useState('');
        const full = validLimit !== undefined && emails.length >= validLimit;

        const commitList = (next: string[]) => {
            if (valueProp === undefined) setInner(next);
            onValueChange?.(next);
        };
        const accept = (raw: string): string | null => {
            const email = normalizeEmailInput(raw.trim());
            return email !== '' && validate(email) ? email : null;
        };
        /** Adds the typed text; returns false when it was not an address. */
        const addTyped = (): boolean => {
            if (text.trim() === '') return true;
            if (full) return true;
            const email = accept(text);
            if (email === null) {
                setTypedInvalid(true);
                return false;
            }
            if (!emails.includes(email)) {
                commitList([...emails, email]);
                setAnnouncement(`${email} ${addedAnnouncement}`);
            }
            setText('');
            setTypedInvalid(false);
            return true;
        };
        const remove = (email: string) => {
            setAnnouncement(`${email} ${removedAnnouncement}`);
            commitList(emails.filter((e) => e !== email));
            inputRef.current?.focus();
        };

        const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
            onKeyDown?.(event);
            if (event.defaultPrevented) return;
            if (COMMIT_KEYS.has(event.key)) {
                // Enter on an empty input submits the form as usual.
                if (event.key === 'Enter' && text.trim() === '') return;
                event.preventDefault();
                addTyped();
                return;
            }
            const last = emails[emails.length - 1];
            if (event.key === 'Backspace' && text === '' && last !== undefined)
                remove(last);
        };
        const handlePaste = (event: ClipboardEvent<HTMLInputElement>) => {
            onPaste?.(event);
            if (event.defaultPrevented) return;
            const pasted = event.clipboardData.getData('text/plain');
            // Entries split on , ; tabs and new lines; an entry with
            // "Name <address>" stays whole, others also split on spaces.
            const parts = pasted
                .split(/[,;\n\r\t]+/)
                .flatMap((entry) =>
                    entry.includes('<') ? [entry] : entry.split(/\s+/)
                )
                .map((part) => part.trim())
                .filter((part) => part !== '');
            const found = parts
                .map(accept)
                .filter((e): e is string => e !== null);
            // Nothing valid: let the text land in the input to be fixed.
            if (found.length === 0) return;
            event.preventDefault();
            // Invalid parts are not dropped silently: they stay in the input,
            // with the error message, to be fixed.
            const rejected = parts.filter((part) => accept(part) === null);
            setText(rejected.join(', '));
            setTypedInvalid(rejected.length > 0);
            const next = [...emails];
            for (const email of found) {
                if (validLimit !== undefined && next.length >= validLimit)
                    break;
                if (!next.includes(email)) next.push(email);
            }
            if (next.length > emails.length) {
                commitList(next);
                setAnnouncement(
                    `${next.length - emails.length} ${addedAnnouncement}`
                );
            }
        };

        const state = fieldStateOf({
            disabled: control.disabled,
            readOnly: false,
            invalid: control.invalid || typedInvalid,
        });
        const showClear = clearable && emails.length > 0 && !control.disabled;

        return (
            <div className="hz:flex hz:w-full hz:min-w-0 hz:flex-col hz:gap-1">
                <div
                    className={cn(comboboxVariants({ size, state }), className)}
                    data-emails-field=""
                    data-size={size}
                >
                    {emails.map((email) => (
                        <Chip
                            key={email}
                            label={email}
                            variant="primary"
                            disabled={control.disabled}
                            onDelete={() => remove(email)}
                            className="hz:max-w-full"
                        />
                    ))}
                    <input
                        {...rest}
                        ref={composeRefs(ref, inputRef)}
                        id={control.id}
                        type="text"
                        inputMode="email"
                        autoComplete="off"
                        enterKeyHint="enter"
                        disabled={control.disabled}
                        readOnly={full || undefined}
                        aria-invalid={
                            control.invalid || typedInvalid || undefined
                        }
                        aria-required={control.required || undefined}
                        aria-describedby={control['aria-describedby']}
                        aria-busy={loading || undefined}
                        placeholder={
                            emails.length > 0 ? undefined : placeholder
                        }
                        value={text}
                        onChange={(event) => {
                            setText(event.target.value);
                            if (typedInvalid) setTypedInvalid(false);
                        }}
                        onKeyDown={handleKeyDown}
                        onPaste={handlePaste}
                        onBlur={(event) => {
                            onBlur?.(event);
                            addTyped();
                        }}
                        className={cn(
                            fieldInputElement,
                            fieldInputText[size],
                            'hz:relative hz:z-1 hz:h-8 hz:min-w-30 hz:tablet:pointer-fine:h-6'
                        )}
                    />
                    <span className="hz:-my-1 hz:ms-auto hz:flex hz:shrink-0 hz:items-center">
                        {loading && (
                            <Spinner
                                aria-hidden="true"
                                size="sm"
                                tone="muted"
                                className="hz:mx-2"
                            />
                        )}
                        {showClear && (
                            <button
                                type="button"
                                aria-label={clearLabel}
                                className={cn(clearAction, 'hz:self-center')}
                                onClick={() => {
                                    commitList([]);
                                    inputRef.current?.focus();
                                }}
                            >
                                <XIcon aria-hidden="true" />
                            </button>
                        )}
                    </span>
                    <span
                        role="status"
                        className="hz:sr-only"
                        data-emails-status=""
                    >
                        {announcement}
                    </span>
                    {name !== undefined &&
                        emails.map((email) => (
                            <input
                                key={email}
                                type="hidden"
                                name={name}
                                value={email}
                                {...(form !== undefined && { form })}
                            />
                        ))}
                </div>
                {(typedInvalid || validLimit !== undefined) && (
                    <div className="hz:flex hz:items-start hz:justify-between hz:gap-2 hz:text-caption">
                        {typedInvalid ? (
                            <p
                                id={messageId}
                                role="alert"
                                className="hz:m-0 hz:flex hz:items-center hz:gap-1 hz:text-destructive-strong"
                                data-emails-message=""
                            >
                                <WarningCircleIcon
                                    aria-hidden="true"
                                    className="hz:size-4 hz:shrink-0"
                                />
                                {invalidMessage}
                            </p>
                        ) : (
                            <span />
                        )}
                        {validLimit !== undefined && (
                            <span
                                id={counterId}
                                className="hz:shrink-0 hz:text-muted-foreground"
                                data-emails-counter=""
                            >
                                {emails.length} / {validLimit}
                            </span>
                        )}
                    </div>
                )}
            </div>
        );
    }
);
EmailsField.displayName = 'EmailsField';
