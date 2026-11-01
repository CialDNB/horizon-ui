import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState, type CSSProperties } from 'react';
import { expect, userEvent, within } from 'storybook/test';
import * as icons from '../icons';
import { ResponsiveSpec } from './ResponsiveSpec';

/*
 * Catalog of the Phosphor icons re-exported from `@cialdnb/horizon-ui/icons`. Only
 * `*Icon` names are listed (the unsuffixed aliases are deprecated upstream) and
 * at most MAX_RESULTS are rendered at once. Stories are excluded from the
 * Tailwind scan, so layout uses inline styles.
 */

type IconComponent = icons.Icon;
const catalog = (Object.entries(icons) as [string, unknown][])
    .filter(([name]) => name.endsWith('Icon') && name !== 'Icon')
    .map(([name, component]) => [name, component as IconComponent] as const)
    .sort(([a], [b]) => a.localeCompare(b));

const featured = [
    'CheckIcon',
    'XIcon',
    'PlusIcon',
    'MagnifyingGlassIcon',
    'CaretDownIcon',
    'CaretRightIcon',
    'ArrowLeftIcon',
    'DownloadSimpleIcon',
    'UserIcon',
    'GearIcon',
    'WarningIcon',
    'InfoIcon',
];
const MAX_RESULTS = 48;

const grid: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(112px, 1fr))',
    gap: 12,
    margin: 0,
    padding: 0,
    listStyle: 'none',
};
const cell: CSSProperties = {
    display: 'grid',
    justifyItems: 'center',
    gap: 8,
    padding: 12,
    border: '1px solid var(--border)',
    borderRadius: 8,
    color: 'var(--foreground)',
    fontSize: 12,
    textAlign: 'center',
    overflowWrap: 'anywhere',
};

function Catalog({ names }: { names: readonly string[] }) {
    const shown = catalog.filter(([name]) => names.includes(name));
    return (
        <ul style={grid} className="hz-story-icons">
            {shown.map(([name, Icon]) => (
                <li key={name} style={cell}>
                    <Icon size={24} aria-hidden="true" />
                    <span>{name}</span>
                </li>
            ))}
        </ul>
    );
}

function Searchable() {
    const [query, setQuery] = useState('');
    const q = query.trim().toLowerCase();
    const matches = catalog.filter(([name]) => name.toLowerCase().includes(q));
    return (
        <div style={{ display: 'grid', gap: 16 }}>
            <label style={{ display: 'grid', gap: 4, maxWidth: 360 }}>
                <span style={{ fontSize: 14, color: 'var(--foreground)' }}>
                    Search {catalog.length} icons
                </span>
                <input
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    style={{
                        minHeight: 44,
                        padding: '0 12px',
                        border: '1px solid var(--border)',
                        borderRadius: 8,
                        background: 'var(--background)',
                        color: 'var(--foreground)',
                        fontSize: 16,
                    }}
                />
            </label>
            <p
                role="status"
                style={{ margin: 0, fontSize: 14, color: 'var(--foreground)' }}
            >
                {matches.length === 0
                    ? 'No icons match.'
                    : `Showing ${Math.min(matches.length, MAX_RESULTS)} of ${matches.length}.`}
            </p>
            <Catalog
                names={matches.slice(0, MAX_RESULTS).map(([name]) => name)}
            />
        </div>
    );
}

const meta = {
    title: 'Foundations/Icons',
    parameters: {
        docs: {
            description: {
                component:
                    'Icons are Phosphor (`@phosphor-icons/react`) re-exported from `@cialdnb/horizon-ui/icons`. Use the `*Icon` names. Phosphor sets no `aria-*`: pass `aria-hidden` on decorative icons and `aria-label` on meaningful ones. Directional icons need `mirrored` under `dir="rtl"`.',
            },
        },
    },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/** A few common icons, all decorative (`aria-hidden`) with the name shown as text. */
export const Featured: Story = {
    render: () => <Catalog names={featured} />,
};

/** Filter the full set by name. */
export const Search: Story = {
    render: () => <Searchable />,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.type(canvas.getByLabelText(/search/i), 'caretright');
        await expect(canvas.getByText('CaretRightIcon')).toBeVisible();
    },
};

/** Directional icons flip under `dir="rtl"` only with `mirrored`. */
export const DirectionalRtl: Story = {
    render: () => (
        <div style={{ display: 'grid', gap: 16 }}>
            {(['ltr', 'rtl'] as const).map((dir) => (
                <div
                    key={dir}
                    dir={dir}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        color: 'var(--foreground)',
                    }}
                >
                    <span style={{ minWidth: 48 }}>{dir}</span>
                    <icons.CaretRightIcon
                        size={24}
                        aria-hidden="true"
                        mirrored={dir === 'rtl'}
                    />
                    <icons.ArrowLeftIcon
                        size={24}
                        aria-hidden="true"
                        mirrored={dir === 'rtl'}
                    />
                </div>
            ))}
        </div>
    ),
};

const responsiveCss = `
.hz-story-icons { grid-template-columns: repeat(2, 1fr) !important; }
@media (min-width: 768px) { .hz-story-icons { grid-template-columns: repeat(4, 1fr) !important; } }
@media (min-width: 1280px) { .hz-story-icons { grid-template-columns: repeat(6, 1fr) !important; } }
@media (min-width: 1920px) { .hz-story-icons { grid-template-columns: repeat(8, 1fr) !important; } }`;

/** Per-breakpoint specification (Responsive Standard). */
export const Responsive: Story = {
    render: () => (
        <div style={{ display: 'grid', gap: 24 }}>
            <style>{responsiveCss}</style>
            <ResponsiveSpec
                caption="Icon catalog responsive specification"
                spec={{
                    mobile: {
                        size: 'Icons render identically at every breakpoint: the size prop (24px here) is chosen by the consuming component, never by the viewport. Search input is 44px tall with 16px type (no iOS zoom).',
                        density: '12px gap, 12px tile padding.',
                        layout: 'Catalog grid: 2 columns; search input full width up to 360px; no horizontal overflow at 320px (names wrap anywhere).',
                        contentVisibility:
                            'Name always visible under the icon; at most 48 results shown, with a status line giving the total.',
                        interaction:
                            'Tiles are not interactive (no touch target needed); icons are aria-hidden, the name is the text. The search field is the only control.',
                    },
                    tablet: {
                        size: 'Same icon size.',
                        density: 'Same.',
                        layout: '4 columns.',
                        contentVisibility: 'Same.',
                        interaction:
                            'Same; keyboard focus ring on the search field.',
                    },
                    laptop: {
                        size: 'Same icon size.',
                        density: 'Same.',
                        layout: '6 columns.',
                        contentVisibility: 'Same.',
                        interaction: 'Same.',
                    },
                    desktop: {
                        size: 'Same icon size.',
                        density: 'Same.',
                        layout: '8 columns.',
                        contentVisibility: 'Same.',
                        interaction: 'Same.',
                        note: 'Only the catalog column count changes; an icon is a fixed-size glyph and gains nothing from width.',
                    },
                }}
            />
            <Searchable />
        </div>
    ),
};
