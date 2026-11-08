import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, userEvent, within } from 'storybook/test';
import { HorizonProvider } from '../../provider';
import { ResponsiveSpec } from '../../stories/ResponsiveSpec';
import {
    storyLayout as layout,
    viewportStory,
    type Viewport,
} from '../../stories/viewports';
import { FormField } from '../FormField';
import { EmailsField } from '.';

const column = { display: 'grid', gap: 16, maxInlineSize: 400 } as const;

const meta = {
    title: 'Components/EmailsField',
    component: EmailsField,
    parameters: {
        layout: 'padded',
        docs: {
            description: {
                component: [
                    'Collects email addresses as removable Chips. Enter, comma, semicolon, space and leaving the field add the typed address when it is valid (x-core `validateEmail` rule, exported as `validateEmail`; replace with `validate`); pasting a list adds every valid address ("Name <a@b.com>" and invisible characters are normalized, as x-core); an invalid address stays in the input with an error message (`role="alert"`, tied by `aria-describedby`); Backspace in the empty input removes the last chip; duplicates are ignored; `limit` shows a counter and stops additions.',
                    '',
                    'Ported from x-core `EmailsFieldV2` (and v1 `EmailsField` call sites): `value`/`onChange(event, emails)` become `value`/`onValueChange(emails)`, `emailValidationFunc` becomes `validate`, `label`/`labelContainer`/`helperText`/`error`/`info` move to FormField, `isLoading` becomes `loading`, `clearable` and `limit` kept; `AutocompleteProps`/`TextFieldProps`/`endAdornment` dropped. It is a textbox, not a combobox (there is no list).',
                ].join('\n'),
            },
        },
    },
    args: {
        'aria-label': 'Recipients',
        placeholder: 'Type an email and press Enter',
    },
    render: (args) => (
        <div style={column}>
            <EmailsField {...args} />
        </div>
    ),
} satisfies Meta<typeof EmailsField>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Controls playground. */
export const Playground: Story = {};

function Demo() {
    const [emails, setEmails] = useState<string[]>(['dana@example.com']);
    return (
        <EmailsField
            aria-label="Share with"
            value={emails}
            onValueChange={setEmails}
            clearable
        />
    );
}

/** Typing, an invalid address, Backspace. */
export const Typing: Story = {
    render: () => (
        <div style={column}>
            <Demo />
        </div>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const box = canvas.getByRole('textbox');
        await userEvent.click(box);
        await userEvent.keyboard('omer@example.com,');
        await expect(
            canvas.getByRole('button', { name: 'Remove omer@example.com' })
        ).toBeVisible();
        await userEvent.keyboard('oops{Enter}');
        await expect(canvas.getByRole('alert')).toBeVisible();
        await userEvent.clear(box);
        await userEvent.keyboard('{Backspace}');
        await expect(
            canvas.queryByRole('button', { name: 'Remove omer@example.com' })
        ).toBeNull();
    },
};

/** States: values, invalid, disabled, loading, limit. */
export const States: Story = {
    render: () => (
        <div style={column}>
            {(['sm', 'md', 'lg'] as const).map((size) => (
                <EmailsField
                    key={size}
                    size={size}
                    aria-label={`Size ${size}`}
                    placeholder={`Size ${size}`}
                />
            ))}
            <EmailsField
                aria-label="With values"
                defaultValue={['dana@example.com', 'omer@example.com']}
                clearable
            />
            <EmailsField
                aria-label="Invalid"
                invalid
                defaultValue={['dana@example.com']}
            />
            <EmailsField
                aria-label="Disabled"
                disabled
                defaultValue={['dana@example.com']}
            />
            <EmailsField
                aria-label="Loading"
                loading
                defaultValue={['dana@example.com']}
            />
            <EmailsField
                aria-label="Limit"
                limit={1}
                defaultValue={['dana@example.com']}
            />
        </div>
    ),
};

/** In a FormField (x-core label / helperText / error). */
export const WithFormField: Story = {
    render: () => (
        <div style={column}>
            <FormField
                label="Contact email"
                description="We notify these addresses"
                required
            >
                <EmailsField placeholder='Type a valid email and press "Enter"' />
            </FormField>
        </div>
    ),
};

