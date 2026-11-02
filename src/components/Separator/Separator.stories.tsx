import type { Meta, StoryObj } from '@storybook/react-vite';
import type { CSSProperties, ReactNode } from 'react';
import { expect, within } from 'storybook/test';
import { HorizonProvider } from '../../provider';
import { ResponsiveSpec } from '../../stories/ResponsiveSpec';
import type { Brand } from '../../tokens';
import { Button } from '../Button';
import { Typography } from '../Typography';
import { Separator } from '.';

/*
 * Stories are excluded from the Tailwind scan (ADR 0001), so layout here uses
 * inline styles; every visual on the Separator itself comes from the component.
 */

const brandList = ['cial', 'dnb', 'il'] as const satisfies readonly Brand[];

const stack: CSSProperties = { display: 'grid', gap: 24 };
const caption: CSSProperties = {
    fontSize: 12,
    fontWeight: 600,
    color: 'var(--muted-foreground)',
    marginBlockEnd: 8,
};
const card: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    padding: 16,
    border: '1px solid var(--border)',
    borderRadius: 16,
    background: 'var(--background)',
    maxInlineSize: 480,
};
const toolbar: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
};

function Section({ title, children }: { title: string; children: ReactNode }) {
    return (
        <section>
            <h3 style={caption}>{title}</h3>
            {children}
        </section>
    );
}

const meta = {
    title: 'Components/Separator',
    component: Separator,
    parameters: {
        layout: 'padded',
        docs: {
            description: {
                component: [
                    'A 1px line that separates content. Ported from x-core `Divider` (MUI): `orientation` kept, `flexItem` is built in (a vertical separator always stretches to its flex or grid row), `color` and `sx` become `className`.',
                    '',
                    '**Look.** 1px in the `border` token (x-core used `#CBD5E1`, the `input` token; `border` is one step lighter and is the semantic role for dividers). No margin: put it in a flex or grid layout and space it with `gap`.',
                    '',
                    '**Accessibility.** Decorative by default (`role="none"`), like shadcn/Radix: most dividers only echo a visual grouping the headings already convey. Pass `decorative={false}` when the line marks a real boundary between groups (toolbar groups, menu sections): it then renders `role="separator"` with `aria-orientation`. Divider lines are not \'graphics required to understand content\', so WCAG 1.4.11\'s 3:1 does not apply (the `border` token is about 1.2:1 on `background`).',
                    '',
                    '**Coexistence.** Renders a `<div>`, never `<hr>`: Bootstrap reboot sets `hr { margin: 1rem 0; border-top: 1px solid rgba(0,0,0,.1) }` (unlayered), which would add margins and a second line.',
                ].join('\n'),
            },
        },
    },
    argTypes: {
        orientation: {
            control: 'inline-radio',
            options: ['horizontal', 'vertical'],
        },
    },
    render: (args) => (
        <div
            style={{
                ...toolbar,
                flexDirection:
                    args.orientation === 'vertical' ? 'row' : 'column',
                alignItems: 'stretch',
                blockSize: args.orientation === 'vertical' ? 40 : undefined,
                maxInlineSize: 480,
            }}
        >
            <span>Before</span>
            <Separator {...args} />
            <span>After</span>
        </div>
    ),
} satisfies Meta<typeof Separator>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Controls playground. */
export const Playground: Story = {};

/** Horizontal between card sections, vertical between toolbar groups. */
export const Orientations: Story = {
    render: () => (
        <div style={stack}>
            <Section title="horizontal (decorative)">
                <div style={card}>
                    <Typography variant="label/md">Report order</Typography>
                    <Typography variant="body/secondary">
                        Ordered 12 Oct 2026 by Dana Levi.
                    </Typography>
                    <Separator />
                    <Typography variant="body/secondary">
                        Delivery expected within two business days.
                    </Typography>
                </div>
            </Section>
            <Section title="vertical (semantic, between toolbar groups)">
                <div role="toolbar" aria-label="Report actions" style={toolbar}>
                    <Button variant="ghost" size="sm">
                        Download
                    </Button>
                    <Button variant="ghost" size="sm">
                        Share
                    </Button>
                    <Separator orientation="vertical" decorative={false} />
                    <Button variant="ghost" size="sm">
                        Archive
                    </Button>
                </div>
            </Section>
            <Section title="vertical between stats (row aligned to centre)">
                <div style={{ ...toolbar, gap: 24 }}>
                    <div>
                        <Typography variant="heading/sm" as="p">
                            72
                        </Typography>
                        <Typography variant="caption">Paydex</Typography>
                    </div>
                    <Separator orientation="vertical" />
                    <div>
                        <Typography variant="heading/sm" as="p">
                            14
                        </Typography>
                        <Typography variant="caption">Days late</Typography>
                    </div>
                </div>
            </Section>
        </div>
    ),
};

/** Right-to-left: identical lines; the toolbar order mirrors. */
export const RTL: Story = {
    globals: { direction: 'rtl' },
    render: () => (
        <div style={stack}>
            <div style={card}>
                <Typography variant="label/md">הזמנת דוח</Typography>
                <Separator />
                <Typography variant="body/secondary">
                    המסירה צפויה תוך שני ימי עסקים.
                </Typography>
            </div>
            <div role="toolbar" aria-label="פעולות" style={toolbar}>
                <Button variant="ghost" size="sm">
                    הורדה
                </Button>
                <Separator orientation="vertical" decorative={false} />
                <Button variant="ghost" size="sm">
                    שיתוף
                </Button>
            </div>
        </div>
    ),
};

