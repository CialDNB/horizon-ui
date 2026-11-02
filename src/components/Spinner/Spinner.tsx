/*
 * No shadcn base: shadcn/ui ships `Spinner` as a lucide `Loader2Icon` with
 * `animate-spin`; Horizon uses no lucide (Task 8 ruling). Native <span> ring,
 * SVG ring for the determinate form. Replaces x-core `CircularProgress` (MUI
 * CircularProgress wrapper, x-core 2.2.30).
 */
import { cva, type VariantProps } from 'class-variance-authority';
import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '../../lib/cn';
import { resolveOption, warnOnce } from '../../lib/options';
import type { DnbBase } from '../../types/DnbBase';

const spinnerStyles = cva(
    'hz:inline-block hz:shrink-0 hz:rounded-full hz:align-middle',
    {
        variants: {
            size: {
                xs: 'hz:size-3 hz:border-2',
                sm: 'hz:size-4 hz:border-2',
                md: 'hz:size-5 hz:border-2',
                lg: 'hz:size-6 hz:border-2',
                xl: 'hz:size-10 hz:border-3',
            },
            tone: {
                primary: 'hz:text-primary',
                muted: 'hz:text-muted-foreground',
                inherit: 'hz:text-inherit',
            },
            determinate: {
                // A three-quarter ring (the border, minus its inline-end side)
                // turning once a second. Under prefers-reduced-motion it turns
                // three times slower instead of stopping: a frozen spinner
                // reads as a hung page. `data-hz-motion="essential"` exempts
                // it from the scoped base stylesheet's animation kill switch.
                false: 'hz:border-current hz:border-e-transparent hz:animate-spin hz:motion-reduce:animate-[spin_3s_linear_infinite]',
                true: 'hz:border-0',
            },
        },
        defaultVariants: { size: 'xl', tone: 'primary', determinate: false },
    }
);

/** Options accepted by {@link spinnerVariants}. */
export type SpinnerVariantOptions = VariantProps<typeof spinnerStyles>;

/** Size of a {@link Spinner}: 12, 16, 20, 24 or 40px. */
export type SpinnerSize = NonNullable<SpinnerVariantOptions['size']>;

/** Colour of a {@link Spinner}. */
export type SpinnerTone = NonNullable<SpinnerVariantOptions['tone']>;

/** Props for {@link Spinner}. */
export type SpinnerProps = Omit<
    HTMLAttributes<HTMLSpanElement>,
    'children' | 'role'
> &
    DnbBase & {
        /**
         * Diameter: `xs` 12px, `sm` 16px (inside buttons and inputs), `md`
         * 20px, `lg` 24px, `xl` 40px (a section or page loader; x-core's
         * default). The stroke is 2px, 3px at `xl`.
         * @default 'xl'
         */
        size?: SpinnerSize;
        /**
         * Colour: `primary`, `muted` (`muted-foreground`, for quiet inline
         * loaders) or `inherit` (`currentColor`, inside a coloured control
         * such as a primary button).
         * @default 'primary'
         */
        tone?: SpinnerTone;
        /**
         * Progress from 0 to 100. Omit for an indeterminate spinner. A number
         * renders a determinate ring on a track and sets `aria-valuenow`;
         * values outside 0..100 are clamped.
         */
        value?: number;
        /**
         * Accessible name, read by screen readers instead of a visible text.
         * Ignored when `aria-labelledby` is set. Translate it for non-English
         * UIs.
         * @default 'Loading'
         */
        label?: string;
    };

/**
 * Class string for a Spinner look (`size`, `tone`, `determinate`),
 * conflict-resolved with `cn()`.
 */
export function spinnerVariants(options?: SpinnerVariantOptions): string {
    return cn(spinnerStyles(options));
}

const spinnerTones: readonly SpinnerTone[] = ['primary', 'muted', 'inherit'];

const ring: Record<SpinnerSize, { px: number; stroke: number }> = {
    xs: { px: 12, stroke: 2 },
    sm: { px: 16, stroke: 2 },
    md: { px: 20, stroke: 2 },
    lg: { px: 24, stroke: 2 },
    xl: { px: 40, stroke: 3 },
};

