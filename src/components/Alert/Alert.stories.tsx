import { LightbulbIcon } from '@phosphor-icons/react/dist/csr/Lightbulb';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useRef, useState, type CSSProperties } from 'react';
import { expect, fn, userEvent, within } from 'storybook/test';
import { HorizonProvider } from '../../provider';
import { ResponsiveSpec } from '../../stories/ResponsiveSpec';
import type { Brand } from '../../tokens';
import { Button } from '../Button';
import { Alert, type AlertVariant } from '.';

/*
 * Stories are excluded from the Tailwind scan (ADR 0001), so layout here uses
 * inline styles; every visual on the Alert itself comes from the component.
 */

const variants = [
    'info',
    'success',
    'warning',
    'error',
    'neutral',
] as const satisfies readonly AlertVariant[];
const brandList = ['cial', 'dnb', 'il'] as const satisfies readonly Brand[];

const stack: CSSProperties = { display: 'grid', gap: 16, maxInlineSize: 720 };

const copy: Record<AlertVariant, { title: string; body: string }> = {
    info: {
        title: 'Data credits running low',
        body: 'New reports will be charged at the overuse rate. Contact your account manager to top up.',
    },
    success: {
        title: 'Schema is valid',
        body: 'No issues found in the uploaded data blocks.',
    },
    warning: {
        title: 'Contract expired',
        body: 'You cannot request new reports or decisions until the subscription is renewed.',
    },
    error: {
        title: 'The request could not be processed',
        body: 'The email address was not saved. Try again in a few minutes.',
    },
    neutral: {
        title: 'Report skipped',
        body: 'This source was not ordered because the company is not registered.',
    },
};

const meta = {
    title: 'Components/Alert',
    component: Alert,
    parameters: {
        layout: 'padded',
        docs: {
            description: {
                component: [
                    'A message about the page or a task. Ported from x-core `Alert` (MUI): `color`/`severity` become `variant`, `AlertTitle` becomes `title`, `onClose` becomes `onDismiss`; `action` and `icon` (incl. `icon={false}`) keep their names.',
                    '',
                    "**Look.** 16px radius card on the tone's `-subtle` surface; title (`label/lg`, 16/24 semibold), description (`body/default`, 16/20), icon and dismiss all in the tone's `-strong` shade (at least 4.5:1 in every brand). Icon 20px (Phosphor Info, CheckCircle, Warning, WarningCircle), centred on the first line. Padding 12px at mobile, 16px from `tablet`; 12px between icon, text and dismiss.",
                    '',
                    '**Layout.** At mobile the action sits below the text; from `tablet` it sits at the end of the row, centred on the text block. The dismiss button stays at the top end corner at every size: a 44px target at mobile and on touch pointers, 32px from `tablet` with a fine pointer, laid out as 20px so it never pushes the text. Long words break (`overflow-wrap: break-word`).',
                    '',
                    '**Accessibility.** `warning` and `error` render `role="alert"` (assertive), `info`, `success` and `neutral` `role="status"` (polite); pass `role` to override (`"none"` for static guidance). Live regions announce changes: render the Alert in response to the event, not on page load. The icon is decorative. The dismiss button is named `dismissLabel` ("Dismiss": translate it); the Alert does not remove itself, so remove it in `onDismiss` and move focus if it was inside (see `Dismissible`).',
                ].join('\n'),
            },
        },
    },
    args: {
        variant: 'info',
        title: copy.info.title,
        children: copy.info.body,
    },
    argTypes: {
        variant: { control: 'inline-radio', options: variants },
    },
} satisfies Meta<typeof Alert>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Controls playground. */
export const Playground: Story = {};

/** Every tone, with and without a title. */
export const Variants: Story = {
    render: () => (
        <div style={stack}>
            {variants.map((variant) => (
                <Alert
                    key={variant}
                    variant={variant}
                    title={copy[variant].title}
                    role="none"
                >
                    {copy[variant].body}
                </Alert>
            ))}
            {variants.map((variant) => (
                <Alert key={`${variant}-plain`} variant={variant} role="none">
                    {copy[variant].body}
                </Alert>
            ))}
        </div>
    ),
};

