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
    {
        use: 'Avatar primary initials',
        text: 'primary-foreground',
        surface: 'primary',
    },
    {
        use: 'Link inline/standalone rest',
        text: 'primary',
        surface: 'background',
    },
    {
        use: 'Link hover and active',
        text: 'primary-hover',
        surface: 'background',
    },
    {
        use: 'Link disabled (exempt, kept AA anyway)',
        text: 'muted-foreground',
        surface: 'background',
    },
    ...tones
        .filter(([tone]) => tone !== 'primary')
        .map(([tone, subtle, strong]) => ({
            use: `Avatar ${tone} initials`,
            text: strong,
            surface: subtle,
        })),
];

textPairs.push(
    { use: 'Label text', text: 'foreground', surface: 'background' },
    {
        use: 'Label disabled (exempt, kept AA anyway)',
        text: 'muted-foreground',
        surface: 'background',
    },
    {
        use: 'Label required asterisk',
        text: 'destructive-strong',
        surface: 'background',
    },
    { use: 'Input value', text: 'foreground', surface: 'background' },
    {
        use: 'Input placeholder',
        text: 'muted-foreground',
        surface: 'background',
    },
    { use: 'Textarea value', text: 'foreground', surface: 'background' },
    {
        use: 'Textarea placeholder',
        text: 'muted-foreground',
        surface: 'background',
    },
    {
        use: 'FormField description',
        text: 'muted-foreground',
        surface: 'background',
    },
    {
        use: 'FormField error text and icon',
        text: 'destructive-strong',
        surface: 'background',
    },
    {
        use: 'Checkbox/Radio/Switch label',
        text: 'foreground',
        surface: 'background',
    },
    { use: 'Select value', text: 'foreground', surface: 'background' },
    {
        use: 'Select placeholder',
        text: 'muted-foreground',
        surface: 'background',
    },
    { use: 'Select option', text: 'popover-foreground', surface: 'popover' },
    {
        use: 'Select highlighted option',
        text: 'accent-foreground',
        surface: 'accent',
    },
    {
        use: 'Select group label and empty message',
        text: 'muted-foreground',
        surface: 'popover',
    },
    { use: 'popover text', text: 'popover-foreground', surface: 'popover' },
    { use: 'popover muted text', text: 'muted-foreground', surface: 'popover' },
    { use: 'Tooltip text', text: 'tooltip-foreground', surface: 'tooltip' },
    { use: 'Overlay title and body', text: 'foreground', surface: 'popover' },
    {
        use: 'DropdownMenu destructive item',
        text: 'destructive-strong',
        surface: 'popover',
    },
    {
        use: 'DropdownMenu highlighted destructive item',
        text: 'destructive-strong',
        surface: 'destructive-subtle',
    },
    // Muted shortcut/icon text on the accent highlight is 2.9:1 in il, so
    // highlighted rows switch it to accent-foreground.
    {
        use: 'DropdownMenu highlighted row shortcut and icon',
        text: 'accent-foreground',
        surface: 'accent',
    },
    {
        use: 'DropdownMenu shortcut',
        text: 'muted-foreground',
        surface: 'popover',
    }
);

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

// IconButton: the icon is the only content (a graphic: 3:1), per variant at
// rest and on hover/press; `secondary` also needs its border to show.
nonTextPairs.push(
    ...(
        [
            ['primary', 'primary-foreground', 'primary'],
            ['primary hover', 'primary-foreground', 'primary-hover'],
            ['secondary', 'primary', 'background'],
            ['secondary border', 'primary', 'background'],
            ['secondary hover', 'primary-foreground', 'primary'],
            ['tertiary', 'primary', 'background'],
            ['tertiary hover', 'accent-foreground', 'accent'],
            ['destructive', 'destructive-foreground', 'destructive'],
            [
                'destructive hover',
                'destructive-foreground',
                'destructive-hover',
            ],
            ['ghost', 'foreground', 'background'],
            ['ghost hover', 'accent-foreground', 'accent'],
            ['focus ring', 'ring', 'background'],
        ] as const
    ).map(([use, text, surface]) => ({
        use: `IconButton ${use} icon`,
        text,
        surface,
    }))
);

