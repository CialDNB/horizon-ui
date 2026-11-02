import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect } from 'react';
import { expect, userEvent, waitFor } from 'storybook/test';
import { HorizonProvider } from '../../provider';
import { ResponsiveSpec } from '../../stories/ResponsiveSpec';
import {
    settled,
    storyLayout as layout,
    viewportStory,
    type Viewport,
} from '../../stories/viewports';
import { Button } from '../Button';
import { ToastProvider, toast, type ToastOptions } from '.';

const items = () =>
    Array.from(document.querySelectorAll<HTMLElement>('[data-toast]'));

function Demo() {
    return (
        <>
            <ToastProvider />
            <div style={layout.row}>
                <Button
                    onClick={() =>
                        toast({
                            variant: 'success',
                            title: 'Report saved',
                            description: 'Acme Ltd. credit report is ready.',
                        })
                    }
                >
                    Success
                </Button>
                <Button
                    variant="destructive"
                    onClick={() =>
                        toast({
                            variant: 'error',
                            description: 'Error while submitting form!',
                        })
                    }
                >
                    Error
                </Button>
                <Button
                    variant="secondary"
                    onClick={() =>
                        toast({
                            variant: 'warning',
                            title: 'New data available',
                            description:
                                'The report changed since you opened it.',
                            action: { label: 'Refresh', onClick: () => {} },
                            duration: Infinity,
                        })
                    }
                >
                    Warning with action
                </Button>
            </div>
        </>
    );
}

/** Shows `list` on mount and clears every toast on unmount. */
function Shown({ list }: { list: ToastOptions[] }) {
    useEffect(() => {
        for (const options of list) toast(options);
        return () => toast.dismiss();
    }, [list]);
    return <ToastProvider />;
}

async function clear() {
    toast.dismiss();
    await waitFor(() => expect(items()).toHaveLength(0));
}

const meta = {
    title: 'Components/Toast',
    component: ToastProvider,
    parameters: {
        layout: 'padded',
        docs: {
            description: {
                component: [
                    "Short notifications that close by themselves, on Radix Toast; each toast is a Horizon Alert. Replaces x-core `Snackbar` (`SnackbarAlert` + `useSnackbar` on notistack) and customer360 `useSimpleSnackbar`: `enqueue({ color, title, text, onActionClick, actionTitle, autoHideDuration, preventDuplicate })` becomes `toast({ variant, title, description, action: { label, onClick }, duration, id })`, which returns `{ id, dismiss }` (customer360 returned `handleClose`). Mount `<ToastProvider />` once inside the app's HorizonProvider.",
                    '',
                    '**Accessibility:** each toast is announced once through one visually hidden live region (polite; assertive for `error`), the visible toast is not a live region. F8 moves focus to the list; hovering or focusing pauses the timers; the dismiss button is 44px at mobile; Escape on a focused toast closes it. Never put the only copy of important information or a required decision in a toast.',
                    '',
                    '**Position:** bottom centre at mobile and tablet (full width minus 16px at mobile, max 400px), bottom end from laptop. customer360 used top-right below the app bar; Horizon moves toasts to the bottom (thumb reach, no app-bar overlap).',
                ].join('\n'),
            },
        },
    },
    render: () => <Demo />,
} satisfies Meta<typeof ToastProvider>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Press the buttons. */
export const Playground: Story = {};

/** Tones and a stack (persistent here). */
export const Variants: Story = {
    render: () => (
        <Shown
            list={[
                {
                    variant: 'info',
                    description: 'Exporting 3 reports...',
                    duration: Infinity,
                },
                {
                    variant: 'success',
                    title: 'Saved',
                    description: 'Changes saved.',
                    duration: Infinity,
                },
                {
                    variant: 'warning',
                    description: 'Credit limit nearly reached.',
                    duration: Infinity,
                },
                {
                    variant: 'error',
                    title: 'Upload failed',
                    description: 'The file is larger than 10 MB.',
                    duration: Infinity,
                },
            ]}
        />
    ),
    play: async () => {
        await waitFor(() => expect(items()).toHaveLength(4));
        await clear();
    },
};

/** Long text wraps. */
export const LongText: Story = {
    render: () => (
        <Shown
            list={[
                {
                    title: 'A long title for a notification that wraps',
                    description:
                        'Averyveryverylongunbrokenwordthatmustwrapinsidethetoast and a long sentence that continues for a while.',
                    duration: Infinity,
                },
            ]}
        />
    ),
    play: async () => {
        await waitFor(() => expect(items()).toHaveLength(1));
        const [item] = items();
        if (!item) throw new Error('no toast');
        await expect(item.scrollWidth).toBeLessThanOrEqual(item.clientWidth);
        await clear();
    },
};

