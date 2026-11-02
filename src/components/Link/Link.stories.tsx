import type { Meta, StoryObj } from '@storybook/react-vite';
import type { AnchorHTMLAttributes, CSSProperties, ReactNode } from 'react';
import { expect, within } from 'storybook/test';
import { HorizonProvider } from '../../provider';
import { ResponsiveSpec } from '../../stories/ResponsiveSpec';
import type { Brand } from '../../tokens';
import { Link, type LinkProps } from '.';

/*
 * Stories are excluded from the Tailwind scan (ADR 0001), so layout here uses
 * inline styles; every visual on the Link itself comes from the component.
 */

const variants = [
    'inline',
    'standalone',
    'subtle',
] as const satisfies readonly NonNullable<LinkProps['variant']>[];
const brandList = ['cial', 'dnb', 'il'] as const satisfies readonly Brand[];

const stack: CSSProperties = { display: 'grid', gap: 24 };
const row: CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 16,
};
const label: CSSProperties = {
    fontSize: 12,
    fontWeight: 600,
    color: 'var(--muted-foreground)',
    marginBlockEnd: 8,
};
const prose: CSSProperties = {
    margin: 0,
    maxInlineSize: '65ch',
    fontSize: 16,
    lineHeight: '24px',
    color: 'var(--foreground)',
};

function Section({ title, children }: { title: string; children: ReactNode }) {
    return (
        <section>
            <h3 style={label}>{title}</h3>
            {children}
        </section>
    );
}

/** Stand-in for react-router's Link (renders `<a href={to}>`). */
function RouterLink({
    to,
    children,
    ...rest
}: AnchorHTMLAttributes<HTMLAnchorElement> & { to: string }) {
    return (
        <a href={to} {...rest}>
            {children}
        </a>
    );
}

const meta = {
    title: 'Components/Link',
    component: Link,
    parameters: {
        layout: 'padded',
        docs: {
            description: {
                component: [
                    'A navigation link. Replaces x-core `Link` (Typography module; maps to `variant="standalone"`), MUI `Link` and `Typography component="a"` anchors. Router links use `asChild`.',
                    '',
                    '**Variants.** `inline`: in running text, primary, always underlined (colour is not the only cue), thicker underline on hover, inherits the type. `standalone`: on its own, semibold `label/md` (or `label/sm`), underline on pointer hover, 44px target at mobile and on touch. `subtle`: takes the surrounding colour (titles, table cells), underline on pointer hover; not for links inside sentences.',
                    '',
                    '**States.** Hover: `primary-hover` (pointer only); on touch the rest look stays (no sticky hover). Active: `primary-hover`. Focus-visible: 2px `ring` outline at 2px offset. Visited: same colour (product UI). Disabled: `href` removed, `aria-disabled`, muted, not focusable.',
                    '',
                    '**External.** `isExternal` sets `target="_blank"`, `rel="noopener noreferrer"` (merged with yours), a visually hidden "(opens in new tab)" (`externalLabel`) and an icon (`showExternalIcon`).',
                    '',
                    '**Legacy hosts.** With `styles.unlayered.css` the Bootstrap reboot `a`, `a:hover` and `a:not([href])` rules do not change any state (anchorGuard).',
                ].join('\n'),
            },
        },
    },
    args: { href: '#reports', children: 'View all reports' },
    argTypes: {
        variant: { control: 'inline-radio', options: variants },
        size: { control: 'inline-radio', options: ['sm', 'md'] },
    },
} satisfies Meta<typeof Link>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Controls playground. */
export const Playground: Story = {};

/** The three variants in their context. */
export const Variants: Story = {
    render: () => (
        <div style={stack}>
            <Section title="inline">
                <p style={prose}>
                    Read the <Link href="#terms">data processing terms</Link>{' '}
                    before exporting the portfolio.
                </p>
            </Section>
            <Section title="standalone (sm, md)">
                <div style={row}>
                    <Link href="#all" variant="standalone" size="sm">
                        View all decisions
                    </Link>
                    <Link href="#all" variant="standalone">
                        View all decisions
                    </Link>
                </div>
            </Section>
            <Section title="subtle (inherits colour)">
                <h4 style={{ ...prose, fontWeight: 700 }}>
                    <Link href="#doc" variant="subtle">
                        Credit decision Q3.pdf
                    </Link>
                </h4>
            </Section>
        </div>
    ),
};

/** External links: new tab, safe rel, hidden hint, icon. */
export const External: Story = {
    render: () => (
        <div style={stack}>
            <p style={prose}>
                The{' '}
                <Link href="https://example.com/policy" isExternal>
                    privacy policy
                </Link>{' '}
                applies.
            </p>
            <Link href="https://example.com" variant="standalone" isExternal>
                Open decision document
            </Link>
            <Link
                href="https://example.com"
                variant="subtle"
                isExternal
                showExternalIcon={false}
            >
                Without icon
            </Link>
        </div>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const link = canvas.getByRole('link', {
            name: 'privacy policy (opens in new tab)',
        });
        await expect(link).toHaveAttribute('target', '_blank');
        await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    },
};

