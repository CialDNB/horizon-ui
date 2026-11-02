import type { Meta, StoryObj } from '@storybook/react-vite';
import type { CSSProperties, ReactNode } from 'react';
import { expect, within } from 'storybook/test';
import { HorizonProvider } from '../../provider';
import { ResponsiveSpec } from '../../stories/ResponsiveSpec';
import type { Brand } from '../../tokens';
import { Progress, type ProgressSize, type ProgressVariant } from '.';

/*
 * Stories are excluded from the Tailwind scan (ADR 0001), so layout here uses
 * inline styles; every visual on the Progress itself comes from the component.
 */

const variants = [
    'primary',
    'neutral',
    'success',
    'warning',
    'error',
] as const satisfies readonly ProgressVariant[];
const sizes = ['sm', 'md'] as const satisfies readonly ProgressSize[];
const brandList = ['cial', 'dnb', 'il'] as const satisfies readonly Brand[];

const stack: CSSProperties = { display: 'grid', gap: 24, maxInlineSize: 480 };
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
            <div style={{ display: 'grid', gap: 16 }}>{children}</div>
        </section>
    );
}

const meta = {
    title: 'Components/Progress',
    component: Progress,
    parameters: {
        layout: 'padded',
        docs: {
            description: {
                component: [
                    'Linear progress bar. Ported from x-core `LinearProgress` (MUI): `variant="determinate" value` becomes `value` (omit it for indeterminate), `color` becomes `variant`.',
                    '',
                    '**Look.** A `muted` track, fully rounded, 4px (`sm`, MUI height) or 8px (`md`). The indicator is `primary` or a tone `-strong` shade (`neutral`, `success`, `warning`, `error`), each at least 3:1 against the track and the page (WCAG 1.4.11). Optional `label` (`label/md`, `foreground`) above the bar and `showValue` (rounded percentage, `body/secondary`, `muted-foreground`, tabular figures) at the end of the label row. Value changes slide over `duration.slow` with `easing.standard`; the fill grows from the inline start (right in RTL).',
                    '',
                    '**Indeterminate.** A 40% segment travels across the track every 1.5s (`easing.standard`). Under `prefers-reduced-motion` the full bar pulses its opacity every 2s instead: still visibly busy, no movement.',
                    '',
                    '**Accessibility.** `role="progressbar"` with `aria-valuenow` (clamped), `aria-valuemin` 0 and `aria-valuemax` (`max`); indeterminate omits `aria-valuenow`. It must be named: `label` (visible, wired with `aria-labelledby`), `aria-label` or `aria-labelledby` (the type requires one). `aria-valuetext` ("3 of 5 steps") and `aria-describedby` reach the bar; the printed percentage is `aria-hidden` because the bar already exposes its value.',
                ].join('\n'),
            },
        },
    },
    args: { value: 45, label: 'Profile completion', showValue: true },
    argTypes: {
        variant: { control: 'inline-radio', options: variants },
        size: { control: 'inline-radio', options: sizes },
        value: { control: { type: 'range', min: 0, max: 100 } },
    },
} satisfies Meta<typeof Progress>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Controls playground. */
export const Playground: Story = {};

/** Every indicator colour in both sizes. */
export const VariantsAndSizes: Story = {
    render: () => (
        <div style={stack}>
            {sizes.map((size) => (
                <Section key={size} title={size}>
                    {variants.map((variant, i) => (
                        <Progress
                            key={variant}
                            size={size}
                            variant={variant}
                            value={20 + i * 18}
                            label={variant}
                            showValue
                        />
                    ))}
                </Section>
            ))}
        </div>
    ),
};

/** Determinate states from empty to complete, and the indeterminate bar. */
export const States: Story = {
    render: () => (
        <div style={stack}>
            <Progress value={0} label="Not started" showValue />
            <Progress
                value={3}
                max={5}
                label="Evaluation steps"
                showValue
                aria-valuetext="3 of 5 steps"
            />
            <Progress
                value={100}
                variant="success"
                label="Upload complete"
                showValue
            />
            <Progress label="Preparing export" />
            <Progress size="md" aria-label="Loading results" />
        </div>
    ),
};

/** Long labels wrap; the percentage stays on the first line end. */
export const LongLabel: Story = {
    render: () => (
        <div style={{ ...stack, inlineSize: 240, maxInlineSize: '100%' }}>
            <Progress
                value={72}
                showValue
                label="Waiting for the company to submit the remaining questionnaire answers and documents"
            />
            <Progress
                value={12}
                showValue
                label="Supercalifragilisticexpialidocious_reference_number_000123"
            />
        </div>
    ),
    play: async ({ canvasElement }) => {
        const container = canvasElement.firstElementChild;
        if (!(container instanceof HTMLElement))
            throw new Error('no container');
        const limit = container.getBoundingClientRect().right + 0.5;
        for (const el of Array.from(container.querySelectorAll('span, [role]')))
            await expect(el.getBoundingClientRect().right).toBeLessThanOrEqual(
                limit
            );
    },
};

