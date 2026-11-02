/*
 * Based on shadcn/ui Progress (registry 2025: Radix Progress, track +
 * translated indicator). No Radix dependency: Radix Progress only adds the
 * progressbar ARIA this sets natively. Adds a visible label, value text,
 * tones, sizes and an indeterminate state. Replaces x-core `LinearProgress`
 * (MUI LinearProgress wrapper, x-core 2.2.30).
 */
import { cva, type VariantProps } from 'class-variance-authority';
import {
    forwardRef,
    useId,
    type CSSProperties,
    type HTMLAttributes,
    type ReactNode,
} from 'react';
import { cn } from '../../lib/cn';
import { omitLegacyProps, resolveOption } from '../../lib/options';
import type { DnbBase } from '../../types/DnbBase';

const progressStyles = cva(
    'hz:relative hz:w-full hz:overflow-hidden hz:rounded-full hz:bg-muted',
    {
        variants: {
            size: {
                sm: 'hz:h-1',
                md: 'hz:h-2',
            },
        },
        defaultVariants: { size: 'sm' },
    }
);

// Indicator fills: the `-strong` shades reach 3:1 against the muted track and
// the page background in every brand (WCAG 1.4.11, src/tokens/contrast.test.ts).
const indicatorTone = {
    primary: 'hz:bg-primary',
    neutral: 'hz:bg-neutral-strong',
    success: 'hz:bg-success-strong',
    warning: 'hz:bg-warning-strong',
    error: 'hz:bg-destructive-strong',
} as const;

const progressSizes: readonly ProgressSize[] = ['sm', 'md'];

/** Options accepted by {@link progressVariants} (the track). */
export type ProgressVariantOptions = VariantProps<typeof progressStyles>;

/** Height of a {@link Progress} track: `sm` 4px, `md` 8px. */
export type ProgressSize = NonNullable<ProgressVariantOptions['size']>;

/** Indicator colour of a {@link Progress}. */
export type ProgressVariant = keyof typeof indicatorTone;

type ProgressBase = Omit<
    HTMLAttributes<HTMLDivElement>,
    'children' | 'role' | 'aria-label' | 'aria-labelledby'
> &
    DnbBase & {
        /**
         * Progress from 0 to `max`. Omit for an indeterminate bar (work whose
         * length is unknown). Values outside 0..max are clamped.
         */
        value?: number;
        /** Value that means complete. @default 100 */
        max?: number;
        /** Indicator colour. @default 'primary' */
        variant?: ProgressVariant;
        /** Track height: `sm` 4px, `md` 8px. @default 'sm' */
        size?: ProgressSize;
        /**
         * Prints the rounded percentage at the end of the label row (hidden
         * from screen readers: the progressbar already exposes its value; use
         * `aria-valuetext` for "3 of 5 steps"). Determinate only.
         * @default false
         */
        showValue?: boolean;
    };

/** Named by a visible label above the bar. */
type LabelledProgress = {
    /** Visible label above the bar; it also names the progressbar. */
    label: ReactNode;
    'aria-label'?: never;
    'aria-labelledby'?: never;
};

/** Named without a visible label. */
type AriaLabelledProgress = {
    label?: never;
} & (
    | {
          /** Accessible name of the progressbar when there is no `label`. */
          'aria-label': string;
          'aria-labelledby'?: never;
      }
    | {
          'aria-label'?: never;
          /** Id of the element that names the progressbar. */
          'aria-labelledby': string;
      }
);

/**
 * Props for {@link Progress}. A progressbar must be named: pass `label`,
 * `aria-label` or `aria-labelledby`. `ref`, `className`, `style` and the
 * other attributes go to the wrapper; the ARIA naming and value attributes go
 * to the progressbar element.
 */
export type ProgressProps = ProgressBase &
    (LabelledProgress | AriaLabelledProgress);

/** Class string for a Progress track (`size`), conflict-resolved with `cn()`. */
export function progressVariants(options?: ProgressVariantOptions): string {
    return cn(progressStyles(options));
}

const clamp = (value: number, max: number) => Math.min(max, Math.max(0, value));

/** x-core / MUI props that are dropped (with a dev warning). */
const legacyProgressProps = {
    sx: 'use className',
    color: 'use variant',
    valueBuffer: 'not supported',
} as const;

