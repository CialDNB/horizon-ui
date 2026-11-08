/*
 * Built-in cell renderers of the data-driven Table, by `Column.type`, for
 * the value shapes x-core's renderers read (x-core Table/Cell/Types). Rich
 * cells reuse horizon Chip, Badge, Avatar and Progress.
 */
import type { ReactNode } from 'react';
import { warnOnce } from '../../lib/options';
import { Avatar, AvatarGroup } from '../Avatar';
import { Badge, type BadgeTone } from '../Badge';
import { Chip, type ChipVariant } from '../Chip';
import { Progress } from '../Progress';
import { tableMutedText } from './TablePrimitives';
import type { Column, ColumnDataType } from './Table.types';

/** The value at `path` (`a.b.c`) in `row` (x-core used lodash `get`). */
export function valueAt(row: object, path: string): unknown {
    let value: unknown = row;
    for (const key of path.split('.')) {
        if (value === null || typeof value !== 'object') return undefined;
        value = (value as Record<string, unknown>)[key];
    }
    return value;
}

/** Empty for a cell: missing, null or an empty array (x-core shows "-"). */
export function isEmptyValue(value: unknown): boolean {
    return (
        value === undefined ||
        value === null ||
        (Array.isArray(value) && value.length === 0)
    );
}

const record = (value: unknown): Record<string, unknown> =>
    value !== null && typeof value === 'object'
        ? (value as Record<string, unknown>)
        : {};

const text = (value: unknown): string =>
    typeof value === 'string' || typeof value === 'number' ? String(value) : '';

/**
 * x-core/MUI palette colour names -> horizon tones. Anything else (grey,
 * default, secondary, purple, blueGrey ...) is neutral.
 */
const toneOf = (color: unknown): BadgeTone & ChipVariant => {
    switch (color) {
        case 'primary':
        case 'info':
        case 'success':
        case 'warning':
        case 'error':
            return color;
        default:
            return 'neutral';
    }
};

/** Plain text of a value whose renderer is not ported. */
const fallbackText = (value: unknown): string => {
    const r = record(value);
    for (const key of ['label', 'title', 'text', 'name'])
        if (typeof r[key] === 'string') return r[key];
    return text(value);
};

const dateFormat = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
});

/** `YYYY-MM-DD` as a local date (no UTC shift), anything else via Date. */
export function parseCellDate(value: unknown): Date | undefined {
    if (value instanceof Date) return value;
    if (typeof value === 'string') {
        const ymd = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
        if (ymd)
            return new Date(Number(ymd[1]), Number(ymd[2]) - 1, Number(ymd[3]));
    }
    if (typeof value === 'string' || typeof value === 'number') {
        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? undefined : date;
    }
    return undefined;
}

/** "Jan 05 2026" (x-core `MMM DD YYYY`). */
export function formatCellDate(date: Date): string {
    const parts = Object.fromEntries(
        dateFormat.formatToParts(date).map((p) => [p.type, p.value])
    );
    return `${parts['month']} ${parts['day']} ${parts['year']}`;
}

const priorities: Record<string, [string, ChipVariant]> = {
    low: ['Low', 'success'],
    medium: ['Medium', 'warning'],
    high: ['High', 'error'],
    critical: ['Critical', 'error'],
    non_critical: ['Non Critical', 'success'],
};

const notPorted = new Set<ColumnDataType>(['user', 'rating', 'link', 'label']);

/** Renders `value` with the built-in renderer for `type`. */
export function renderCellValue(
    type: ColumnDataType,
    value: unknown,
    column: Pick<Column, 'id'>
): ReactNode {
    if (notPorted.has(type))
        warnOnce(
            `Table: column type "${type}" is not ported; column "${column.id}" shows plain text. Use the column's render function.`
        );
    switch (type) {
        case 'numeric':
            return Array.isArray(value) ? value.length : text(value);
        case 'date': {
            const date = parseCellDate(value);
            return date ? (
                <time dateTime={date.toISOString()}>
                    {formatCellDate(date)}
                </time>
            ) : (
                text(value)
            );
        }
        case 'chip': {
            const r = record(value);
            const label = typeof value === 'string' ? value : text(r['label']);
            if (!label) return null;
            return (
                <Chip
                    size="sm"
                    label={label}
                    variant={
                        typeof value === 'string'
                            ? 'primary'
                            : toneOf(r['color'])
                    }
                    appearance={
                        r['variant'] === 'outlined' ? 'outline' : 'soft'
                    }
                />
            );
        }
        case 'status': {
            const r = record(value);
            const label = text(r['label']);
            if (!label || r['color'] === undefined) return null;
            return <Badge variant={toneOf(r['color'])}>{label}</Badge>;
        }
        case 'priority': {
            const [label, variant] =
                priorities[text(value)] ??
                (priorities['low'] as [string, ChipVariant]);
            return <Chip size="sm" label={label} variant={variant} />;
        }
        case 'titleSubtitle': {
            const r = record(value);
            return (
                <span className="hz:flex hz:flex-col hz:gap-0.5">
                    <span>{text(r['title'])}</span>
                    {r['subtitle'] !== undefined && r['subtitle'] !== null && (
                        <span className={`hz:text-caption ${tableMutedText}`}>
                            {text(r['subtitle'])}
                        </span>
                    )}
                </span>
            );
        }
        case 'avatar': {
            const people = (Array.isArray(value) ? value : []).map(record);
            return (
                <AvatarGroup max={4}>
                    {people.map((person, i) => (
                        <Avatar
                            key={`${text(person['alt'])}-${i}`}
                            size="sm"
                            alt={text(person['alt'])}
                            name={text(person['alt'])}
                            {...(typeof person['src'] === 'string' &&
                            person['src']
                                ? { src: person['src'] }
                                : {})}
                        />
                    ))}
                </AvatarGroup>
            );
        }
        case 'email': {
            const emails = (Array.isArray(value) ? value : [value])
                .map(text)
                .filter(Boolean);
            const [first, ...more] = emails;
            if (!first) return null;
            return (
                <span className="hz:inline-flex hz:items-center hz:gap-1">
                    <Chip
                        size="sm"
                        variant="neutral"
                        appearance="outline"
                        label={first}
                    />
                    {more.length > 0 && (
                        <span
                            title={more.join(', ')}
                            className="hz:text-caption"
                        >
                            <span aria-hidden="true">+{more.length}</span>
                            <span className="hz:sr-only">
                                and {more.join(', ')}
                            </span>
                        </span>
                    )}
                </span>
            );
        }
        case 'progress': {
            const r = record(value);
            const raw =
                typeof value === 'object' && value !== null
                    ? r['percentage']
                    : value;
            const percentage = Math.min(Math.max(Number(raw) || 0, 0), 100);
            const label = text(r['label']);
            return (
                <span className="hz:block hz:w-32">
                    {label ? (
                        <Progress value={percentage} label={label} showValue />
                    ) : (
                        <Progress
                            value={percentage}
                            aria-label={`${percentage}%`}
                            showValue
                        />
                    )}
                </span>
            );
        }
        case 'text':
        case 'duns': {
            const r = record(value);
            if (typeof value === 'object' && value !== null && 'text' in r)
                return (
                    <span className="hz:inline-flex hz:items-center hz:gap-1">
                        {r['icon'] as ReactNode}
                        {text(r['text'])}
                    </span>
                );
            return text(value);
        }
        default:
            return fallbackText(value);
    }
}
