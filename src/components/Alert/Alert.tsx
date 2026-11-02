/*
 * Based on shadcn/ui Alert (registry 2025: grid of icon, AlertTitle and
 * AlertDescription; no dismiss, no action). Single component with `title`,
 * `action` and `onDismiss` props instead of compound parts: x-core call sites
 * pass title/action as props too. Replaces x-core `Alert` (MUI Alert with
 * Phosphor icons and an `onClose` button, x-core 2.2.30).
 */
import { CheckCircleIcon } from '@phosphor-icons/react/dist/csr/CheckCircle';
import { InfoIcon } from '@phosphor-icons/react/dist/csr/Info';
import { WarningIcon } from '@phosphor-icons/react/dist/csr/Warning';
import { WarningCircleIcon } from '@phosphor-icons/react/dist/csr/WarningCircle';
import { XIcon } from '@phosphor-icons/react/dist/csr/X';
import { cva, type VariantProps } from 'class-variance-authority';
import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '../../lib/cn';
import { omitLegacyProps, resolveOption } from '../../lib/options';
import type { DnbBase } from '../../types/DnbBase';

const alertStyles = cva(
    [
        'hz:flex hz:w-full hz:min-w-0 hz:items-start hz:gap-3 hz:rounded-md hz:p-3 hz:tablet:p-4',
        'hz:text-body-default hz:wrap-break-word',
    ],
    {
        variants: {
            // Text, icon and dismiss all use the tone's `-strong` shade on its
            // `-subtle` surface (>= 4.5:1 in every brand; `foreground` is not,
            // D&B 3.96-4.34:1).
            variant: {
                info: 'hz:bg-info-subtle hz:text-info-strong',
                success: 'hz:bg-success-subtle hz:text-success-strong',
                warning: 'hz:bg-warning-subtle hz:text-warning-strong',
                error: 'hz:bg-destructive-subtle hz:text-destructive-strong',
                neutral: 'hz:bg-neutral-subtle hz:text-neutral-strong',
            },
        },
        defaultVariants: { variant: 'info' },
    }
);

/** Options accepted by {@link alertVariants}. */
export type AlertVariantOptions = VariantProps<typeof alertStyles>;

/** Tone of an {@link Alert}. */
export type AlertVariant = NonNullable<AlertVariantOptions['variant']>;

const toneIcon = {
    info: { name: 'Info', Icon: InfoIcon },
    success: { name: 'CheckCircle', Icon: CheckCircleIcon },
    warning: { name: 'Warning', Icon: WarningIcon },
    error: { name: 'WarningCircle', Icon: WarningCircleIcon },
    neutral: { name: 'Info', Icon: InfoIcon },
} as const satisfies Record<AlertVariant, unknown>;

const alertVariantNames = Object.keys(toneIcon) as AlertVariant[];

/** Errors and warnings interrupt; the rest wait for the user to be idle. */
const toneRole: Record<AlertVariant, AlertRole> = {
    info: 'status',
    success: 'status',
    warning: 'alert',
    error: 'alert',
    neutral: 'status',
};

/**
 * Roles an {@link Alert} can take: the two live-region roles, `none` for
 * static guidance, or `region` (needs `aria-label`) for a landmark.
 */
export type AlertRole = 'alert' | 'status' | 'none' | 'region';

/** Props for {@link Alert}. */
export type AlertProps = Omit<
    HTMLAttributes<HTMLDivElement>,
    'title' | 'role'
> &
    DnbBase & {
        /**
         * Tone: colours, icon and default role. `warning` and `error` render
         * `role="alert"` (assertive), `info`, `success` and `neutral`
         * `role="status"` (polite).
         * @default 'info'
         */
        variant?: AlertVariant;
        /**
         * Short summary shown above the description in semibold (x-core
         * `AlertTitle`). It is not a heading; pass one inside if the page
         * outline needs it.
         */
        title?: ReactNode;
        /** Description: the message itself. Wraps; long words break. */
        children?: ReactNode;
        /**
         * Leading icon. Defaults to the tone's Phosphor icon (Info,
         * CheckCircle, Warning, WarningCircle); `false` hides it. Always
         * decorative (`aria-hidden`), sized 20px.
         */
        icon?: ReactNode | false;
        /**
         * An action for the message, usually a `Button` (`variant="tertiary"`
         * or `"secondary"`, `size="sm"`). Sits below the text at mobile and at
         * the end of the row from `tablet`.
         */
        action?: ReactNode;
        /**
         * Shows a dismiss button at the end (named by `dismissLabel`) that
         * calls this handler. The alert does not hide itself: remove it in the
         * handler, and move focus somewhere sensible if it was inside.
         */
        onDismiss?: () => void;
        /**
         * Accessible name of the dismiss button. Translate it.
         * @default 'Dismiss'
         */
        dismissLabel?: string;
        /**
         * Overrides the tone's role: for example `"status"` for an error that
         * is part of the page content rather than a reaction to the user, or
         * `"none"` for static guidance that must not be announced.
         */
        role?: AlertRole;
    };

