import type { Meta, StoryObj } from '@storybook/react-vite';
import type { CSSProperties, ReactNode } from 'react';
import { expect, within } from 'storybook/test';
import { HorizonProvider } from '../../provider';
import { ResponsiveSpec } from '../../stories/ResponsiveSpec';
import type { Brand } from '../../tokens';
import { Button, type ButtonProps } from '.';

/*
 * Stories are excluded from the Tailwind scan (ADR 0001), so layout here uses
 * inline styles; every visual on the Button itself comes from the component.
 */

const variants = [
    'primary',
    'secondary',
    'tertiary',
    'destructive',
    'ghost',
    'link',
] as const satisfies readonly NonNullable<ButtonProps['variant']>[];
const sizes = ['sm', 'md', 'lg'] as const satisfies readonly NonNullable<
    ButtonProps['size']
>[];
const brandList = ['cial', 'dnb', 'il'] as const satisfies readonly Brand[];

const row: CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 16,
};
const stack: CSSProperties = { display: 'grid', gap: 24 };
const label: CSSProperties = {
    fontSize: 12,
    fontWeight: 600,
    color: 'var(--muted-foreground)',
    marginBlockEnd: 8,
};

function Section({ title, children }: { title: string; children: ReactNode }) {
    return (
        <section>
            <h3 style={label}>{title}</h3>
            <div style={row}>{children}</div>
        </section>
    );
}

/** Inline icons until the icon set lands (Task 8). `currentColor`, sized by the Button. */
function PlusIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
                d="M12 5v14M5 12h14"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
            />
        </svg>
    );
}

function DownloadIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
                d="M12 4v11m0 0-4-4m4 4 4-4M5 20h14"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

const meta = {
    title: 'Components/Button',
    component: Button,
    parameters: {
        layout: 'padded',
        docs: {
            description: {
                component: [
                    'Triggers an action. Ported from x-core `ButtonV2` (contained -> `primary`, outlined -> `secondary`, text -> `tertiary`, `color="error"` -> `destructive`; `ghost` and `link` are new).',
                    '',
                    '**Sizes (min-height, px).** Base (mobile, and any touch pointer at any width): sm 44, md 44, lg 48. Tablet and up with a fine pointer: sm 32, md 36, lg 44. Type: type-scale roles `label/sm` 12/16, `label/md` 14/20, `label/lg` 16/24 (semibold). Inline padding: sm 16, md 20, lg 24 (`link`: none, min-width 44). Radius `lg` (20px) everywhere.',
                    '',
                    '**States.** Hover (pointer devices only): primary/destructive darken to `*-hover`; secondary fills with `primary`; tertiary underlines; ghost tints to `accent`; link thickens its underline. Press: scale 0.98. Focus-visible: 2px `ring` outline, 2px offset. Disabled: `muted` surface and `muted-foreground` text, not focusable; with `asChild` it becomes `aria-disabled` + `tabIndex=-1` and activation is blocked (a consumer-set `aria-disabled` also blocks `onClick` and gets the same look). Loading: label kept for width and accessible name but hidden, spinner in `currentColor`, `aria-busy` and `aria-disabled`, still focusable, clicks blocked.',
                    '',
                    '**Motion.** Colour, border and transform transition over `duration.fast` (100ms) with `easing.standard`. `prefers-reduced-motion` collapses transitions (the scoped base stylesheet handles it); the spinner is the shared `Spinner` ring and slows to one turn every 3s instead of stopping.',
                    '',
                    '**Long labels** wrap (balanced) inside the container instead of overflowing; the Button never exceeds its container width.',
                    '',
                    '**Icons** go in `children`, before or after the label; they are sized by the Button (16px, 20px at `lg`). An icon-only action must carry `aria-label`; prefer `IconButton` (Task 10) for that.',
                ].join('\n'),
            },
        },
    },
    args: { children: 'Save changes' },
    argTypes: {
        variant: { control: 'select', options: variants },
        size: { control: 'inline-radio', options: sizes },
    },
} satisfies Meta<typeof Button>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Controls playground. */
export const Playground: Story = {};

