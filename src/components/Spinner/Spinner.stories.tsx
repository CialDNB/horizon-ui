import type { Meta, StoryObj } from '@storybook/react-vite';
import type { CSSProperties, ReactNode } from 'react';
import { expect, within } from 'storybook/test';
import { HorizonProvider } from '../../provider';
import { ResponsiveSpec } from '../../stories/ResponsiveSpec';
import type { Brand } from '../../tokens';
import { Button } from '../Button';
import { Spinner, type SpinnerSize, type SpinnerTone } from '.';

/*
 * Stories are excluded from the Tailwind scan (ADR 0001), so layout here uses
 * inline styles; every visual on the Spinner itself comes from the component.
 */

const sizes = [
    'xs',
    'sm',
    'md',
    'lg',
    'xl',
] as const satisfies readonly SpinnerSize[];
const tones = [
    'primary',
    'muted',
    'inherit',
] as const satisfies readonly SpinnerTone[];
const brandList = ['cial', 'dnb', 'il'] as const satisfies readonly Brand[];
const px: Record<SpinnerSize, number> = {
    xs: 12,
    sm: 16,
    md: 20,
    lg: 24,
    xl: 40,
};

const row: CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 16,
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
    title: 'Components/Spinner',
    component: Spinner,
    parameters: {
        layout: 'padded',
        docs: {
            description: {
                component: [
                    'Loading indicator. Ported from x-core `CircularProgress` (MUI): `size={n}` becomes a size step, `color` becomes `tone`, `variant="determinate" value` becomes `value`.',
                    '',
                    "**Look.** Indeterminate: a three-quarter ring in `currentColor` (the inline-end quarter is open, so it mirrors in RTL) turning once a second, the same ring the loading Button shows. Sizes `xs` 12, `sm` 16, `md` 20, `lg` 24, `xl` 40px (x-core default); stroke 2px, 3px at `xl`. Tones: `primary`, `muted` (`muted-foreground`), `inherit`. Determinate (`value` 0..100): an arc starting at 12 o'clock on a `muted` track (`inherit`: the current colour at 25%), the arc moving over `duration.slow` with `easing.standard`.",
                    '',
                    '**Motion.** `prefers-reduced-motion: reduce` slows the ring to one turn every 3 seconds instead of freezing it: a frozen spinner reads as a hung page, and a slow small rotation is not a vestibular trigger. The ring is marked `data-hz-motion="essential"` so the scoped base stylesheet does not stop it.',
                    '',
                    '**Accessibility.** `role="progressbar"` named by `label` ("Loading" by default: translate it) or `aria-labelledby`; determinate adds `aria-valuenow` (rounded), `aria-valuemin` 0, `aria-valuemax` 100. Inside a control that already reports busy (Button `loading` sets `aria-busy`), pass `aria-hidden="true"`: the spinner drops its role and name. For a region that is loading, also set `aria-busy` on the region.',
                ].join('\n'),
            },
        },
    },
    argTypes: {
        size: { control: 'inline-radio', options: sizes },
        tone: { control: 'inline-radio', options: tones },
        value: { control: { type: 'range', min: 0, max: 100 } },
    },
} satisfies Meta<typeof Spinner>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Controls playground. */
export const Playground: Story = {};

/** Every size in every tone (`inherit` shown on primary text). */
export const SizesAndTones: Story = {
    render: () => (
        <div style={stack}>
            {tones.map((tone) => (
                <Section key={tone} title={tone}>
                    <span
                        style={{
                            ...row,
                            color:
                                tone === 'inherit'
                                    ? 'var(--primary)'
                                    : undefined,
                        }}
                    >
                        {sizes.map((size) => (
                            <Spinner
                                key={size}
                                size={size}
                                tone={tone}
                                label={`Loading ${size}`}
                            />
                        ))}
                    </span>
                </Section>
            ))}
        </div>
    ),
};

/** Determinate rings (x-core `variant="determinate"`). */
export const Determinate: Story = {
    render: () => (
        <div style={stack}>
            {sizes.map((size) => (
                <Section key={size} title={size}>
                    {[0, 25, 50, 75, 100].map((value) => (
                        <Spinner
                            key={value}
                            size={size}
                            value={value}
                            label={`Upload ${value}%`}
                        />
                    ))}
                </Section>
            ))}
        </div>
    ),
};

