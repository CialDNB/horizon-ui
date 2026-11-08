/*
 * No shadcn base used as-is: shadcn's Combobox is Popover + cmdk Command.
 * cmdk was measured and rejected (Task 11c report): it marks the
 * highlighted item `aria-selected`, which contradicts multi-select state,
 * keeps `aria-expanded` true while closed and adds 4.7 KB gz of its own.
 * This is a hand-rolled ARIA 1.2 editable combobox (list autocomplete)
 * positioned with Radix Popover (already a dependency). Replaces x-core
 * `Autocomplete` and `CountryAutoComplete` (MUI Autocomplete, x-core
 * 2.2.30) and the multi-select / search call sites of `SelectV2`/`Select`.
 */
import { CaretDownIcon } from '@phosphor-icons/react/dist/csr/CaretDown';
import { CheckIcon } from '@phosphor-icons/react/dist/csr/Check';
import { WarningCircleIcon } from '@phosphor-icons/react/dist/csr/WarningCircle';
import { XIcon } from '@phosphor-icons/react/dist/csr/X';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { cva, type VariantProps } from 'class-variance-authority';
import {
    forwardRef,
    useEffect,
    useId,
    useMemo,
    useRef,
    useState,
    type ChangeEvent,
    type InputHTMLAttributes,
    type KeyboardEvent,
    type ReactNode,
} from 'react';
import { cn } from '../../lib/cn';
import { omitLegacyProps, resolveOption, warnOnce } from '../../lib/options';
import {
    anchoredMotion,
    clearAction,
    composeRefs,
    containEscape,
    fieldBase,
    fieldInputElement,
    fieldInputText,
    fieldState,
    fieldStateOf,
    listItem,
    overlaySurface,
    useFieldControl,
    useFormField,
    useResolvedDir,
    type Direction,
} from '../../primitives';
import { usePortalContainer } from '../../provider';
import type { DnbBase } from '../../types/DnbBase';
import { Chip } from '../Chip';
import { Spinner } from '../Spinner';

const fieldStyles = cva(
    [
        fieldBase,
        'hz:flex hz:flex-wrap hz:items-center hz:gap-1 hz:py-1',
        'hz:forced-colors:has-[>input:focus]:outline-2 hz:forced-colors:has-[>input:focus]:outline-offset-2 hz:forced-colors:has-[>input:focus]:outline-solid hz:forced-colors:has-[>input:focus]:outline-[Highlight]',
    ],
    {
        variants: {
            // As Input: 44px with 16px text at mobile and on touch pointers;
            // sm 32, md 40, lg 48 from tablet with a fine pointer. A
            // multi-select grows with its chips (min-height).
            size: {
                sm: 'hz:min-h-11 hz:ps-3 hz:pe-1 hz:tablet:pointer-fine:min-h-8',
                md: 'hz:min-h-11 hz:ps-4 hz:pe-1 hz:tablet:pointer-fine:min-h-10',
                lg: 'hz:min-h-12 hz:ps-4 hz:pe-1',
            },
            state: {
                rest: `${fieldState.rest} hz:has-[>input:focus]:ring-2 hz:has-[>input:focus]:ring-ring`,
                invalid: `${fieldState.invalid} hz:has-[>input:focus]:ring-2`,
                disabled: fieldState.disabled,
                readOnly: fieldState.readOnly,
            },
        },
        defaultVariants: { size: 'md', state: 'rest' },
    }
);

/** Options accepted by {@link comboboxVariants}: `size`, `state`. */
export type ComboboxVariantOptions = VariantProps<typeof fieldStyles>;

/** Size of a {@link Combobox}. */
export type ComboboxSize = NonNullable<ComboboxVariantOptions['size']>;

const comboboxSizes: readonly ComboboxSize[] = ['sm', 'md', 'lg'];

/** Class string for the Combobox field box, conflict-resolved with `cn()`. */
export function comboboxVariants(options?: ComboboxVariantOptions): string {
    return cn(fieldStyles(options));
}

// Width follows the field; height at most 320px or the space left.
const contentStyles = cn(
    'hz:relative hz:z-dropdown hz:flex hz:w-(--radix-popover-trigger-width) hz:min-w-48 hz:max-w-[calc(100vw-16px)] hz:max-h-[min(320px,var(--radix-popover-content-available-height))] hz:flex-col hz:overflow-hidden hz:rounded-sm',
    overlaySurface,
    'hz:origin-(--radix-popover-content-transform-origin)',
    anchoredMotion
);

