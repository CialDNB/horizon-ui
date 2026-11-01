import type { Meta, StoryObj } from '@storybook/react-vite';
import type { CSSProperties } from 'react';
import { expect, within } from 'storybook/test';
import { HorizonProvider } from '../../provider';
import { ResponsiveSpec } from '../../stories/ResponsiveSpec';
import { typography as typographyTokens, type Brand } from '../../tokens';
import { Typography, type TypographyColor, type TypographyVariant } from '.';

/*
 * Stories are excluded from the Tailwind scan (ADR 0001), so layout here uses
 * inline styles; every visual on the text itself comes from the component.
 */

const roles = Object.keys(typographyTokens.typeScale) as TypographyVariant[];
const colors = [
    'foreground',
    'muted-foreground',
    'primary',
    'neutral-strong',
    'info-strong',
    'success-strong',
    'warning-strong',
    'destructive-strong',
] as const satisfies readonly TypographyColor[];
const brandList = ['cial', 'dnb', 'il'] as const satisfies readonly Brand[];

const stack: CSSProperties = { display: 'grid', gap: 16 };
const specimen: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'minmax(96px, 120px) minmax(0, 1fr)',
    alignItems: 'baseline',
    gap: 16,
};
const meta_: CSSProperties = {
    fontSize: 12,
    color: 'var(--muted-foreground)',
    fontFamily: 'ui-monospace, monospace',
};

const px = (rem: string) => parseFloat(rem) * 16;

const meta = {
    title: 'Components/Typography',
    component: Typography,
    parameters: {
        layout: 'padded',
        docs: {
            description: {
                component: [
                    'Text in a Horizon type-scale role. Ported from x-core `Typography` (MUI). Variants are the 14 slash-notation roles (`display/xl` ... `label/lg`); MUI names map as `h1` -> `heading/xl`, `h2` -> `heading/lg`, `h3` -> `heading/md`, `h4` -> `heading/sm`, `body1` -> `body/default`, `body2` -> `body/secondary`, `caption` -> `caption`, `subtitle2` -> `body/secondary` + `weight="semibold"`, `h6`/`subtitle1` -> `body/default` (+ `weight="semibold"` for `h6`).',
                    '',
                    '**Element.** Each role renders its semantic element (`h1` for display and `heading/xl`, `h2`..`h4` for the smaller headings, `p` for body/caption/micro, `span` for labels). `as` changes the element, never the look; choose the heading level by document outline, not by size.',
                    '',
                    '**Colour.** Semantic tokens only; every option is at least 4.5:1 on `background` in all three brands. Use the `-strong` tokens for status text (plain `success` is 3.52:1, `destructive` 4.47:1 in CIAL).',
                    '',
                    '**Wrapping.** Headings use `text-wrap: balance`, body `pretty`; long words break instead of overflowing. `truncate` clips to one line (or clamps to 2-4).',
                    '',
                    '**Legacy hosts.** Margin, colour, family, size, line height and weight are always set by the component, so Bootstrap\'s `h1..h6` and `p` rules do not change it with `styles.unlayered.css` (measured in the coexistence harness).',
                ].join('\n'),
            },
        },
    },
    args: { children: 'Portfolio risk overview', variant: 'heading/md' },
    argTypes: {
        variant: { control: 'select', options: roles },
        color: { control: 'select', options: [...colors, 'inherit'] },
        weight: {
            control: 'inline-radio',
            options: ['regular', 'medium', 'semibold', 'bold'],
        },
        align: { control: 'inline-radio', options: ['start', 'center', 'end'] },
    },
} satisfies Meta<typeof Typography>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Controls playground. */
export const Playground: Story = {};

/** The full type scale with its size, line height and weight. */
export const TypeScale: Story = {
    render: () => (
        <div style={stack}>
            {roles.map((role) => {
                const t = typographyTokens.typeScale[role];
                return (
                    <div key={role} style={specimen}>
                        <span style={meta_}>
                            {role}
                            <br />
                            {px(t.fontSize)}/{px(t.lineHeight)} {t.fontWeight}
                        </span>
                        <Typography variant={role}>
                            Company credit assessment
                        </Typography>
                    </div>
                );
            })}
        </div>
    ),
};

/** Semantic text colours. */
export const Colors: Story = {
    render: () => (
        <div style={stack}>
            {colors.map((color) => (
                <Typography key={color} color={color}>
                    {`${color}: Payment behaviour updated`}
                </Typography>
            ))}
            <div
                style={{
                    background: 'var(--primary)',
                    padding: 12,
                    borderRadius: 8,
                }}
            >
                <Typography color="primary-foreground">
                    primary-foreground on a primary surface
                </Typography>
            </div>
        </div>
    ),
};

