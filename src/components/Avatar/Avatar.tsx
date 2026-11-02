/*
 * Based on shadcn/ui Avatar (registry 2025: Avatar, AvatarImage,
 * AvatarFallback), without its Radix dependency: one native component with
 * the same load-then-show behaviour. Replaces x-core `Avatar` (MUI Avatar
 * wrapper) and `AvatarGroup` (MUI AvatarGroup wrapper), x-core 2.2.30.
 */
import { UserIcon } from '@phosphor-icons/react/dist/csr/User';
import { cva, type VariantProps } from 'class-variance-authority';
import {
    Children,
    createContext,
    forwardRef,
    isValidElement,
    useContext,
    useLayoutEffect,
    useRef,
    useState,
    type HTMLAttributes,
    type ReactNode,
} from 'react';
import { cn } from '../../lib/cn';
import { omitLegacyProps, resolveOption } from '../../lib/options';
import type { DnbBase } from '../../types/DnbBase';

const avatarStyles = cva(
    [
        'hz:relative hz:inline-flex hz:shrink-0 hz:items-center hz:justify-center hz:overflow-hidden hz:align-middle',
        'hz:font-semibold hz:whitespace-nowrap hz:select-none',
    ],
    {
        variants: {
            // Initials step through the type scale with the box; the person
            // icon (no name) takes about 60% of it.
            size: {
                xs: 'hz:size-4 hz:text-micro hz:[&_svg]:size-3',
                sm: 'hz:size-6 hz:text-label-sm hz:[&_svg]:size-4',
                md: 'hz:size-8 hz:text-label-md hz:[&_svg]:size-5',
                lg: 'hz:size-10 hz:text-label-lg hz:[&_svg]:size-6',
                xl: 'hz:size-16 hz:text-heading-sm hz:[&_svg]:size-10',
            },
            shape: {
                circle: 'hz:rounded-full',
                rounded: '',
            },
            // Fallback surface. `primary` is x-core's look (solid primary,
            // white initials); the status tones are soft fills with their
            // `-strong` text (4.5:1 in every brand).
            tone: {
                primary: 'hz:bg-primary hz:text-primary-foreground',
                neutral: 'hz:bg-neutral-subtle hz:text-neutral-strong',
                info: 'hz:bg-info-subtle hz:text-info-strong',
                success: 'hz:bg-success-subtle hz:text-success-strong',
                warning: 'hz:bg-warning-subtle hz:text-warning-strong',
                error: 'hz:bg-destructive-subtle hz:text-destructive-strong',
            },
        },
        compoundVariants: [
            { shape: 'rounded', size: ['xs', 'sm'], class: 'hz:rounded-xs' },
            {
                shape: 'rounded',
                size: ['md', 'lg', 'xl'],
                class: 'hz:rounded-sm',
            },
        ],
        defaultVariants: { size: 'sm', shape: 'circle', tone: 'primary' },
    }
);

/** Options accepted by {@link avatarVariants}. */
export type AvatarVariantOptions = VariantProps<typeof avatarStyles>;

/** Size of an {@link Avatar}: 16, 24, 32, 40 or 64px. */
export type AvatarSize = NonNullable<AvatarVariantOptions['size']>;

/** Shape of an {@link Avatar}. */
export type AvatarShape = NonNullable<AvatarVariantOptions['shape']>;

/** Fallback surface tone of an {@link Avatar}. */
export type AvatarTone = NonNullable<AvatarVariantOptions['tone']>;

const avatarSizes: readonly AvatarSize[] = ['xs', 'sm', 'md', 'lg', 'xl'];
const avatarShapes: readonly AvatarShape[] = ['circle', 'rounded'];
const avatarTones: readonly AvatarTone[] = [
    'primary',
    'neutral',
    'info',
    'success',
    'warning',
    'error',
];

/**
 * Class string for an Avatar box (size, shape, tone), conflict-resolved with
 * `cn()`.
 */
export function avatarVariants(options?: AvatarVariantOptions): string {
    return cn(avatarStyles(options));
}

/**
 * Up to two initials from a name: the first letter of the first two words,
 * upper-cased for the current locale. Punctuation is ignored and any script
 * works (`"דנה לוי"` -> `"דל"`, `"O'Brien, Pat"` -> `"OP"`).
 */
export function getInitials(name: string): string {
    return name
        .replace(/[^\p{L}\p{N}\s]/gu, '')
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((word) => Array.from(word)[0]?.toLocaleUpperCase() ?? '')
        .join('');
}