// Shared list row (src/primitives/listItem.ts).
const optionStyles = cn(listItem({ disabledBy: 'aria' }), 'hz:px-3');

const messageStyles =
    'hz:flex hz:min-h-11 hz:items-center hz:gap-2 hz:px-3 hz:text-body-default hz:text-muted-foreground hz:tablet:pointer-fine:min-h-9 hz:tablet:pointer-fine:text-body-secondary';

// Start-aligned 16px box for multi-select rows (decorative).
const checkBox =
    'hz:inline-flex hz:size-4 hz:shrink-0 hz:items-center hz:justify-center hz:rounded-xs hz:ring-1 hz:ring-inset hz:ring-control-border hz:group-data-[highlighted]:ring-accent-foreground hz:forced-colors:border hz:forced-colors:border-solid hz:forced-colors:border-[CanvasText] hz:[&>svg]:size-3';

const endAction = cn(clearAction, 'hz:self-center');

/** One choice of a {@link Combobox}. */
export type ComboboxOption = {
    /** The value reported by `onValueChange` (unique, non-empty). */
    value: string;
    /** Visible text, matched by the default filter. */
    label: string;
    /** Group heading; consecutive options with the same group are grouped (sort them). */
    group?: string;
    /** Shown but not selectable. */
    disabled?: boolean;
    /** Secondary line under the label. */
    description?: string;
};

/** Why the text changed (MUI `onInputChange` reasons). */
export type ComboboxInputReason = 'input' | 'reset' | 'clear';

/** x-core Autocomplete / MUI props that are dropped (dev warning). */
const legacyComboboxProps = {
    onChange: 'use onValueChange(value)',
    getOptionLabel: 'map your items to { value, label } options',
    isOptionEqualToValue: 'values are option value strings',
    getOptionDisabled: 'use option.disabled',
    renderInput: 'the field is built in; wrap it in FormField for a label',
    renderOption: 'use optionContent(option, state) (row content only)',
    renderTags: 'selected values render as Chips',
    groupBy: 'use option.group',
    freeSolo: 'use allowCustomValue',
    filterOptions: 'use filter',
    filterOptionsLimit: 'use limit',
    noOptionsText: 'use emptyMessage',
    loadingText: 'use loadingMessage',
    disablePortal: 'not needed: the list portals into the HorizonProvider root',
    disableClearable:
        'use clearable={false} (the clear button is on by default)',
    disableCloseOnSelect: 'multiple keeps the list open by itself',
    popupIcon: 'not supported',
    clearIcon: 'not supported',
    ListboxProps: 'not supported',
    PaperProps: 'not supported',
    componentsProps: 'not supported',
    slotProps: 'not supported',
    ChipProps: 'not supported',
    limitTags: 'not supported',
    autoHighlight: 'the first match is highlighted while typing',
    openOnFocus: 'not supported',
    clearOnBlur: 'built in (unless allowCustomValue)',
    selectOnFocus: 'not supported',
    handleHomeEndKeys: 'Home/End move the caret',
    includeInputInList: 'not supported',
    fullWidth: 'Combobox is full width by default',
    label: 'wrap in FormField label',
    helperText: 'use FormField description or error',
    error: 'use invalid, or FormField error',
    sx: 'use className',
} as const;

type ComboboxBaseProps = Omit<
    InputHTMLAttributes<HTMLInputElement>,
    | 'value'
    | 'defaultValue'
    | 'onChange'
    | 'size'
    | 'multiple'
    | 'children'
    | 'dir'
    | 'type'
