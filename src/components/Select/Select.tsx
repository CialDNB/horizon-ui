/*
 * Based on shadcn/ui Select (registry 2025) on Radix Select, simplified to
 * one component with item children (Select + SelectItem/SelectGroup/
 * SelectSeparator) plus clearable and empty state. Replaces x-core
 * `SelectV2` (MUI Select with an `options` array, x-core 2.2.30) for single
 * selection; `Select` (v1) is superseded. Multiple selection and the search
 * field are not here: they need a Combobox (Popover + listbox, Task 11b).
 */
import { CaretDownIcon } from '@phosphor-icons/react/dist/csr/CaretDown';
import { CaretUpIcon } from '@phosphor-icons/react/dist/csr/CaretUp';
import { CheckIcon } from '@phosphor-icons/react/dist/csr/Check';
import { XIcon } from '@phosphor-icons/react/dist/csr/X';
import * as SelectPrimitive from '@radix-ui/react-select';
import { cva, type VariantProps } from 'class-variance-authority';
import {
    Children,
    forwardRef,
    useRef,
    useState,
    type ButtonHTMLAttributes,
    type ComponentPropsWithoutRef,
    type ReactNode,
} from 'react';
import { cn } from '../../lib/cn';
import { omitLegacyProps, resolveOption } from '../../lib/options';
import {
    composeRefs,
    fieldBase,
    fieldState,
    fieldStateOf,
    useFieldControl,
    useResolvedDir,
    type Direction,
} from '../../primitives';
import { usePortalContainer } from '../../provider';
import type { DnbBase } from '../../types/DnbBase';

// The trigger is a button styled as Input's field box (same sizes and
// states). Everything Bootstrap's `button` rules (incl. the `button:focus`
// outline width and colour) and customer360's `button + button` /
// `button:focus` touch is restated.
const triggerStyles = cva(
    [
        fieldBase,
        'hz:m-0 hz:flex hz:cursor-pointer hz:items-center hz:justify-between hz:gap-2 hz:border-0 hz:text-start hz:normal-case',
        'hz:focus:outline-none hz:focus:outline-2 hz:focus:outline-ring hz:focus-visible:ring-2 hz:data-[state=open]:ring-2',
        'hz:data-[placeholder]:text-muted-foreground',
        'hz:[&>svg]:size-4 hz:[&>svg]:shrink-0 hz:[&>svg]:align-middle hz:[&>svg]:text-muted-foreground hz:[&>svg]:transition-transform hz:[&>svg]:duration-fast hz:data-[state=open]:[&>svg]:rotate-180',
    ],
    {
        variants: {
            size: {
                sm: 'hz:h-11 hz:px-3 hz:text-body-default hz:tablet:pointer-fine:h-8 hz:tablet:pointer-fine:text-body-secondary',
                md: 'hz:h-11 hz:px-4 hz:text-body-default hz:tablet:pointer-fine:h-10 hz:tablet:pointer-fine:text-body-secondary',
                lg: 'hz:h-12 hz:px-4 hz:text-body-default',
            },
            state: {
                rest: `${fieldState.rest} hz:focus-visible:ring-ring hz:data-[state=open]:ring-ring`,
                invalid: fieldState.invalid,
                disabled: fieldState.disabled,
                readOnly: fieldState.readOnly,
            },
            // Room for the clear button (44px at mobile, 32px fine pointer)
            // between the value and the chevron.
            clearing: {
                true: 'hz:pe-19 hz:tablet:pointer-fine:pe-16',
                false: '',
            },
        },
        defaultVariants: { size: 'md', state: 'rest', clearing: false },
    }
);

/** Options accepted by {@link selectVariants}: `size`, `state`, `clearing`. */
export type SelectVariantOptions = VariantProps<typeof triggerStyles>;

/** Size of a {@link Select} trigger. */
export type SelectSize = NonNullable<SelectVariantOptions['size']>;

const selectSizes: readonly SelectSize[] = ['sm', 'md', 'lg'];

/** Class string for the Select trigger, conflict-resolved with `cn()`. */
export function selectVariants(options?: SelectVariantOptions): string {
    return cn(triggerStyles(options));
}