/** Class string for an Alert surface (`variant`), conflict-resolved with `cn()`. */
export function alertVariants(options?: AlertVariantOptions): string {
    return cn(alertStyles(options));
}

// The first text line is 24px with a title (label/lg) and 20px without
// (body/default): icon and dismiss centre on it.
const firstLine = (hasTitle: boolean) =>
    cn('hz:flex hz:shrink-0 hz:items-center', hasTitle ? 'hz:h-6' : 'hz:h-5');

const dismissStyles = cn(
    // Bootstrap reboot sets button margin, radius and a `button:focus`
    // outline: each is set here as a class, which wins in the unlayered build.
    'hz:inline-flex hz:items-center hz:justify-center hz:rounded-full hz:border-0 hz:bg-transparent hz:p-0 hz:text-inherit hz:cursor-pointer',
    // 44px target at mobile and on touch, laid out as 20px (negative margins)
    // so it never pushes the text; 32px from tablet with a fine pointer.
    'hz:size-11 hz:-m-3 hz:tablet:pointer-fine:size-8 hz:tablet:pointer-fine:-m-1.5',
    'hz:[&_svg]:size-5 hz:[&_svg]:pointer-events-none',
    'hz:transition-colors hz:duration-fast hz:ease-standard hz:hover:bg-current/12 hz:active:bg-current/16',
    // The ring sits 2px inside the target where the 44px target reaches the
    // alert's edge (an overflow-hidden parent would clip an outside ring);
    // the 32px fine-pointer target has room for it at offset 0.
    'hz:outline-ring hz:focus:outline-none hz:focus-visible:outline-2 hz:focus-visible:-outline-offset-2 hz:tablet:pointer-fine:focus-visible:outline-offset-0 hz:focus-visible:outline-solid hz:focus-visible:outline-ring'
);

/** x-core / MUI props that are dropped (with a dev warning). */
const legacyAlertProps = {
    sx: 'use className',
    color: 'use variant',
    severity: 'use variant',
    onClose: 'use onDismiss',
} as const;

/**
 * A message about the page or a task: tone surface, icon, optional title,
 * description, optional action and dismiss button. Errors and warnings are
 * announced assertively (`role="alert"`), the rest politely
 * (`role="status"`). Live regions announce changes, so render the Alert in
 * response to the event it reports; an alert present on page load is read
 * in place.
 */
export const Alert = forwardRef<HTMLDivElement, AlertProps>(function Alert(
    {
        variant: variantProp,
        title,
        icon,
        action,
        onDismiss,
        dismissLabel = 'Dismiss',
        role,
        className,
        children,
        ...props
    },
    ref
) {
    const rest = omitLegacyProps('Alert', props, legacyAlertProps);
    // Untyped callers may pass x-core values (`variant="standard"`).
    const variant = resolveOption(
        'Alert',
        'variant',
        variantProp,
        alertVariantNames,
        'info'
    );
    const hasTitle = title !== undefined && title !== null && title !== false;
    const { name, Icon } = toneIcon[variant];
    const hasAction = action !== undefined && action !== null;
    return (
        <div
            {...rest}
            ref={ref}
            role={role ?? toneRole[variant]}
            data-variant={variant}
            className={cn(alertStyles({ variant }), className)}
        >
            {icon !== false && (
                <span
                    aria-hidden="true"
                    data-alert-icon=""
                    data-icon={icon === undefined ? name : 'custom'}
                    className={cn(firstLine(hasTitle), 'hz:[&_svg]:size-5')}
                >
                    {icon === undefined ? <Icon /> : icon}
                </span>
            )}
            <div
                data-alert-body=""
                className="hz:flex hz:min-w-0 hz:flex-1 hz:flex-col hz:gap-3 hz:tablet:flex-row hz:tablet:items-center hz:tablet:gap-4"
            >
                <div className="hz:flex hz:min-w-0 hz:flex-1 hz:flex-col hz:gap-1">
                    {hasTitle && (
                        <div data-alert-title="" className="hz:text-label-lg">
                            {title}
                        </div>
                    )}
                    {children !== undefined && children !== null && (
                        <div data-alert-description="">{children}</div>
                    )}
                </div>
                {hasAction && (
                    <div
                        data-alert-action=""
                        className="hz:flex hz:shrink-0 hz:flex-wrap hz:items-center hz:gap-2"
                    >
                        {action}
                    </div>
                )}
            </div>
            {onDismiss && (
                <span className={firstLine(hasTitle)}>
                    <button
                        type="button"
                        aria-label={dismissLabel}
                        onClick={onDismiss}
                        className={dismissStyles}
                    >
                        <XIcon weight="bold" aria-hidden="true" />
                    </button>
                </span>
            )}
        </div>
    );
});
Alert.displayName = 'Alert';
