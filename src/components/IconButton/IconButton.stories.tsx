import { CheckIcon } from '@phosphor-icons/react/dist/csr/Check';
import { DownloadSimpleIcon } from '@phosphor-icons/react/dist/csr/DownloadSimple';
import { PencilSimpleIcon } from '@phosphor-icons/react/dist/csr/PencilSimple';
import { TrashIcon } from '@phosphor-icons/react/dist/csr/Trash';
import { XIcon } from '@phosphor-icons/react/dist/csr/X';
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { CSSProperties, ReactNode } from 'react';
import { expect, within } from 'storybook/test';
import { HorizonProvider } from '../../provider';
import { ResponsiveSpec } from '../../stories/ResponsiveSpec';
import type { Brand } from '../../tokens';
import { IconButton, type IconButtonProps } from '.';

/*
 * Stories are excluded from the Tailwind scan (ADR 0001), so layout here uses
 * inline styles; every visual on the IconButton comes from the component.
 */

const variants = [
    'primary',
    'secondary',
    'tertiary',
    'destructive',
    'ghost',
] as const satisfies readonly NonNullable<IconButtonProps['variant']>[];
const sizes = ['sm', 'md', 'lg'] as const satisfies readonly NonNullable<
    IconButtonProps['size']
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

const meta = {
    title: 'Components/IconButton',
    component: IconButton,
    parameters: {
        layout: 'padded',
        docs: {
            description: {
                component: [
                    'An action shown as an icon only. Ported from x-core `IconButton` (`color` default -> `primary`, primary -> `tertiary`, secondary -> `secondary`, error -> `destructive`; success/info/warning have no tone variant) and the compact `ActionIconButton`.',
                    '',
                    '**Name.** `aria-label` (or `aria-labelledby`) is required by the type; the icon is hidden from assistive technology so the name is read once. Until Tooltip (Task 11) the name is not shown on hover: choose an unambiguous icon or use `Button` with a label.',
                    '',
                    '**Sizes (px, square, circular).** Mobile and touch pointers: sm 44, md 44, lg 48. Tablet and up with a fine pointer: sm 32, md 36, lg 44 (Button heights). Icons 16/20/24.',
                    '',
                    '**States** as Button: hover (pointer only) darkens or tints, press scales to 0.98, focus-visible 2px `ring` outline at 2px offset, disabled `muted`, loading swaps the icon for the shared Spinner and keeps focus. `asChild` renders a link (router `Link`) with the same look; `anchorGuard` keeps a host `a:hover` from restyling it.',
                ].join('\n'),
            },
        },
    },
    args: { 'aria-label': 'Edit email', children: <PencilSimpleIcon /> },
    argTypes: {
        variant: { control: 'select', options: variants },
        size: { control: 'inline-radio', options: sizes },
        children: { control: false },
    },
} satisfies Meta<typeof IconButton>;
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
                        <IconButton
                            key={size}
                            variant={variant}
                            size={size}
                            aria-label={`Edit (${variant} ${size})`}
                        >
                            <PencilSimpleIcon />
                        </IconButton>
                    ))}
                </Section>
            ))}
        </div>
    ),
};

/** Disabled: muted, not focusable. */
export const Disabled: Story = {
    render: () => (
        <Section title="disabled">
            {variants.map((variant) => (
                <IconButton
                    key={variant}
                    variant={variant}
                    disabled
                    aria-label={`Delete (${variant})`}
                >
                    <TrashIcon />
                </IconButton>
            ))}
        </Section>
    ),
    play: async ({ canvasElement }) => {
        for (const button of within(canvasElement).getAllByRole('button'))
            await expect(button).toBeDisabled();
    },
};

/** Loading: spinner replaces the icon, name and focus kept. */
export const Loading: Story = {
    render: () => (
        <Section title="loading">
            {sizes.map((size) => (
                <IconButton
                    key={size}
                    size={size}
                    loading
                    aria-label={`Saving file (${size})`}
                >
                    <DownloadSimpleIcon />
                </IconButton>
            ))}
        </Section>
    ),
    play: async ({ canvasElement }) => {
        for (const button of within(canvasElement).getAllByRole('button')) {
            await expect(button).toHaveAttribute('aria-busy', 'true');
            await expect(button).toHaveAccessibleName(/^Saving file/);
        }
    },
};