> &
    DnbBase & {
        /** The choices (shown in this order; sort grouped options by group). */
        options: readonly ComboboxOption[];
        /** Text in the input (controlled). */
        inputValue?: string;
        /** Initial text (uncontrolled). */
        defaultInputValue?: string;
        /**
         * Called when the text changes: `input` (typing), `reset` (the text
         * follows a selection) or `clear` (MUI `onInputChange`). Use it to
         * fetch options asynchronously, with `filter={false}`.
         */
        onInputChange?: (text: string, reason: ComboboxInputReason) => void;
        /**
         * Which options match the typed text. Default: case- and
         * accent-insensitive "label contains text". `false` shows `options`
         * as given (server-side search).
         */
        filter?: ((option: ComboboxOption, text: string) => boolean) | false;
        /**
         * Custom row content (x-core/MUI `renderOption` rich rows). It
         * replaces the label and description inside the row; the row itself
         * (`role="option"`, `aria-selected`, id, check, click and keyboard)
         * stays Combobox's. Content must be non-interactive (no buttons or
         * links: the option is the interactive element) and its text should
         * start with the label, which is also the row's accessible name
         * source. Different name and signature than MUI's
         * `renderOption(props, option)` on purpose: those call sites must be
         * rewritten, not passed through.
         */
        optionContent?: (
            option: ComboboxOption,
            state: {
                selected: boolean;
                highlighted: boolean;
                inputValue: string;
            }
        ) => ReactNode;
        /** Most options rendered at once (x-core `filterOptionsLimit`). @default 100 */
        limit?: number;
        /**
         * Accept typed text that is not an option (MUI `freeSolo`): Enter
         * commits it; the text is kept on blur.
         * @default false
         */
        allowCustomValue?: boolean;
        /**
         * Options are being fetched: spinner in the field, `aria-busy`, and
         * `loadingMessage` in the list (announced politely).
         * @default false
         */
        loading?: boolean;
        /** Shown and announced while loading with no options. @default 'Loading…' */
        loadingMessage?: string;
        /** Shown and announced when nothing matches. @default 'No options' */
        emptyMessage?: string;
        /**
         * Height and text size, as Input: 44px (lg 48px) with 16px text at
         * mobile and on touch pointers; sm 32, md 40, lg 48 from tablet with
         * a fine pointer.
         * @default 'md'
         */
        size?: ComboboxSize;
        /** Invalid look and `aria-invalid` (set by a FormField `error`). */
        invalid?: boolean;
        /**
         * Shows a clear button while something is selected or typed, on by
         * default as MUI's (`disableClearable` -> `clearable={false}`). Like
         * MUI's it is not a Tab stop (`tabIndex=-1`, pointer only); from the
         * keyboard, Escape on a closed list clears (see the component docs).
         * @default true
         */
        clearable?: boolean;
        /** Status text after a picked label (translate it). @default 'selected' */
        selectedAnnouncement?: string;
        /** Status text after a removed label (translate it). @default 'removed' */
        removedAnnouncement?: string;
        /**
         * Validation message when `required` and `multiple` with nothing
         * selected: the input blocks form submission (`setCustomValidity`).
         * @default 'Select at least one option'
         */
        requiredMessage?: string;
        /** Accessible name of the clear button. @default 'Clear' */
        clearLabel?: string;
        /** Accessible name of the list toggle button. @default 'Show options' */
        toggleLabel?: string;
        /** Controlled open state of the list. */
        open?: boolean;
        /** Initial open state. */
        defaultOpen?: boolean;
        /** Called when the list opens or closes. */
        onOpenChange?: (open: boolean) => void;
        /** Direction; read from the DOM when omitted. */
        dir?: Direction;
        /** Form field name: one hidden input per selected value submits it. */
        name?: string;
        /** Classes for the field box. Other attributes go to the `<input>`. */
        className?: string;
    };

/** Single selection (default). */
export type ComboboxSingleProps = ComboboxBaseProps & {
    /** Single selection. @default false */
    multiple?: false;
    /** Selected value (controlled); `null` = nothing. */
    value?: string | null;
    /** Initial value (uncontrolled). */
    defaultValue?: string | null;
    /** Called with the new value (`null` after clearing). */
    onValueChange?: (value: string | null) => void;
};

/** Multiple selection: values render as removable Chips. */
export type ComboboxMultipleProps = ComboboxBaseProps & {
    /** Multiple selection; the list stays open while picking. */
    multiple: true;
    /** Selected values (controlled). */
    value?: readonly string[];
    /** Initial values (uncontrolled). */
    defaultValue?: readonly string[];
    /** Called with the new values. */
    onValueChange?: (value: string[]) => void;
};

/** Props for {@link Combobox}. */
export type ComboboxProps = ComboboxSingleProps | ComboboxMultipleProps;

const fold = (s: string) =>
    s
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .toLowerCase();