/** In context: inline with text, inside a loading Button, as a section loader. */
export const InContext: Story = {
    render: () => (
        <div style={stack}>
            <p
                style={{
                    ...row,
                    gap: 8,
                    margin: 0,
                    color: 'var(--muted-foreground)',
                    fontSize: 14,
                }}
            >
                <Spinner size="sm" tone="muted" label="Refreshing ratings" />
                Refreshing ratings…
            </p>
            <div style={row}>
                <Button loading>Save changes</Button>
                <Button variant="secondary" loading>
                    Export
                </Button>
            </div>
            <div
                aria-busy="true"
                style={{
                    display: 'grid',
                    placeItems: 'center',
                    blockSize: 160,
                    border: '1px solid var(--border)',
                    borderRadius: 16,
                }}
            >
                <Spinner label="Loading company report" />
            </div>
        </div>
    ),
};

/** Right-to-left: the open quarter sits on the inline end (left). */
export const RTL: Story = {
    globals: { direction: 'rtl' },
    render: () => (
        <Section title="rtl">
            <Spinner size="lg" label="טוען" />
            <Spinner size="lg" value={60} label="התקדמות" />
            <Button loading>שמירה</Button>
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
                    <div style={row}>
                        <Spinner size="lg" label={`${brand} loading`} />
                        <Spinner
                            size="lg"
                            tone="muted"
                            label={`${brand} muted loading`}
                        />
                        <Spinner size="lg" value={65} label={`${brand} 65%`} />
                        <Button loading>Save</Button>
                    </div>
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
                caption="Spinner responsive specification"
                spec={{
                    mobile: {
                        size: 'Fixed per size step: 12/16/20/24/40px, stroke 2px (3px at xl). No step change by breakpoint.',
                        density:
                            'No padding of its own; spacing belongs to the host (inline gap 8px recommended).',
                        layout: 'Inline-block, vertically centred on the text line; section loaders centre it in the region.',
                        contentVisibility:
                            'Name is screen-reader only ("Loading" by default); no visible text.',
                        interaction:
                            'Not interactive, never a touch target. Reduced motion: one turn per 3s instead of 1s.',
                    },
                    tablet: {
                        size: 'As mobile.',
                        density: 'As mobile.',
                        layout: 'As mobile.',
                        contentVisibility: 'As mobile.',
                        interaction: 'As mobile.',
                        note: 'Identical at all four: the size is chosen by the host context (button, field, section), which already adapts by breakpoint; a spinner that changed size on its own would jump next to its host.',
                    },
                    laptop: {
                        size: 'As mobile.',
                        density: 'As mobile.',
                        layout: 'As mobile.',
                        contentVisibility: 'As mobile.',
                        interaction: 'As mobile.',
                        note: 'Identical (see tablet).',
                    },
                    desktop: {
                        size: 'As mobile.',
                        density: 'As mobile.',
                        layout: 'As mobile.',
                        contentVisibility: 'As mobile.',
                        interaction: 'As mobile.',
                        note: 'Identical (see tablet).',
                    },
                }}
            />
            <div style={row}>
                {sizes.map((size) => (
                    <Spinner key={size} size={size} label={`Loading ${size}`} />
                ))}
            </div>
        </div>
    ),
};

/* ---- Viewport and computed-style tests (Storybook browser project) ---- */

const viewportWidth = { mobile: 375, tablet: 768, laptop: 1280, desktop: 1920 };
type Viewport = keyof typeof viewportWidth;

function GeometryProbe({ dir }: { dir: 'ltr' | 'rtl' }) {
    return (
        <HorizonProvider dir={dir} style={{ padding: 16 }}>
            <div style={row}>
                {sizes.map((size) => (
                    <Spinner
                        key={size}
                        size={size}
                        label={`${dir} ${size}`}
                        data-testid={`${dir}-${size}`}
                    />
                ))}
                <Spinner
                    size="xl"
                    value={30}
                    label={`${dir} determinate`}
                    data-testid={`${dir}-ring`}
                />
            </div>
        </HorizonProvider>
    );
}

async function assertGeometry(canvasElement: HTMLElement, viewport: Viewport) {
    const canvas = within(canvasElement);
    await expect(window.innerWidth).toBe(viewportWidth[viewport]);
    for (const dir of ['ltr', 'rtl'] as const) {
        for (const size of sizes) {
            const el = canvas.getByTestId(`${dir}-${size}`);
            // Layout box (offset size ignores the rotation transform).
            await expect(el.offsetWidth).toBe(px[size]);
            await expect(el.offsetHeight).toBe(px[size]);
            const cs = getComputedStyle(el);
            // The open quarter is the inline end: right in LTR, left in RTL.
            const open =
                dir === 'ltr' ? cs.borderRightColor : cs.borderLeftColor;
            const closed =
                dir === 'ltr' ? cs.borderLeftColor : cs.borderRightColor;
            await expect(open).toBe('rgba(0, 0, 0, 0)');
            await expect(closed).toBe(cs.color);
        }
        const ring = canvas.getByTestId(`${dir}-ring`);
        await expect(ring.offsetWidth).toBe(40);
    }
    await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(
        window.innerWidth
    );
}

