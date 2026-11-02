import { BellIcon } from '@phosphor-icons/react/dist/csr/Bell';
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { CSSProperties, ReactNode } from 'react';
import { expect, within } from 'storybook/test';
import { HorizonProvider } from '../../provider';
import { ResponsiveSpec } from '../../stories/ResponsiveSpec';
import type { Brand } from '../../tokens';
import { Badge, BadgeAnchor, type BadgeTone } from '.';

/*
 * Stories are excluded from the Tailwind scan (ADR 0001), so layout here uses
 * inline styles; every visual on the Badge itself comes from the component.
 */

const tones = [
    'neutral',
    'primary',
    'info',
    'success',
    'warning',
    'error',
] as const satisfies readonly BadgeTone[];
const brandList = ['cial', 'dnb', 'il'] as const satisfies readonly Brand[];

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

/** Stand-in for an icon button or avatar (IconButton/Avatar land later). */
function Target({ round = false, label }: { round?: boolean; label: string }) {
    return (
        <span
            role="img"
            aria-label={label}
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                inlineSize: 40,
                blockSize: 40,
                borderRadius: round ? '50%' : 8,
                background: 'var(--muted)',
                color: 'var(--foreground)',
            }}
        >
            <BellIcon size={20} aria-hidden="true" />
        </span>
    );
}

const meta = {
    title: 'Components/Badge',
    component: Badge,
    parameters: {
        layout: 'padded',
        docs: {
            description: {
                component: [
                    'Small status indicator. Ported from x-core `Badge` (MUI), `BadgeAI` and `AIVerifiedBadge`.',
                    '',
                    '**Forms.** *Label* (children): tone dot (8px) + `micro` 10px semibold uppercase label in `foreground`, as x-core `Badge` with `label`. *Count* (`count`): 20px pill, `label/sm` tabular figures, tone `-strong` fill with `background` text (primary: `primary`/`primary-foreground`); `count > max` shows `{max}+` (max 999 as x-core), `0` renders nothing. *Dot* (no children): 8px tone dot, must carry `aria-label` (renders `role="img"`).',
                    '',
                    '**AI markers.** `ai` = x-core `BadgeAI` default: sparkle in a 20px `secondary`->`primary` gradient circle + `label/sm` text in `primary`. `ai-verified` / `ai-unverified` = x-core `AIVerifiedBadge` with `isValidated` true / false: 24px pill, 1px `success` / `destructive` ring, duotone sparkle in the `-strong` tone, 10px semibold `foreground` label. Give the two states different labels: colour alone does not tell them apart (x-core used "AI Verified" for both).',
                    '',
                    '**Accessibility.** Labels and counts are plain text, read in place. Name a count with `aria-label` when the number alone is unclear ("3 unread messages"; the badge then renders `role="img"`). A badge is not a live region; pass `role="status"` only when updates must be announced. The tone dot and the AI marks are decorative (`aria-hidden`).',
                    '',
                    '**BadgeAnchor** pins a badge to the top end corner of a control or avatar (`overlap="circular"` for round children); the corner follows `dir`.',
                ].join('\n'),
            },
        },
    },
    args: { children: 'Pending', variant: 'warning' },
    argTypes: {
        variant: {
            control: 'select',
            options: [...tones, 'ai', 'ai-verified', 'ai-unverified'],
        },
    },
} satisfies Meta<typeof Badge>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Controls playground. */
export const Playground: Story = {};

/** Status labels, counts and dots in every tone. */
export const Forms: Story = {
    render: () => (
        <div style={stack}>
            <Section title="label">
                {tones.map((tone) => (
                    <Badge key={tone} variant={tone}>
                        {tone}
                    </Badge>
                ))}
            </Section>
            <Section title="count">
                {tones.map((tone) => (
                    <Badge
                        key={tone}
                        variant={tone}
                        count={tone === 'error' ? 1200 : 8}
                    />
                ))}
            </Section>
            <Section title="dot">
                {tones.map((tone) => (
                    <Badge key={tone} variant={tone} aria-label={tone} />
                ))}
            </Section>
        </div>
    ),
};

/** AI markers (x-core BadgeAI and AIVerifiedBadge). */
export const AI: Story = {
    render: () => (
        <Section title="ai">
            <Badge variant="ai">AI summary</Badge>
            <Badge variant="ai-verified">AI verified</Badge>
            <Badge variant="ai-unverified">Not verified by AI</Badge>
        </Section>
    ),
};

/** Pinned to a control or avatar with BadgeAnchor. */
export const Anchored: Story = {
    render: () => (
        <Section title="anchor">
            <BadgeAnchor
                badge={
                    <Badge
                        variant="error"
                        count={4}
                        aria-label="4 unread notifications"
                    />
                }
            >
                <Target label="Notifications" />
            </BadgeAnchor>
            <BadgeAnchor
                overlap="circular"
                badge={<Badge variant="success" aria-label="Online" />}
            >
                <Target round label="Dana Levi" />
            </BadgeAnchor>
        </Section>
    ),
};

