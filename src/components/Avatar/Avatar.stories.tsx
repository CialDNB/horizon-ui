import type { Meta, StoryObj } from '@storybook/react-vite';
import type { CSSProperties, ReactNode } from 'react';
import { expect, waitFor, within } from 'storybook/test';
import { HorizonProvider } from '../../provider';
import { ResponsiveSpec } from '../../stories/ResponsiveSpec';
import type { Brand } from '../../tokens';
import { Avatar, AvatarGroup, type AvatarProps } from '.';

/*
 * Stories are excluded from the Tailwind scan (ADR 0001), so layout here uses
 * inline styles; every visual on the Avatar itself comes from the component.
 */

const sizes = [
    'xs',
    'sm',
    'md',
    'lg',
    'xl',
] as const satisfies readonly NonNullable<AvatarProps['size']>[];
const tones = [
    'primary',
    'neutral',
    'info',
    'success',
    'warning',
    'error',
] as const satisfies readonly NonNullable<AvatarProps['tone']>[];
const brandList = ['cial', 'dnb', 'il'] as const satisfies readonly Brand[];
const px = { xs: 16, sm: 24, md: 32, lg: 40, xl: 64 } as const;

// Inline image (no network in tests): a portrait-like two-tone square.
const PHOTO = `data:image/svg+xml,${encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="#5b7083"/><circle cx="32" cy="26" r="12" fill="#e8d5c4"/><rect x="12" y="42" width="40" height="30" rx="16" fill="#e8d5c4"/></svg>'
)}`;
const BROKEN = '/__missing-avatar__.png';

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

const people = [
    'Dana Levi',
    'Omer Katz',
    'Noa Peretz',
    'Yael Ben-David',
    'Tom Gil',
    'Rina Shaked',
];

const meta = {
    title: 'Components/Avatar',
    component: Avatar,
    parameters: {
        layout: 'padded',
        docs: {
            description: {
                component: [
                    'A person or entity: image, or initials (person icon without a name) while it loads, if it fails, or when there is none. Ported from x-core `Avatar` and `AvatarGroup` (no Radix; native image load handling).',
                    '',
                    '**Sizes (px).** xs 16 (one initial, `micro`), sm 24 (`label/sm`), md 32 (`label/md`), lg 40 (`label/lg`), xl 64 (`heading/sm`). Same at every breakpoint. **Shape.** `circle` for people, `rounded` (4px up to sm, 8px from md) for companies. **Tone** of the fallback: `primary` (x-core look) or soft status tints.',
                    '',
                    '**Accessibility.** Named once, as `role="img"`, by `alt` or `name`; initials and the image itself are hidden. Pass `alt=""` when the name is visible next to it. Not interactive: put it inside a Button or link for an action (that control gets the 44px target).',
                    '',
                    '**AvatarGroup.** Overlapping row, 2px `background` ring, `+N` avatar named "N more" (translate with `overflowLabel`). `max` counts the `+N` avatar.',
                ].join('\n'),
            },
        },
    },
    args: { name: 'Dana Levi' },
    argTypes: {
        size: { control: 'inline-radio', options: sizes },
        tone: { control: 'select', options: tones },
        shape: { control: 'inline-radio', options: ['circle', 'rounded'] },
    },
} satisfies Meta<typeof Avatar>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Controls playground. */
export const Playground: Story = {};

/** Every size, with initials, the person icon and an image. */
export const Sizes: Story = {
    render: () => (
        <div style={stack}>
            <Section title="initials">
                {sizes.map((size) => (
                    <Avatar key={size} size={size} name="Dana Levi" />
                ))}
            </Section>
            <Section title="no name (decorative person icon)">
                {sizes.map((size) => (
                    <Avatar key={size} size={size} />
                ))}
            </Section>
            <Section title="image">
                {sizes.map((size) => (
                    <Avatar
                        key={size}
                        size={size}
                        src={PHOTO}
                        name="Omer Katz"
                    />
                ))}
            </Section>
            <Section title="rounded (entities)">
                {sizes.map((size) => (
                    <Avatar
                        key={size}
                        size={size}
                        shape="rounded"
                        name="Acme Trading"
                    />
                ))}
            </Section>
        </div>
    ),
};

/** Fallback tones: solid primary (default) and soft status tints. */
export const Tones: Story = {
    render: () => (
        <Section title="tones">
            {tones.map((tone) => (
                <Avatar
                    key={tone}
                    tone={tone}
                    size="lg"
                    name={`${tone} user`}
                />
            ))}
        </Section>
    ),
};

/** A broken image falls back to the initials; a loaded one replaces them. */
export const ImageFallback: Story = {
    render: () => (
        <Section title="image states">
            <Avatar size="lg" src={PHOTO} name="Omer Katz" data-testid="ok" />
            <Avatar
                size="lg"
                src={BROKEN}
                name="Noa Peretz"
                data-testid="broken"
            />
        </Section>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        // Image load/error events can take over 1s while the full suite runs
        // in parallel (flaked from Task 11a on); wait up to 5s.
        await waitFor(
            () =>
                expect(canvas.getByTestId('broken')).toHaveAttribute(
                    'data-status',
                    'error'
                ),
            { timeout: 5000 }
        );
        await expect(canvas.getByTestId('broken')).toHaveTextContent('NP');
        await waitFor(
            () =>
                expect(canvas.getByTestId('ok')).toHaveAttribute(
                    'data-status',
                    'loaded'
                ),
            { timeout: 5000 }
        );
        await expect(
            canvas.getByRole('img', { name: 'Omer Katz' })
        ).toBeVisible();
    },
};