// Form controls (Task 11a): the control boundary must be visible (3:1) on the
// page and on popover surfaces.
nonTextPairs.push(
    {
        use: 'form control boundary (Input, Select trigger, Checkbox, Radio, Switch off track)',
        text: 'control-border',
        surface: 'background',
    },
    { use: 'Input hover ring', text: 'primary', surface: 'background' },
    { use: 'Input focus ring (2px)', text: 'ring', surface: 'background' },
    { use: 'Input invalid ring', text: 'destructive', surface: 'background' },
    {
        use: 'Input invalid icon',
        text: 'destructive-strong',
        surface: 'background',
    },
    {
        use: 'Input clear/adornment icon',
        text: 'muted-foreground',
        surface: 'background',
    },
    { use: 'Textarea focus ring', text: 'ring', surface: 'background' },
    {
        use: 'Textarea invalid ring',
        text: 'destructive',
        surface: 'background',
    },
    {
        use: 'Checkbox box (unchecked)',
        text: 'control-border',
        surface: 'background',
    },
    { use: 'Checkbox hover ring', text: 'primary', surface: 'background' },
    { use: 'Checkbox checked fill', text: 'primary', surface: 'background' },
    {
        use: 'Checkbox check mark on the fill',
        text: 'primary-foreground',
        surface: 'primary',
    },
    {
        use: 'Checkbox check mark on the hover fill',
        text: 'primary-foreground',
        surface: 'primary-hover',
    },
    {
        use: 'Checkbox invalid ring',
        text: 'destructive',
        surface: 'background',
    },
    { use: 'Checkbox focus ring', text: 'ring', surface: 'background' },
    {
        use: 'Radio circle (unchecked)',
        text: 'control-border',
        surface: 'background',
    },
    {
        use: 'Radio checked ring and dot',
        text: 'primary',
        surface: 'background',
    },
    {
        use: 'Radio invalid ring and dot',
        text: 'destructive',
        surface: 'background',
    },
    { use: 'Switch off track', text: 'control-border', surface: 'background' },
    { use: 'Switch on track', text: 'primary', surface: 'background' },
    {
        use: 'Switch thumb on the off track',
        text: 'background',
        surface: 'control-border',
    },
    {
        use: 'Switch thumb on the on track',
        text: 'background',
        surface: 'primary',
    },
    {
        use: 'Switch thumb on the hovered on track',
        text: 'background',
        surface: 'primary-hover',
    },
    { use: 'Switch focus ring', text: 'ring', surface: 'background' },
    { use: 'Select selected check', text: 'primary', surface: 'popover' },
    {
        use: 'Select selected check, highlighted',
        text: 'primary',
        surface: 'accent',
    },
    {
        use: 'Select trigger focus/open ring',
        text: 'ring',
        surface: 'background',
    },
    {
        use: 'form control boundary on a popover',
        text: 'control-border',
        surface: 'popover',
    }
);

