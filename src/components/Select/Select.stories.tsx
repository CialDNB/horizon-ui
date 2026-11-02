import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { HorizonProvider } from '../../provider';
import { ResponsiveSpec } from '../../stories/ResponsiveSpec';
import {
    storyLayout as layout,
    viewportStory,
    type Viewport,
} from '../../stories/viewports';
import { FormField } from '../FormField';
import { Select, SelectGroup, SelectItem, SelectSeparator } from '.';

const column = { display: 'grid', gap: 16, maxInlineSize: 360 } as const;
const page = within(document.body);

function Options() {
    return (
        <>
            <SelectGroup label="Active">
                <SelectItem value="acme">Acme Ltd.</SelectItem>
                <SelectItem value="globex">Globex Corporation</SelectItem>
                <SelectItem value="initech" disabled>
                    Initech (suspended)
                </SelectItem>
            </SelectGroup>
            <SelectSeparator />
            <SelectGroup label="Prospects">
                <SelectItem value="umbrella">Umbrella Holdings</SelectItem>
                <SelectItem value="long">
                    Very Long International Trading Company Limited Partnership
                    Holdings
                </SelectItem>
            </SelectGroup>
        </>
    );
}

const meta = {
    title: 'Components/Select',
    component: Select,
    subcomponents: { SelectItem, SelectGroup, SelectSeparator },
    parameters: {
        layout: 'padded',
        docs: {
            description: {
                component: [
                    'Pick one value from a list, on Radix Select. Ported from x-core `SelectV2` (single selection): the `options` array becomes `SelectItem` children (`group` becomes `SelectGroup`, `disabled` per item), `onChange(event, value)` becomes `onValueChange(value)`, `placeholderValue` becomes `placeholder`, `clearable` kept, label/helperText/error move to `FormField`.',
                    '',
                    '**Not here: multiple selection** (`multiple`, `variant="check" | "radio" | "switch"`, apply/reset buttons) and the **search field**: Radix Select is single-value with typeahead only. They need a Combobox (Popover + listbox), planned with the overlays in Task 11b. Values are non-empty strings.',
                    '',
                    '**Why Radix Select, not a native `<select>`:** grouped, disabled and long options look and behave the same in every browser, the list follows Horizon tokens and brand, the trigger matches Input, and Radix still renders a hidden native select so the value submits with forms and autofill works.',
                    '',
                    '**Mobile.** The list is a full-width popover (as wide as the trigger, which fills the form) with 44px rows and 16px text, sized to the space left in the viewport (scroll buttons when it overflows). From tablet with a fine pointer: 36px rows, 14px text. The trigger follows Input sizes. The list portals into the HorizonProvider root at `--z-dropdown` (1400, above MUI dialogs).',
                ].join('\n'),
            },
        },
    },
    args: { 'aria-label': 'Company', placeholder: 'Choose a company' },
    render: (args) => (
        <div style={column}>
            <Select {...args}>
                <Options />
            </Select>
        </div>
    ),
} satisfies Meta<typeof Select>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Controls playground. */
export const Playground: Story = {};

/*
 * While the list is open Radix aria-hides the rest of the page (modal list,
 * focus trapped in the listbox); axe then flags the hidden trigger as
 * focusable (aria-hidden-focus). The trigger cannot receive focus while the
 * list traps it, so this rule is off for stories rendered open.
 */
const openA11y = {
    a11y: {
        config: { rules: [{ id: 'aria-hidden-focus', enabled: false }] },
    },
};

/** Open: groups, a disabled option, the selected check, a long option. */
export const Open: Story = {
    parameters: openA11y,
    args: { defaultValue: 'globex', defaultOpen: true },
    play: async () => {
        const listbox = await page.findByRole('listbox');
        await expect(listbox).toBeVisible();
        await expect(
            page.getByRole('option', { name: 'Globex Corporation' })
        ).toHaveAttribute('aria-selected', 'true');
    },
};

/** Sizes and states (closed). */
export const States: Story = {
    render: () => (
        <div style={column}>
            {(['sm', 'md', 'lg'] as const).map((size) => (
                <Select
                    key={size}
                    size={size}
                    aria-label={`Size ${size}`}
                    placeholder={`Size ${size}`}
                >
                    <Options />
                </Select>
            ))}
            <Select aria-label="Selected" defaultValue="acme">
                <Options />
            </Select>
            <Select aria-label="Invalid" invalid placeholder="Invalid">
                <Options />
            </Select>
            <Select aria-label="Disabled" disabled defaultValue="acme">
                <Options />
            </Select>
            <Select aria-label="Clearable" clearable defaultValue="acme">
                <Options />
            </Select>
        </div>
    ),
};

