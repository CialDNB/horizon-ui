import { describe, expect, it } from 'vitest';
import { brands, type Brand, type SemanticKey } from './brands';
import { contrastRatio } from './contrast';

const contrast = contrastRatio;

type Pair = { use: string; text: SemanticKey; surface: SemanticKey };

const tones = [
    ['neutral', 'neutral-subtle', 'neutral-strong'],
    ['primary', 'accent', 'accent-foreground'],
    ['info', 'info-subtle', 'info-strong'],
    ['success', 'success-subtle', 'success-strong'],
    ['warning', 'warning-subtle', 'warning-strong'],
    ['error', 'destructive-subtle', 'destructive-strong'],
] as const satisfies readonly (readonly [string, SemanticKey, SemanticKey])[];

const alertTones = [
    ['neutral', 'neutral-subtle', 'neutral-strong'],
    ['info', 'info-subtle', 'info-strong'],
    ['success', 'success-subtle', 'success-strong'],
    ['warning', 'warning-subtle', 'warning-strong'],
    ['error', 'destructive-subtle', 'destructive-strong'],
] as const satisfies readonly (readonly [string, SemanticKey, SemanticKey])[];

/** Every text-on-surface pair Typography, Chip and Badge render. */
const textPairs: Pair[] = [
    ...(
        [
            'foreground',
            'muted-foreground',
            'primary',
            'neutral-strong',
            'info-strong',
            'success-strong',
            'warning-strong',
            'destructive-strong',
        ] as const
    ).map((text) => ({
        use: `Typography color=${text}`,
        text,
        surface: 'background' as const,
    })),
    ...tones.flatMap(([tone, subtle, strong]): Pair[] => [
        { use: `Chip ${tone} soft`, text: strong, surface: subtle },
        { use: `Chip ${tone} outline`, text: strong, surface: 'background' },
    ]),
    // Not listed: disabled Chip (muted-foreground on muted, IL 4.34:1).
    // Inactive components are exempt from WCAG 1.4.3.
    ...tones
        .filter(([tone]) => tone !== 'primary')
        .map(([tone, , strong]) => ({
            use: `Badge count ${tone}`,
            text: 'background' as const,
            surface: strong,
        })),
    {
        use: 'Badge count primary',
        text: 'primary-foreground',
        surface: 'primary',
    },
    { use: 'Badge status label', text: 'foreground', surface: 'background' },
    { use: 'Badge ai label', text: 'primary', surface: 'background' },
    ...alertTones.flatMap(([tone, subtle, strong]): Pair[] => [
        { use: `Alert ${tone} text and icon`, text: strong, surface: subtle },
        {
            use: `Alert ${tone} tertiary Button action`,
            text: 'primary',
            surface: subtle,
        },
    ]),
    { use: 'Progress label', text: 'foreground', surface: 'background' },
    {
        use: 'Progress value',
        text: 'muted-foreground',
        surface: 'background',
    },
];

describe('semantic colour contrast (WCAG AA, 4.5:1 for text)', () => {
    it('computes the reference ratios', () => {
        expect(contrast('#FFFFFF', '#000000')).toBeCloseTo(21, 5);
        expect(contrast('#FFFFFF', '#FFFFFF')).toBe(1);
    });

    for (const brand of Object.keys(brands) as Brand[])
        it.each(textPairs)(`${brand}: $use`, ({ text, surface }) => {
            const palette = brands[brand];
            expect(
                contrast(palette[text], palette[surface])
            ).toBeGreaterThanOrEqual(4.5);
        });
});

/**
 * Non-text pairs (WCAG 1.4.11, 3:1): graphics that carry meaning on their own
 * and focus indicators, against the page background.
 */
const nonTextPairs: Pair[] = [
    { use: 'focus ring (Button, Chip)', text: 'ring', surface: 'background' },
    ...alertTones.map(([tone, subtle]) => ({
        use: `Alert ${tone} dismiss focus ring`,
        text: 'ring' as const,
        surface: subtle,
    })),
    ...(
        [
            'neutral-strong',
            'primary',
            'info-strong',
            'success-strong',
            'warning-strong',
            'destructive-strong',
        ] as const
    ).map((text) => ({
        use: `Badge dot boundary ${text}`,
        text,
        surface: 'background' as const,
    })),
    ...(
        [
            'primary',
            'neutral-strong',
            'success-strong',
            'warning-strong',
            'destructive-strong',
        ] as const
    ).flatMap((text) => [
        {
            use: `Progress ${text} indicator on the muted track`,
            text,
            surface: 'muted' as const,
        },
        {
            use: `Progress ${text} indicator on background`,
            text,
            surface: 'background' as const,
        },
    ]),
    ...(['primary', 'muted-foreground'] as const).flatMap((text) => [
        { use: `Spinner ${text} ring`, text, surface: 'background' as const },
        {
            use: `Spinner ${text} arc on the muted track`,
            text,
            surface: 'muted' as const,
        },
    ]),
];

describe('semantic non-text contrast (WCAG 1.4.11, 3:1)', () => {
    for (const brand of Object.keys(brands) as Brand[])
        it.each(nonTextPairs)(`${brand}: $use`, ({ text, surface }) => {
            const palette = brands[brand];
            expect(
                contrast(palette[text], palette[surface])
            ).toBeGreaterThanOrEqual(3);
        });
});