/** Long labels truncate inside a narrow container. */
export const LongLabel: Story = {
    render: () => (
        <div style={{ ...stack, inlineSize: 160, maxInlineSize: '100%' }}>
            <Badge variant="info">Waiting for document submission</Badge>
            <Badge variant="ai-verified">
                AI verified against the company registry
            </Badge>
        </div>
    ),
    play: async ({ canvasElement }) => {
        const container = canvasElement.firstElementChild;
        if (!(container instanceof HTMLElement))
            throw new Error('no container');
        const limit = container.getBoundingClientRect().right + 0.5;
        for (const badge of Array.from(container.children))
            await expect(
                badge.getBoundingClientRect().right
            ).toBeLessThanOrEqual(limit);
    },
};

/** Right-to-left: dot and marker lead; anchored badges sit on the left corner. */
export const RTL: Story = {
    globals: { direction: 'rtl' },
    render: () => (
        <Section title="rtl">
            <Badge variant="success">מאושר</Badge>
            <Badge variant="ai-verified">אומת על ידי AI</Badge>
            <BadgeAnchor
                badge={
                    <Badge variant="error" count={4} aria-label="4 התראות" />
                }
            >
                <Target label="התראות" />
            </BadgeAnchor>
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
                    <div style={{ ...row, marginBlockEnd: 8 }}>
                        {tones.map((tone) => (
                            <Badge key={tone} variant={tone}>
                                {tone}
                            </Badge>
                        ))}
                    </div>
                    <div style={{ ...row, marginBlockEnd: 8 }}>
                        {tones.map((tone) => (
                            <Badge key={tone} variant={tone} count={12} />
                        ))}
                    </div>
                    <div style={row}>
                        <Badge variant="ai">AI summary</Badge>
                        <Badge variant="ai-verified">AI verified</Badge>
                        <Badge variant="ai-unverified">Not verified</Badge>
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
                caption="Badge responsive specification"
                spec={{
                    mobile: {
                        size: 'Label 10/10 semibold with an 8px dot; count 20px tall (min 20px wide); AI pills 24px; dot 8px.',
                        density:
                            'Gap dot-label 6px, AI 4px; count padding 6px; AI pill padding 8px.',
                        layout: 'Inline. BadgeAnchor centres the badge on the top end corner of its child (14% inset for round children).',
                        contentVisibility:
                            'Long labels truncate inside the container; counts cap at max+ (999+).',
                        interaction:
                            'Not interactive: no touch target of its own. An anchored badge never takes the tap; its host control keeps its own 44px target.',
                    },
                    tablet: {
                        size: 'As mobile.',
                        density: 'As mobile.',
                        layout: 'As mobile.',
                        contentVisibility: 'As mobile.',
                        interaction: 'As mobile.',
                        note: 'Identical at all four: a badge annotates its host and must read the same wherever the host appears; density changes belong to the host.',
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
                <Badge variant="success">Approved</Badge>
                <Badge variant="error" count={4} />
                <Badge variant="ai">AI summary</Badge>
            </div>
        </div>
    ),
};

/* ---- Viewport and computed-style tests (Storybook browser project) ---- */

const viewportWidth = { mobile: 375, tablet: 768, laptop: 1280, desktop: 1920 };
type Viewport = keyof typeof viewportWidth;

function GeometryProbe({ dir }: { dir: 'ltr' | 'rtl' }) {
    return (
        <HorizonProvider dir={dir} style={{ padding: 32 }}>
            <div style={row}>
                <Badge variant="success" data-testid={`${dir}-label`}>
                    Approved
                </Badge>
                <Badge variant="error" count={4} data-testid={`${dir}-count`} />
                <Badge variant="ai-verified" data-testid={`${dir}-ai`}>
                    AI verified
                </Badge>
                <BadgeAnchor
                    data-testid={`${dir}-anchor`}
                    badge={
                        <Badge
                            variant="error"
                            count={4}
                            aria-label="4 unread"
                            data-testid={`${dir}-anchored`}
                        />
                    }
                >
                    <Target label="Notifications" />
                </BadgeAnchor>
            </div>
        </HorizonProvider>
    );
}

async function assertGeometry(canvasElement: HTMLElement, viewport: Viewport) {
    const canvas = within(canvasElement);
    await expect(window.innerWidth).toBe(viewportWidth[viewport]);
    for (const dir of ['ltr', 'rtl'] as const) {
        // Identical at every breakpoint (see Responsive).
        const count = canvas
            .getByTestId(`${dir}-count`)
            .getBoundingClientRect();
        await expect(count.height).toBe(20);
        await expect(count.width).toBeGreaterThanOrEqual(20);
        await expect(
            canvas.getByTestId(`${dir}-ai`).getBoundingClientRect().height
        ).toBe(24);
        const dot = canvas
            .getByTestId(`${dir}-label`)
            .querySelector('[data-badge-dot]');
        await expect(dot?.getBoundingClientRect().width).toBe(8);
        // Anchored badge centred on the top end corner (end follows dir).
        const host = canvas
            .getByTestId(`${dir}-anchor`)
            .getBoundingClientRect();
        const badge = canvas
            .getByTestId(`${dir}-anchored`)
            .getBoundingClientRect();
        const cornerX = dir === 'ltr' ? host.right : host.left;
        await expect(
            Math.abs(badge.left + badge.width / 2 - cornerX)
        ).toBeLessThanOrEqual(0.5);
        await expect(
            Math.abs(badge.top + badge.height / 2 - host.top)
        ).toBeLessThanOrEqual(0.5);
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
    name: 'keeps sizes and anchors to the end corner at mobile',
};
export const GeometryTablet: Story = {
    ...viewportTest('tablet'),
    name: 'keeps sizes and anchors to the end corner at tablet',
};
export const GeometryLaptop: Story = {
    ...viewportTest('laptop'),
    name: 'keeps sizes and anchors to the end corner at laptop',
};
export const GeometryDesktop: Story = {
    ...viewportTest('desktop'),
    name: 'keeps sizes and anchors to the end corner at desktop',
};

/** Computed styles that encode the design: type, tone tokens, fills, rings. */
export const ComputedStyles: Story = {
    name: 'applies Horizon tokens to the rendered badge',
    tags: ['!autodocs', '!dev'],
    globals: { viewport: { value: 'laptop', isRotated: false } },
    render: () => (
        <div style={row}>
            <Badge variant="success" data-testid="label">
                Approved
            </Badge>
            <Badge variant="error" count={4} data-testid="count" />
            <Badge variant="primary" count={4} data-testid="count-primary" />
            <Badge
                variant="error"
                count={2}
                role="status"
                aria-label="2 new alerts"
                data-testid="live"
            />
            <Badge variant="warning" aria-label="Pending" data-testid="dot" />
            <Badge variant="ai" data-testid="ai">
                AI summary
            </Badge>
            <Badge variant="ai-verified" data-testid="verified">
                AI verified
            </Badge>
            <span
                data-testid="probe"
                style={{
                    color: 'var(--foreground)',
                    background: 'var(--success)',
                    borderColor: 'var(--destructive-strong)',
                    outlineColor: 'var(--background)',
                    textDecorationColor: 'var(--primary)',
                }}
            />
        </div>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const probe = getComputedStyle(canvas.getByTestId('probe'));
        const label = canvas.getByTestId('label');
        const ls = getComputedStyle(label);
        await expect(ls.fontSize).toBe('10px');
        await expect(ls.fontWeight).toBe('600');
        await expect(ls.textTransform).toBe('uppercase');
        await expect(ls.color).toBe(probe.color);
        const dot = label.querySelector('[data-badge-dot]');
        if (!dot) throw new Error('no dot');
        const ds = getComputedStyle(dot);
        await expect(ds.backgroundColor).toBe(probe.backgroundColor);
        await expect(ds.borderRadius).toBe('100px');

        const cs = getComputedStyle(canvas.getByTestId('count'));
        await expect(cs.backgroundColor).toBe(probe.borderColor);
        await expect(cs.color).toBe(probe.outlineColor);
        await expect(cs.fontSize).toBe('12px');
        await expect(cs.fontVariantNumeric).toBe('tabular-nums');
        await expect(cs.textTransform).toBe('none');

        const live = canvas.getByTestId('live');
        const srOnly = within(live).getByText('2 new alerts');
        const sr = getComputedStyle(srOnly);
        await expect(sr.position).toBe('absolute');
        await expect(srOnly.getBoundingClientRect().width).toBeLessThanOrEqual(
            1
        );
        const dotStyle = getComputedStyle(canvas.getByTestId('dot'));
        await expect(dotStyle.boxShadow).toContain('0px 0px 0px 1px inset');

        const primary = getComputedStyle(canvas.getByTestId('count-primary'));
        await expect(primary.backgroundColor).toBe(probe.textDecorationColor);

        const ai = canvas.getByTestId('ai');
        await expect(getComputedStyle(ai).color).toBe(
            probe.textDecorationColor
        );
        await expect(getComputedStyle(ai).fontSize).toBe('12px');
        const icon = ai.querySelector('[data-badge-icon]');
        if (!icon) throw new Error('no icon');
        await expect(getComputedStyle(icon).backgroundImage).toContain(
            'linear-gradient(263deg'
        );
        await expect(icon.getBoundingClientRect().width).toBe(20);

        const verified = getComputedStyle(canvas.getByTestId('verified'));
        await expect(verified.boxShadow).toContain('0px 0px 0px 1px inset');
        await expect(verified.borderRadius).toBe('100px');
        await expect(verified.textTransform).toBe('none');
    },
};