type GroupDefaults = { size?: AvatarSize; shape?: AvatarShape };
const AvatarGroupContext = createContext<GroupDefaults>({});

/** Props for {@link Avatar}. */
export type AvatarProps = Omit<HTMLAttributes<HTMLSpanElement>, 'role'> &
    DnbBase & {
        /** Image URL. While it loads, and if it fails, the fallback shows. */
        src?: string;
        /**
         * Name of the person or entity. Source of the initials and, unless
         * `alt` is set, of the accessible name. Without `name`, the initials
         * come from `alt` (as x-core).
         */
        name?: string;
        /**
         * Accessible name (announced once, as an image). Defaults to `name`.
         * Pass `alt=""` when the name is already visible next to the avatar,
         * so screen readers do not read it twice; the avatar is then hidden
         * from assistive technology. Without `name` and `alt` it is decorative.
         */
        alt?: string;
        /**
         * Box size: `xs` 16, `sm` 24, `md` 32, `lg` 40, `xl` 64px. Identical at
         * every breakpoint. `xs` shows one initial. Inside an
         * {@link AvatarGroup} the group's size is the default.
         * @default 'sm'
         */
        size?: AvatarSize;
        /**
         * `circle` for people, `rounded` (4px radius up to `sm`, 8px from `md`)
         * for companies and other entities. (x-core MUI `variant`.)
         * @default 'circle'
         */
        shape?: AvatarShape;
        /**
         * Surface of the fallback (initials or icon). `primary` is the solid
         * x-core look; the others are soft status tints, for example an
         * approver's decision.
         * @default 'primary'
         */
        tone?: AvatarTone;
        /**
         * Custom fallback content (a logo, an icon, preformatted initials)
         * shown instead of the initials. It is hidden from assistive
         * technology: the avatar is named by `alt`/`name`.
         */
        children?: ReactNode;
    };

/** x-core Avatar / MUI props that are dropped (with a dev warning). */
const legacyAvatarProps = {
    sx: 'use size, tone or className',
    variant: 'use shape ("circle" | "rounded")',
    imgProps: 'not supported',
    sizes: 'not supported',
    srcSet: 'not supported',
    component: 'not supported',
} as const;

type ImageStatus = 'none' | 'loading' | 'loaded' | 'error';

/**
 * A person or entity: their image, or initials (or a person icon) while the
 * image loads, when it fails, or when there is none. Not interactive: wrap it
 * in a `Button` or link for an action. Renders a `<span role="img">` named by
 * `alt` or `name`, or a hidden decorative span with `alt=""`.
 */
export const Avatar = forwardRef<HTMLSpanElement, AvatarProps>(function Avatar(
    {
        src,
        name,
        alt,
        size: sizeProp,
        shape: shapeProp,
        tone: toneProp,
        className,
        children,
        ...props
    },
    ref
) {
    const rest = omitLegacyProps('Avatar', props, legacyAvatarProps);
    const group = useContext(AvatarGroupContext);
    // Untyped callers may pass x-core values (`size="small"`).
    const size = resolveOption(
        'Avatar',
        'size',
        sizeProp ?? group.size,
        avatarSizes,
        'sm'
    );
    const shape = resolveOption(
        'Avatar',
        'shape',
        shapeProp ?? group.shape,
        avatarShapes,
        'circle'
    );
    const tone = resolveOption(
        'Avatar',
        'tone',
        toneProp,
        avatarTones,
        'primary'
    );

    // Status belongs to one src: a new src starts loading again.
    const [loaded, setLoaded] = useState<{ src: string; ok: boolean } | null>(
        null
    );
    const status: ImageStatus = !src
        ? 'none'
        : loaded?.src === src
          ? loaded.ok
              ? 'loaded'
              : 'error'
          : 'loading';
    const imgRef = useRef<HTMLImageElement>(null);
    useLayoutEffect(() => {
        // An image already decoded (cache, hydration) fires no load event.
        const image = imgRef.current;
        if (src && image?.complete && image.naturalWidth > 0)
            setLoaded({ src, ok: true });
    }, [src]);

    const label = alt ?? name ?? '';
    // x-core derived the initials from `alt` (`<Avatar alt={name} />`).
    const source = name ?? alt;
    const initials = source ? getInitials(source) : '';
    const fallback =
        children ??
        (initials ? (
            size === 'xs' ? (
                Array.from(initials)[0]
            ) : (
                initials
            )
        ) : (
            <UserIcon weight="fill" />
        ));

    return (
        <span
            {...rest}
            ref={ref}
            {...(label
                ? { role: 'img', 'aria-label': label }
                : { 'aria-hidden': true })}
            data-size={size}
            data-shape={shape}
            data-tone={tone}
            data-status={status}
            className={cn(avatarStyles({ size, shape, tone }), className)}
        >
            {status !== 'loaded' && (
                <span
                    aria-hidden="true"
                    className="hz:inline-flex hz:items-center hz:justify-center"
                >
                    {fallback}
                </span>
            )}
            {src && status !== 'error' && (
                <img
                    ref={imgRef}
                    src={src}
                    alt=""
                    // Bootstrap reboot styles `img { vertical-align: middle;
                    // border-style: none }`: both are set here.
                    className={cn(
                        'hz:absolute hz:inset-0 hz:block hz:size-full hz:border-0 hz:object-cover hz:align-top',
                        status === 'loading' && 'hz:opacity-0'
                    )}
                    onLoad={() => setLoaded({ src, ok: true })}
                    onError={() => setLoaded({ src, ok: false })}
                />
            )}
        </span>
    );
});
Avatar.displayName = 'Avatar';

