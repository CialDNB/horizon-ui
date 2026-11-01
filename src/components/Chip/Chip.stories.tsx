import { CheckCircleIcon } from '@phosphor-icons/react/dist/csr/CheckCircle';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState, type CSSProperties, type ReactNode } from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { HorizonProvider } from '../../provider';
import { ResponsiveSpec } from '../../stories/ResponsiveSpec';
import type { Brand } from '../../tokens';
import { Chip, type ChipProps } from '.';

/*
 * Stories are excluded from the Tailwind scan (ADR 0001), so layout here uses
 * inline styles; every visual on the Chip itself comes from the component.
 */

const variants = [
    'neutral',
    'primary',
    'info',
    'success',
    'warning',
    'error',
] as const satisfies readonly NonNullable<ChipProps['variant']>[];
const appearances = ['soft', 'outline'] as const;
const sizes = ['sm', 'md'] as const;
const brandList = ['cial', 'dnb', 'il'] as const satisfies readonly Brand[];

const row: CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
};
const stack: CSSProperties = { display: 'grid', gap: 24 };
const caption: CSSProperties = {
    fontSize: 12,
    fontWeight: 600,
    color: 'var(--muted-foreground)',
    marginBlockEnd: 8,
};

function Section({ title, children }: { title: string; children: ReactNode }) {
    return (
        <section>
            <h3 style={caption}>{title}</h3>
            <div style={row}>{children}</div>
        </section>
    );
}

const meta = {
    title: 'Components/Chip',
    component: Chip,
    parameters: {
        layout: 'padded',
        docs: {
            description: {
                component: [
                    'Compact label for a status, category, filter or selected value. Ported from x-core `Chip` (MUI): `color` -> `variant` (tone), `variant="filled"`/`"outlined"` -> `appearance="soft"`/`"outline"`, `size="small"`/`"medium"` -> `sm`/`md`.',
                    '',
                    "**Look.** 24px (`md`) or 20px (`sm`) tall, 4px radius, `label/sm` type (12/16 semibold). `soft` fills with the tone's `-subtle` surface; `outline` draws a 1px inset ring in the tone colour on a transparent fill. Text is always the tone's `-strong` token (primary uses `accent`/`accent-foreground`).",
                    '',
                    '**Actions.** Static by default. `onClick` renders the label as a `<button>` whose hit area covers the whole chip; `onDelete` adds a separate remove `<button>` named `Remove <label>` (`removeLabel` to localise). Backspace or Delete on a clickable chip also removes it. Hover and press show a `currentColor` state layer (8% / 12%); keyboard focus draws the 2px `ring` around the chip.',
                    '',
                    "**Touch targets.** Visual size never changes. At mobile and on any touch pointer the action's hit area is 44px tall (and the chip at least 44px wide) and the remove button's is 44x44px; from tablet with a fine pointer they shrink to the chip height (remove: 24px).",
                    '',
                    '**Long labels** truncate with an ellipsis inside the container; the full text is in the DOM (screen readers) and in `title` while truncated.',
                ].join('\n'),
            },
        },
    },
    args: { label: 'In review' },
    argTypes: {
        variant: { control: 'select', options: variants },
        appearance: { control: 'inline-radio', options: appearances },
        size: { control: 'inline-radio', options: sizes },
    },
} satisfies Meta<typeof Chip>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Controls playground. */
export const Playground: Story = {};

/** Every tone in both appearances and both sizes. */
export const VariantsAndSizes: Story = {
    render: () => (
        <div style={stack}>
            {appearances.map((appearance) =>
                sizes.map((size) => (
                    <Section
                        key={`${appearance}-${size}`}
                        title={`${appearance} ${size}`}
                    >
                        {variants.map((variant) => (
                            <Chip
                                key={variant}
                                variant={variant}
                                appearance={appearance}
                                size={size}
                                label={variant}
                            />
                        ))}
                    </Section>
                ))
            )}
        </div>
    ),
};