/** Long addresses truncate inside their chip; chips wrap. */
export const LongText: Story = {
    render: () => (
        <div style={{ ...column, maxInlineSize: 260 }}>
            <EmailsField
                aria-label="Long"
                defaultValue={[
                    'very.long.first.name.and.last.name@an-extremely-long-company-domain.example.com',
                    'a@b.co',
                    'second.person@example.com',
                ]}
            />
        </div>
    ),
};

/** Right-to-left. */
export const RTL: Story = {
    globals: { direction: 'rtl' },
    render: () => (
        <div style={column}>
            <EmailsField
                aria-label="נמענים"
                defaultValue={['dana@example.com']}
                clearable
            />
        </div>
    ),
};

/** All three brands side by side. */
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
                        <EmailsField
                            aria-label={`${brand} recipients`}
                            defaultValue={['dana@example.com']}
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
            caption="EmailsField responsive specification"
            spec={{
                mobile: {
                    size: 'Field at least 44px (lg 48px), 16px text, the email keyboard (`inputmode="email"`); chip remove targets 44px; clear 44px.',
                    density:
                        'Chips 24px with 4px gaps; the field grows a row per line of chips.',
                    layout: 'Full width; chips wrap; the input takes the rest of the last row (min 120px).',
                    contentVisibility:
                        'Long addresses truncate in their chip (title shows the full address); the counter and error sit under the field.',
                    interaction:
                        "Type and press the keyboard's Enter/comma/space, or leave the field; paste a list.",
                },
                tablet: {
                    size: 'Fine pointer: min sm 32, md 40, lg 48; 14px text; clear 32px. Touch: mobile sizes.',
                    density: 'As mobile.',
                    layout: 'As mobile.',
                    contentVisibility: 'As mobile.',
                    interaction:
                        'Keyboard: Enter , ; Space add; Backspace removes the last chip; Tab reaches each remove button.',
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

const expected = {
    mobile: { field: 44, text: '16px' },
    tablet: { field: 40, text: '14px' },
    laptop: { field: 40, text: '14px' },
    desktop: { field: 40, text: '14px' },
} as const;

function Probe() {
    return (
        <div style={{ inlineSize: 320 }}>
            <EmailsField aria-label="Probe" data-testid="empty" />
            <div style={{ blockSize: 16 }} />
            <EmailsField
                aria-label="Chips"
                data-testid="chips"
                defaultValue={[
                    'very.long.first.name@an-extremely-long-company-domain.example.com',
                    'dana@example.com',
                    'omer@example.com',
                ]}
            />
        </div>
    );
}

async function assertEmails(canvasElement: HTMLElement, viewport: Viewport) {
    const canvas = within(canvasElement);
    const want = expected[viewport];
    const empty = canvas.getByTestId('empty');
    const field = empty.closest('[data-emails-field]');
    if (!field) throw new Error('no field');
    await expect(field.getBoundingClientRect().height, 'empty field').toBe(
        want.field
    );
    await expect(getComputedStyle(empty).fontSize).toBe(want.text);
    const chips = canvas.getByTestId('chips').closest('[data-emails-field]');
    if (!chips) throw new Error('no chips field');
    const box = chips.getBoundingClientRect();
    await expect(box.width).toBe(320);
    for (const chip of chips.querySelectorAll(':scope > span')) {
        const r = chip.getBoundingClientRect();
        await expect(r.right).toBeLessThanOrEqual(box.right);
    }
    await expect(document.documentElement.scrollWidth).toBe(window.innerWidth);
}

export const LayoutMobile: Story = {
    ...viewportStory('mobile', () => <Probe />, assertEmails),
    name: 'is 44px and wraps chips without overflow at mobile',
};
export const LayoutTablet: Story = {
    ...viewportStory('tablet', () => <Probe />, assertEmails),
    name: 'is 40px with a fine pointer at tablet',
};
export const LayoutLaptop: Story = {
    ...viewportStory('laptop', () => <Probe />, assertEmails),
    name: 'is 40px with a fine pointer at laptop',
};
export const LayoutDesktop: Story = {
    ...viewportStory('desktop', () => <Probe />, assertEmails),
    name: 'is 40px with a fine pointer at desktop',
};
