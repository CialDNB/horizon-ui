import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { HorizonProvider } from '../../provider';
import { ResponsiveSpec } from '../../stories/ResponsiveSpec';
import {
    settled,
    storyLayout as layout,
    viewportStory,
    type Viewport,
} from '../../stories/viewports';
import { Button } from '../Button';
import { ConfirmationDialog, type ConfirmationDialogProps } from '.';

const page = within(document.body);
const panel = () =>
    document.querySelector<HTMLElement>('[data-dialog-content]');

function Demo(
    props: Partial<ConfirmationDialogProps> & { initiallyOpen?: boolean }
) {
    const { initiallyOpen = false, ...rest } = props;
    const [open, setOpen] = useState(initiallyOpen);
    return (
        <>
            <Button
                variant="secondary"
                data-testid="trigger"
                onClick={() => setOpen(true)}
            >
                Delete report
            </Button>
            <ConfirmationDialog
                open={open}
                onOpenChange={setOpen}
                title="Delete this report?"
                description="The report and its history are removed for everyone in your company."
                confirmLabel="Delete"
                onConfirm={() => {}}
                {...rest}
            />
        </>
    );
}

async function cancel() {
    await userEvent.click(page.getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(panel()).toBeNull());
}

const meta = {
    title: 'Components/ConfirmationDialog',
    component: ConfirmationDialog,
    parameters: {
        layout: 'padded',
        docs: {
            description: {
                component: [
                    'A blocking question with Cancel and Confirm (`role="alertdialog"`), a preset of Dialog. Ported from x-core `ConfirmationDialog`: `onSubmit` becomes `onConfirm`, `onClose` becomes `onOpenChange(false)` (+ `onCancel`), `approveText`/`cancelText` become `confirmLabel`/`cancelLabel`, `submitLoading` becomes `loading`, `submitDisabled` becomes `confirmDisabled`, `manualClose` becomes `closeOnConfirm={false}`, `color="error"` becomes `variant="destructive"`.',
                    '',
                    'Initial focus is on Cancel; Escape and the scrim cancel; while `loading` nothing but the running action can close it. No close button: the two actions are the only choices.',
                ].join('\n'),
            },
        },
    },
    args: {
        open: false,
        onOpenChange: () => {},
        title: 'Delete this report?',
        onConfirm: () => {},
    },
    // The Demo owns the open state; the controls set the rest.
    render: ({ title, description, variant, loading }) => (
        <Demo
            title={title}
            description={description}
            {...(variant !== undefined && { variant })}
            {...(loading !== undefined && { loading })}
        />
    ),
} satisfies Meta<typeof ConfirmationDialog>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Click the button. */
export const Playground: Story = {};

/** Destructive: red confirm. */
export const Destructive: Story = {
    render: () => <Demo variant="destructive" initiallyOpen />,
    play: async () => {
        await page.findByRole('alertdialog', { name: 'Delete this report?' });
        await waitFor(() =>
            expect(page.getByRole('button', { name: 'Cancel' })).toHaveFocus()
        );
        await cancel();
    },
};

/** Loading: the confirm button spins; cancel and Escape are blocked. */
export const Loading: Story = {
    render: () => <Demo loading initiallyOpen confirmLabel="Deleting" />,
};

/** Long title and description wrap. */
export const LongText: Story = {
    render: () => (
        <Demo
            title="Delete the credit report for Very Long International Trading Company Limited Partnership Holdings?"
            description="This removes the report, its monitoring alerts, the payment history snapshots and every comment written by your colleagues. It cannot be undone."
        />
    ),
};

/** Right-to-left. */
export const RTL: Story = {
    globals: { direction: 'rtl' },
    render: () => (
        <Demo
            title="למחוק את הדוח?"
            description="הדוח וההיסטוריה שלו יימחקו."
            confirmLabel="מחיקה"
            cancelLabel="ביטול"
        />
    ),
};

/** All three brands. */
export const Brands: Story = {
    render: () => (
        <div style={layout.row}>
            {(['cial', 'dnb', 'il'] as const).map((brand) => (
                <HorizonProvider
                    key={brand}
                    brand={brand}
                    style={{ background: 'var(--background)', padding: 16 }}
                >
                    <Demo variant="destructive" />
                </HorizonProvider>
            ))}
        </div>
    ),
};

/** Per-breakpoint specification (Responsive Standard). */
export const Responsive: Story = {
    render: () => (
        <ResponsiveSpec
            caption="ConfirmationDialog responsive specification"
            spec={{
                mobile: {
                    size: 'Dialog at mobile: full screen (x-core fullScreen below tablet); buttons 44px, full width.',
                    density: 'As Dialog.',
                    layout: 'Confirm on top of Cancel, both full width, at the bottom above the safe area.',
                    contentVisibility: 'Title and description wrap.',
                    interaction:
                        'Tap Confirm or Cancel; no close button (the two actions are the choices).',
                },
                tablet: {
                    size: 'Centred, up to 570px (size sm).',
                    density: 'As Dialog.',
                    layout: 'Cancel then Confirm in a row at the end.',
                    contentVisibility: 'As mobile.',
                    interaction:
                        'Focus starts on Cancel; Escape or the scrim cancel (not while loading).',
                },
                laptop: {
                    size: 'As tablet.',
                    density: 'As tablet.',
                    layout: 'As tablet.',
                    contentVisibility: 'As tablet.',
                    interaction: 'As tablet.',
                    note: 'Identical to tablet.',
                },
                desktop: {
                    size: 'As tablet.',
                    density: 'As tablet.',
                    layout: 'As tablet.',
                    contentVisibility: 'As tablet.',
                    interaction: 'As tablet.',
                    note: 'Identical to tablet.',
                },
            }}
        />
    ),
};

/* ---- Viewport tests ---- */

async function assertConfirmation(...[, viewport]: [HTMLElement, Viewport]) {
    const el = await waitFor(() => {
        const found = panel();
        if (!found) throw new Error('no dialog');
        return found;
    });
    await settled(el);
    const r = el.getBoundingClientRect();
    const confirm = page.getByRole('button', { name: 'Delete' });
    const cancelButton = page.getByRole('button', { name: 'Cancel' });
    const c = confirm.getBoundingClientRect();
    const x = cancelButton.getBoundingClientRect();
    if (viewport === 'mobile') {
        await expect(r.width).toBe(window.innerWidth);
        await expect(c.height).toBe(44);
        await expect(c.bottom).toBeLessThanOrEqual(x.top);
    } else {
        await expect(r.width).toBe(570);
        await expect(c.top).toBe(x.top);
        await expect(c.left).toBeGreaterThan(x.left);
    }
    await cancel();
}

const probe = () => <Demo initiallyOpen variant="destructive" />;

export const OpenMobile: Story = {
    ...viewportStory('mobile', probe, assertConfirmation),
    name: 'stacks Confirm over Cancel at mobile',
};
export const OpenTablet: Story = {
    ...viewportStory('tablet', probe, assertConfirmation),
    name: 'is 570px with a row of actions at tablet',
};
export const OpenLaptop: Story = {
    ...viewportStory('laptop', probe, assertConfirmation),
    name: 'is 570px at laptop',
};
export const OpenDesktop: Story = {
    ...viewportStory('desktop', probe, assertConfirmation),
    name: 'is 570px at desktop',
};