/** Weight overrides and logical alignment. */
export const WeightAndAlign: Story = {
    render: () => (
        <div style={stack}>
            {(['regular', 'medium', 'semibold', 'bold'] as const).map(
                (weight) => (
                    <Typography key={weight} weight={weight}>
                        {`${weight}: Registered capital`}
                    </Typography>
                )
            )}
            {(['start', 'center', 'end'] as const).map((align) => (
                <Typography key={align} align={align} variant="body/secondary">
                    {`align ${align}`}
                </Typography>
            ))}
        </div>
    ),
};

const longText =
    'The registered address, beneficial owners and board members were updated after the latest filing with the companies registrar, so the risk score was recalculated overnight.';

/** Truncation: one line with an ellipsis, or a clamp to 2-4 lines. */
export const Truncation: Story = {
    render: () => (
        <div style={{ ...stack, inlineSize: 320, maxInlineSize: '100%' }}>
            <Typography truncate title={longText}>
                {longText}
            </Typography>
            <Typography truncate={2} variant="body/secondary">
                {longText}
            </Typography>
        </div>
    ),
};

/** Long unbroken words wrap inside a narrow column; headings balance. */
export const LongText: Story = {
    render: () => (
        <div style={{ ...stack, inlineSize: 240, maxInlineSize: '100%' }}>
            <Typography variant="display/xl">
                Supercalifragilisticexpialidocious holdings
            </Typography>
            <Typography>{longText}</Typography>
        </div>
    ),
    play: async ({ canvasElement }) => {
        const container = canvasElement.firstElementChild;
        if (!(container instanceof HTMLElement))
            throw new Error('no container');
        for (const child of Array.from(container.children)) {
            await expect(child.scrollWidth).toBeLessThanOrEqual(
                child.clientWidth
            );
        }
    },
};