/** Every variant at every size. */
export const VariantsAndSizes: Story = {
    render: () => (
        <div style={stack}>
            {variants.map((variant) => (
                <Section key={variant} title={variant}>
                    {sizes.map((size) => (
                        <Button key={size} variant={variant} size={size}>
                            {`${variant} ${size}`}
                        </Button>
                    ))}
                </Section>
            ))}
        </div>
    ),
};

/** Disabled: muted surface, not focusable, no hover. */
export const Disabled: Story = {
    render: () => (
        <Section title="disabled">
            {variants.map((variant) => (
                <Button key={variant} variant={variant} disabled>
                    {variant}
                </Button>
            ))}
        </Section>
    ),
    play: async ({ canvasElement }) => {
        for (const button of within(canvasElement).getAllByRole('button')) {
            await expect(button).toBeDisabled();
        }
    },
};

/** Loading: spinner replaces the label visually, width is kept, still focusable. */
export const Loading: Story = {
    render: () => (
        <Section title="loading">
            {variants.map((variant) => (
                <Button key={variant} variant={variant} loading>
                    {`Saving ${variant}`}
                </Button>
            ))}
        </Section>
    ),
    play: async ({ canvasElement }) => {
        for (const button of within(canvasElement).getAllByRole('button')) {
            await expect(button).toHaveAttribute('aria-busy', 'true');
            await expect(button).toHaveAccessibleName(/^Saving /);
        }
    },
};

/** Leading and trailing icons as children. */
export const WithIcon: Story = {
    render: () => (
        <div style={stack}>
            {sizes.map((size) => (
                <Section key={size} title={size}>
                    <Button size={size}>
                        <PlusIcon />
                        New report
                    </Button>
                    <Button size={size} variant="secondary">
                        Export
                        <DownloadIcon />
                    </Button>
                    <Button size={size} variant="ghost">
                        <PlusIcon />
                        Add filter
                    </Button>
                </Section>
            ))}
        </div>
    ),
};

/** Long labels wrap and stay inside a narrow container; long words break. */
export const LongLabel: Story = {
    render: () => (
        <div style={{ ...stack, inlineSize: 240, maxInlineSize: '100%' }}>
            <Button>Export the full customer risk assessment report</Button>
            <Button variant="secondary" size="sm">
                Supercalifragilisticexpialidociousreportname
            </Button>
            <Button fullWidth variant="destructive">
                Delete all archived portfolio entries
            </Button>
        </div>
    ),
    play: async ({ canvasElement }) => {
        const container = canvasElement.firstElementChild;
        if (!(container instanceof HTMLElement))
            throw new Error('no container');
        const limit = container.getBoundingClientRect().right + 0.5;
        for (const button of within(canvasElement).getAllByRole('button')) {
            // Content must not spill past the button's own edges either.
            await expect(button.scrollWidth).toBeLessThanOrEqual(
                button.clientWidth
            );
            await expect(
                button.getBoundingClientRect().right
            ).toBeLessThanOrEqual(limit);
        }
    },
};

/** Full width: fills its container at every breakpoint. */
export const FullWidth: Story = {
    args: { fullWidth: true, children: 'Continue to payment' },
};

/** Rendered as a link with `asChild`. Styles and focus ring carry over. */
export const AsLink: Story = {
    render: () => (
        <Section title="asChild">
            <Button asChild variant="secondary">
                <a href="#reports">Open reports</a>
            </Button>
        </Section>
    ),
};

/** Right-to-left: logical padding and icon order follow `dir`. */
export const RTL: Story = {
    globals: { direction: 'rtl' },
    render: () => (
        <Section title="rtl">
            <Button>
                <PlusIcon />
                דוח חדש
            </Button>
            <Button variant="secondary">
                ייצוא
                <DownloadIcon />
            </Button>
            <Button variant="tertiary">ביטול</Button>
        </Section>
    ),
};

/**
 * All three brands side by side (nested providers), every variant. The a11y
 * check runs colour contrast on each one.
 */