/** Disabled: no href, muted, announced as an unavailable link. */
export const Disabled: Story = {
    render: () => (
        <div style={row}>
            {variants.map((variant) => (
                <Link key={variant} href="#x" variant={variant} disabled>
                    {`${variant} disabled`}
                </Link>
            ))}
        </div>
    ),
    play: async ({ canvasElement }) => {
        for (const link of within(canvasElement).getAllByRole('link')) {
            await expect(link).toHaveAttribute('aria-disabled', 'true');
            await expect(link).not.toHaveAttribute('href');
        }
    },
};

/** Router link through `asChild`. */
export const AsRouterLink: Story = {
    render: () => (
        <Link asChild variant="standalone">
            <RouterLink to="#groups">Go to groups</RouterLink>
        </Link>
    ),
};

/** Long URLs break inside a narrow column instead of overflowing. */
export const LongText: Story = {
    render: () => (
        <p style={{ ...prose, inlineSize: 240, maxInlineSize: '100%' }}>
            Source:{' '}
            <Link href="#long">
                https://reports.example.com/portfolio/2026/q3/credit-decisions/export?format=pdf
            </Link>
        </p>
    ),
    play: async ({ canvasElement }) => {
        const p = canvasElement.querySelector('p');
        if (!p) throw new Error('no paragraph');
        await expect(p.scrollWidth).toBeLessThanOrEqual(p.clientWidth);
    },
};

/** Right-to-left: the icon follows the text, underline unchanged. */
export const RTL: Story = {
    globals: { direction: 'rtl' },
    render: () => (
        <div style={stack}>
            <p style={prose}>
                קראו את <Link href="#terms">תנאי השימוש</Link> לפני הייצוא.
            </p>
            <Link
                href="https://example.com"
                variant="standalone"
                isExternal
                externalLabel="(נפתח בלשונית חדשה)"
            >
                מסמך ההחלטה
            </Link>
        </div>
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
                        <p style={prose}>
                            Read the <Link href="#t">terms</Link>.
                        </p>
                        <Link href="#a" variant="standalone">
                            View all
                        </Link>
                        <span style={{ color: 'var(--foreground)' }}>
                            <Link href="#s" variant="subtle">
                                Subtle
                            </Link>
                        </span>
                        <Link href="#d" variant="standalone" disabled>
                            Disabled
                        </Link>
                    </div>
                </HorizonProvider>
            ))}
        </div>
    ),
};

function Probe() {
    return (
        <div style={stack}>
            <div style={row}>
                <Link
                    href="#a"
                    variant="standalone"
                    data-testid="standalone-md"
                >
                    View all
                </Link>
                <Link
                    href="#a"
                    variant="standalone"
                    size="sm"
                    data-testid="standalone-sm"
                >
                    Go
                </Link>
            </div>
            <p style={prose}>
                Read the{' '}
                <Link href="#t" data-testid="inline">
                    terms
                </Link>{' '}
                first.
            </p>
        </div>
    );
}

