import type { Meta, StoryObj } from '@storybook/react-vite';
import type { CSSProperties } from 'react';
import { expect, within } from 'storybook/test';
import * as illustrations from '../illustrations';
import { ResponsiveSpec } from './ResponsiveSpec';

/*
 * Catalog of every brand illustration. Stories are excluded from the Tailwind
 * scan, so layout uses inline styles and one small <style> block for the
 * per-breakpoint sizes (breakpoints from the tokens: 768, 1280, 1920).
 */

type Entry = readonly [
    string,
    React.ComponentType<illustrations.IllustrationProps>,
];
const all = (Object.entries(illustrations) as [string, unknown][]).map(
    ([name, component]) => [name, component] as Entry
);
const il = all.filter(([name]) => name.endsWith('IL'));
const cial = all.filter(([name]) => !name.endsWith('IL'));

const grid: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
    gap: 16,
    margin: 0,
    padding: 0,
    listStyle: 'none',
};
const cell: CSSProperties = {
    display: 'grid',
    justifyItems: 'center',
    alignContent: 'start',
    gap: 8,
    padding: 16,
    border: '1px solid var(--border)',
    borderRadius: 8,
    color: 'var(--foreground)',
    fontSize: 12,
    textAlign: 'center',
    overflowWrap: 'anywhere',
};
const heading: CSSProperties = {
    fontSize: 16,
    fontWeight: 600,
    color: 'var(--foreground)',
    margin: '0 0 12px',
};

function Group({
    title,
    entries,
}: {
    title: string;
    entries: readonly Entry[];
}) {
    return (
        <section>
            <h3 style={heading}>{title}</h3>
            <ul style={grid}>
                {entries.map(([name, Illustration]) => (
                    <li key={name} style={cell}>
                        <Illustration />
                        <span>{name}</span>
                    </li>
                ))}
            </ul>
        </section>
    );
}

const meta = {
    title: 'Foundations/Illustrations',
    parameters: {
        docs: {
            description: {
                component:
                    'Brand illustrations (CIAL and IL sets), generated from the source SVGs by `scripts/port-illustrations.ts`. Decorative (`aria-hidden`) by default; pass `title` or `aria-label` for a meaningful one. `size` sets width and height; the viewBox is kept so artwork scales without distortion.',
            },
        },
    },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/** Every illustration, grouped by brand set. */
export const Catalog: Story = {
    render: () => (
        <div style={{ display: 'grid', gap: 32 }}>
            <Group title={`CIAL (${cial.length})`} entries={cial} />
            <Group title={`IL (${il.length})`} entries={il} />
        </div>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByText('EmptyState')).toBeVisible();
        await expect(canvas.getByText('EmptyStateIL')).toBeVisible();
    },
};

/** A named illustration is exposed as an image; a decorative one is hidden. */
export const Accessible: Story = {
    render: () => (
        <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
            <illustrations.NoData size={96} title="No data available" />
            <illustrations.NoData size={96} />
        </div>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(
            canvas.getByRole('img', { name: 'No data available' })
        ).toBeVisible();
        await expect(canvas.getAllByRole('img')).toHaveLength(1);
    },
};

const responsiveCss = `
.hz-story-ill svg { inline-size: 72px; block-size: 72px; }
.hz-story-ill-grid { grid-template-columns: repeat(2, 1fr) !important; }
@media (min-width: 768px) {
    .hz-story-ill svg { inline-size: 96px; block-size: 96px; }
    .hz-story-ill-grid { grid-template-columns: repeat(3, 1fr) !important; }
}
@media (min-width: 1280px) {
    .hz-story-ill svg { inline-size: 120px; block-size: 120px; }
    .hz-story-ill-grid { grid-template-columns: repeat(4, 1fr) !important; }
}
@media (min-width: 1920px) {
    .hz-story-ill svg { inline-size: 144px; block-size: 144px; }
    .hz-story-ill-grid { grid-template-columns: repeat(6, 1fr) !important; }
}`;

/** Per-breakpoint specification (Responsive Standard). */
export const Responsive: Story = {
    render: () => (
        <div style={{ display: 'grid', gap: 24 }}>
            <style>{responsiveCss}</style>
            <ResponsiveSpec
                caption="Illustration responsive specification"
                spec={{
                    mobile: {
                        size: '72px square box (about the intrinsic 72-80px artwork).',
                        density: '16px gap between illustrations.',
                        layout: 'Two per row; never wider than the container, no overflow at 320px.',
                        contentVisibility:
                            'Decorative: aria-hidden. A captioned or empty-state illustration stays visible at all sizes.',
                        interaction: 'None (not interactive).',
                    },
                    tablet: {
                        size: '96px box.',
                        density: '16px gap.',
                        layout: 'Three per row.',
                        contentVisibility: 'Same as mobile.',
                        interaction: 'None.',
                    },
                    laptop: {
                        size: '120px box.',
                        density: '16px gap.',
                        layout: 'Four per row.',
                        contentVisibility: 'Same as mobile.',
                        interaction: 'None.',
                    },
                    desktop: {
                        size: '144px box.',
                        density: '16px gap.',
                        layout: 'Six per row.',
                        contentVisibility: 'Same as mobile.',
                        interaction: 'None.',
                        note: 'Artwork is vector: scaling is lossless. Components choose the box with `size` or CSS width/height; the viewBox keeps proportions. Illustrations do not mirror in RTL (they are not directional).',
                    },
                }}
            />
            <section>
                <h3 style={heading}>Scaling with the viewport</h3>
                <ul style={grid} className="hz-story-ill-grid">
                    {cial.slice(0, 6).map(([name, Illustration]) => (
                        <li key={name} style={cell}>
                            <span className="hz-story-ill">
                                <Illustration />
                            </span>
                            <span>{name}</span>
                        </li>
                    ))}
                </ul>
            </section>
        </div>
    ),
};