export const Brands: Story = {
    render: () => (
        <div style={stack}>
            {brandList.map((brand) => (
                <HorizonProvider
                    key={brand}
                    brand={brand}
                    style={{ background: 'var(--background)', padding: 16 }}
                >
                    <h3 style={{ ...label, color: 'var(--foreground)' }}>
                        {brand}
                    </h3>
                    <div style={row}>
                        {variants.map((variant) => (
                            <Button key={variant} variant={variant}>
                                {variant}
                            </Button>
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
        <div style={stack}>
            <ResponsiveSpec
                caption="Button responsive specification"
                spec={{
                    mobile: {
                        size: 'Min-height sm 44px, md 44px, lg 48px (touch target). Type sm 12/16, md 14/20, lg 16/24 semibold.',
                        density:
                            'Inline padding sm 16px, md 20px, lg 24px; icon gap sm 4px, md/lg 8px.',
                        layout: 'Inline; fullWidth fills the container. Never wider than its container.',
                        contentVisibility:
                            'Long labels wrap (balanced); unbroken words break.',
                        interaction:
                            'Touch: press feedback (scale 0.98); no hover styles on touch.',
                    },
                    tablet: {
                        size: 'Fine pointer: min-height sm 32px, md 36px, lg 44px. Touch pointer: keeps the mobile 44/44/48.',
                        density: 'Same padding and type as mobile.',
                        layout: 'Same as mobile.',
                        contentVisibility: 'Same as mobile.',
                        interaction:
                            'Pointer: hover styles; keyboard: focus-visible ring.',
                        note: 'Density is gated on pointer precision, not width alone, so touch tablets keep 44px targets.',
                    },
                    laptop: {
                        size: 'As tablet (x-core ButtonV2 desktop heights, sm/lg rounded to the 4px grid).',
                        density: 'As tablet.',
                        layout: 'As tablet.',
                        contentVisibility: 'As tablet.',
                        interaction: 'As tablet.',
                        note: 'Identical to tablet: a button does not gain from more width.',
                    },
                    desktop: {
                        size: 'As tablet.',
                        density: 'As tablet.',
                        layout: 'As tablet.',
                        contentVisibility: 'As tablet.',
                        interaction: 'As tablet.',
                        note: 'Identical to tablet (see laptop).',
                    },
                }}
            />
            <div style={row}>
                {sizes.map((size) => (
                    <Button key={size} size={size}>{`Size ${size}`}</Button>
                ))}
            </div>
        </div>
    ),
};

/* ---- Viewport tests (real compiled CSS and layout, Storybook browser project) ---- */

const expectedHeight = {
    mobile: { sm: 44, md: 44, lg: 48 },
    tablet: { sm: 32, md: 36, lg: 44 },
    laptop: { sm: 32, md: 36, lg: 44 },
    desktop: { sm: 32, md: 36, lg: 44 },
} as const;
const viewportWidth = { mobile: 375, tablet: 768, laptop: 1280, desktop: 1920 };
type Viewport = keyof typeof expectedHeight;

function SizeProbe() {
    return (
        <div style={stack}>
            <div style={row}>
                {sizes.map((size) => (
                    <Button key={size} size={size} data-testid={`size-${size}`}>
                        {`Size ${size}`}
                    </Button>
                ))}
                {sizes.map((size) => (
                    <Button
                        key={size}
                        size={size}
                        variant="link"
                        data-testid={`link-${size}`}
                    >
                        Go
                    </Button>
                ))}
            </div>
            <div data-testid="container">
                <Button fullWidth data-testid="full">
                    Continue
                </Button>
            </div>
        </div>
    );
}

async function assertViewport(canvasElement: HTMLElement, viewport: Viewport) {
    const canvas = within(canvasElement);
    await expect(window.innerWidth).toBe(viewportWidth[viewport]);
    for (const size of sizes) {
        const rect = canvas.getByTestId(`size-${size}`).getBoundingClientRect();
        const expected = expectedHeight[viewport][size];
        if (viewport === 'mobile') {
            await expect(rect.height).toBeGreaterThanOrEqual(44);
            await expect(rect.width).toBeGreaterThanOrEqual(44);
        }
        await expect(rect.height).toBe(expected);
        const link = canvas.getByTestId(`link-${size}`).getBoundingClientRect();
        if (viewport === 'mobile') {
            // The link variant has no inline padding; min-width keeps the target.
            await expect(link.width).toBeGreaterThanOrEqual(44);
            await expect(link.height).toBeGreaterThanOrEqual(44);
        }
    }
    const container = canvas.getByTestId('container').getBoundingClientRect();
    const full = canvas.getByTestId('full').getBoundingClientRect();
    await expect(full.width).toBe(container.width);
}

const viewportTest = (viewport: Viewport) => ({
    tags: ['!autodocs', '!dev'],
    globals: { viewport: { value: viewport, isRotated: false } },
    render: () => <SizeProbe />,
    play: async ({ canvasElement }: { canvasElement: HTMLElement }) =>
        assertViewport(canvasElement, viewport),
});

export const MinHeightMobile: Story = {
    ...viewportTest('mobile'),
    name: 'is at least 44px tall at mobile for every size',
};

export const FullWidthMobile: Story = {
    name: 'full-width prop fills the container at mobile',
    tags: ['!autodocs', '!dev'],
    globals: { viewport: { value: 'mobile', isRotated: false } },
    render: () => <SizeProbe />,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(window.innerWidth).toBe(375);
        const container = canvas
            .getByTestId('container')
            .getBoundingClientRect();
        const full = canvas.getByTestId('full').getBoundingClientRect();
        await expect(container.width).toBeGreaterThan(300);
        await expect(full.width).toBe(container.width);
        await expect(full.height).toBeGreaterThanOrEqual(44);
    },
};

export const DensityTablet: Story = {
    ...viewportTest('tablet'),
    name: 'uses dense heights with a fine pointer at tablet',
};
export const DensityLaptop: Story = {
    ...viewportTest('laptop'),
    name: 'uses dense heights with a fine pointer at laptop',
};
export const DensityDesktop: Story = {
    ...viewportTest('desktop'),
    name: 'uses dense heights with a fine pointer at desktop',
};

/** Computed styles that encode the design: radius, type, focus ring, motion, disabled-over-hover. */
export const ComputedStyles: Story = {
    name: 'applies Horizon tokens to the rendered button',
    tags: ['!autodocs', '!dev'],
    globals: { viewport: { value: 'laptop', isRotated: false } },
    render: () => (
        <div style={row}>
            {sizes.map((size) => (
                <Button key={size} size={size} data-testid={`type-${size}`}>
                    {size}
                </Button>
            ))}
            <Button data-testid="disabled" disabled>
                Disabled
            </Button>
            <Button asChild disabled data-testid="aria-disabled">
                <a href="#reports">Disabled link</a>
            </Button>
            <span
                data-testid="probe"
                style={{ background: 'var(--muted)', color: 'var(--ring)' }}
            />
        </div>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const type = { sm: [12, 16], md: [14, 20], lg: [16, 24] } as const;
        for (const size of sizes) {
            const style = getComputedStyle(canvas.getByTestId(`type-${size}`));
            await expect(style.borderRadius).toBe('20px');
            await expect(style.fontWeight).toBe('600');
            await expect(style.fontSize).toBe(`${type[size][0]}px`);
            await expect(style.lineHeight).toBe(`${type[size][1]}px`);
            await expect(style.transitionProperty).toContain(
                'background-color'
            );
            await expect(style.transitionProperty).toContain('scale');
            await expect(style.transitionDuration).toContain('0.1s');
            await expect(style.transitionTimingFunction).toContain(
                'cubic-bezier(0.2, 0, 0, 1)'
            );
        }
        const probe = getComputedStyle(canvas.getByTestId('probe'));
        const md = canvas.getByTestId('type-md');
        md.focus();
        const focused = getComputedStyle(md);
        await expect(focused.outlineStyle).toBe('solid');
        await expect(focused.outlineWidth).toBe('2px');
        await expect(focused.outlineOffset).toBe('2px');
        await expect(focused.outlineColor).toBe(probe.color);
        const disabled = getComputedStyle(canvas.getByTestId('disabled'));
        await expect(disabled.backgroundColor).toBe(probe.backgroundColor);
        // aria-disabled (asChild link) mirrors the native :disabled look.
        const ariaDisabled = getComputedStyle(
            canvas.getByTestId('aria-disabled')
        );
        await expect(ariaDisabled.backgroundColor).toBe(
            disabled.backgroundColor
        );
        await expect(ariaDisabled.color).toBe(disabled.color);
        await expect(ariaDisabled.cursor).toBe('not-allowed');
    },
};