/** Action (x-core DuplicateAlert "Review now") and custom or hidden icons. */
export const ActionsAndIcons: Story = {
    render: () => (
        <div style={stack}>
            <Alert
                variant="warning"
                title="A decision is pending review"
                action={
                    <Button variant="tertiary" size="sm">
                        Review now
                    </Button>
                }
            >
                We identified a duplicate decision that must be reviewed before
                proceeding.
            </Alert>
            <Alert
                variant="info"
                action={
                    <>
                        <Button variant="secondary" size="sm">
                            Top up
                        </Button>
                        <Button variant="tertiary" size="sm">
                            Later
                        </Button>
                    </>
                }
            >
                Your data credits are running low.
            </Alert>
            <Alert variant="neutral" icon={<LightbulbIcon />} role="none">
                Arrange questionnaire and document sources in sequence so the
                applicant receives a single email.
            </Alert>
            <Alert variant="error" icon={false} role="none">
                Report failed. The disclaimer replaces the content.
            </Alert>
        </div>
    ),
};

/** Dismissing removes the alert and returns focus to the trigger. */
export const Dismissible: Story = {
    render: function Render() {
        const [open, setOpen] = useState(true);
        const trigger = useRef<HTMLButtonElement>(null);
        return (
            <div style={stack}>
                <div>
                    <Button
                        ref={trigger}
                        variant="secondary"
                        size="sm"
                        onClick={() => setOpen(true)}
                    >
                        Save email
                    </Button>
                </div>
                {open && (
                    <Alert
                        variant="success"
                        title="Email saved"
                        onDismiss={() => {
                            setOpen(false);
                            trigger.current?.focus();
                        }}
                    >
                        Pending steps will be resent to the new address.
                    </Alert>
                )}
            </div>
        );
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.click(canvas.getByRole('button', { name: 'Dismiss' }));
        await expect(canvas.queryByRole('status')).toBeNull();
        await expect(
            canvas.getByRole('button', { name: 'Save email' })
        ).toHaveFocus();
        await userEvent.click(
            canvas.getByRole('button', { name: 'Save email' })
        );
        await expect(canvas.getByRole('status')).toBeVisible();
    },
};

/** Long text wraps, long words break, nothing overflows a 320px container. */
export const LongText: Story = {
    render: () => (
        <div
            data-testid="narrow"
            style={{ ...stack, inlineSize: 320, maxInlineSize: '100%' }}
        >
            <Alert
                variant="warning"
                title="This report has already been billed and continuing cannot be undone automatically"
                onDismiss={() => undefined}
                action={
                    <Button variant="tertiary" size="sm">
                        Continue anyway
                    </Button>
                }
            >
                The charge will not be reversed, and any granted approvals will
                be reset. Notifications go to
                averyveryveryverylongemailaddress.forapprovals@subsidiary.example.com.
            </Alert>
        </div>
    ),
    play: async ({ canvasElement }) => {
        const narrow = within(canvasElement).getByTestId('narrow');
        const limit = narrow.getBoundingClientRect().right + 0.5;
        for (const el of Array.from(narrow.querySelectorAll('*')))
            await expect(el.getBoundingClientRect().right).toBeLessThanOrEqual(
                limit
            );
    },
};

