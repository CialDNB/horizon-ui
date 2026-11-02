import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { HorizonProvider } from '../../provider';
import { ResponsiveSpec } from '../../stories/ResponsiveSpec';
import {
    settled,
    storyLayout as layout,
    viewportStory,
} from '../../stories/viewports';
import { Textarea } from '.';

const column = { display: 'grid', gap: 12, maxInlineSize: 420 } as const;

const meta = {
    title: 'Components/Textarea',
    component: Textarea,
    parameters: {
        layout: 'padded',
        docs: {
            description: {
                component: [
                    'Multi-line text field. Ported from x-core `TextArea`: label, helper text and error move to `FormField`; the custom drag handle becomes the native vertical `resize` handle (`resize="none"` hides it); `autoResize` grows with the content up to `maxRows` (instant, never animated).',
                    '',
                    'Same rings and states as `Input` (control-border rest, primary hover, 2px focus ring, destructive invalid, muted disabled). Text is 16/20 at every breakpoint (multi-line text needs the leading; 16px avoids zoom on iPad). Padding 12px 16px, radius 20px, 4 rows by default.',
                ].join('\n'),
            },
        },
    },
    args: {
        'aria-label': 'Comment',
        placeholder: 'Add a comment for the workflow',
    },
    render: (args) => (
        <div style={column}>
            <Textarea {...args} />
        </div>
    ),
} satisfies Meta<typeof Textarea>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Controls playground. */
export const Playground: Story = {};

/** Rest, filled, invalid, disabled, read-only. */
export const States: Story = {
    render: () => (
        <div style={column}>
            <Textarea aria-label="Rest" placeholder="Placeholder" />
            <Textarea aria-label="Invalid" defaultValue="Too short" invalid />
            <Textarea aria-label="Disabled" defaultValue="Locked" disabled />
            <Textarea aria-label="Read-only" defaultValue="Signed" readOnly />
        </div>
    ),
};

/** Grows with the content up to 6 rows, then scrolls. */
export const AutoResize: Story = {
    render: () => (
        <div style={column}>
            <Textarea
                aria-label="Notes"
                rows={2}
                autoResize
                maxRows={6}
                data-testid="auto"
            />
        </div>
    ),
    play: async ({ canvasElement }) => {
        const box = within(canvasElement).getByTestId('auto');
        const start = box.getBoundingClientRect().height;
        await userEvent.type(box, 'one{enter}two{enter}three{enter}four');
        const grown = box.getBoundingClientRect().height;
        await expect(grown).toBeGreaterThan(start);
        await userEvent.type(box, '{enter}5{enter}6{enter}7{enter}8{enter}9');
        // Capped at 6 lines (6 x 20px + 24px padding) and scrolls.
        await expect(box.getBoundingClientRect().height).toBe(144);
        await expect(getComputedStyle(box).overflowY).toBe('auto');
    },
};

/** Long unbroken text wraps; nothing overflows a 280px column. */
export const LongText: Story = {
    render: () => (
        <div style={{ ...column, maxInlineSize: 280 }}>
            <Textarea
                aria-label="Long"
                defaultValue="Averyveryverylongunbrokenwordwithoutspacesthatmustwrap and then a normal sentence about the account."
            />
        </div>
    ),
};

/** Right-to-left: the resize handle moves to the inline end. */
export const RTL: Story = {
    globals: { direction: 'rtl' },
    render: () => (
        <div style={column}>
            <Textarea aria-label="הערה" defaultValue="הערה על הלקוח" />
        </div>
    ),
};

/** All three brands side by side: the a11y check runs contrast on each. */
export const Brands: Story = {
    render: () => (
        <div style={layout.stack}>
            {(['cial', 'dnb', 'il'] as const).map((brand) => (
                <HorizonProvider
                    key={brand}
                    brand={brand}
                    style={{ background: 'var(--background)', padding: 16 }}
                >
                    <div style={column}>
                        <Textarea
                            aria-label={`${brand} rest`}
                            placeholder={`${brand} placeholder`}
                            rows={2}
                        />
                        <Textarea
                            aria-label={`${brand} invalid`}
                            defaultValue="invalid"
                            invalid
                            rows={2}
                        />
                    </div>
                </HorizonProvider>
            ))}
        </div>
    ),
};