/** customer360 pattern: confirm / cancel pair in an edit row. */
export const ConfirmCancel: Story = {
    render: () => (
        <Section title="edit row">
            <IconButton
                variant="secondary"
                size="sm"
                aria-label="Confirm email change"
            >
                <CheckIcon />
            </IconButton>
            <IconButton
                variant="ghost"
                size="sm"
                aria-label="Cancel email change"
            >
                <XIcon />
            </IconButton>
        </Section>
    ),
};

/** Rendered as a link with `asChild`. */
export const AsLink: Story = {
    render: () => (
        <Section title="asChild">
            <IconButton asChild variant="ghost" aria-label="Download report">
                <a href="#download">
                    <DownloadSimpleIcon aria-hidden="true" />
                </a>
            </IconButton>
        </Section>
    ),
};

/** Right-to-left: identical (a circular control has no direction). */
export const RTL: Story = {
    globals: { direction: 'rtl' },
    render: () => (
        <Section title="rtl">
            <IconButton aria-label="עריכה">
                <PencilSimpleIcon />
            </IconButton>
            <IconButton variant="ghost" aria-label="סגירה">
                <XIcon />
            </IconButton>
        </Section>
    ),
};

/** All three brands side by side: the a11y check runs contrast on each. */
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
                            <IconButton
                                key={variant}
                                variant={variant}
                                aria-label={`Edit (${brand} ${variant})`}
                            >
                                <PencilSimpleIcon />
                            </IconButton>
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
                caption="IconButton responsive specification"
                spec={{
                    mobile: {
                        size: 'Square sm 44, md 44, lg 48px (the box is the touch target); icons 16/20/24px.',
                        density: 'No padding: the icon is centred in the box.',
                        layout: 'Inline, circular, never shrinks.',
                        contentVisibility:
                            'Icon only; the name is in aria-label (no tooltip until Task 11).',
                        interaction:
                            'Touch: press feedback (scale 0.98), no hover look on touch.',
                    },
                    tablet: {
                        size: 'Fine pointer: sm 32, md 36, lg 44px. Touch pointer: keeps the mobile 44/44/48.',
                        density: 'Same as mobile.',
                        layout: 'Same as mobile.',
                        contentVisibility: 'Same as mobile.',
                        interaction:
                            'Pointer: hover tint; keyboard: focus-visible ring.',
                        note: 'Density follows pointer precision, not width alone, as Button.',
                    },
                    laptop: {
                        size: 'As tablet.',
                        density: 'As tablet.',
                        layout: 'As tablet.',
                        contentVisibility: 'As tablet.',
                        interaction: 'As tablet.',
                        note: 'Identical to tablet: an icon control does not gain from more width.',
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
            <SizeProbe />
        </div>
    ),
};

/* ---- Viewport tests (real compiled CSS and layout, Storybook browser project) ---- */

const expected = {
    mobile: { sm: 44, md: 44, lg: 48 },
    tablet: { sm: 32, md: 36, lg: 44 },
    laptop: { sm: 32, md: 36, lg: 44 },
    desktop: { sm: 32, md: 36, lg: 44 },
} as const;
const iconPx = { sm: 16, md: 20, lg: 24 } as const;
const viewportWidth = { mobile: 375, tablet: 768, laptop: 1280, desktop: 1920 };
type Viewport = keyof typeof expected;

function SizeProbe() {
    return (
        <div style={row}>
            {sizes.map((size) => (
                <IconButton
                    key={size}
                    size={size}
                    aria-label={`Edit ${size}`}
                    data-testid={`size-${size}`}
                >
                    <PencilSimpleIcon />
                </IconButton>
            ))}
            <IconButton asChild size="sm" aria-label="Open" data-testid="link">
                <a href="#open">
                    <PencilSimpleIcon aria-hidden="true" />
                </a>
            </IconButton>
        </div>
    );
}

async function assertViewport(canvasElement: HTMLElement, viewport: Viewport) {
    const canvas = within(canvasElement);
    await expect(window.innerWidth).toBe(viewportWidth[viewport]);
    for (const size of sizes) {
        const button = canvas.getByTestId(`size-${size}`);
        const rect = button.getBoundingClientRect();
        await expect([rect.width, rect.height]).toEqual([
            expected[viewport][size],
            expected[viewport][size],
        ]);
        const icon = button.querySelector('svg')?.getBoundingClientRect();
        await expect(icon?.width).toBe(iconPx[size]);
    }
    const link = canvas.getByTestId('link').getBoundingClientRect();
    await expect(link.width).toBe(expected[viewport].sm);
    await expect(link.height).toBe(expected[viewport].sm);
}

const viewportTest = (viewport: Viewport) => ({
    tags: ['!autodocs', '!dev'],
    globals: { viewport: { value: viewport, isRotated: false } },
    render: () => <SizeProbe />,
    play: async ({ canvasElement }: { canvasElement: HTMLElement }) =>
        assertViewport(canvasElement, viewport),
});

export const TargetMobile: Story = {
    ...viewportTest('mobile'),
    name: 'is at least 44px square at mobile for every size',
};
export const DensityTablet: Story = {
    ...viewportTest('tablet'),
    name: 'uses dense squares with a fine pointer at tablet',
};
export const DensityLaptop: Story = {
    ...viewportTest('laptop'),
    name: 'uses dense squares with a fine pointer at laptop',
};
export const DensityDesktop: Story = {
    ...viewportTest('desktop'),
    name: 'uses dense squares with a fine pointer at desktop',
};

/** Computed styles that encode the design: circle, focus ring, motion, disabled. */
export const ComputedStyles: Story = {
    name: 'applies Horizon tokens to the rendered icon button',
    tags: ['!autodocs', '!dev'],
    globals: { viewport: { value: 'laptop', isRotated: false } },
    render: () => (
        <div style={row}>
            <IconButton aria-label="Edit" data-testid="primary">
                <PencilSimpleIcon />
            </IconButton>
            <IconButton
                variant="secondary"
                aria-label="Edit"
                data-testid="secondary"
            >
                <PencilSimpleIcon />
            </IconButton>
            <IconButton disabled aria-label="Edit" data-testid="disabled">
                <PencilSimpleIcon />
            </IconButton>
            <IconButton
                asChild
                disabled
                aria-label="Open"
                data-testid="aria-disabled"
            >
                <a href="#open">
                    <PencilSimpleIcon aria-hidden="true" />
                </a>
            </IconButton>
            <span
                data-testid="probe"
                style={{
                    background: 'var(--primary)',
                    color: 'var(--ring)',
                    borderColor: 'var(--muted)',
                }}
            />
        </div>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const probe = getComputedStyle(canvas.getByTestId('probe'));
        const primary = canvas.getByTestId('primary');
        const style = getComputedStyle(primary);
        await expect(style.borderRadius).toMatch(/^(9999|100|3\.35544e\+07)/);
        await expect(style.backgroundColor).toBe(probe.backgroundColor);
        await expect(style.transitionDuration).toContain('0.1s');
        await expect(style.transitionTimingFunction).toContain(
            'cubic-bezier(0.2, 0, 0, 1)'
        );
        await expect(
            getComputedStyle(canvas.getByTestId('secondary')).borderTopColor
        ).toBe(probe.backgroundColor);
        primary.focus();
        const focused = getComputedStyle(primary);
        await expect(focused.outlineStyle).toBe('solid');
        await expect(focused.outlineWidth).toBe('2px');
        await expect(focused.outlineOffset).toBe('2px');
        await expect(focused.outlineColor).toBe(probe.color);
        const disabled = getComputedStyle(canvas.getByTestId('disabled'));
        await expect(disabled.backgroundColor).toBe(probe.borderTopColor);
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