/** MUI's default: case- and accent-insensitive "contains". */
function defaultFilter(option: ComboboxOption, text: string): boolean {
    return fold(option.label).includes(fold(text.trim()));
}

function toList(value: unknown): string[] {
    if (value === null || value === undefined) return [];
    const list = Array.isArray(value) ? value : [value];
    if (list.some((v) => typeof v !== 'string'))
        warnOnce(
            'Combobox: value must be option value strings (x-core passed option objects); non-strings were ignored.'
        );
    return list.filter((v): v is string => typeof v === 'string');
}

/**
 * A text field with a list of suggestions (ARIA 1.2 combobox, list
 * autocomplete): typing filters, arrow keys move the highlight
 * (`aria-activedescendant`), Enter picks, Escape closes. Single or
 * `multiple` selection (removable Chips; Backspace removes the last),
 * optional custom values, async loading and empty states announced
 * politely. The list portals into the HorizonProvider root
 * (`--z-dropdown`). Name it with `FormField` or `aria-label`.
 *
 * Keyboard clearing: Escape on an open list closes it and restores the
 * label; Escape again (list closed) clears the text, and for a single
 * Combobox the value (APG; MUI's `clearOnEscape`). Backspace in an empty
 * multi-select removes the last chip. The clear button is pointer-only.
 * Tab closes the list without picking. Not implemented (deferred): Page
 * Up/Page Down jumps in the list. Home/End move the caret in the input.
 */