const clamp = (value: number) => Math.min(100, Math.max(0, value));

const sizeNames = Object.keys(ring) as SpinnerSize[];

/**
 * Untyped callers may pass x-core's pixel sizes (`size={24}`, `"19px"`):
 * those map to the nearest step (ties to the smaller), with a dev warning.
 * Other unknown values fall back to `xl`.
 */
function resolveSize(size: unknown): SpinnerSize {
    const px =
        typeof size === 'number'
            ? size
            : typeof size === 'string' && /^\d+(\.\d+)?(px)?$/.test(size)
              ? Number.parseFloat(size)
              : Number.NaN;
    if (Number.isNaN(px))
        return resolveOption('Spinner', 'size', size, sizeNames, 'xl');
    const step = sizeNames.reduce((best, name) =>
        Math.abs(ring[name].px - px) < Math.abs(ring[best].px - px)
            ? name
            : best
    );
    warnOnce(
        `Spinner: numeric size ${JSON.stringify(size)} is an x-core value; using "${step}" (${ring[step].px}px). Accepted: ${sizeNames.map((n) => `"${n}"`).join(', ')}.`
    );
    return step;
}

/**
 * Shows that something is loading. Renders `role="progressbar"` named by
 * `label` ("Loading"); with `value` it is a determinate ring with
 * `aria-valuenow`. Inside a control that already says it is busy (a loading
 * Button), pass `aria-hidden="true"`: the spinner is then decorative and has
 * no role or name.
 */
export const Spinner = forwardRef<HTMLSpanElement, SpinnerProps>(
    function Spinner(
        {
            size: sizeProp,
            tone: toneProp,
            value,
            label = 'Loading',
            className,
            ...rest
        },
        ref
    ) {
        const size = resolveSize(sizeProp);
        const tone = resolveOption(
            'Spinner',
            'tone',
            toneProp,
            spinnerTones,
            'primary'
        );
        const hidden =
            rest['aria-hidden'] === true || rest['aria-hidden'] === 'true';
        const determinate = value !== undefined && !Number.isNaN(value);
        const now = determinate ? clamp(value) : undefined;
        const { px, stroke } = ring[size];
        const r = (px - stroke) / 2;
        return (
            <span
                role={hidden ? undefined : 'progressbar'}
                aria-label={
                    hidden || rest['aria-labelledby'] ? undefined : label
                }
                aria-valuenow={
                    now === undefined || hidden ? undefined : Math.round(now)
                }
                aria-valuemin={determinate && !hidden ? 0 : undefined}
                aria-valuemax={determinate && !hidden ? 100 : undefined}
                {...rest}
                ref={ref}
                data-size={size}
                data-tone={tone}
                data-hz-motion={determinate ? undefined : 'essential'}
                className={cn(
                    spinnerStyles({ size, tone, determinate }),
                    className
                )}
            >
                {now !== undefined && (
                    <svg
                        aria-hidden="true"
                        viewBox={`0 0 ${px} ${px}`}
                        // align-top: Bootstrap reboot sets `svg { vertical-align: middle }`;
                        // the class keeps the computed style host-independent.
                        className="hz:block hz:size-full hz:-rotate-90 hz:align-top"
                        fill="none"
                    >
                        <circle
                            cx={px / 2}
                            cy={px / 2}
                            r={r}
                            strokeWidth={stroke}
                            className={
                                tone === 'inherit'
                                    ? 'hz:stroke-current hz:opacity-25'
                                    : 'hz:stroke-muted'
                            }
                        />
                        <circle
                            data-spinner-arc=""
                            cx={px / 2}
                            cy={px / 2}
                            r={r}
                            strokeWidth={stroke}
                            pathLength={100}
                            strokeDasharray={100}
                            strokeDashoffset={Number((100 - now).toFixed(2))}
                            strokeLinecap={now > 0 ? 'round' : 'butt'}
                            className="hz:stroke-current hz:transition-[stroke-dashoffset] hz:duration-slow hz:ease-standard"
                        />
                    </svg>
                )}
            </span>
        );
    }
);
Spinner.displayName = 'Spinner';