// Width follows the trigger (full width at mobile, where fields fill the
// form); max height follows the space Radix measured. Above the MUI modal.
const contentStyles =
    'hz:relative hz:z-dropdown hz:max-h-(--radix-select-content-available-height) hz:w-(--radix-select-trigger-width) hz:min-w-48 hz:overflow-hidden hz:rounded-sm hz:bg-popover hz:text-popover-foreground hz:shadow-2 hz:ring-1 hz:ring-border';

// 44px rows at mobile and on touch pointers, 36px with a fine pointer.
const itemStyles = [
    'hz:relative hz:m-0 hz:flex hz:min-h-11 hz:w-full hz:cursor-pointer hz:items-center hz:gap-2 hz:rounded-xs hz:py-2 hz:ps-3 hz:pe-9 hz:outline-none hz:select-none',
    'hz:text-body-default hz:text-popover-foreground hz:tablet:pointer-fine:min-h-9 hz:tablet:pointer-fine:text-body-secondary',
    'hz:data-[highlighted]:bg-accent hz:data-[highlighted]:text-accent-foreground',
    'hz:data-[disabled]:cursor-not-allowed hz:data-[disabled]:text-muted-foreground',
].join(' ');

const scrollButton =
    'hz:flex hz:h-6 hz:cursor-default hz:items-center hz:justify-center hz:text-muted-foreground hz:[&>svg]:size-4';

const clearButton = [
    'hz:absolute hz:inset-y-0 hz:end-8 hz:m-0 hz:my-auto hz:inline-flex hz:size-11 hz:cursor-pointer hz:items-center hz:justify-center hz:rounded-full hz:border-0 hz:bg-transparent hz:p-0 hz:text-muted-foreground',
    'hz:tablet:pointer-fine:size-8',
    'hz:transition-colors hz:duration-fast hz:ease-standard hz:hover:text-foreground',
    'hz:focus:outline-none hz:focus-visible:outline-2 hz:focus-visible:-outline-offset-2 hz:focus-visible:outline-solid hz:focus-visible:outline-ring',
    'hz:[&_svg]:size-4 hz:[&_svg]:align-middle',
].join(' ');

/** x-core SelectV2 / MUI Select props that are dropped (dev warning). */
const legacySelectProps = {
    options: 'render a SelectItem per option',
    onChange: 'use onValueChange(value)',
    multiple: 'multiple selection: use Combobox (planned)',
    variant:
        'check/radio/switch variants are multi-select: use Combobox (planned)',
    label: 'wrap in FormField label',
    helperText: 'use FormField description or error',
    error: 'use invalid, or FormField error',
    placeholderValue: 'use placeholder',
    placeholderSearchField: 'search: use Combobox (planned)',
    enableSearchField: 'search: use Combobox (planned)',
    muiSelectProps: 'not supported',
    menuHeaderTitle: 'use SelectGroup label',
    menuHeaderIcon: 'not supported',
    applyButtonText: 'multi-select only: use Combobox (planned)',
    resetButtonText: 'use clearable',
    resetOnNoValue: 'use clearable',
    loading: 'not supported yet',
    startAdornment: 'not supported',
    isLabelContainer: 'use FormField',
    info: 'use FormField description',
    sx: 'use className',
    fullWidth: 'Select is full width by default',
} as const;

/** Props for {@link Select}. */
export type SelectProps = Omit<
    ButtonHTMLAttributes<HTMLButtonElement>,
    'value' | 'defaultValue' | 'onChange' | 'dir' | 'children'
> &
    DnbBase & {
        /** Selected value (controlled). `''` shows the placeholder. */
        value?: string;
        /** Initial value (uncontrolled). */
        defaultValue?: string;
        /** Called with the new value (`''` after clearing). */
        onValueChange?: (value: string) => void;
        /** Text shown while nothing is selected. */
        placeholder?: ReactNode;
        /**
         * Trigger height and text size, as Input: 44px (lg 48px) with 16px
         * text at mobile and on touch pointers; sm 32, md 40, lg 48 from
         * tablet with a fine pointer.
         * @default 'md'
         */
        size?: SelectSize;
        /** Invalid look and `aria-invalid` (set by a FormField `error`). */
        invalid?: boolean;
        /**
         * Shows a clear button while a value is selected (x-core
         * `clearable`); it resets to the placeholder and refocuses the
         * trigger.
         * @default false
         */
        clearable?: boolean;
        /** Accessible name of the clear button. @default 'Clear' */
        clearLabel?: string;
        /** Shown in the open list when there are no options. @default 'No options' */
        emptyMessage?: ReactNode;
        /** Requires a value (`aria-required`; FormField `required` sets it). */
        required?: boolean;
        /** Form field name (a hidden native select submits the value). */
        name?: string;
        /** Id of a `<form>` elsewhere in the document to submit with. */
        form?: string;
        /** Autofill hint for the hidden native select (e.g. `country`). */
        autoComplete?: string;
        /** Controlled open state. */
        open?: boolean;
        /** Initial open state. */
        defaultOpen?: boolean;
        /** Called when the list opens or closes. */
        onOpenChange?: (open: boolean) => void;
        /** Direction; read from the DOM when omitted. */
        dir?: Direction;
        /** `SelectItem`, `SelectGroup` and `SelectSeparator` elements. */
        children?: ReactNode;
        /** Classes for the trigger. */
        className?: string;
    };