/** Right-to-left: `align="start"` follows the reading direction. */
export const RTL: Story = {
    globals: { direction: 'rtl' },
    render: () => (
        <div style={stack}>
            <Typography variant="heading/md">סקירת סיכונים</Typography>
            <Typography align="start">
                הכתובת הרשומה עודכנה לאחר הדיווח האחרון.
            </Typography>
            <Typography align="end" color="muted-foreground">
                עודכן היום
            </Typography>
        </div>
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
                    <Typography variant="heading/sm">{brand}</Typography>
                    {colors.map((color) => (
                        <Typography
                            key={color}
                            color={color}
                            variant="body/secondary"
                        >
                            {color}
                        </Typography>
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
                caption="Typography responsive specification"
                spec={{
                    mobile: {
                        size: 'display/xl 36/36, display/lg 32/32, heading/xl 32/32 (one step down the scale). Every other role at its token size.',
                        density: 'No margin of its own (spacing belongs to the layout).',
                        layout: 'Block for headings/body, inline for labels. Headings balance, body uses text-wrap: pretty.',
                        contentVisibility:
                            'Long words break; truncate clips with an ellipsis or clamps to 2-4 lines.',
                        interaction: 'Not interactive.',
                    },
                    tablet: {
                        size: 'display/xl 44/44, display/lg 40/40, heading/xl 36/36: full token sizes.',
                        density: 'As mobile.',
                        layout: 'As mobile.',
                        contentVisibility: 'As mobile.',
                        interaction: 'Not interactive.',
                        note: 'The step at 768px keeps 44px display words from overflowing a 320-375px viewport.',
                    },
                    laptop: {
                        size: 'As tablet.',
                        density: 'As tablet.',
                        layout: 'As tablet.',
                        contentVisibility: 'As tablet.',
                        interaction: 'Not interactive.',
                        note: 'Product UI uses a fixed scale above tablet (no fluid type).',
                    },
                    desktop: {
                        size: 'As tablet.',
                        density: 'As tablet.',
                        layout: 'As tablet. Prose line length is capped by the layout, not the component.',
                        contentVisibility: 'As tablet.',
                        interaction: 'Not interactive.',
                        note: 'Identical to tablet.',
                    },
                }}
            />
            <Typography variant="display/xl">Display xl</Typography>
            <Typography variant="heading/xl">Heading xl</Typography>
        </div>
    ),
};

/* ---- Viewport and computed-style tests (Storybook browser project) ---- */

const viewportWidth = { mobile: 375, tablet: 768, laptop: 1280, desktop: 1920 };
type Viewport = keyof typeof viewportWidth;

/** Expected [font-size, line-height] px per responsive role and viewport. */
const responsiveSize = {
    'display/xl': { mobile: [36, 36], wide: [44, 44] },
    'display/lg': { mobile: [32, 32], wide: [40, 40] },
    'heading/xl': { mobile: [32, 32], wide: [36, 36] },
    'heading/lg': { mobile: [32, 32], wide: [32, 32] },
} as const;

const viewportTest = (viewport: Viewport) => ({
    tags: ['!autodocs', '!dev'],
    globals: { viewport: { value: viewport, isRotated: false } },
    render: () => (
        <div style={stack}>
            {(Object.keys(responsiveSize) as TypographyVariant[]).map(
                (role) => (
                    <Typography key={role} variant={role} data-testid={role}>
                        {role}
                    </Typography>
                )
            )}
            <Typography variant="display/xl" data-testid="long">
                Supercalifragilisticexpialidocious
            </Typography>
        </div>
    ),
    play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
        const canvas = within(canvasElement);
        await expect(window.innerWidth).toBe(viewportWidth[viewport]);
        for (const [role, sizes] of Object.entries(responsiveSize)) {
            const [size, line] = viewport === 'mobile' ? sizes.mobile : sizes.wide;
            const style = getComputedStyle(canvas.getByTestId(role));
            await expect(style.fontSize, role).toBe(`${size}px`);
            await expect(style.lineHeight, role).toBe(`${line}px`);
        }
        const long = canvas.getByTestId('long');
        await expect(long.scrollWidth).toBeLessThanOrEqual(long.clientWidth);
        await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(
            window.innerWidth
        );
    },
});

export const SizeMobile: Story = {
    ...viewportTest('mobile'),
    name: 'steps display and heading/xl down one size at mobile',
};
export const SizeTablet: Story = {
    ...viewportTest('tablet'),
    name: 'uses full display sizes at tablet',
};
export const SizeLaptop: Story = {
    ...viewportTest('laptop'),
    name: 'uses full display sizes at laptop',
};
export const SizeDesktop: Story = {
    ...viewportTest('desktop'),
    name: 'uses full display sizes at desktop',
};

/** Every role renders its token size, line height, weight and family; overrides win. */
export const ComputedStyles: Story = {
    name: 'applies the Horizon type scale and semantic colour',
    tags: ['!autodocs', '!dev'],
    globals: { viewport: { value: 'laptop', isRotated: false } },
    render: () => (
        <div style={stack}>
            {roles.map((role) => (
                <Typography key={role} variant={role} data-testid={role}>
                    {role}
                </Typography>
            ))}
            <Typography weight="semibold" data-testid="weight">
                Semibold body
            </Typography>
            <Typography variant="heading/sm" weight="regular" data-testid="heading-regular">
                Regular heading
            </Typography>
            <Typography color="muted-foreground" data-testid="muted">
                Muted
            </Typography>
            <div style={{ inlineSize: 120 }}>
                <Typography truncate data-testid="truncate">
                    {longText}
                </Typography>
            </div>
            <span
                data-testid="probe"
                style={{
                    color: 'var(--foreground)',
                    background: 'var(--muted-foreground)',
                    fontFamily: 'var(--font-family)',
                }}
            />
        </div>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const probe = getComputedStyle(canvas.getByTestId('probe'));
        for (const role of roles) {
            const t = typographyTokens.typeScale[role];
            const style = getComputedStyle(canvas.getByTestId(role));
            await expect(style.fontSize, role).toBe(`${px(t.fontSize)}px`);
            await expect(style.lineHeight, role).toBe(`${px(t.lineHeight)}px`);
            await expect(style.fontWeight, role).toBe(String(t.fontWeight));
            await expect(style.fontFamily, role).toBe(probe.fontFamily);
            await expect(style.marginBlockStart, role).toBe('0px');
            await expect(style.marginBlockEnd, role).toBe('0px');
            await expect(style.color, role).toBe(probe.color);
        }
        await expect(
            getComputedStyle(canvas.getByTestId('weight')).fontWeight
        ).toBe('600');
        await expect(
            getComputedStyle(canvas.getByTestId('heading-regular')).fontWeight
        ).toBe('400');
        await expect(getComputedStyle(canvas.getByTestId('muted')).color).toBe(
            probe.backgroundColor
        );
        const truncated = canvas.getByTestId('truncate');
        const ts = getComputedStyle(truncated);
        await expect(ts.textOverflow).toBe('ellipsis');
        await expect(ts.whiteSpace).toBe('nowrap');
        await expect(truncated.scrollWidth).toBeGreaterThan(
            truncated.clientWidth
        );
        await expect(truncated.getBoundingClientRect().height).toBe(20);
    },
};