/** Keyboard: Enter opens, arrows skip the disabled option, Enter selects. */
export const Keyboard: Story = {
    play: async ({ canvasElement }) => {
        const trigger = within(canvasElement).getByRole('combobox');
        trigger.focus();
        await userEvent.keyboard('{Enter}');
        await page.findByRole('listbox');
        await waitFor(() =>
            expect(
                page.getByRole('option', { name: 'Acme Ltd.' })
            ).toHaveFocus()
        );
        await userEvent.keyboard('{ArrowDown}{ArrowDown}{Enter}');
        await expect(trigger).toHaveTextContent('Umbrella Holdings');
    },
};

function ClearableDemo() {
    const [value, setValue] = useState('acme');
    return (
        <Select
            aria-label="Owner company"
            placeholder="Any company"
            clearable
            clearLabel="Clear company"
            value={value}
            onValueChange={setValue}
        >
            <Options />
        </Select>
    );
}

/** Clearable (x-core `clearable`): back to the placeholder. */
export const Clearable: Story = {
    render: () => (
        <div style={column}>
            <ClearableDemo />
        </div>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.click(
            canvas.getByRole('button', { name: 'Clear company' })
        );
        await expect(canvas.getByRole('combobox')).toHaveTextContent(
            'Any company'
        );
    },
};

/** No options: the list says so. */
export const Empty: Story = {
    parameters: openA11y,
    render: () => (
        <div style={column}>
            <Select
                aria-label="Owner"
                placeholder="Choose an owner"
                emptyMessage="No owners yet"
                defaultOpen
            />
        </div>
    ),
    play: async () => {
        await expect(await page.findByText('No owners yet')).toBeVisible();
    },
};

/** In a FormField with a description and an error. */
export const WithFormField: Story = {
    render: () => (
        <div style={column}>
            <FormField
                label="Company"
                description="The account owner"
                error="Choose a company"
                required
            >
                <Select placeholder="Choose a company">
                    <Options />
                </Select>
            </FormField>
        </div>
    ),
};

/** A long selected value truncates in the trigger. */
export const LongText: Story = {
    render: () => (
        <div style={{ ...column, maxInlineSize: 240 }}>
            <Select aria-label="Long" defaultValue="long" clearable>
                <Options />
            </Select>
        </div>
    ),
};

/** Right-to-left: chevron and check on the left. */
export const RTL: Story = {
    parameters: openA11y,
    globals: { direction: 'rtl' },
    render: () => (
        <div style={column}>
            <Select aria-label="חברה" placeholder="בחירת חברה" defaultOpen>
                <SelectItem value="a">אקמי בע״מ</SelectItem>
                <SelectItem value="b">גלובקס</SelectItem>
            </Select>
        </div>
    ),
};