export const Combobox = forwardRef<HTMLInputElement, ComboboxProps>(
    function Combobox(props, ref) {
        const {
            options,
            inputValue: inputValueProp,
            defaultInputValue,
            onInputChange,
            filter = defaultFilter,
            optionContent,
            limit = 100,
            allowCustomValue = false,
            loading = false,
            loadingMessage = 'Loading…',
            emptyMessage = 'No options',
            size: sizeProp,
            invalid: invalidProp,
            clearable = true,
            selectedAnnouncement: selectedText_ = 'selected',
            removedAnnouncement: removedText = 'removed',
            requiredMessage = 'Select at least one option',
            clearLabel = 'Clear',
            toggleLabel = 'Show options',
            open: openProp,
            defaultOpen = false,
            onOpenChange,
            dir,
            name,
            form,
            className,
            id: idProp,
            disabled: disabledProp,
            required,
            placeholder,
            'aria-describedby': describedByProp,
            'aria-label': ariaLabel,
            'aria-labelledby': ariaLabelledBy,
            onKeyDown,
            onBlur,
            onClick,
            multiple: multipleProp,
            value: valueProp,
            defaultValue,
            onValueChange,
            ...restProps
        } = props;
        const rest = omitLegacyProps(
            'Combobox',
            restProps,
            legacyComboboxProps
        );
        const multiple = multipleProp === true;
        const size = resolveOption(
            'Combobox',
            'size',
            sizeProp,
            comboboxSizes,
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
        const autoId = useId();
        const inputId = control.id ?? `${autoId}-input`;
        const listboxId = `${autoId}-listbox`;
        const statusId = `${autoId}-status`;
        const fieldRef = useRef<HTMLDivElement>(null);
        const inputRef = useRef<HTMLInputElement>(null);
        const listRef = useRef<HTMLDivElement>(null);
        const direction = useResolvedDir(fieldRef, dir);
        const container = usePortalContainer();

        const byValue = useMemo(
            () => new Map(options.map((o) => [o.value, o])),
            [options]
        );
        const labelOf = (v: string) => byValue.get(v)?.label ?? v;

        // Selection (both modes as a list).
        const [innerValue, setInnerValue] = useState<string[]>(() =>
            toList(defaultValue)
        );
        const selected =
            valueProp !== undefined ? toList(valueProp) : innerValue;
        const commitValue = (next: string[]) => {
            if (valueProp === undefined) setInnerValue(next);
            if (multiple)
                (onValueChange as ComboboxMultipleProps['onValueChange'])?.(
                    next
                );
            else
                (onValueChange as ComboboxSingleProps['onValueChange'])?.(
                    next[0] ?? null
                );
        };

        // Text.
        const selectedText = multiple
            ? ''
            : selected[0] !== undefined
              ? labelOf(selected[0])
              : '';
        const [innerText, setInnerText] = useState(
            () => defaultInputValue ?? selectedText
        );
        const text = inputValueProp ?? innerText;
        const setText = (next: string, reason: ComboboxInputReason) => {
            if (inputValueProp === undefined) setInnerText(next);
            if (next !== text || reason !== 'reset')
                onInputChange?.(next, reason);
        };
        // A pristine text (unchanged since a selection or open) does not filter.
        const [pristine, setPristine] = useState(true);
        // A controlled value changed from outside: show its label.
        const lastSelectedText = useRef(selectedText);
        useEffect(() => {
            if (multiple || lastSelectedText.current === selectedText) return;
            lastSelectedText.current = selectedText;
            if (inputValueProp === undefined) setInnerText(selectedText);
            setPristine(true);
        }, [multiple, selectedText, inputValueProp]);

        // Open state.
        const [innerOpen, setInnerOpen] = useState(defaultOpen);
        const open = (openProp ?? innerOpen) && !control.disabled;
        const setOpen = (next: boolean) => {
            if (next === open) return;
            if (openProp === undefined) setInnerOpen(next);
            onOpenChange?.(next);
            if (!next) setHighlighted(-1);
        };

        const visible = useMemo(() => {
            const query = pristine ? '' : text;
            const matches =
                filter === false || query.trim() === ''
                    ? options
                    : options.filter((o) => filter(o, query));
            return matches.slice(0, Math.max(0, limit));
        }, [options, filter, pristine, text, limit]);
        const [highlighted, setHighlighted] = useState(-1);
        const active =
            open && highlighted >= 0 && highlighted < visible.length
                ? highlighted
                : -1;
        const optionId = (i: number) => `${listboxId}-${i}`;

        const enabledIndex = (from: number, step: 1 | -1) => {
            const n = visible.length;
            for (let k = 1; k <= n; k++) {
                const i = (((from + step * k) % n) + n) % n;
                if (!visible[i]?.disabled) return i;
            }
            return -1;
        };
        const firstSelectedIndex = () =>
            visible.findIndex((o) => selected.includes(o.value) && !o.disabled);

        // Keep the keyboard highlight in view.
        const keyboardMove = useRef(false);
        useEffect(() => {
            if (!keyboardMove.current || active < 0) return;
            keyboardMove.current = false;
            document
                .getElementById(optionId(active))
                ?.scrollIntoView?.({ block: 'nearest' });
        });

        // Picks and removals are spoken through the status region (the
        // input value alone changes silently for many screen readers).
        const [announcement, setAnnouncement] = useState('');
        const pick = (option: ComboboxOption) => {
            if (option.disabled) return;
            if (multiple) {
                const had = selected.includes(option.value);
                const next = had
                    ? selected.filter((v) => v !== option.value)
                    : [...selected, option.value];
                commitValue(next);
                setAnnouncement(
                    `${option.label} ${had ? removedText : selectedText_}`
                );
                if (text !== '') setText('', 'reset');
                setPristine(true);
                return;
            }
            commitValue([option.value]);
            setAnnouncement(`${option.label} ${selectedText_}`);
            lastSelectedText.current = option.label;
            setText(option.label, 'reset');
            setPristine(true);
            setOpen(false);
        };
        const pickCustom = () => {
            const custom = text.trim();
            if (custom === '') return false;
            if (multiple) {
                if (!selected.includes(custom))
                    commitValue([...selected, custom]);
                setText('', 'reset');
            } else {
                commitValue([custom]);
                lastSelectedText.current = custom;
            }
            setPristine(true);
            return true;
        };
        const removeValue = (v: string) => {
            commitValue(selected.filter((s) => s !== v));
            setAnnouncement(`${labelOf(v)} ${removedText}`);
            inputRef.current?.focus();
        };
        const clear = () => {
            commitValue([]);
            lastSelectedText.current = '';
            setText('', 'clear');
            setPristine(true);
            inputRef.current?.focus();
        };

        const openWith = (index: number) => {
            setOpen(true);
            keyboardMove.current = true;
            setHighlighted(index);
        };

        const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
            onKeyDown?.(event);
            if (event.defaultPrevented) return;
            switch (event.key) {
                case 'ArrowDown': {
                    event.preventDefault();
                    if (event.altKey) return setOpen(true);
                    if (!open) {
                        const sel = firstSelectedIndex();
                        return openWith(sel >= 0 ? sel : enabledIndex(-1, 1));
                    }
                    keyboardMove.current = true;
                    return setHighlighted(enabledIndex(active, 1));
                }
                case 'ArrowUp': {
                    event.preventDefault();
                    if (event.altKey) return setOpen(false);
                    if (!open)
                        return openWith(enabledIndex(visible.length, -1));
                    keyboardMove.current = true;
                    return setHighlighted(
                        enabledIndex(active < 0 ? visible.length : active, -1)
                    );
                }
                case 'Enter': {
                    const option = active >= 0 ? visible[active] : undefined;
                    if (option) {
                        event.preventDefault();
                        pick(option);
                    } else if (allowCustomValue && pickCustom()) {
                        event.preventDefault();
                        if (!multiple) setOpen(false);
                    }
                    return;
                }
                case 'Tab': {
                    // ARIA 1.2: Tab closes the popup and moves on. It does
                    // not accept the highlighted option (as Enter does):
                    // this combobox picks only on Enter or click (MUI
                    // `autoSelect` off).
                    if (open) setOpen(false);
                    return;
                }
                case 'Escape': {
                    // Reached only while the list is closed (an open list's
                    // Escape is handled by its layer and contained). APG:
                    // Escape on a closed popup clears the textbox. Single:
                    // text and value; multiple: the typed text (chips go
                    // with Backspace). Nothing to clear: let it bubble (an
                    // enclosing dialog may close).
                    const hasSingle = !multiple && selected.length > 0;
                    if (text === '' && !hasSingle) return;
                    event.preventDefault();
                    event.stopPropagation();
                    if (multiple) {
                        setText('', 'clear');
                        setPristine(true);
                    } else clear();
                    return;
                }
                case 'Backspace': {
                    const last = selected[selected.length - 1];
                    if (multiple && text === '' && last !== undefined)
                        removeValue(last);
                    return;
                }
                default:
                    return;
            }
        };

        const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
            const next = event.target.value;
            setText(next, 'input');
            setAnnouncement('');
            setPristine(false);
            setOpen(true);
            // Highlight the first match (list autocomplete with automatic
            // selection), unless free text is allowed.
            setHighlighted(allowCustomValue || next.trim() === '' ? -1 : 0);
        };

        const resetText = () => {
            if (allowCustomValue) return;
            if (multiple) {
                if (text !== '') setText('', 'reset');
            } else if (text !== selectedText) setText(selectedText, 'reset');
            setPristine(true);
        };

        // Focus leaving the whole field (input, chips, clear button) closes
        // the list and restores the label. A native listener: the field box
        // is not itself interactive.
        const leaveField = useRef(() => {});
        leaveField.current = () => {
            setOpen(false);
            resetText();
        };
        useEffect(() => {
            const field = fieldRef.current;
            if (!field) return;
            const onFocusOut = (event: FocusEvent) => {
                if (!field.contains(event.relatedTarget as Node | null))
                    leaveField.current();
            };
            field.addEventListener('focusout', onFocusOut);
            return () => field.removeEventListener('focusout', onFocusOut);
        }, []);

        // Keep the first-match highlight valid after filtering.
        useEffect(() => {
            if (highlighted >= 0 && visible[highlighted]?.disabled)
                setHighlighted(enabledIndex(highlighted - 1, 1));
        }, [visible]);

        // `required` on a multi-select: the visible input is empty even with
        // chips, so native `required` cannot work; validity follows the values.
        const missing = multiple && control.required && selected.length === 0;
        useEffect(() => {
            inputRef.current?.setCustomValidity(missing ? requiredMessage : '');
        }, [missing, requiredMessage]);

        const empty = visible.length === 0;
        const showList = open && !empty;
        const message = !open
            ? ''
            : loading && empty
              ? loadingMessage
              : empty
                ? emptyMessage
                : '';
        const status = message || announcement;
        const showClear =
            clearable &&
            !control.disabled &&
            (selected.length > 0 || text !== '');
        const state = fieldStateOf({
            disabled: control.disabled,
            readOnly: false,
            invalid: control.invalid,
        });
        const listName = field
            ? { 'aria-labelledby': field.labelId }
            : ariaLabelledBy !== undefined
              ? { 'aria-labelledby': ariaLabelledBy }
              : ariaLabel !== undefined
                ? { 'aria-label': ariaLabel }
                : {};

        // Consecutive options sharing a group render inside one role=group.
        const rows: ReactNode[] = [];
        let groupRows: ReactNode[] = [];
        let groupName: string | undefined;
        const flush = () => {
            if (groupName === undefined) rows.push(...groupRows);
            else {
                const headingId = `${listboxId}-g${rows.length}`;
                rows.push(
                    <div
                        key={headingId}
                        role="group"
                        aria-labelledby={headingId}
                    >
                        <div
                            id={headingId}
                            role="presentation"
                            className="hz:px-3 hz:pt-2 hz:pb-1 hz:text-label-sm hz:text-muted-foreground"
                        >
                            {groupName}
                        </div>
                        {groupRows}
                    </div>
                );
            }
            groupRows = [];
        };
        visible.forEach((option, i) => {
            if (option.group !== groupName) {
                flush();
                groupName = option.group;
            }
            const isSelected = selected.includes(option.value);
            groupRows.push(
                // Keyboard lives on the input (aria-activedescendant): options
                // never take focus, so they have no key handlers of their own.
                // eslint-disable-next-line jsx-a11y/click-events-have-key-events
                <div
                    key={option.value}
                    tabIndex={-1}
                    id={optionId(i)}
                    role="option"
                    aria-selected={isSelected}
                    aria-disabled={option.disabled || undefined}
                    data-highlighted={i === active ? '' : undefined}
                    title={option.label}
                    className={optionStyles}
                    onMouseDown={(e) => e.preventDefault()}
                    onPointerMove={() => {
                        if (!option.disabled && i !== active) setHighlighted(i);
                    }}
                    onClick={() => pick(option)}
                >
                    {multiple && (
                        <span
                            aria-hidden="true"
                            className={cn(
                                checkBox,
                                isSelected &&
                                    'hz:bg-primary hz:text-primary-foreground hz:ring-primary hz:group-data-[highlighted]:ring-primary'
                            )}
                        >
                            {isSelected && <CheckIcon weight="bold" />}
                        </span>
                    )}
                    <span className="hz:flex hz:min-w-0 hz:flex-1 hz:flex-col">
                        {optionContent ? (
                            optionContent(option, {
                                selected: isSelected,
                                highlighted: i === active,
                                inputValue: text,
                            })
                        ) : (
                            <>
                                <span className="hz:truncate">
                                    {option.label}
                                </span>
                                {option.description && (
                                    <span className="hz:truncate hz:text-caption hz:text-muted-foreground hz:group-data-[highlighted]:text-accent-foreground">
                                        {option.description}
                                    </span>
                                )}
                            </>
                        )}
                    </span>
                    {!multiple && isSelected && (
                        <CheckIcon
                            aria-hidden="true"
                            weight="bold"
                            className="hz:size-4 hz:shrink-0 hz:text-primary"
                        />
                    )}
                </div>
            );
        });
        flush();

        return (
            <PopoverPrimitive.Root
                open={open && (showList || message !== '')}
                onOpenChange={(next) => {
                    if (!next) {
                        setOpen(false);
                        resetText();
                    }
                }}
            >
                <PopoverPrimitive.Anchor asChild>
                    <div
                        ref={fieldRef}
                        className={cn(fieldStyles({ size, state }), className)}
                        data-combobox-field=""
                        data-size={size}
                        data-invalid={control.invalid || undefined}
                        data-disabled={control.disabled || undefined}
                    >
                        {multiple &&
                            selected.map((v) => (
                                <Chip
                                    key={v}
                                    label={labelOf(v)}
                                    variant="neutral"
                                    disabled={control.disabled}
                                    onDelete={() => removeValue(v)}
                                    className="hz:max-w-full"
                                />
                            ))}
                        <input
                            {...rest}
                            ref={composeRefs(ref, inputRef)}
                            id={inputId}
                            type="text"
                            role="combobox"
                            autoComplete="off"
                            aria-autocomplete="list"
                            aria-expanded={showList}
                            aria-controls={showList ? listboxId : undefined}
                            aria-activedescendant={
                                active >= 0 ? optionId(active) : undefined
                            }
                            aria-label={ariaLabel}
                            aria-labelledby={ariaLabelledBy}
                            aria-describedby={control['aria-describedby']}
                            aria-invalid={control.invalid || undefined}
                            aria-required={control.required || undefined}
                            aria-busy={loading || undefined}
                            required={multiple ? undefined : required}
                            disabled={control.disabled}
                            placeholder={
                                multiple && selected.length > 0
                                    ? undefined
                                    : placeholder
                            }
                            value={text}
                            onChange={handleChange}
                            onKeyDown={handleKeyDown}
                            onClick={(event) => {
                                onClick?.(event);
                                if (!open) setOpen(true);
                            }}
                            onBlur={onBlur}
                            className={cn(
                                fieldInputElement,
                                fieldInputText[size],
                                'hz:relative hz:z-1 hz:h-8 hz:min-w-16 hz:tablet:pointer-fine:h-6'
                            )}
                        />
                        <span className="hz:-my-1 hz:ms-auto hz:flex hz:shrink-0 hz:items-center">
                            {loading && (
                                <Spinner
                                    aria-hidden="true"
                                    size="sm"
                                    tone="muted"
                                    data-combobox-loading=""
                                    className="hz:mx-2"
                                />
                            )}
                            {control.invalid && !loading && (
                                <WarningCircleIcon
                                    aria-hidden="true"
                                    className="hz:mx-1 hz:size-4 hz:shrink-0 hz:text-destructive-strong"
                                />
                            )}
                            {showClear && (
                                <button
                                    type="button"
                                    tabIndex={-1}
                                    aria-label={clearLabel}
                                    className={endAction}
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={clear}
                                >
                                    <XIcon aria-hidden="true" />
                                </button>
                            )}
                            <button
                                type="button"
                                tabIndex={-1}
                                aria-label={toggleLabel}
                                aria-controls={showList ? listboxId : undefined}
                                aria-expanded={showList}
                                disabled={control.disabled}
                                data-combobox-toggle=""
                                className={cn(
                                    endAction,
                                    'hz:disabled:cursor-not-allowed hz:[&>svg]:transition-transform hz:[&>svg]:duration-fast',
                                    open && 'hz:[&>svg]:rotate-180'
                                )}
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => {
                                    inputRef.current?.focus();
                                    if (open) setOpen(false);
                                    else {
                                        setPristine(true);
                                        setOpen(true);
                                    }
                                }}
                            >
                                <CaretDownIcon aria-hidden="true" />
                            </button>
                        </span>
                        <span
                            id={statusId}
                            role="status"
                            className="hz:sr-only"
                            data-combobox-status=""
                        >
                            {status}
                        </span>
                        {name !== undefined &&
                            selected.map((v) => (
                                <input
                                    key={v}
                                    type="hidden"
                                    name={name}
                                    value={v}
                                    {...(form !== undefined && { form })}
                                />
                            ))}
                    </div>
                </PopoverPrimitive.Anchor>
                {container && (
                    <PopoverPrimitive.Portal container={container}>
                        <PopoverPrimitive.Content
                            role="presentation"
                            side="bottom"
                            align="start"
                            sideOffset={4}
                            collisionPadding={8}
                            dir={direction}
                            className={contentStyles}
                            data-combobox-content=""
                            onOpenAutoFocus={(e) => e.preventDefault()}
                            onCloseAutoFocus={(e) => e.preventDefault()}
                            onInteractOutside={(e) => {
                                if (
                                    fieldRef.current?.contains(
                                        e.target as Node | null
                                    )
                                )
                                    e.preventDefault();
                            }}
                            onEscapeKeyDown={containEscape(() => resetText())}
                        >
                            {showList ? (
                                <div
                                    ref={listRef}
                                    id={listboxId}
                                    role="listbox"
                                    aria-multiselectable={multiple || undefined}
                                    aria-busy={loading || undefined}
                                    {...listName}
                                    className="hz:min-h-0 hz:flex-1 hz:overflow-y-auto hz:p-1"
                                >
                                    {rows}
                                </div>
                            ) : (
                                <div
                                    aria-hidden="true"
                                    className={messageStyles}
                                    data-combobox-message=""
                                >
                                    {loading && (
                                        <Spinner
                                            aria-hidden="true"
                                            size="sm"
                                            tone="muted"
                                        />
                                    )}
                                    {message}
                                </div>
                            )}
                        </PopoverPrimitive.Content>
                    </PopoverPrimitive.Portal>
                )}
            </PopoverPrimitive.Root>
        );
    }
);
Combobox.displayName = 'Combobox';