/** Right-to-left: the fill grows from the right, the segment travels leftwards. */
export const RTL: Story = {
    globals: { direction: 'rtl' },
    render: () => (
        <div style={stack}>
            <Progress value={30} label="השלמת פרופיל" showValue />
            <Progress label="מכין ייצוא" />
        </div>
    ),
};

/** All three brands side by side; the a11y check runs contrast on each. */
export const Brands: Story = {
    render: () => (
        <div style={{ display: 'grid', gap: 24 }}>
            {brandList.map((brand) => (
                <HorizonProvider
                    key={brand}
                    brand={brand}
                    style={{ background: 'var(--background)', padding: 16 }}
                >
                    <div style={stack}>
                        {variants.map((variant) => (
                            <Progress
                                key={variant}
                                variant={variant}
                                value={60}
                                label={`${brand} ${variant}`}
                                showValue
                            />
                        ))}
                    </div>
                </HorizonProvider>
            ))}
        </div>
    ),
};

/** Per-breakpoint specification (Responsive Standard). */
export const Responsive: Story = {
    render: () => (
        <div style={{ display: 'grid', gap: 24 }}>
            <ResponsiveSpec
                caption="Progress responsive specification"
                spec={{
                    mobile: {
                        size: 'Track 4px (sm) or 8px (md); label 14/20 semibold, value 14px.',
                        density:
                            'Label row 8px above the track; 12px between label and value.',
                        layout: 'Fills its container width. Long labels wrap (break anywhere); the value stays at the end of the first line.',
                        contentVisibility:
                            'Label and value always shown when given; nothing truncates.',
                        interaction:
                            'Not interactive, never a touch target. Reduced motion: indeterminate pulses instead of travelling.',
                    },
                    tablet: {
                        size: 'As mobile.',
                        density: 'As mobile.',
                        layout: 'As mobile.',
                        contentVisibility: 'As mobile.',
                        interaction: 'As mobile.',
                        note: 'Identical at all four: the bar takes the width its container gives it, so it already adapts through the host layout; the 14px type is the smallest body step and does not need a mobile step-down.',
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
            <div style={stack}>
                <Progress value={45} label="Profile completion" showValue />
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
            <div style={{ display: 'grid', gap: 16 }}>
                <Progress
                    value={30}
                    label={`${dir} thirty`}
                    showValue
                    data-testid={`${dir}-sm`}
                />
                <Progress
                    value={30}
                    size="md"
                    aria-label={`${dir} md`}
                    data-testid={`${dir}-md`}
                />
                <Progress
                    aria-label={`${dir} indeterminate`}
                    data-testid={`${dir}-indeterminate`}
                />
            </div>
        </HorizonProvider>
    );
}

async function settle(el: Element) {
    await Promise.all(
        el
            .getAnimations()
            .filter((a) => a.effect?.getTiming().iterations !== Infinity)
            .map((a) => a.finished.catch(() => undefined))
    );
}

async function assertGeometry(canvasElement: HTMLElement, viewport: Viewport) {
    const canvas = within(canvasElement);
    await expect(window.innerWidth).toBe(viewportWidth[viewport]);
    for (const dir of ['ltr', 'rtl'] as const) {
        const root = canvas.getByTestId(`${dir}-sm`);
        const bar = within(root).getByRole('progressbar');
        const track = bar.getBoundingClientRect();
        await expect(track.height).toBe(4);
        await expect(
            Math.abs(track.width - root.getBoundingClientRect().width)
        ).toBeLessThanOrEqual(0.5);
        const fill = bar.querySelector('[data-progress-indicator]');
        if (!fill) throw new Error('no indicator');
        await settle(fill);
        const f = fill.getBoundingClientRect();
        // 30% visible from the inline start; the rest is clipped by the track.
        const visibleEdge = dir === 'ltr' ? f.right : f.left;
        const expected =
            dir === 'ltr'
                ? track.left + track.width * 0.3
                : track.right - track.width * 0.3;
        await expect(Math.abs(visibleEdge - expected)).toBeLessThanOrEqual(1);
        // The printed value sits at the inline end of the label row.
        const value = root.querySelector('[data-progress-value]');
        if (!value) throw new Error('no value');
        const v = value.getBoundingClientRect();
        const r = root.getBoundingClientRect();
        await expect(
            Math.abs(dir === 'ltr' ? r.right - v.right : v.left - r.left)
        ).toBeLessThanOrEqual(0.5);

        const md = within(canvas.getByTestId(`${dir}-md`)).getByRole(
            'progressbar'
        );
        await expect(md.getBoundingClientRect().height).toBe(8);

        const indeterminate = within(
            canvas.getByTestId(`${dir}-indeterminate`)
        ).getByRole('progressbar');
        const segment = indeterminate.querySelector(
            '[data-progress-indicator]'
        );
        if (!segment) throw new Error('no segment');
        const seg = getComputedStyle(segment);
        await expect(seg.animationName).toBe('hz-progress-indeterminate');
        await expect(seg.getPropertyValue('--hz-progress-dir').trim()).toBe(
            dir === 'ltr' ? '1' : '-1'
        );
        // 40% segment anchored at the inline start.
        const s = segment.getBoundingClientRect();
        const t = indeterminate.getBoundingClientRect();
        await expect(Math.abs(s.width - t.width * 0.4)).toBeLessThanOrEqual(1);
    }
    await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(
        window.innerWidth
    );
}

const viewportTest = (viewport: Viewport) => ({
    tags: ['!autodocs', '!dev'],
    globals: { viewport: { value: viewport, isRotated: false } },
    render: () => (
        <div style={{ display: 'grid', gap: 24 }}>
            <GeometryProbe dir="ltr" />
            <GeometryProbe dir="rtl" />
        </div>
    ),
    play: async ({ canvasElement }: { canvasElement: HTMLElement }) =>
        assertGeometry(canvasElement, viewport),
});

export const GeometryMobile: Story = {
    ...viewportTest('mobile'),
    name: 'fills from the inline start and spans its container at mobile',
};
export const GeometryTablet: Story = {
    ...viewportTest('tablet'),
    name: 'fills from the inline start and spans its container at tablet',
};
export const GeometryLaptop: Story = {
    ...viewportTest('laptop'),
    name: 'fills from the inline start and spans its container at laptop',
};
export const GeometryDesktop: Story = {
    ...viewportTest('desktop'),
    name: 'fills from the inline start and spans its container at desktop',
};

/** Computed styles that encode the design: tokens, type, radius. */
export const ComputedStyles: Story = {
    name: 'applies Horizon tokens to track, indicator, label and value',
    tags: ['!autodocs', '!dev'],
    globals: { viewport: { value: 'laptop', isRotated: false } },
    render: () => (
        <div style={stack}>
            <Progress
                value={50}
                label="Label"
                showValue
                data-testid="primary"
            />
            <Progress
                value={50}
                variant="error"
                aria-label="Error"
                data-testid="error"
            />
            <span
                data-testid="probe"
                style={{
                    color: 'var(--foreground)',
                    background: 'var(--muted)',
                    borderColor: 'var(--primary)',
                    outlineColor: 'var(--destructive-strong)',
                    textDecorationColor: 'var(--muted-foreground)',
                }}
            />
        </div>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const probe = getComputedStyle(canvas.getByTestId('probe'));
        const root = canvas.getByTestId('primary');
        const bar = within(root).getByRole('progressbar', { name: 'Label' });
        const track = getComputedStyle(bar);
        await expect(track.backgroundColor).toBe(probe.backgroundColor);
        await expect(track.borderRadius).toBe('100px');
        await expect(track.overflow).toBe('hidden');
        const fill = bar.querySelector('[data-progress-indicator]');
        if (!fill) throw new Error('no indicator');
        await expect(getComputedStyle(fill).backgroundColor).toBe(
            probe.borderColor
        );
        await expect(getComputedStyle(fill).transitionDuration).toBe('0.3s');
        const label = within(root).getByText('Label');
        await expect(getComputedStyle(label).fontSize).toBe('14px');
        await expect(getComputedStyle(label).fontWeight).toBe('600');
        await expect(getComputedStyle(label).color).toBe(probe.color);
        const value = within(root).getByText('50%');
        await expect(getComputedStyle(value).color).toBe(
            probe.textDecorationColor
        );
        await expect(getComputedStyle(value).fontVariantNumeric).toBe(
            'tabular-nums'
        );
        const err = within(canvas.getByTestId('error')).getByRole(
            'progressbar'
        );
        const errFill = err.querySelector('[data-progress-indicator]');
        if (!errFill) throw new Error('no indicator');
        await expect(getComputedStyle(errFill).backgroundColor).toBe(
            probe.outlineColor
        );
    },
};