/** Per-breakpoint specification (Responsive Standard). */
export const Responsive: Story = {
    render: () => (
        <ResponsiveSpec
            caption="Textarea responsive specification"
            spec={{
                mobile: {
                    size: 'Text 16/20; 4 rows (104px) by default; min 44px tall.',
                    density: 'Padding 12px 16px.',
                    layout: 'Full width of its container; wraps long words, never overflows 320px.',
                    contentVisibility:
                        'Scrolls past its height; autoResize grows up to maxRows.',
                    interaction:
                        'Touch: native resize handle (vertical only); focus ring 2px.',
                },
                tablet: {
                    size: 'As mobile.',
                    density: 'As mobile.',
                    layout: 'As mobile.',
                    contentVisibility: 'As mobile.',
                    interaction:
                        'Pointer: hover turns the ring primary; drag to resize.',
                    note: 'Identical at every breakpoint: multi-line text keeps 16/20 (14/14 is too tight for prose) and the height is set by rows, not by width.',
                },
                laptop: {
                    size: 'As mobile.',
                    density: 'As mobile.',
                    layout: 'As mobile.',
                    contentVisibility: 'As mobile.',
                    interaction: 'As tablet.',
                    note: 'Identical (see tablet).',
                },
                desktop: {
                    size: 'As mobile.',
                    density: 'As mobile.',
                    layout: 'As mobile.',
                    contentVisibility: 'As mobile.',
                    interaction: 'As tablet.',
                    note: 'Identical (see tablet).',
                },
            }}
        />
    ),
};

/* ---- Viewport tests ---- */

function Probe() {
    return (
        <div style={{ inlineSize: 320 }}>
            <Textarea
                aria-label="Probe"
                data-testid="probe"
                defaultValue="Averyveryverylongunbrokenwordwithoutspacesthatmustwrap"
            />
        </div>
    );
}

async function assertTextarea(canvasElement: HTMLElement) {
    const box = within(canvasElement).getByTestId('probe');
    const cs = getComputedStyle(box);
    await expect(cs.fontSize).toBe('16px');
    await expect(cs.lineHeight).toBe('20px');
    await expect(cs.resize).toBe('vertical');
    // 4 rows x 20px + 24px padding.
    await expect(box.getBoundingClientRect().height).toBe(104);
    await expect(box.getBoundingClientRect().width).toBe(320);
    await expect(box.scrollWidth).toBeLessThanOrEqual(320);
}

export const SpecMobile: Story = {
    ...viewportStory('mobile', () => <Probe />, assertTextarea),
    name: 'is 16/20, 4 rows and wraps at mobile',
};
export const SpecTablet: Story = {
    ...viewportStory('tablet', () => <Probe />, assertTextarea),
    name: 'is 16/20, 4 rows and wraps at tablet',
};
export const SpecLaptop: Story = {
    ...viewportStory('laptop', () => <Probe />, assertTextarea),
    name: 'is 16/20, 4 rows and wraps at laptop',
};
export const SpecDesktop: Story = {
    ...viewportStory('desktop', () => <Probe />, assertTextarea),
    name: 'is 16/20, 4 rows and wraps at desktop',
};

/** Rings and fills come from the tokens (shared with Input). */
export const ComputedStyles: Story = {
    name: 'applies Horizon tokens to the textarea',
    tags: ['!autodocs', '!dev'],
    render: () => (
        <div style={column}>
            <Textarea aria-label="Rest" data-testid="rest" />
            <Textarea aria-label="Invalid" data-testid="invalid" invalid />
            <Textarea aria-label="Disabled" data-testid="disabled" disabled />
            <span
                data-testid="probe"
                style={{
                    color: 'var(--control-border)',
                    background: 'var(--muted)',
                    borderColor: 'var(--destructive)',
                    outlineColor: 'var(--ring)',
                }}
            />
        </div>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const probe = getComputedStyle(canvas.getByTestId('probe'));
        const rest = canvas.getByTestId('rest');
        await expect(getComputedStyle(rest).borderRadius).toBe('20px');
        await expect(getComputedStyle(rest).boxShadow).toContain(probe.color);
        await expect(
            getComputedStyle(canvas.getByTestId('invalid')).boxShadow
        ).toContain(probe.borderTopColor);
        await expect(
            getComputedStyle(canvas.getByTestId('disabled')).backgroundColor
        ).toBe(probe.backgroundColor);
        rest.focus();
        const focused = await settled(rest);
        await expect(focused.boxShadow).toContain(probe.outlineColor);
        await expect(focused.boxShadow).toContain('0px 0px 0px 2px');
    },
};