/** Per-breakpoint specification (Responsive Standard). */
export const Responsive: Story = {
    render: () => (
        <div style={stack}>
            <ResponsiveSpec
                caption="Link responsive specification"
                spec={{
                    mobile: {
                        size: 'standalone: label/md 14/20 (sm: label/sm 12/16), box at least 44x44px. inline/subtle: inherit the text, no box.',
                        density:
                            'standalone: 4px gap to the external icon; no padding.',
                        layout: 'inline/subtle flow in text and wrap anywhere (long URLs); standalone is an inline-flex row.',
                        contentVisibility:
                            'Full text; external hint visually hidden; icon 1em.',
                        interaction:
                            'Touch: no hover look (sticky hover keeps the rest look); press shows primary-hover.',
                        note: 'Inline links are exempt from the 44px target (WCAG 2.5.8 inline exception).',
                    },
                    tablet: {
                        size: 'Fine pointer: standalone shrinks to its text (20px tall at md). Touch: keeps 44px.',
                        density: 'Same as mobile.',
                        layout: 'Same as mobile.',
                        contentVisibility: 'Same as mobile.',
                        interaction:
                            'Pointer: hover colour and underline; keyboard: focus-visible ring.',
                    },
                    laptop: {
                        size: 'As tablet.',
                        density: 'As tablet.',
                        layout: 'As tablet.',
                        contentVisibility: 'As tablet.',
                        interaction: 'As tablet.',
                        note: 'Identical to tablet: a link follows its text, not the viewport.',
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
            <Probe />
        </div>
    ),
};

/* ---- Viewport tests (real compiled CSS and layout, Storybook browser project) ---- */

const viewportWidth = { mobile: 375, tablet: 768, laptop: 1280, desktop: 1920 };
type Viewport = keyof typeof viewportWidth;
const standaloneHeight = {
    mobile: { md: 44, sm: 44 },
    tablet: { md: 20, sm: 16 },
    laptop: { md: 20, sm: 16 },
    desktop: { md: 20, sm: 16 },
} as const;

async function assertViewport(canvasElement: HTMLElement, viewport: Viewport) {
    const canvas = within(canvasElement);
    await expect(window.innerWidth).toBe(viewportWidth[viewport]);
    for (const size of ['md', 'sm'] as const) {
        const rect = canvas
            .getByTestId(`standalone-${size}`)
            .getBoundingClientRect();
        await expect(rect.height).toBe(standaloneHeight[viewport][size]);
        if (viewport === 'mobile')
            await expect(rect.width).toBeGreaterThanOrEqual(44);
    }
    // Inline links never get a box: their line box is the paragraph's.
    const inline = canvas.getByTestId('inline');
    await expect(getComputedStyle(inline).display).toBe('inline');
    await expect(inline.getBoundingClientRect().height).toBeLessThan(30);
}

const viewportTest = (viewport: Viewport) => ({
    tags: ['!autodocs', '!dev'],
    globals: { viewport: { value: viewport, isRotated: false } },
    render: () => <Probe />,
    play: async ({ canvasElement }: { canvasElement: HTMLElement }) =>
        assertViewport(canvasElement, viewport),
});

export const TargetMobile: Story = {
    ...viewportTest('mobile'),
    name: 'standalone links are at least 44px at mobile; inline are not boxed',
};
export const TargetTablet: Story = {
    ...viewportTest('tablet'),
    name: 'standalone links follow their text with a fine pointer at tablet',
};
export const TargetLaptop: Story = {
    ...viewportTest('laptop'),
    name: 'standalone links follow their text with a fine pointer at laptop',
};
export const TargetDesktop: Story = {
    ...viewportTest('desktop'),
    name: 'standalone links follow their text with a fine pointer at desktop',
};

/** Computed styles that encode the design. */
export const ComputedStyles: Story = {
    name: 'applies Horizon tokens to the rendered link',
    tags: ['!autodocs', '!dev'],
    globals: { viewport: { value: 'laptop', isRotated: false } },
    render: () => (
        <div style={stack}>
            <p style={prose}>
                <Link href="#t" data-testid="inline">
                    terms
                </Link>{' '}
                <span style={{ color: 'var(--success-strong)' }}>
                    <Link href="#s" variant="subtle" data-testid="subtle">
                        subtle
                    </Link>
                </span>
            </p>
            <Link href="#a" variant="standalone" data-testid="standalone">
                View all
            </Link>
            <Link
                href="#a"
                variant="standalone"
                isExternal
                data-testid="external"
            >
                Open
            </Link>
            <Link href="#d" disabled data-testid="disabled">
                Disabled
            </Link>
            <span
                data-testid="probe"
                style={{
                    color: 'var(--primary)',
                    background: 'var(--muted-foreground)',
                    borderColor: 'var(--success-strong)',
                    outlineColor: 'var(--ring)',
                }}
            />
        </div>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const probe = getComputedStyle(canvas.getByTestId('probe'));
        const inline = canvas.getByTestId('inline');
        const inlineStyle = getComputedStyle(inline);
        await expect(inlineStyle.color).toBe(probe.color);
        await expect(inlineStyle.textDecorationLine).toBe('underline');
        await expect(inlineStyle.fontSize).toBe('16px');
        const subtle = getComputedStyle(canvas.getByTestId('subtle'));
        await expect(subtle.color).toBe(probe.borderTopColor);
        await expect(subtle.textDecorationLine).toBe('none');
        const standalone = getComputedStyle(canvas.getByTestId('standalone'));
        await expect(standalone.color).toBe(probe.color);
        await expect(standalone.textDecorationLine).toBe('none');
        await expect(standalone.fontSize).toBe('14px');
        await expect(standalone.fontWeight).toBe('600');
        await expect(standalone.transitionDuration).toContain('0.1s');
        const icon = canvas.getByTestId('external').querySelector('svg');
        await expect(icon?.getBoundingClientRect().width).toBe(14);
        const disabled = getComputedStyle(canvas.getByTestId('disabled'));
        await expect(disabled.color).toBe(probe.backgroundColor);
        await expect(disabled.cursor).toBe('not-allowed');
        inline.focus();
        const focused = getComputedStyle(inline);
        await expect(focused.outlineStyle).toBe('solid');
        await expect(focused.outlineWidth).toBe('2px');
        await expect(focused.outlineColor).toBe(probe.outlineColor);
    },
};
