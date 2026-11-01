import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { borderRadius, semanticKeys, spacing, typography } from '../tokens';
import { ResponsiveSpec } from './ResponsiveSpec';

const meta = {
    title: 'Foundations/Tokens',
    parameters: { layout: 'padded' },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

const grid = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(144px, 1fr))',
    gap: 16,
} as const;

const heading = { fontWeight: 700, marginBlock: '24px 12px' } as const;

/** One swatch per semantic colour key, resolved from the active brand. */
export const Colors: Story = {
    render: () => (
        <section aria-labelledby="colors-heading">
            <h2 id="colors-heading" style={heading}>
                Semantic colours
            </h2>
            <div style={grid}>
                {semanticKeys.map((key) => (
                    <figure key={key} style={{ margin: 0 }}>
                        <div
                            data-testid={`swatch-${key}`}
                            style={{
                                background: `var(--${key})`,
                                blockSize: 64,
                                borderRadius: 8,
                                border: '1px solid var(--border)',
                            }}
                        />
                        <figcaption
                            style={{ fontSize: 12, marginBlockStart: 4 }}
                        >
                            {key}
                        </figcaption>
                    </figure>
                ))}
            </div>
        </section>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        for (const key of semanticKeys) {
            const swatch = canvas.getByTestId(`swatch-${key}`);
            const color = getComputedStyle(swatch).backgroundColor;
            await expect(color).not.toBe('');
            await expect(color).not.toBe('rgba(0, 0, 0, 0)');
        }
    },
};

/** Border radius scale in px. */
export const Radius: Story = {
    render: () => (
        <section aria-labelledby="radius-heading">
            <h2 id="radius-heading" style={heading}>
                Radius
            </h2>
            <div style={grid}>
                {Object.entries(borderRadius).map(([name, px]) => (
                    <figure key={name} style={{ margin: 0 }}>
                        <div
                            style={{
                                background: 'var(--primary)',
                                blockSize: 64,
                                borderRadius: px,
                            }}
                        />
                        <figcaption
                            style={{ fontSize: 12, marginBlockStart: 4 }}
                        >
                            {name} ({px}px)
                        </figcaption>
                    </figure>
                ))}
            </div>
        </section>
    ),
};

/** Spacing scale: 4px base, steps 1 to 24. */
export const Spacing: Story = {
    render: () => (
        <section aria-labelledby="spacing-heading">
            <h2 id="spacing-heading" style={heading}>
                Spacing (4px base)
            </h2>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                {Object.entries(spacing.spacing).map(([step, px]) => (
                    <li
                        key={step}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            marginBlockEnd: 4,
                            fontSize: 12,
                        }}
                    >
                        <span style={{ inlineSize: 72 }}>
                            {step} ({px}px)
                        </span>
                        <span
                            style={{
                                background: 'var(--accent)',
                                blockSize: 12,
                                inlineSize: px,
                            }}
                        />
                    </li>
                ))}
            </ul>
        </section>
    ),
};

/** Semantic type scale, resolved from the active brand's typography. */
export const TypeScale: Story = {
    render: () => (
        <section aria-labelledby="type-heading">
            <h2 id="type-heading" style={heading}>
                Type scale
            </h2>
            {Object.keys(typography.typeScale).map((name) => {
                const token = name.replace('/', '-');
                return (
                    <p
                        key={name}
                        style={{
                            margin: '0 0 12px',
                            fontFamily: 'var(--font-family)',
                            fontSize: `var(--text-${token}-size)`,
                            lineHeight: `var(--text-${token}-line-height)`,
                            fontWeight: `var(--text-${token}-weight)`,
                        }}
                    >
                        {name}: The quick brown fox
                    </p>
                );
            })}
        </section>
    ),
};

/** Demonstrates the reusable `ResponsiveSpec` table. */
export const ResponsiveSpecExample: Story = {
    name: 'Responsive spec (example)',
    play: async ({ canvasElement }) => {
        const table = within(canvasElement).getByRole('table', {
            name: 'Example: token swatch grid',
        });
        await expect(within(table).getAllByRole('row')).toHaveLength(5);
        await expect(
            within(table)
                .getAllByRole('columnheader')
                .map((header) => header.textContent)
        ).toEqual([
            'Breakpoint',
            'Size',
            'Density',
            'Layout',
            'Content visibility',
            'Interaction pattern',
            'Note',
        ]);
        const rowNames = within(table)
            .getAllByRole('rowheader')
            .map((header) => /^[a-z]+/.exec(header.textContent ?? '')?.[0]);
        await expect(rowNames).toEqual([
            'mobile',
            'tablet',
            'laptop',
            'desktop',
        ]);
        for (const name of ['mobile', 'tablet', 'laptop', 'desktop']) {
            await expect(
                within(table).getByRole('rowheader', { name: new RegExp(name) })
            ).toBeVisible();
        }
    },
    render: () => (
        <ResponsiveSpec
            caption="Example: token swatch grid"
            spec={{
                mobile: {
                    size: '144px min swatch',
                    density: 'gap 16px',
                    layout: '2 columns',
                    contentVisibility: 'all keys',
                    interaction: 'none',
                },
                tablet: {
                    size: '144px min swatch',
                    density: 'gap 16px',
                    layout: '5 columns',
                    contentVisibility: 'all keys',
                    interaction: 'none',
                },
                laptop: {
                    size: '144px min swatch',
                    density: 'gap 16px',
                    layout: '8 columns',
                    contentVisibility: 'all keys',
                    interaction: 'none',
                },
                desktop: {
                    size: '144px min swatch',
                    density: 'gap 16px',
                    layout: '12 columns',
                    contentVisibility: 'all keys',
                    interaction: 'none',
                    note: 'Identical apart from column count.',
                },
            }}
        />
    ),
};