/**
 * Pick one value from a list: Radix Select (`role="combobox"` trigger,
 * `listbox` of options, typeahead, arrow keys, Home/End, Escape). The list
 * portals into the HorizonProvider root above MUI dialogs (`--z-dropdown`).
 * Name it with `FormField` or `aria-label`.
 */
export const Select = forwardRef<HTMLButtonElement, SelectProps>(
    function Select(
        {
            value: valueProp,
            defaultValue,
            onValueChange,
            placeholder,
            size: sizeProp,
            invalid: invalidProp,
            clearable = false,
            clearLabel = 'Clear',
            emptyMessage = 'No options',
            name,
            form,
            autoComplete,
            open,
            defaultOpen,
            onOpenChange,
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
        const rest = omitLegacyProps('Select', props, legacySelectProps);
        const size = resolveOption(
            'Select',
            'size',
            sizeProp,
            selectSizes,
            'md'
        );
        const control = useFieldControl({
            id: idProp,
            'aria-describedby': describedByProp,
            invalid: invalidProp,
            required,
            disabled: disabledProp,
        });
        const triggerRef = useRef<HTMLButtonElement>(null);
        const direction = useResolvedDir(triggerRef, dir);
        const container = usePortalContainer();
        const [inner, setInner] = useState(defaultValue ?? '');
        const value = valueProp ?? inner;
        const change = (next: string) => {
            if (valueProp === undefined) setInner(next);
            onValueChange?.(next);
        };
        const showClear = clearable && value !== '' && !control.disabled;
        const empty = Children.toArray(children).length === 0;

        const root = (
            <SelectPrimitive.Root
                value={value}
                onValueChange={change}
                name={name}
                {...(form !== undefined && { form })}
                {...(autoComplete !== undefined && { autoComplete })}
                disabled={control.disabled}
                required={control.required}
                dir={direction}
                {...(open !== undefined && { open })}
                {...(defaultOpen !== undefined && { defaultOpen })}
                {...(onOpenChange && { onOpenChange })}
            >
                <SelectPrimitive.Trigger
                    {...rest}
                    ref={composeRefs(ref, triggerRef)}
                    id={control.id}
                    aria-invalid={control.invalid || undefined}
                    aria-describedby={control['aria-describedby']}
                    data-size={size}
                    className={cn(
                        triggerStyles({
                            size,
                            state: fieldStateOf({
                                disabled: control.disabled,
                                readOnly: false,
                                invalid: control.invalid,
                            }),
                            clearing: showClear,
                        }),
                        className
                    )}
                >
                    <span className="hz:min-w-0 hz:flex-1 hz:truncate">
                        <SelectPrimitive.Value placeholder={placeholder} />
                    </span>
                    <SelectPrimitive.Icon asChild>
                        <CaretDownIcon aria-hidden="true" />
                    </SelectPrimitive.Icon>
                </SelectPrimitive.Trigger>
                {container && (
                    <SelectPrimitive.Portal container={container}>
                        <SelectPrimitive.Content
                            position="popper"
                            side="bottom"
                            align="start"
                            sideOffset={4}
                            collisionPadding={8}
                            className={contentStyles}
                            data-select-content=""
                        >
                            <SelectPrimitive.ScrollUpButton
                                className={scrollButton}
                            >
                                <CaretUpIcon aria-hidden="true" />
                            </SelectPrimitive.ScrollUpButton>
                            <SelectPrimitive.Viewport className="hz:p-1">
                                {empty ? (
                                    <div
                                        role="option"
                                        aria-disabled="true"
                                        aria-selected="false"
                                        className="hz:px-3 hz:py-2 hz:text-body-secondary hz:text-muted-foreground"
                                    >
                                        {emptyMessage}
                                    </div>
                                ) : (
                                    children
                                )}
                            </SelectPrimitive.Viewport>
                            <SelectPrimitive.ScrollDownButton
                                className={scrollButton}
                            >
                                <CaretDownIcon aria-hidden="true" />
                            </SelectPrimitive.ScrollDownButton>
                        </SelectPrimitive.Content>
                    </SelectPrimitive.Portal>
                )}
            </SelectPrimitive.Root>
        );

        if (!clearable) return root;
        // The clear button cannot live inside the trigger (a button); it
        // sits over the trigger's reserved end padding.
        return (
            <div
                className="hz:relative hz:w-full hz:min-w-0"
                data-select-field=""
            >
                {root}
                {showClear && (
                    <button
                        type="button"
                        aria-label={clearLabel}
                        className={clearButton}
                        onClick={() => {
                            change('');
                            triggerRef.current?.focus();
                        }}
                    >
                        <XIcon aria-hidden="true" />
                    </button>
                )}
            </div>
        );
    }
);
Select.displayName = 'Select';

/** Props for {@link SelectItem}. */
export type SelectItemProps = Omit<
    ComponentPropsWithoutRef<typeof SelectPrimitive.Item>,
    'asChild'
> &
    DnbBase & {
        /** The option's value (a non-empty string). */
        value: string;
        /** The option text (also shown in the trigger when selected). */
        children: ReactNode;
    };

/**
 * One option. Long text is truncated with an ellipsis (a string child also
 * becomes the `title`); 44px rows at mobile and on touch pointers.
 */
export const SelectItem = forwardRef<HTMLDivElement, SelectItemProps>(
    function SelectItem({ className, children, title, ...props }, ref) {
        return (
            <SelectPrimitive.Item
                {...props}
                ref={ref}
                title={
                    title ??
                    (typeof children === 'string' ? children : undefined)
                }
                className={cn(itemStyles, className)}
            >
                {/* Radix ItemText drops className: truncate on a wrapper. */}
                <span className="hz:min-w-0 hz:flex-1 hz:truncate">
                    <SelectPrimitive.ItemText>
                        {children}
                    </SelectPrimitive.ItemText>
                </span>
                <SelectPrimitive.ItemIndicator className="hz:absolute hz:end-3 hz:inline-flex hz:items-center hz:text-primary hz:[&>svg]:size-4">
                    <CheckIcon aria-hidden="true" weight="bold" />
                </SelectPrimitive.ItemIndicator>
            </SelectPrimitive.Item>
        );
    }
);
SelectItem.displayName = 'SelectItem';

/** Props for {@link SelectGroup}. */
export type SelectGroupProps = Omit<
    ComponentPropsWithoutRef<typeof SelectPrimitive.Group>,
    'asChild'
> &
    DnbBase & {
        /** Visible group heading (names the group). */
        label: ReactNode;
    };

/** A labelled group of options (x-core SelectV2 `group`). */
export const SelectGroup = forwardRef<HTMLDivElement, SelectGroupProps>(
    function SelectGroup({ label, children, ...props }, ref) {
        return (
            <SelectPrimitive.Group {...props} ref={ref}>
                <SelectPrimitive.Label className="hz:px-3 hz:pt-2 hz:pb-1 hz:text-label-sm hz:text-muted-foreground">
                    {label}
                </SelectPrimitive.Label>
                {children}
            </SelectPrimitive.Group>
        );
    }
);
SelectGroup.displayName = 'SelectGroup';

/** Props for {@link SelectSeparator}. */
export type SelectSeparatorProps = Omit<
    ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>,
    'asChild'
> &
    DnbBase;

/** A divider between options or groups. */
export const SelectSeparator = forwardRef<HTMLDivElement, SelectSeparatorProps>(
    function SelectSeparator({ className, ...props }, ref) {
        return (
            <SelectPrimitive.Separator
                {...props}
                ref={ref}
                className={cn(
                    'hz:-mx-1 hz:my-1 hz:h-px hz:bg-border',
                    className
                )}
            />
        );
    }
);
SelectSeparator.displayName = 'SelectSeparator';