/** Right-to-left: icon on the right, dismiss on the left, action at the end. */
export const RTL: Story = {
    globals: { direction: 'rtl' },
    render: () => (
        <div style={stack}>
            <Alert
                variant="warning"
                title="החוזה פג תוקף"
                onDismiss={() => undefined}
                dismissLabel="סגירה"
                action={
                    <Button variant="tertiary" size="sm">
                        חידוש
                    </Button>
                }
            >
                לא ניתן להזמין דוחות חדשים עד לחידוש המנוי.
            </Alert>
            <Alert variant="success" role="none">
                הנתונים נשמרו בהצלחה.
            </Alert>
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
                            <Alert
                                key={variant}
                                variant={variant}
                                title={`${brand} ${variant}`}
                                role="none"
                                onDismiss={() => undefined}
                                action={
                                    <Button variant="tertiary" size="sm">
                                        Action
                                    </Button>
                                }
                            >
                                {copy[variant].body}
                            </Alert>
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
                caption="Alert responsive specification"
                spec={{
                    mobile: {
                        size: 'Title 16/24 semibold, description 16/20, icon 20px. Dismiss target 44x44px.',
                        density:
                            'Padding 12px; gaps 12px (icon, text, dismiss; text to action); title to description 4px.',
                        layout: 'Icon | text column | dismiss. The action stacks below the text, aligned with it.',
                        contentVisibility:
                            'Everything shown; text wraps, long words break. No truncation.',
                        interaction:
                            'Action buttons keep their own 44px targets; dismiss is 44px (laid out as 20px).',
                    },
                    tablet: {
                        size: 'As mobile; dismiss 32x32px with a fine pointer (44px on touch).',
                        density: 'Padding 16px; text to action gap 16px.',
                        layout: 'The action moves to the end of the row, centred on the text block.',
                        contentVisibility: 'As mobile.',
                        interaction:
                            'Hover state layer on dismiss (pointer); focus ring 2px `ring`.',
                    },
                    laptop: {
                        size: 'As tablet.',
                        density: 'As tablet.',
                        layout: 'As tablet.',
                        contentVisibility: 'As tablet.',
                        interaction: 'As tablet.',
                        note: 'Identical to tablet: the alert fills its container, and the inline action already fits from 768px; more width only lengthens lines.',
                    },
                    desktop: {
                        size: 'As tablet.',
                        density: 'As tablet.',
                        layout: 'As tablet.',
                        contentVisibility: 'As tablet.',
                        interaction: 'As tablet.',
                        note: 'Identical to tablet (see laptop). Hosts should cap the line length (about 720px) on wide pages.',
                    },
                }}
            />
            <div style={stack}>
                <Alert
                    variant="info"
                    title={copy.info.title}
                    onDismiss={() => undefined}
                    action={
                        <Button variant="tertiary" size="sm">
                            Top up
                        </Button>
                    }
                >
                    {copy.info.body}
                </Alert>
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
            <Alert
                variant="warning"
                title="Contract expired"
                onDismiss={() => undefined}
                action={
                    <Button variant="tertiary" size="sm">
                        Renew
                    </Button>
                }
                data-testid={`${dir}-alert`}
            >
                Renew the subscription to keep ordering reports.
            </Alert>
        </HorizonProvider>
    );
}

const part = (root: HTMLElement, selector: string) => {
    const el = root.querySelector(selector);
    if (!(el instanceof HTMLElement)) throw new Error(`missing ${selector}`);
    return el.getBoundingClientRect();
};