/** Right-to-left: bottom start corner (left) from laptop, swipe left. */
export const RTL: Story = {
    globals: { direction: 'rtl' },
    render: () => (
        <Shown list={[{ description: 'הדוח נשמר', duration: Infinity }]} />
    ),
    play: async () => {
        await waitFor(() => expect(items()).toHaveLength(1));
        await expect(items()[0]).toHaveAttribute(
            'data-swipe-direction',
            'left'
        );
        await clear();
    },
};

/** All three brands. */
export const Brands: Story = {
    render: () => (
        <div style={layout.stack}>
            {(['cial', 'dnb', 'il'] as const).map((brand) => (
                <HorizonProvider
                    key={brand}
                    brand={brand}
                    style={{ background: 'var(--background)', padding: 16 }}
                >
                    <Button
                        onClick={() =>
                            toast({
                                variant: 'success',
                                description: `${brand} toast`,
                            })
                        }
                    >
                        {brand}
                    </Button>
                </HorizonProvider>
            ))}
            <ToastProvider />
        </div>
    ),
};

/** Keyboard: the dismiss button is reachable and closes the toast. */
export const Keyboard: Story = {
    render: () => (
        <Shown list={[{ description: 'Press Escape', duration: Infinity }]} />
    ),
    play: async () => {
        await waitFor(() => expect(items()).toHaveLength(1));
        const dismiss = items()[0]?.querySelector('button');
        if (!dismiss) throw new Error('no dismiss');
        dismiss.focus();
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(items()).toHaveLength(0));
    },
};

/** Per-breakpoint specification (Responsive Standard). */
export const Responsive: Story = {
    render: () => (
        <ResponsiveSpec
            caption="Toast responsive specification"
            spec={{
                mobile: {
                    size: 'Full width minus 16px each side; Alert type (16px); dismiss 44px.',
                    density:
                        'List padding 16px (plus the bottom safe area), 8px between toasts.',
                    layout: 'Bottom centre; newest at the bottom; slides up 16px while fading in.',
                    contentVisibility:
                        'Title and message wrap; action under the text.',
                    interaction:
                        'Swipe toward the inline end or tap dismiss; timer pauses while touched.',
                },
                tablet: {
                    size: 'Max 400px wide; dismiss 32px with a fine pointer.',
                    density: 'As mobile.',
                    layout: 'Bottom centre.',
                    contentVisibility: 'Action at the end of the row.',
                    interaction:
                        'Hover or focus pauses; F8 jumps to the list; Escape closes a focused toast.',
                },
                laptop: {
                    size: 'As tablet.',
                    density: 'List padding 24px.',
                    layout: 'Bottom end corner (right in ltr, left in rtl).',
                    contentVisibility: 'As tablet.',
                    interaction: 'As tablet.',
                },
                desktop: {
                    size: 'As tablet.',
                    density: 'As laptop.',
                    layout: 'As laptop.',
                    contentVisibility: 'As tablet.',
                    interaction: 'As tablet.',
                    note: 'Identical to laptop.',
                },
            }}
        />
    ),
};

/* ---- Viewport tests ---- */

async function assertToast(...[, viewport]: [HTMLElement, Viewport]) {
    await waitFor(() => expect(items()).toHaveLength(1));
    const [item] = items();
    if (!item) throw new Error('no toast');
    await settled(item);
    const r = item.getBoundingClientRect();
    const w = window.innerWidth;
    const viewportEl = document.querySelector('[data-toast-viewport]');
    if (!viewportEl) throw new Error('no viewport');
    await expect(getComputedStyle(viewportEl).zIndex).toBe('1600');
    const dismiss = item.querySelector('button');
    if (!dismiss) throw new Error('no dismiss');
    await expect(Math.round(r.bottom)).toBe(
        window.innerHeight -
            (viewport === 'mobile' || viewport === 'tablet' ? 16 : 24)
    );
    if (viewport === 'mobile') {
        await expect(r.width).toBe(w - 32);
        await expect(dismiss.getBoundingClientRect().height).toBe(44);
    } else if (viewport === 'tablet') {
        await expect(r.width).toBe(400);
        await expect(Math.round(r.left)).toBe(Math.round((w - 400) / 2));
    } else {
        await expect(r.width).toBe(400);
        await expect(Math.round(r.right)).toBe(w - 24);
    }
    await clear();
}

const probe = () => (
    <Shown
        list={[
            { variant: 'success', description: 'Saved', duration: Infinity },
        ]}
    />
);

export const AtMobile: Story = {
    ...viewportStory('mobile', probe, assertToast),
    name: 'is bottom centre, full width at mobile',
};
export const AtTablet: Story = {
    ...viewportStory('tablet', probe, assertToast),
    name: 'is bottom centre, 400px at tablet',
};
export const AtLaptop: Story = {
    ...viewportStory('laptop', probe, assertToast),
    name: 'is bottom end at laptop',
};
export const AtDesktop: Story = {
    ...viewportStory('desktop', probe, assertToast),
    name: 'is bottom end at desktop',
};