// Task 11c: Combobox, SearchBar, SplitButton, Filter, EmailsField, NumberInput.
textPairs.push(
    {
        use: 'Filter pill at rest',
        text: 'accent-foreground',
        surface: 'accent',
    },
    {
        use: 'Filter pill open or pressed',
        text: 'primary-foreground',
        surface: 'primary',
    },
    {
        use: 'Filter count bubble',
        text: 'primary-foreground',
        surface: 'primary',
    },
    {
        use: 'Filter count bubble on the open pill',
        text: 'primary',
        surface: 'primary-foreground',
    },
    {
        use: 'Filter total bubble',
        text: 'accent-foreground',
        surface: 'background',
    },
    {
        use: 'EmailsField chip (primary soft)',
        text: 'accent-foreground',
        surface: 'accent',
    },
    {
        use: 'EmailsField invalid message',
        text: 'destructive-strong',
        surface: 'background',
    },
    {
        use: 'EmailsField counter',
        text: 'muted-foreground',
        surface: 'background',
    },
    {
        use: 'Combobox/SearchBar/EmailsField/NumberInput value',
        text: 'foreground',
        surface: 'background',
    },
    {
        use: 'Combobox/SearchBar/EmailsField/NumberInput placeholder',
        text: 'muted-foreground',
        surface: 'background',
    },
    { use: 'Combobox option', text: 'popover-foreground', surface: 'popover' },
    {
        use: 'Combobox highlighted option and its description',
        text: 'accent-foreground',
        surface: 'accent',
    },
    {
        use: 'Combobox group label, description, empty/loading message',
        text: 'muted-foreground',
        surface: 'popover',
    },
    {
        use: 'Combobox/EmailsField chip (neutral soft)',
        text: 'neutral-strong',
        surface: 'neutral-subtle',
    }
);
nonTextPairs.push(
    { use: 'Filter pill hover ring', text: 'primary', surface: 'accent' },
    {
        use: 'NumberInput stepper and Combobox toggle icons',
        text: 'muted-foreground',
        surface: 'background',
    },
    { use: 'SearchBar search icon', text: 'primary', surface: 'background' },
    {
        use: 'SearchBar search icon hover',
        text: 'primary-hover',
        surface: 'background',
    },
    {
        use: 'Combobox selected check on the list',
        text: 'primary',
        surface: 'popover',
    },
    {
        use: 'Combobox selected check on a highlighted row',
        text: 'primary',
        surface: 'accent',
    },
    {
        use: 'Combobox multi-select box boundary',
        text: 'control-border',
        surface: 'popover',
    },
    {
        // control-border on accent is below 3:1 for dnb and il: the box
        // switches to accent-foreground on a highlighted row.
        use: 'Combobox multi-select box boundary on a highlighted row',
        text: 'accent-foreground',
        surface: 'accent',
    },
    {
        use: 'Combobox multi-select checked box fill',
        text: 'primary',
        surface: 'popover',
    },
    {
        use: 'Combobox multi-select check on its fill',
        text: 'primary-foreground',
        surface: 'primary',
    }
);

// Task 12a: Pagination.
textPairs.push(
    {
        use: 'Pagination page number',
        text: 'foreground',
        surface: 'background',
    },
    {
        use: 'Pagination page number, hover',
        text: 'accent-foreground',
        surface: 'accent',
    },
    {
        use: 'Pagination current page',
        text: 'primary-foreground',
        surface: 'primary',
    },
    {
        use: 'Pagination current page, hover',
        text: 'primary-foreground',
        surface: 'primary-hover',
    },
    {
        use: 'Pagination range text and indicator',
        text: 'foreground',
        surface: 'background',
    },
    {
        use: 'Pagination rows-per-page label and ellipsis',
        text: 'muted-foreground',
        surface: 'background',
    }
);
nonTextPairs.push(
    {
        use: 'Pagination arrows (ghost IconButton)',
        text: 'foreground',
        surface: 'background',
    },
    {
        use: 'Pagination current page fill',
        text: 'primary',
        surface: 'background',
    },
    { use: 'Pagination focus ring', text: 'ring', surface: 'background' }
);

