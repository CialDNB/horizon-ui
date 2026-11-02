import type { Meta, StoryObj } from '@storybook/react-vite';
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
import { FormField } from '../FormField';
import { Input } from '../Input';
import {
    Dialog,
    DialogBody,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    type DialogContentProps,
} from '.';

const page = within(document.body);
const panel = () =>
    document.querySelector<HTMLElement>('[data-dialog-content]');

async function openPanel() {
    return waitFor(() => {
        const el = panel();
        if (!el) throw new Error('no dialog');
        return el;
    });
}
async function closeDialog() {
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(panel()).toBeNull());
}

function EditCompany({
    open,
    lines = 0,
    ...content
}: Partial<DialogContentProps> & { open?: boolean; lines?: number }) {
    return (
        <Dialog {...(open !== undefined && { defaultOpen: open })}>
            <DialogTrigger asChild>
                <Button data-testid="trigger">Edit company</Button>
            </DialogTrigger>
            <DialogContent {...content}>
                <DialogHeader>
                    <DialogTitle>Edit company</DialogTitle>
                    <DialogDescription>
                        Changes apply to every report of this company.
                    </DialogDescription>
                </DialogHeader>
                <DialogBody>
                    <div style={{ display: 'grid', gap: 16 }}>
                        <FormField label="Company name">
                            <Input defaultValue="Acme Ltd." />
                        </FormField>
                        <FormField label="Registration number">
                            <Input defaultValue="51-123456-7" />
                        </FormField>
                        {Array.from({ length: lines }, (_, i) => (
                            <p key={i} style={{ margin: 0 }}>
                                Paragraph {i + 1} of a long dialog body that
                                scrolls while the header and the footer stay.
                            </p>
                        ))}
                    </div>
                </DialogBody>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="secondary">Cancel</Button>
                    </DialogClose>
                    <DialogClose asChild>
                        <Button>Save</Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

const meta = {
    title: 'Components/Dialog',
    component: DialogContent,
    subcomponents: {
        Dialog,
        DialogTrigger,
        DialogHeader,
        DialogTitle,
        DialogDescription,
        DialogBody,
        DialogFooter,
        DialogClose,
    },
    parameters: {
        layout: 'padded',
        docs: {
            description: {
                component: [
                    'A modal dialog on Radix Dialog, composed of parts. Ported from x-core `DialogV2`: `dialogTitle` becomes `DialogHeader` + `DialogTitle` (+ `DialogDescription`), `dialogContent` becomes `DialogBody` (scrolls), `dialogActions` becomes `DialogFooter` (always visible: `isStickyHeader`/`isStickyFooter` are the default); `open` + `onClose` become `open` + `onOpenChange`; `maxWidth` becomes `size` (sm 570, md 600, lg 900, xl 1136).',
                    '',
                    'Focus moves to the first focusable element, is trapped, and returns to the trigger; the page behind does not scroll and is hidden from assistive tech. Escape and a click on the scrim close it, unless `dismissible={false}` (blocking confirmations; see ConfirmationDialog). In development a missing title or description is warned about once.',
                    '',
                    '**Mobile:** full screen (x-core `fullScreen` below tablet), respecting the safe areas, body scrolls, footer buttons full width stacked with the primary action on top. **Tablet+:** centred, up to the size and the viewport minus 32px each side.',
                    '',
                    '**Inside an MUI dialog** wrap the content in `<HorizonProvider>` (inherits brand and direction). Horizon dialogs stack above MUI dialogs (`--z-dialog` 1350 vs 1300), so open an MUI dialog from a Horizon dialog is not supported: it would sit behind.',
                ].join('\n'),
            },
        },
    },
    render: (args) => <EditCompany {...args} />,
} satisfies Meta<typeof DialogContent>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Click the trigger. */
export const Playground: Story = {};

/** Keyboard: focus starts on the first field, Escape restores it. */
export const Keyboard: Story = {
    play: async ({ canvasElement }) => {
        const trigger = within(canvasElement).getByTestId('trigger');
        trigger.focus();
        await userEvent.keyboard('{Enter}');
        await page.findByRole('dialog', { name: 'Edit company' });
        await waitFor(() =>
            expect(
                page.getByRole('textbox', { name: 'Company name' })
            ).toHaveFocus()
        );
        await closeDialog();
        await waitFor(() => expect(trigger).toHaveFocus());
    },
};

/** Sizes from tablet. */
export const Sizes: Story = {
    render: () => (
        <div style={layout.row}>
            {(['sm', 'md', 'lg', 'xl'] as const).map((size) => (
                <Dialog key={size}>
                    <DialogTrigger asChild>
                        <Button variant="secondary">{size}</Button>
                    </DialogTrigger>
                    <DialogContent size={size} aria-describedby={undefined}>
                        <DialogHeader>
                            <DialogTitle>Size {size}</DialogTitle>
                        </DialogHeader>
                        <DialogBody>Body</DialogBody>
                    </DialogContent>
                </Dialog>
            ))}
        </div>
    ),
};

/** Not dismissible: no close button, Escape and the scrim do nothing. */
export const NotDismissible: Story = {
    args: { dismissible: false },
};

/**
 * keepMounted (x-core Dialog v1, e.g. customer360 FilterModal with a
 * react-hook-form FormProvider): typed values survive closing; the layout
 * is the same as without it.
 */
export const KeepMounted: Story = {
    render: () => <EditCompany keepMounted lines={40} />,
    play: async ({ canvasElement }) => {
        const trigger = within(canvasElement).getByTestId('trigger');
        await userEvent.click(trigger);
        const field = await page.findByRole('textbox', {
            name: 'Company name',
        });
        await userEvent.clear(field);
        await userEvent.type(field, 'Globex');
        await closeDialog();
        await userEvent.click(trigger);
        await expect(
            await page.findByRole('textbox', { name: 'Company name' })
        ).toHaveValue('Globex');
        const el = await openPanel();
        await settled(el);
        const body = el.querySelector('[data-dialog-body]');
        const save = page.getByRole('button', { name: 'Save' });
        if (!body) throw new Error('no body');
        // Body still scrolls between header and footer (layout-neutral host).
        await expect(body.scrollHeight).toBeGreaterThan(body.clientHeight);
        await expect(save.getBoundingClientRect().bottom).toBeLessThanOrEqual(
            el.getBoundingClientRect().bottom
        );
        await closeDialog();
    },
};

/** Long body: scrolls between the fixed header and footer. */
export const LongContent: Story = {
    render: () => <EditCompany lines={40} />,
};

/** Right-to-left: close button at the top left, footer from the left. */
export const RTL: Story = {
    globals: { direction: 'rtl' },
    render: () => <EditCompany open />,
    play: async () => {
        const el = await openPanel();
        await settled(el);
        const close = page.getByRole('button', { name: 'Close' });
        const r = el.getBoundingClientRect();
        await expect(close.getBoundingClientRect().left - r.left).toBeLessThan(
            40
        );
        await closeDialog();
    },
};

/** Open in all three brands (one at a time). */
export const Brands: Story = {
    render: () => (
        <div style={layout.row}>
            {(['cial', 'dnb', 'il'] as const).map((brand) => (
                <HorizonProvider
                    key={brand}
                    brand={brand}
                    style={{ background: 'var(--background)', padding: 16 }}
                >
                    <EditCompany />
                </HorizonProvider>
            ))}
        </div>
    ),
};

/** Per-breakpoint specification (Responsive Standard). */
export const Responsive: Story = {
    render: () => (
        <ResponsiveSpec
            caption="Dialog responsive specification"
            spec={{
                mobile: {
                    size: 'Full screen; title 16px semibold; close 44px; footer buttons full width (44px).',
                    density:
                        'Header/body/footer 16px side padding; header top and footer bottom padding grow with the safe areas.',
                    layout: 'Full-screen sheet, no radius, slides up 24px while fading in; header and footer fixed, body scrolls; actions stacked with the primary on top.',
                    contentVisibility:
                        'All content; long titles wrap; long bodies scroll.',
                    interaction:
                        'Close button or a footer action; no scrim to tap (full screen). Focus trapped; Escape with a keyboard.',
                },
                tablet: {
                    size: 'Width up to the size (sm 570, md 600, lg 900, xl 1136) and the viewport minus 64px; title 24px; close 32px with a fine pointer.',
                    density: '24px side padding.',
                    layout: 'Centred over a 50% scrim, 16px radius, height fits the content up to the viewport minus 64px; scales in from 96%.',
                    contentVisibility: 'As mobile.',
                    interaction:
                        'Escape, the close button or a scrim click close it (unless not dismissible); focus returns to the trigger.',
                },
                laptop: {
                    size: 'As tablet.',
                    density: 'As tablet.',
                    layout: 'As tablet.',
                    contentVisibility: 'As tablet.',
                    interaction: 'As tablet.',
                    note: 'Identical to tablet: sizes are fixed maximum widths.',
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

async function assertDialog(...[, viewport]: [HTMLElement, Viewport]) {
    const el = await openPanel();
    await settled(el);
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    await expect(cs.zIndex).toBe('1350');
    const close = page.getByRole('button', { name: 'Close' });
    const save = page.getByRole('button', { name: 'Save' });
    const cancel = page.getByRole('button', { name: 'Cancel' });
    const body = el.querySelector('[data-dialog-body]');
    if (!body) throw new Error('no body');
    if (viewport === 'mobile') {
        await expect([r.left, r.top, r.width, r.height]).toEqual([
            0,
            0,
            window.innerWidth,
            window.innerHeight,
        ]);
        await expect(cs.borderTopLeftRadius).toBe('0px');
        await expect(close.getBoundingClientRect().height).toBe(44);
        // Stacked, full width, primary on top.
        await expect(save.getBoundingClientRect().width).toBe(r.width - 32);
        await expect(save.getBoundingClientRect().bottom).toBeLessThanOrEqual(
            cancel.getBoundingClientRect().top
        );
    } else {
        await expect(r.width).toBe(600);
        await expect(Math.round(r.left)).toBe(
            Math.round((window.innerWidth - 600) / 2)
        );
        await expect(r.height).toBeLessThanOrEqual(window.innerHeight - 64);
        await expect(cs.borderTopLeftRadius).toBe('16px');
        await expect(close.getBoundingClientRect().height).toBe(32);
        await expect(save.getBoundingClientRect().top).toBe(
            cancel.getBoundingClientRect().top
        );
        await expect(save.getBoundingClientRect().left).toBeGreaterThan(
            cancel.getBoundingClientRect().left
        );
    }
    // Long body: scrolls, footer stays inside the panel.
    await expect(body.scrollHeight).toBeGreaterThan(body.clientHeight);
    await expect(save.getBoundingClientRect().bottom).toBeLessThanOrEqual(
        r.bottom
    );
    await closeDialog();
}

const probe = () => <EditCompany open lines={40} />;

export const OpenMobile: Story = {
    ...viewportStory('mobile', probe, assertDialog),
    name: 'is full screen with stacked actions at mobile',
};
export const OpenTablet: Story = {
    ...viewportStory('tablet', probe, assertDialog),
    name: 'is centred at 600px at tablet',
};
export const OpenLaptop: Story = {
    ...viewportStory('laptop', probe, assertDialog),
    name: 'is centred at 600px at laptop',
};
export const OpenDesktop: Story = {
    ...viewportStory('desktop', probe, assertDialog),
    name: 'is centred at 600px at desktop',
};