/** Leading icon, clickable, deletable, both, and disabled. */
export const States: Story = {
    args: { onClick: fn(), onDelete: fn() },
    render: ({ onClick = () => undefined, onDelete = () => undefined }) => (
        <div style={stack}>
            <Section title="icon">
                <Chip
                    variant="success"
                    label="Verified"
                    icon={<CheckCircleIcon weight="fill" />}
                />
                <Chip
                    variant="success"
                    size="sm"
                    label="Verified"
                    icon={<CheckCircleIcon weight="fill" />}
                />
            </Section>
            <Section title="clickable">
                <Chip label="Open cases" onClick={onClick} />
                <Chip
                    appearance="outline"
                    variant="neutral"
                    label="Last 30 days"
                    onClick={onClick}
                />
            </Section>
            <Section title="deletable">
                <Chip variant="neutral" label="Germany" onDelete={onDelete} />
                <Chip
                    variant="info"
                    size="sm"
                    label="Manufacturing"
                    onDelete={onDelete}
                />
            </Section>
            <Section title="clickable and deletable">
                <Chip
                    label="Risk: high"
                    variant="error"
                    onClick={onClick}
                    onDelete={onDelete}
                />
            </Section>
            <Section title="disabled">
                <Chip
                    label="Archived"
                    disabled
                    onClick={onClick}
                    onDelete={onDelete}
                />
                <Chip label="Read only" variant="neutral" disabled />
            </Section>
        </div>
    ),
    play: async ({ args, canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.click(
            canvas.getByRole('button', { name: 'Open cases' })
        );
        await expect(args.onClick).toHaveBeenCalledTimes(1);
        await userEvent.click(
            canvas.getByRole('button', { name: 'Remove Germany' })
        );
        await expect(args.onDelete).toHaveBeenCalledTimes(1);
    },
};

/** Removing chips from a list: focus moves on, nothing is lost. */
export const RemovableList: Story = {
    render: function RemovableList() {
        const [items, setItems] = useState([
            'Germany',
            'France',
            'Israel',
            'United Kingdom',
        ]);
        return (
            <div style={row}>
                {items.map((item) => (
                    <Chip
                        key={item}
                        variant="neutral"
                        label={item}
                        onDelete={() =>
                            setItems((list) => list.filter((i) => i !== item))
                        }
                    />
                ))}
                {items.length === 0 && (
                    <span style={caption}>No countries selected</span>
                )}
            </div>
        );
    },
};

const longLabel =
    'Beneficial owner verification pending for the holding company';

/** Long labels truncate inside a narrow container; title shows the full text. */
export const LongLabel: Story = {
    render: () => (
        <div style={{ ...stack, inlineSize: 200, maxInlineSize: '100%' }}>
            <Chip label={longLabel} data-testid="long" />
            <Chip label={longLabel} onDelete={() => undefined} variant="info" />
            <Chip label="Short" data-testid="short" />
        </div>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const container = canvasElement.firstElementChild;
        if (!(container instanceof HTMLElement))
            throw new Error('no container');
        const limit = container.getBoundingClientRect().right + 0.5;
        for (const chip of Array.from(container.children)) {
            await expect(
                chip.getBoundingClientRect().right
            ).toBeLessThanOrEqual(limit);
        }
        await waitFor(() =>
            expect(canvas.getAllByText(longLabel)[0]).toHaveAttribute(
                'title',
                longLabel
            )
        );
        await expect(canvas.getByText('Short')).not.toHaveAttribute('title');
    },
};

/** Right-to-left: icon and remove button follow the reading direction. */
export const RTL: Story = {
    globals: { direction: 'rtl' },
    render: () => (
        <Section title="rtl">
            <Chip
                variant="success"
                label="מאומת"
                icon={<CheckCircleIcon weight="fill" />}
            />
            <Chip
                variant="neutral"
                label="ישראל"
                removeLabel="הסר ישראל"
                onDelete={() => undefined}
            />
        </Section>
    ),
};

/** All three brands side by side; the a11y check runs contrast on each. */
export const Brands: Story = {
    render: () => (
        <div style={stack}>
            {brandList.map((brand) => (
                <HorizonProvider
                    key={brand}
                    brand={brand}
                    style={{ background: 'var(--background)', padding: 16 }}
                >
                    <h3 style={{ ...caption, color: 'var(--foreground)' }}>
                        {brand}
                    </h3>
                    {appearances.map((appearance) => (
                        <div
                            key={appearance}
                            style={{ ...row, marginBlockEnd: 8 }}
                        >
                            {variants.map((variant) => (
                                <Chip
                                    key={variant}
                                    variant={variant}
                                    appearance={appearance}
                                    label={variant}
                                />
                            ))}
                        </div>
                    ))}
                </HorizonProvider>
            ))}
        </div>
    ),
};

/** Per-breakpoint specification (Responsive Standard). */
export const Responsive: Story = {
    render: () => (
        <div style={stack}>
            <ResponsiveSpec
                caption="Chip responsive specification"
                spec={{
                    mobile: {
                        size: 'Visual height md 24px, sm 20px; label/sm 12/16. Hit area: action 44px tall and the chip at least 44px wide; remove button 44x44px.',
                        density: 'Inline padding md 8px, sm 6px; icon gap 4px.',
                        layout: 'Inline; chips wrap in their container (compose with a flex-wrap gap of 8px).',
                        contentVisibility:
                            'Long labels truncate with an ellipsis; title carries the full label while truncated.',
                        interaction:
                            'Tap: press state layer; no hover look on touch. Remove via its own button.',
                    },
                    tablet: {
                        size: 'Fine pointer: hit areas shrink to the chip height (remove button 24px). Touch pointer: keeps the mobile 44px hit areas.',
                        density: 'As mobile.',
                        layout: 'As mobile.',
                        contentVisibility: 'As mobile.',
                        interaction:
                            'Pointer: hover state layer; keyboard: focus ring around the chip, Backspace/Delete removes.',
                        note: 'Gated on pointer precision, as Button, so touch tablets keep 44px targets.',
                    },
                    laptop: {
                        size: 'As tablet.',
                        density: 'As tablet.',
                        layout: 'As tablet.',
                        contentVisibility: 'As tablet.',
                        interaction: 'As tablet.',
                        note: 'Identical to tablet: a chip does not gain from more width.',
                    },
                    desktop: {
                        size: 'As tablet.',
                        density: 'As tablet.',
                        layout: 'As tablet.',
                        contentVisibility: 'As tablet.',
                        interaction: 'As tablet.',
                        note: 'Identical to tablet.',
                    },
                }}
            />
            <div style={row}>
                <Chip label="Static" />
                <Chip label="Clickable" onClick={() => undefined} />
                <Chip
                    label="Deletable"
                    variant="neutral"
                    onDelete={() => undefined}
                />
            </div>
        </div>
    ),
};

/* ---- Viewport and computed-style tests (Storybook browser project) ---- */

const viewportWidth = { mobile: 375, tablet: 768, laptop: 1280, desktop: 1920 };
type Viewport = keyof typeof viewportWidth;

function HitProbe() {
    return (
        <div style={{ ...stack, padding: 48 }}>
            {sizes.map((size) => (
                <div key={size} style={row}>
                    <Chip
                        size={size}
                        label="Open cases"
                        onClick={() => undefined}
                        data-testid={`action-${size}`}
                    />
                    <span style={{ inlineSize: 64 }} />
                    <Chip
                        size={size}
                        variant="neutral"
                        label="Germany"
                        onDelete={() => undefined}
                        data-testid={`remove-${size}`}
                    />
                    <span style={{ inlineSize: 64 }} />
                    <Chip
                        size={size}
                        label="A"
                        onClick={() => undefined}
                        data-testid={`short-${size}`}
                    />
                </div>
            ))}
        </div>
    );
}

const hit = (x: number, y: number) => document.elementFromPoint(x, y);

async function assertHitArea(canvasElement: HTMLElement, viewport: Viewport) {
    const canvas = within(canvasElement);
    await expect(window.innerWidth).toBe(viewportWidth[viewport]);
    const touch = viewport === 'mobile';
    for (const size of sizes) {
        const chip = canvas.getByTestId(`action-${size}`);
        const rect = chip.getBoundingClientRect();
        await expect(rect.height).toBe(size === 'md' ? 24 : 20);
        const action = within(chip).getByRole('button');
        // 4px above the visual edge: inside the 44px hit area only at mobile.
        const above = hit(rect.left + rect.width / 2, rect.top - 4);
        const below = hit(rect.left + rect.width / 2, rect.bottom + 4);
        if (touch) {
            await expect(above).toBe(action);
            await expect(below).toBe(action);
            await expect(hit(rect.left + rect.width / 2, rect.top - 9)).toBe(
                action
            );
        } else {
            await expect(above).not.toBe(action);
            await expect(below).not.toBe(action);
        }
        const removeChip = canvas.getByTestId(`remove-${size}`);
        const remove = within(removeChip).getByRole('button');
        const r = remove.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        if (touch) {
            for (const [dx, dy] of [
                [0, -21],
                [0, 21],
                [21, 0],
                [-21, 0],
            ] as const)
                await expect(
                    hit(cx + dx, cy + dy),
                    `remove ${size} ${dx},${dy}`
                ).toBe(remove);
        } else {
            await expect(hit(cx, cy - 21)).not.toBe(remove);
            await expect(hit(cx, cy - 11)).toBe(remove);
        }
        const short = canvas
            .getByTestId(`short-${size}`)
            .getBoundingClientRect();
        if (touch) await expect(short.width).toBeGreaterThanOrEqual(44);
        else await expect(short.width).toBeLessThan(44);
    }
    await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(
        window.innerWidth
    );
}

const viewportTest = (viewport: Viewport) => ({
    tags: ['!autodocs', '!dev'],
    globals: { viewport: { value: viewport, isRotated: false } },
    render: () => <HitProbe />,
    play: async ({ canvasElement }: { canvasElement: HTMLElement }) =>
        assertHitArea(canvasElement, viewport),
});

export const HitAreaMobile: Story = {
    ...viewportTest('mobile'),
    name: 'has 44px hit areas at mobile without changing the visual size',
};
export const HitAreaTablet: Story = {
    ...viewportTest('tablet'),
    name: 'uses visual-size hit areas with a fine pointer at tablet',
};
export const HitAreaLaptop: Story = {
    ...viewportTest('laptop'),
    name: 'uses visual-size hit areas with a fine pointer at laptop',
};
export const HitAreaDesktop: Story = {
    ...viewportTest('desktop'),
    name: 'uses visual-size hit areas with a fine pointer at desktop',
};

/** Computed styles that encode the design: size, radius, type, tone tokens, focus ring. */
export const ComputedStyles: Story = {
    name: 'applies Horizon tokens to the rendered chip',
    tags: ['!autodocs', '!dev'],
    globals: { viewport: { value: 'laptop', isRotated: false } },
    render: () => (
        <div style={row}>
            <Chip label="Soft" variant="success" data-testid="soft" />
            <Chip
                label="Outline"
                variant="success"
                appearance="outline"
                data-testid="outline"
            />
            <Chip label="Small" size="sm" data-testid="sm" />
            <Chip
                label="Action"
                onClick={() => undefined}
                data-testid="action"
            />
            <Chip
                label="Germany"
                variant="neutral"
                onDelete={() => undefined}
                data-testid="remove"
            />
            <span
                data-testid="probe"
                style={{
                    color: 'var(--success-strong)',
                    background: 'var(--success-subtle)',
                    borderColor: 'var(--success)',
                    outlineColor: 'var(--ring)',
                }}
            />
        </div>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const probe = getComputedStyle(canvas.getByTestId('probe'));
        const soft = getComputedStyle(canvas.getByTestId('soft'));
        await expect(soft.height).toBe('24px');
        await expect(soft.borderRadius).toBe('4px');
        await expect(soft.fontSize).toBe('12px');
        await expect(soft.lineHeight).toBe('16px');
        await expect(soft.fontWeight).toBe('600');
        await expect(soft.paddingInlineStart).toBe('8px');
        await expect(soft.color).toBe(probe.color);
        await expect(soft.backgroundColor).toBe(probe.backgroundColor);
        const outline = getComputedStyle(canvas.getByTestId('outline'));
        await expect(outline.backgroundColor).toBe('rgba(0, 0, 0, 0)');
        await expect(outline.boxShadow).toContain(
            `${probe.borderColor} 0px 0px 0px 1px inset`
        );
        await expect(outline.height).toBe('24px');
        const sm = getComputedStyle(canvas.getByTestId('sm'));
        await expect(sm.height).toBe('20px');
        await expect(sm.paddingInlineStart).toBe('6px');

        const action = canvas.getByTestId('action');
        await userEvent.tab();
        await expect(within(action).getByRole('button')).toHaveFocus();
        const ring = getComputedStyle(action);
        await expect(ring.outlineStyle).toBe('solid');
        await expect(ring.outlineWidth).toBe('2px');
        await expect(ring.outlineColor).toBe(probe.outlineColor);
        await expect(
            getComputedStyle(within(action).getByRole('button')).outlineStyle
        ).toBe('none');

        const remove = within(canvas.getByTestId('remove')).getByRole('button');
        await userEvent.tab();
        await expect(remove).toHaveFocus();
        const removeFocus = getComputedStyle(remove);
        await expect(removeFocus.outlineStyle).toBe('solid');
        await expect(removeFocus.outlineColor).toBe(probe.outlineColor);
        await expect(removeFocus.borderRadius).toBe('100px');
        await expect(remove.getBoundingClientRect().width).toBe(16);
    },
};