async function assertGeometry(canvasElement: HTMLElement, viewport: Viewport) {
    const canvas = within(canvasElement);
    await expect(window.innerWidth).toBe(viewportWidth[viewport]);
    const mobile = viewport === 'mobile';
    for (const dir of ['ltr', 'rtl'] as const) {
        const root = canvas.getByTestId(`${dir}-alert`);
        const box = root.getBoundingClientRect();
        const pad = mobile ? 12 : 16;
        const cs = getComputedStyle(root);
        await expect(cs.paddingTop).toBe(`${pad}px`);
        await expect(cs.paddingInlineStart).toBe(`${pad}px`);

        const text = part(root, '[data-alert-title]');
        const action = part(root, '[data-alert-action]');
        const icon = part(root, '[data-alert-icon]');
        const dismiss = part(root, 'button[aria-label="Dismiss"]');

        // Icon at the inline start; dismiss at the top inline end.
        const start = (r: DOMRect) =>
            dir === 'ltr' ? r.left - box.left : box.right - r.right;
        await expect(start(icon)).toBeCloseTo(pad, 0);
        await expect(start(icon)).toBeLessThan(start(text));
        await expect(start(dismiss)).toBeGreaterThan(start(action));
        // Dismiss: 44px target at mobile, 32px with a fine pointer from tablet.
        const target = mobile ? 44 : 32;
        await expect(dismiss.width).toBe(target);
        await expect(dismiss.height).toBe(target);
        // The target stays inside the alert, flush with the corner at mobile.
        await expect(dismiss.top).toBeGreaterThanOrEqual(box.top - 0.5);
        await expect(
            dir === 'ltr' ? box.right - dismiss.right : dismiss.left - box.left
        ).toBeGreaterThanOrEqual(-0.5);

        if (mobile) {
            // Action below the text, aligned with its start.
            const description = part(root, '[data-alert-description]');
            await expect(action.top).toBeGreaterThanOrEqual(description.bottom);
            await expect(
                Math.abs(start(action) - start(text))
            ).toBeLessThanOrEqual(0.5);
        } else {
            // Action at the end of the row, beside the text.
            await expect(start(action)).toBeGreaterThan(
                start(text) + text.width - 0.5
            );
            await expect(action.top).toBeLessThan(
                part(root, '[data-alert-description]').bottom
            );
        }
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
    name: 'stacks the action and keeps a 44px dismiss at mobile',
};
export const GeometryTablet: Story = {
    ...viewportTest('tablet'),
    name: 'puts the action inline and a 32px dismiss at tablet',
};
export const GeometryLaptop: Story = {
    ...viewportTest('laptop'),
    name: 'puts the action inline and a 32px dismiss at laptop',
};
export const GeometryDesktop: Story = {
    ...viewportTest('desktop'),
    name: 'puts the action inline and a 32px dismiss at desktop',
};

const dismissSpy = fn();

/** Computed styles that encode the design: tokens, type, radius, focus. */
export const ComputedStyles: Story = {
    name: 'applies Horizon tokens, type and focus ring',
    tags: ['!autodocs', '!dev'],
    globals: { viewport: { value: 'laptop', isRotated: false } },
    render: () => (
        <div style={stack}>
            <Alert
                variant="error"
                title="Failed"
                onDismiss={dismissSpy}
                data-testid="alert"
            >
                Try again.
            </Alert>
            <span
                data-testid="probe"
                style={{
                    color: 'var(--destructive-strong)',
                    background: 'var(--destructive-subtle)',
                    outlineColor: 'var(--ring)',
                }}
            />
        </div>
    ),
    play: async ({ canvasElement }) => {
        dismissSpy.mockClear();
        const canvas = within(canvasElement);
        const probe = getComputedStyle(canvas.getByTestId('probe'));
        const root = canvas.getByTestId('alert');
        const cs = getComputedStyle(root);
        await expect(cs.backgroundColor).toBe(probe.backgroundColor);
        await expect(cs.color).toBe(probe.color);
        await expect(cs.borderRadius).toBe('16px');
        await expect(cs.fontSize).toBe('16px');
        await expect(cs.lineHeight).toBe('20px');
        const title = root.querySelector('[data-alert-title]');
        if (!title) throw new Error('no title');
        await expect(getComputedStyle(title).fontWeight).toBe('600');
        await expect(getComputedStyle(title).lineHeight).toBe('24px');
        const icon = root.querySelector('[data-alert-icon] svg');
        if (!icon) throw new Error('no icon');
        await expect(icon.getBoundingClientRect().width).toBe(20);
        await expect(getComputedStyle(icon).color).toBe(probe.color);

        const dismiss = canvas.getByRole('button', { name: 'Dismiss' });
        await expect(getComputedStyle(dismiss).borderRadius).toBe('100px');
        await userEvent.tab();
        await expect(dismiss).toHaveFocus();
        const focused = getComputedStyle(dismiss);
        await expect(focused.outlineStyle).toBe('solid');
        await expect(focused.outlineWidth).toBe('2px');
        await expect(focused.outlineColor).toBe(probe.outlineColor);
        await userEvent.keyboard(' ');
        await expect(dismissSpy).toHaveBeenCalledOnce();
    },
};