/**
 * Shows how far a task has got: a bar on a `muted` track, with an optional
 * label and percentage. Without `value` it is indeterminate: a segment
 * travels along the track (a slow pulse under `prefers-reduced-motion`).
 * Renders `role="progressbar"` with `aria-valuenow`/`min`/`max`.
 */
export const Progress = forwardRef<HTMLDivElement, ProgressProps>(
    function Progress(
        {
            value,
            max: maxProp = 100,
            variant: variantProp,
            size: sizeProp,
            label,
            showValue = false,
            'aria-label': ariaLabel,
            'aria-labelledby': ariaLabelledBy,
            'aria-valuetext': ariaValueText,
            'aria-describedby': ariaDescribedBy,
            className,
            ...props
        },
        ref
    ) {
        const rest = omitLegacyProps('Progress', props, legacyProgressProps);
        const labelId = useId();
        // Untyped callers may pass x-core values (`variant="determinate"`).
        const variant = resolveOption(
            'Progress',
            'variant',
            variantProp,
            Object.keys(indicatorTone) as ProgressVariant[],
            'primary'
        );
        const size = resolveOption(
            'Progress',
            'size',
            sizeProp,
            progressSizes,
            'sm'
        );
        const max = maxProp > 0 ? maxProp : 100;
        const determinate = value !== undefined && !Number.isNaN(value);
        const now = determinate ? clamp(value, max) : undefined;
        const percent = now === undefined ? undefined : (now / max) * 100;
        const hasLabel = label !== undefined && label !== null;
        const printValue = showValue && percent !== undefined;
        return (
            <div
                {...rest}
                ref={ref}
                className={cn(
                    'hz:flex hz:w-full hz:min-w-0 hz:flex-col hz:gap-2',
                    className
                )}
            >
                {(hasLabel || printValue) && (
                    <div className="hz:flex hz:min-w-0 hz:items-baseline hz:justify-between hz:gap-3">
                        {hasLabel && (
                            <span
                                id={labelId}
                                className="hz:min-w-0 hz:text-label-md hz:wrap-anywhere hz:text-foreground"
                            >
                                {label}
                            </span>
                        )}
                        {printValue && (
                            <span
                                aria-hidden="true"
                                data-progress-value=""
                                className="hz:ms-auto hz:shrink-0 hz:text-body-secondary hz:text-muted-foreground hz:tabular-nums"
                            >
                                {Math.round(percent)}%
                            </span>
                        )}
                    </div>
                )}
                <div
                    role="progressbar"
                    aria-label={ariaLabel}
                    aria-labelledby={hasLabel ? labelId : ariaLabelledBy}
                    aria-describedby={ariaDescribedBy}
                    aria-valuemin={0}
                    aria-valuemax={max}
                    aria-valuenow={now}
                    aria-valuetext={ariaValueText}
                    data-state={
                        now === undefined
                            ? 'indeterminate'
                            : now === max
                              ? 'complete'
                              : 'loading'
                    }
                    data-variant={variant}
                    data-size={size}
                    className={progressStyles({ size })}
                >
                    {percent === undefined ? (
                        <div
                            data-progress-indicator=""
                            data-hz-motion="essential"
                            className={cn(
                                'hz:absolute hz:inset-y-0 hz:start-0 hz:w-2/5 hz:rounded-full',
                                'hz:[--hz-progress-dir:1] hz:rtl:[--hz-progress-dir:-1]',
                                'hz:animate-progress-indeterminate',
                                'hz:motion-reduce:w-full hz:motion-reduce:animate-progress-pulse',
                                indicatorTone[variant]
                            )}
                        />
                    ) : (
                        <div
                            data-progress-indicator=""
                            style={
                                {
                                    '--hz-progress-offset': `${Number((100 - percent).toFixed(2))}%`,
                                } as CSSProperties
                            }
                            className={cn(
                                'hz:h-full hz:w-full hz:rounded-full',
                                // Slides in from the inline start: left in LTR, right in RTL.
                                'hz:ltr:-translate-x-(--hz-progress-offset) hz:rtl:translate-x-(--hz-progress-offset)',
                                'hz:transition-transform hz:duration-slow hz:ease-standard',
                                indicatorTone[variant]
                            )}
                        />
                    )}
                </div>
            </div>
        );
    }
);
Progress.displayName = 'Progress';