/** All three brands side by side (closed): contrast per brand. */
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
                        <Select
                            aria-label={`${brand} placeholder`}
                            placeholder={`${brand} placeholder`}
                        >
                            <Options />
                        </Select>
                        <Select
                            aria-label={`${brand} value`}
                            defaultValue="acme"
                        >
                            <Options />
                        </Select>
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
            caption="Select responsive specification"
            spec={{
                mobile: {
                    size: 'Trigger as Input (44px, lg 48px, 16px text); options 44px rows, 16px text.',
                    density:
                        'List padding 4px; option padding 8px 36px 8px 12px.',
                    layout: 'Full-width popover under (or above) the trigger, as wide as the trigger; height limited to the space left, with scroll buttons.',
                    contentVisibility:
                        'Long options and values truncate with an ellipsis (title shows the full text).',
                    interaction:
                        'Tap to open, tap an option; the list closes on selection or outside tap.',
                    note: 'A popover, not a bottom sheet: the trigger is full width at mobile, so the list already spans the screen and stays next to its field; bottom sheets come with the Popover/Dialog overlays (Task 11b).',
                },
                tablet: {
                    size: 'Fine pointer: trigger sm 32, md 40, lg 48; options 36px, 14px text. Touch (iPad): mobile sizes.',
                    density: 'As mobile.',
                    layout: 'Popover as wide as the trigger (min 192px).',
                    contentVisibility: 'As mobile.',
                    interaction:
                        'Pointer hover highlights; keyboard: Enter/Space/arrows open, arrows/Home/End move, typeahead, Escape closes.',
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

/* ---- Viewport tests (open list, real layout) ---- */

const expected = {
    mobile: { trigger: 44, row: 44, text: '16px' },
    tablet: { trigger: 40, row: 36, text: '14px' },
    laptop: { trigger: 40, row: 36, text: '14px' },
    desktop: { trigger: 40, row: 36, text: '14px' },
} as const;

function Probe() {
    return (
        <div style={{ inlineSize: 320 }}>
            <Select
                aria-label="Probe"
                defaultValue="long"
                data-testid="trigger"
            >
                <Options />
            </Select>
        </div>
    );
}

async function assertSelect(canvasElement: HTMLElement, viewport: Viewport) {
    const trigger = within(canvasElement).getByTestId('trigger');
    const want = expected[viewport];
    const rect = trigger.getBoundingClientRect();
    await expect(rect.height, 'trigger height').toBe(want.trigger);
    await expect(rect.width).toBe(320);
    // The long value truncates inside the trigger.
    await expect(trigger.scrollWidth).toBeLessThanOrEqual(320);
    await userEvent.click(trigger);
    const listbox = await page.findByRole('listbox');
    const content = listbox.closest('[data-select-content]');
    if (!content) throw new Error('no content');
    await expect(content.getBoundingClientRect().width).toBe(320);
    await expect(getComputedStyle(content).zIndex).toBe('1400');
    await expect(content.closest('.hz-root')).not.toBeNull();
    const option = page.getByRole('option', { name: 'Acme Ltd.' });
    await expect(option.getBoundingClientRect().height, 'row').toBe(want.row);
    await expect(getComputedStyle(option).fontSize).toBe(want.text);
    const long = page.getByRole('option', { name: /Very Long/ });
    await expect(long.getBoundingClientRect().height, 'long row').toBe(
        want.row
    );
    await expect(long).toHaveAttribute('title');
    await userEvent.keyboard('{Escape}');
}

export const OpenMobile: Story = {
    ...viewportStory('mobile', () => <Probe />, assertSelect),
    name: 'opens a full-width list with 44px rows at mobile',
};
export const OpenTablet: Story = {
    ...viewportStory('tablet', () => <Probe />, assertSelect),
    name: 'opens a dense list with a fine pointer at tablet',
};
export const OpenLaptop: Story = {
    ...viewportStory('laptop', () => <Probe />, assertSelect),
    name: 'opens a dense list with a fine pointer at laptop',
};
export const OpenDesktop: Story = {
    ...viewportStory('desktop', () => <Probe />, assertSelect),
    name: 'opens a dense list with a fine pointer at desktop',
};

/** Trigger and list colours come from the tokens. */
export const ComputedStyles: Story = {
    name: 'applies Horizon tokens to trigger and list',
    tags: ['!autodocs', '!dev'],
    render: () => (
        <div style={column}>
            <Select
                aria-label="Tokens"
                placeholder="Pick"
                data-testid="trigger"
            >
                <Options />
            </Select>
            <span
                data-testid="probe"
                style={{
                    color: 'var(--control-border)',
                    background: 'var(--popover)',
                    borderColor: 'var(--accent)',
                    outlineColor: 'var(--muted-foreground)',
                }}
            />
        </div>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const probe = getComputedStyle(canvas.getByTestId('probe'));
        const trigger = canvas.getByTestId('trigger');
        const cs = getComputedStyle(trigger);
        await expect(cs.boxShadow).toContain(probe.color);
        await expect(cs.borderRadius).toBe('20px');
        await expect(cs.color).toBe(probe.outlineColor);
        await userEvent.click(trigger);
        const listbox = await page.findByRole('listbox');
        const content = listbox.closest('[data-select-content]');
        if (!content) throw new Error('no content');
        await expect(getComputedStyle(content).backgroundColor).toBe(
            probe.backgroundColor
        );
        await userEvent.hover(page.getByRole('option', { name: 'Acme Ltd.' }));
        await waitFor(() =>
            expect(
                getComputedStyle(
                    page.getByRole('option', { name: 'Acme Ltd.' })
                ).backgroundColor
            ).toBe(probe.borderTopColor)
        );
        await userEvent.keyboard('{Escape}');
    },
};