/** Name shown next to the avatar: `alt=""` so it is read once. */
export const WithVisibleName: Story = {
    render: () => (
        <div style={{ ...row, gap: 8 }}>
            <Avatar name="Dana Levi" alt="" />
            <span style={{ color: 'var(--foreground)', fontSize: 14 }}>
                Dana Levi
            </span>
        </div>
    ),
    play: async ({ canvasElement }) => {
        await expect(within(canvasElement).queryByRole('img')).toBeNull();
    },
};

/** Groups: overflow `+N`, `total` beyond the children, sizes. */
export const Group: Story = {
    render: () => (
        <div style={stack}>
            <Section title="max 3 (default)">
                <AvatarGroup aria-label="Assignees">
                    {people.map((name) => (
                        <Avatar key={name} name={name} />
                    ))}
                </AvatarGroup>
            </Section>
            <Section title="max 4, md, with images">
                <AvatarGroup size="md" max={4} aria-label="Reviewers">
                    {people.map((name, i) => (
                        <Avatar
                            key={name}
                            name={name}
                            {...(i % 2 === 0 && { src: PHOTO })}
                        />
                    ))}
                </AvatarGroup>
            </Section>
            <Section title="total 120, xl">
                <AvatarGroup size="xl" total={120} aria-label="Team">
                    {people.slice(0, 2).map((name) => (
                        <Avatar key={name} name={name} />
                    ))}
                </AvatarGroup>
            </Section>
        </div>
    ),
};

/** Long and non-Latin names: initials stay two letters, the box never grows. */
export const LongNames: Story = {
    render: () => (
        <Section title="long names">
            <Avatar
                size="md"
                name="Maximiliana Wolfeschlegelsteinhausenbergerdorff"
            />
            <Avatar size="md" name="דנה לוי" />
            <Avatar size="md" name="محمد علي" />
            <Avatar size="md" name="Émile Zola" />
        </Section>
    ),
};

/** Right-to-left: groups overlap toward the inline start. */
export const RTL: Story = {
    globals: { direction: 'rtl' },
    render: () => (
        <Section title="rtl">
            <AvatarGroup size="md" aria-label="משתתפים">
                {['דנה לוי', 'עומר כץ', 'נועה פרץ', 'יעל בן'].map((name) => (
                    <Avatar key={name} name={name} />
                ))}
            </AvatarGroup>
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
                        {tones.map((tone) => (
                            <Avatar
                                key={tone}
                                tone={tone}
                                size="md"
                                name={`${tone} user`}
                            />
                        ))}
                        <AvatarGroup aria-label={`${brand} group`}>
                            {people.map((name) => (
                                <Avatar key={name} name={name} />
                            ))}
                        </AvatarGroup>
                    </div>
                </HorizonProvider>
            ))}
        </div>
    ),
};

const responsiveSpec = {
    mobile: {
        size: 'xs 16, sm 24, md 32, lg 40, xl 64px; initials micro / label sm / label md / label lg / heading sm.',
        density:
            'Group overlap 4px (xs, sm) or 8px (md+), 2px background ring.',
        layout: 'Inline box; a group is one row and never wraps (overflow goes into +N).',
        contentVisibility:
            'Two initials (one at xs); image replaces them once loaded; +N for people beyond max.',
        interaction:
            'None: not interactive, no hover. An action wraps it in a Button or link, which owns the 44px target.',
    },
    tablet: {
        size: 'Same as mobile.',
        density: 'Same as mobile.',
        layout: 'Same as mobile.',
        contentVisibility: 'Same as mobile.',
        interaction: 'Same as mobile.',
        note: 'Identical at all four: an avatar is an identity glyph sized by its context (list row, header), so the caller picks the size per layout, as customer360 does for the company logo.',
    },
    laptop: {
        size: 'Same as mobile.',
        density: 'Same as mobile.',
        layout: 'Same as mobile.',
        contentVisibility: 'Same as mobile.',
        interaction: 'Same as mobile.',
        note: 'Identical (see tablet).',
    },
    desktop: {
        size: 'Same as mobile.',
        density: 'Same as mobile.',
        layout: 'Same as mobile.',
        contentVisibility: 'Same as mobile.',
        interaction: 'Same as mobile.',
        note: 'Identical (see tablet).',
    },
};

function Probe() {
    return (
        <div style={stack}>
            <div style={row}>
                {sizes.map((size) => (
                    <Avatar
                        key={size}
                        size={size}
                        name="Dana Levi"
                        data-testid={`size-${size}`}
                    />
                ))}
            </div>
            <div>
                <AvatarGroup
                    size="md"
                    aria-label="Assignees"
                    data-testid="group"
                >
                    {people.map((name) => (
                        <Avatar key={name} name={name} />
                    ))}
                </AvatarGroup>
            </div>
        </div>
    );
}