/** All three brands side by side. */
export const Brands: Story = {
    render: () => (
        <div style={stack}>
            {brandList.map((brand) => (
                <HorizonProvider
                    key={brand}
                    brand={brand}
                    style={{ background: 'var(--background)', padding: 16 }}
                >
                    <div style={card}>
                        <Typography variant="label/md">{brand}</Typography>
                        <Separator />
                        <div style={{ ...toolbar, blockSize: 24 }}>
                            <Typography variant="caption">Start</Typography>
                            <Separator orientation="vertical" />
                            <Typography variant="caption">End</Typography>
                        </div>
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
                caption="Separator responsive specification"
                spec={{
                    mobile: {
                        size: '1px thick; horizontal fills the container width, vertical fills the row height.',
                        density:
                            'No margin; spacing is the gap of the surrounding layout.',
                        layout: 'Horizontal between stacked blocks; vertical between items of a flex or grid row (stretches regardless of align-items).',
                        contentVisibility: 'Always visible; no text.',
                        interaction: 'Not interactive.',
                    },
                    tablet: {
                        size: 'As mobile.',
                        density: 'As mobile.',
                        layout: 'As mobile.',
                        contentVisibility: 'As mobile.',
                        interaction: 'As mobile.',
                        note: 'Identical at all four: a hairline has no density of its own; when a host row stacks at mobile, the host swaps a vertical separator for a horizontal one (orientation is a prop, not a breakpoint behaviour, so the host decides).',
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
            <div style={card}>
                <Typography variant="label/md">Section</Typography>
                <Separator />
                <Typography variant="body/secondary">Content</Typography>
            </div>
        </div>
    ),
};

/* ---- Viewport and computed-style tests (Storybook browser project) ---- */

const viewportWidth = { mobile: 375, tablet: 768, laptop: 1280, desktop: 1920 };
type Viewport = keyof typeof viewportWidth;

function GeometryProbe() {
    return (
        <div style={stack}>
            {/* Horizontal inside a centred flex column: must still fill it. */}
            <div
                data-testid="column"
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 8,
                }}
            >
                <span>Above</span>
                <Separator data-testid="h-flex" />
                <span>Below</span>
            </div>
            {/* Vertical inside a centred flex row: must stretch to its height. */}
            <div
                data-testid="row"
                style={{ display: 'flex', alignItems: 'center', gap: 8 }}
            >
                <span style={{ blockSize: 40, display: 'inline-flex' }}>
                    Tall item
                </span>
                <Separator orientation="vertical" data-testid="v-flex" />
                <span>Short</span>
            </div>
            {/* Vertical in a grid row. */}
            <div
                data-testid="grid"
                style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr auto 1fr',
                    alignItems: 'center',
                    gap: 8,
                }}
            >
                <span style={{ blockSize: 32, display: 'block' }}>Left</span>
                <Separator orientation="vertical" data-testid="v-grid" />
                <span>Right</span>
            </div>
            <div data-testid="block">
                <Separator data-testid="h-block" />
            </div>
        </div>
    );
}

async function assertGeometry(canvasElement: HTMLElement, viewport: Viewport) {
    const canvas = within(canvasElement);
    await expect(window.innerWidth).toBe(viewportWidth[viewport]);
    const box = (id: string) => canvas.getByTestId(id).getBoundingClientRect();
    await expect(box('h-flex').height).toBe(1);
    await expect(box('h-flex').width).toBe(box('column').width);
    await expect(box('h-block').height).toBe(1);
    await expect(box('h-block').width).toBe(box('block').width);
    await expect(box('v-flex').width).toBe(1);
    await expect(box('v-flex').height).toBe(box('row').height);
    await expect(box('v-flex').height).toBe(40);
    await expect(box('v-grid').width).toBe(1);
    await expect(box('v-grid').height).toBe(32);
    await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(
        window.innerWidth
    );
}

const viewportTest = (viewport: Viewport) => ({
    tags: ['!autodocs', '!dev'],
    globals: { viewport: { value: viewport, isRotated: false } },
    render: () => <GeometryProbe />,
    play: async ({ canvasElement }: { canvasElement: HTMLElement }) =>
        assertGeometry(canvasElement, viewport),
});

export const GeometryMobile: Story = {
    ...viewportTest('mobile'),
    name: 'fills its container or row in flex, grid and block at mobile',
};
export const GeometryTablet: Story = {
    ...viewportTest('tablet'),
    name: 'fills its container or row in flex, grid and block at tablet',
};
export const GeometryLaptop: Story = {
    ...viewportTest('laptop'),
    name: 'fills its container or row in flex, grid and block at laptop',
};
export const GeometryDesktop: Story = {
    ...viewportTest('desktop'),
    name: 'fills its container or row in flex, grid and block at desktop',
};

/** Computed styles that encode the design: colour token, no margin. */
export const ComputedStyles: Story = {
    name: 'draws a 1px border-token line with no margin',
    tags: ['!autodocs', '!dev'],
    globals: { viewport: { value: 'laptop', isRotated: false } },
    render: () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Separator data-testid="sep" />
            <span
                data-testid="probe"
                style={{ backgroundColor: 'var(--border)' }}
            />
        </div>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const cs = getComputedStyle(canvas.getByTestId('sep'));
        const probe = getComputedStyle(canvas.getByTestId('probe'));
        await expect(cs.backgroundColor).toBe(probe.backgroundColor);
        await expect(cs.marginTop).toBe('0px');
        await expect(cs.marginBottom).toBe('0px');
        await expect(cs.borderTopWidth).toBe('0px');
        await expect(cs.flexShrink).toBe('0');
    },
};