/** Props for {@link AvatarGroup}. */
export type AvatarGroupProps = Omit<HTMLAttributes<HTMLDivElement>, 'role'> &
    DnbBase & {
        /** `Avatar` elements, in display order. */
        children?: ReactNode;
        /**
         * Most avatars shown, including the `+N` overflow avatar: with more
         * people than `max`, the first `max - 1` show and `+N` stands for the
         * rest. Values below 2 are treated as 2.
         * @default 3
         */
        max?: number;
        /**
         * Total number of people, when only some are passed as children (for
         * example the first page of a list). Defaults to the number of
         * children.
         */
        total?: number;
        /** Default size of every avatar in the group, including `+N`. @default 'sm' */
        size?: AvatarSize;
        /** Default shape of every avatar in the group. @default 'circle' */
        shape?: AvatarShape;
        /**
         * Accessible name of the `+N` avatar (the visible text is hidden).
         * Translate it.
         * @default (n) => `${n} more`
         */
        overflowLabel?: (hidden: number) => string;
        /** Accessible name of the group, for example "Assignees". */
        'aria-label'?: string;
    };

// Overlap: avatars pull 4px (xs, sm) or 8px (md and up) under the previous
// one; a 2px `background` ring separates them.
const overlap: Record<AvatarSize, string> = {
    xs: 'hz:[&>*+*]:-ms-1',
    sm: 'hz:[&>*+*]:-ms-1',
    md: 'hz:[&>*+*]:-ms-2',
    lg: 'hz:[&>*+*]:-ms-2',
    xl: 'hz:[&>*+*]:-ms-2',
};

/**
 * A row of overlapping avatars (`role="group"`) with a `+N` overflow avatar,
 * named "N more" for screen readers. Sets the default `size` and `shape` of
 * the avatars inside it.
 */
export const AvatarGroup = forwardRef<HTMLDivElement, AvatarGroupProps>(
    function AvatarGroup(
        {
            children,
            max = 3,
            total,
            size: sizeProp,
            shape: shapeProp,
            overflowLabel = (hidden) => `${hidden} more`,
            className,
            ...rest
        },
        ref
    ) {
        const size = resolveOption(
            'AvatarGroup',
            'size',
            sizeProp,
            avatarSizes,
            'sm'
        );
        const shape = resolveOption(
            'AvatarGroup',
            'shape',
            shapeProp,
            avatarShapes,
            'circle'
        );
        const items = Children.toArray(children).filter(isValidElement);
        const limit = Number.isFinite(max) ? Math.max(2, Math.floor(max)) : 3;
        const count = Math.max(total ?? items.length, items.length);
        const shown = count > limit ? items.slice(0, limit - 1) : items;
        const hidden = count - shown.length;
        return (
            <AvatarGroupContext.Provider value={{ size, shape }}>
                <div
                    {...rest}
                    ref={ref}
                    role="group"
                    data-size={size}
                    className={cn(
                        'hz:inline-flex hz:max-w-full hz:items-center hz:align-middle',
                        'hz:[&>*]:ring-2 hz:[&>*]:ring-background',
                        overlap[size],
                        className
                    )}
                >
                    {shown}
                    {hidden > 0 && (
                        <Avatar tone="neutral" alt={overflowLabel(hidden)}>
                            {`+${hidden}`}
                        </Avatar>
                    )}
                </div>
            </AvatarGroupContext.Provider>
        );
    }
);
AvatarGroup.displayName = 'AvatarGroup';