const viewportTest = (viewport: Viewport) => ({
    tags: ['!autodocs', '!dev'],
    globals: { viewport: { value: viewport, isRotated: false } },
    render: () => (
        <div style={stack}>
            <GeometryProbe dir="ltr" />
            <GeometryProbe dir="rtl" />
        </div>
    ),
    play: async ({ canvasElement }: { canvasElement: HTMLElement }) =>
        assertGeometry(canvasElement, viewport),
});

export const GeometryMobile: Story = {
    ...viewportTest('mobile'),
    name: 'keeps every size and opens on the inline end at mobile',
};
export const GeometryTablet: Story = {
    ...viewportTest('tablet'),
    name: 'keeps every size and opens on the inline end at tablet',
};
export const GeometryLaptop: Story = {
    ...viewportTest('laptop'),
    name: 'keeps every size and opens on the inline end at laptop',
};
export const GeometryDesktop: Story = {
    ...viewportTest('desktop'),
    name: 'keeps every size and opens on the inline end at desktop',
};

/** Computed styles that encode the design: tokens, stroke, animation. */
export const ComputedStyles: Story = {
    name: 'applies Horizon tokens and the hz-spin animation',
    tags: ['!autodocs', '!dev'],
    globals: { viewport: { value: 'laptop', isRotated: false } },
    render: () => (
        <div style={row}>
            <Spinner data-testid="xl" />
            <Spinner size="sm" tone="muted" data-testid="muted" />
            <span style={{ color: 'rgb(1, 2, 3)' }}>
                <Spinner size="sm" tone="inherit" data-testid="inherit" />
            </span>
            <Spinner value={25} size="xl" data-testid="ring" />
            <Button loading data-testid="button">
                Save
            </Button>
            <span
                data-testid="probe"
                style={{
                    color: 'var(--primary)',
                    background: 'var(--muted)',
                    borderColor: 'var(--muted-foreground)',
                }}
            />
        </div>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const probe = getComputedStyle(canvas.getByTestId('probe'));

        const xl = getComputedStyle(canvas.getByTestId('xl'));
        await expect(xl.color).toBe(probe.color);
        await expect(xl.borderTopWidth).toBe('3px');
        await expect(xl.borderRadius).toBe('100px');
        await expect(xl.animationName).toBe('hz-spin');
        await expect(xl.animationDuration).toBe('1s');
        await expect(xl.animationIterationCount).toBe('infinite');
        await expect(xl.animationTimingFunction).toBe('linear');
        await expect(xl.verticalAlign).toBe('middle');

        const muted = getComputedStyle(canvas.getByTestId('muted'));
        await expect(muted.color).toBe(probe.borderColor);
        await expect(muted.borderTopWidth).toBe('2px');
        await expect(
            getComputedStyle(canvas.getByTestId('inherit')).color
        ).toBe('rgb(1, 2, 3)');

        const ring = canvas.getByTestId('ring');
        await expect(getComputedStyle(ring).animationName).toBe('none');
        await expect(getComputedStyle(ring).borderTopWidth).toBe('0px');
        const [track, arc] = Array.from(ring.querySelectorAll('circle'));
        if (!track || !arc) throw new Error('ring circles missing');
        await expect(getComputedStyle(track).stroke).toBe(
            probe.backgroundColor
        );
        await expect(getComputedStyle(arc).stroke).toBe(probe.color);
        await expect(getComputedStyle(arc).strokeWidth).toBe('3px');
        await expect(arc.getAttribute('stroke-dashoffset')).toBe('75');

        // The loading Button reuses the same ring, decorative.
        const button = canvas.getByTestId('button');
        const inner = button.querySelector('[data-hz-motion="essential"]');
        if (!(inner instanceof HTMLElement)) throw new Error('no spinner');
        await expect(inner).toHaveAttribute('aria-hidden', 'true');
        await expect(inner).not.toHaveAttribute('role');
        await expect(inner.offsetWidth).toBe(16);
        await expect(getComputedStyle(inner).animationName).toBe('hz-spin');
    },
};