// Task 12a: Table (opaque surfaces; zebra and hover mixes are tested below).
textPairs.push(
    { use: 'Table cell text', text: 'foreground', surface: 'background' },
    {
        use: 'Table secondary text and stacked labels',
        text: 'muted-foreground',
        surface: 'background',
    },
    {
        use: 'Table header text',
        text: 'neutral-strong',
        surface: 'neutral-subtle',
    },
    {
        use: 'Table selected row text (muted text switches too)',
        text: 'accent-foreground',
        surface: 'accent',
    },
    {
        use: 'Table caption and footer',
        text: 'foreground',
        surface: 'background',
    },
    {
        use: 'Table empty state',
        text: 'muted-foreground',
        surface: 'background',
    },
    {
        use: 'Table error state',
        text: 'destructive-strong',
        surface: 'background',
    }
);
nonTextPairs.push(
    {
        use: 'Table selected row bar (inline start)',
        text: 'primary',
        surface: 'accent',
    },
    {
        use: 'Table header separator',
        text: 'control-border',
        surface: 'background',
    },
    {
        use: 'Table header separator against the header fill',
        text: 'control-border',
        surface: 'neutral-subtle',
    },
    {
        use: 'Table sort icon and stacked sort pill border',
        text: 'neutral-strong',
        surface: 'neutral-subtle',
    },
    {
        use: 'Table stacked sort pill border',
        text: 'control-border',
        surface: 'background',
    },
    { use: 'Table focus ring on a row', text: 'ring', surface: 'background' },
    {
        use: 'Table focus ring on a selected row',
        text: 'ring',
        surface: 'accent',
    }
    // Not listed: row dividers and stacked card borders (`border`, 1.2:1)
    // are decorative: rows are identified by alignment and the text itself
    // (WCAG 1.4.11 does not apply). Skeleton bars are aria-hidden.
);

describe('semantic non-text contrast (WCAG 1.4.11, 3:1)', () => {
    for (const brand of Object.keys(brands) as Brand[])
        it.each(nonTextPairs)(`${brand}: $use`, ({ text, surface }) => {
            const palette = brands[brand];
            expect(
                contrast(palette[text], palette[surface])
            ).toBeGreaterThanOrEqual(3);
        });
});

/** Opacity at the low point of the reduced-motion Progress pulse (index.css). */
const PROGRESS_PULSE_MIN_OPACITY = 0.75;

/** `top` at `alpha` composited over an opaque `bottom` (sRGB hex). */
function over(top: string, bottom: string, alpha: number): string {
    const rgb = (h: string) =>
        [1, 3, 5].map((i) => Number.parseInt(h.slice(i, i + 2), 16));
    const b = rgb(bottom);
    return `#${rgb(top)
        .map((v, i) =>
            Math.round(v * alpha + (b[i] ?? 0) * (1 - alpha))
                .toString(16)
                .padStart(2, '0')
        )
        .join('')}`;
}

describe('Progress reduced-motion pulse keeps 3:1 against the track at its low point', () => {
    for (const brand of Object.keys(brands) as Brand[])
        it.each([
            'primary',
            'neutral-strong',
            'success-strong',
            'warning-strong',
            'destructive-strong',
        ] as const)(`${brand}: %s`, (fill) => {
            const p = brands[brand];
            expect(
                contrast(
                    over(p[fill], p.muted, PROGRESS_PULSE_MIN_OPACITY),
                    p.muted
                )
            ).toBeGreaterThanOrEqual(3);
        });
});

/** Table row surfaces: sRGB mixes painted by the cells (TablePrimitives.tsx). */
const TABLE_ZEBRA_MUTED = 0.3;
const TABLE_HOVER_ACCENT = 0.5;

describe('Table zebra and hover surfaces (mixed over background)', () => {
    for (const brand of Object.keys(brands) as Brand[]) {
        const p = brands[brand];
        const zebra = over(p.muted, p.background, TABLE_ZEBRA_MUTED);
        const hover = over(p.accent, p.background, TABLE_HOVER_ACCENT);
        it.each([
            ['zebra: cell text', p.foreground, zebra],
            ['zebra: secondary text', p['muted-foreground'], zebra],
            [
                'hover: text (switched to accent-foreground)',
                p['accent-foreground'],
                hover,
            ],
        ])(`${brand}: %s (4.5:1)`, (_use, text, surface) => {
            expect(contrast(text, surface)).toBeGreaterThanOrEqual(4.5);
        });
        it.each([
            ['hover: focus ring', p.ring, hover],
            ['zebra: focus ring', p.ring, zebra],
        ])(`${brand}: %s (3:1)`, (_use, line, surface) => {
            expect(contrast(line, surface)).toBeGreaterThanOrEqual(3);
        });
    }
});