/** Per-breakpoint specification (Responsive Standard). */
export const Responsive: Story = {
    render: () => (
        <div style={stack}>
            <ResponsiveSpec
                caption="Avatar responsive specification"
                spec={responsiveSpec}
            />
            <Probe />
        </div>
    ),
};

/* ---- Viewport tests (real compiled CSS and layout, Storybook browser project) ---- */

const viewportWidth = { mobile: 375, tablet: 768, laptop: 1280, desktop: 1920 };
type Viewport = keyof typeof viewportWidth;

async function assertViewport(canvasElement: HTMLElement, viewport: Viewport) {
    const canvas = within(canvasElement);
    await expect(window.innerWidth).toBe(viewportWidth[viewport]);
    for (const size of sizes) {
        const rect = canvas.getByTestId(`size-${size}`).getBoundingClientRect();
        await expect([rect.width, rect.height]).toEqual([px[size], px[size]]);
    }
    // md group: 3 avatars of 32px overlapping by 8px = 32 + 2 x 24.
    const group = canvas.getByTestId('group');
    await expect(group.getBoundingClientRect().width).toBe(80);
    await expect(group.getBoundingClientRect().height).toBe(32);
    // Not interactive: nothing in the tab order.
    await expect(group.querySelector('[tabindex], button, a')).toBeNull();
    await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(
        window.innerWidth
    );
}

const viewportTest = (viewport: Viewport) => ({
    tags: ['!autodocs', '!dev'],
    globals: { viewport: { value: viewport, isRotated: false } },
    render: () => <Probe />,
    play: async ({ canvasElement }: { canvasElement: HTMLElement }) =>
        assertViewport(canvasElement, viewport),
});

export const SizesMobile: Story = {
    ...viewportTest('mobile'),
    name: 'keeps every size and the group overlap at mobile',
};
export const SizesTablet: Story = {
    ...viewportTest('tablet'),
    name: 'keeps every size and the group overlap at tablet',
};
export const SizesLaptop: Story = {
    ...viewportTest('laptop'),
    name: 'keeps every size and the group overlap at laptop',
};
export const SizesDesktop: Story = {
    ...viewportTest('desktop'),
    name: 'keeps every size and the group overlap at desktop',
};

/** Computed styles that encode the design: type step, radius, ring, image fit. */
export const ComputedStyles: Story = {
    name: 'applies Horizon tokens to the rendered avatar',
    tags: ['!autodocs', '!dev'],
    globals: { viewport: { value: 'laptop', isRotated: false } },
    render: () => (
        <div style={row}>
            {sizes.map((size) => (
                <Avatar
                    key={size}
                    size={size}
                    name="Dana Levi"
                    data-testid={`type-${size}`}
                />
            ))}
            <Avatar shape="rounded" size="sm" name="Acme" data-testid="r-sm" />
            <Avatar shape="rounded" size="md" name="Acme" data-testid="r-md" />
            <Avatar
                size="lg"
                src={PHOTO}
                name="Omer Katz"
                data-testid="photo"
            />
            <AvatarGroup data-testid="group">
                <Avatar name="Dana Levi" />
                <Avatar name="Omer Katz" />
            </AvatarGroup>
            <span
                data-testid="probe"
                style={{
                    background: 'var(--primary)',
                    color: 'var(--primary-foreground)',
                    borderColor: 'var(--background)',
                }}
            />
        </div>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const type = {
            xs: '10px',
            sm: '12px',
            md: '14px',
            lg: '16px',
            xl: '24px',
        } as const;
        const probe = getComputedStyle(canvas.getByTestId('probe'));
        for (const size of sizes) {
            const style = getComputedStyle(canvas.getByTestId(`type-${size}`));
            await expect(style.fontSize).toBe(type[size]);
            await expect(style.fontWeight).toBe('600');
            await expect(style.borderRadius).toMatch(
                /^(9999|100|3\.35544e\+07)/
            );
            await expect(style.backgroundColor).toBe(probe.backgroundColor);
            await expect(style.color).toBe(probe.color);
            await expect(style.overflow).toBe('hidden');
        }
        await expect(
            getComputedStyle(canvas.getByTestId('r-sm')).borderRadius
        ).toBe('4px');
        await expect(
            getComputedStyle(canvas.getByTestId('r-md')).borderRadius
        ).toBe('8px');
        await waitFor(() =>
            expect(canvas.getByTestId('photo')).toHaveAttribute(
                'data-status',
                'loaded'
            )
        );
        const image = canvas.getByTestId('photo').querySelector('img');
        if (!image) throw new Error('no image');
        await expect(getComputedStyle(image).objectFit).toBe('cover');
        await expect(image.getBoundingClientRect().width).toBe(40);
        const second = canvas.getByTestId('group').children[1];
        if (!second) throw new Error('no second avatar');
        const ring = getComputedStyle(second).boxShadow;
        await expect(ring).toContain('0px 0px 0px 2px');
        await expect(ring).toContain(probe.borderTopColor);
    },
};
