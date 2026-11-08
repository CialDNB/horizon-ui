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
import { FormField } from '../FormField';
import { Combobox, type ComboboxOption } from '.';

const column = { display: 'grid', gap: 16, maxInlineSize: 360 } as const;
const page = within(document.body);

const COMPANIES: ComboboxOption[] = [
    { value: 'acme', label: 'Acme Ltd.', group: 'Active' },
    { value: 'globex', label: 'Globex Corporation', group: 'Active' },
    {
        value: 'initech',
        label: 'Initech (suspended)',
        group: 'Active',
        disabled: true,
    },
    {
        value: 'umbrella',
        label: 'Umbrella Holdings',
        group: 'Prospects',
        description: 'Registered 2019, Tel Aviv',
    },
    {
        value: 'long',
        label: 'Very Long International Trading Company Limited Partnership Holdings',
        group: 'Prospects',
    },
];

async function closeList() {
    await userEvent.keyboard('{Escape}');
    await waitFor(() =>
        expect(document.querySelector('[data-combobox-content]')).toBeNull()
    );
}

const meta = {
    title: 'Components/Combobox',
    component: Combobox,
    parameters: {
        layout: 'padded',
        docs: {
            description: {
                component: [
                    'A text field with a list of suggestions (ARIA 1.2 editable combobox, list autocomplete). Ported from x-core `Autocomplete` and `CountryAutoComplete` (MUI Autocomplete), and the target for `SelectV2`/`Select` call sites that use `multiple` or the search field.',
                    '',
                    '**Keyboard.** Typing opens and filters (case- and accent-insensitive "contains", as MUI) and highlights the first match; ArrowDown/ArrowUp open and move (disabled options skipped, wrapping); Alt+ArrowDown opens without moving; Enter picks; Escape closes and restores the selected label; Backspace in an empty multi-select removes the last chip. Focus stays in the input (`aria-activedescendant`).',
                    '',
                    '**Multiple.** Values render as removable Chips (44px remove target at mobile); the list stays open while picking and shows a check box per option. **Custom values** (`allowCustomValue`, MUI `freeSolo`): Enter commits the typed text. **Async**: pass `filter={false}`, fetch in `onInputChange` and set `loading`; the loading and empty states are announced politely once each.',
                    '',
                    '**Mobile.** The list stays anchored under the field (as wide as the field, 44px rows, 16px text), not a bottom sheet: the typed text must stay visible above the on-screen keyboard, which covers a bottom-pinned sheet (same call as Select). The list portals into the HorizonProvider root at `--z-dropdown` (1400, above MUI dialogs; inside an MUI dialog wrap the content in a HorizonProvider).',
                    '',
                    '**Why not cmdk (shadcn Command):** cmdk sets `aria-selected` on the highlighted item, which contradicts multi-select state, keeps `aria-expanded` true while closed, and adds 4.7 KB gz; this component is built on Radix Popover (already a dependency).',
                ].join('\n'),
            },
        },
    },
    args: {
        'aria-label': 'Company',
        placeholder: 'Search companies',
        options: COMPANIES,
    },
    render: (args) => (
        <div style={column}>
            <Combobox {...args} />
        </div>
    ),
} satisfies Meta<typeof Combobox>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Controls playground. */
export const Playground: Story = {};

/** Open: groups, a disabled option, a description, a long option. */
export const Open: Story = {
    args: { defaultValue: 'globex', defaultOpen: true },
    play: async () => {
        const listbox = await page.findByRole('listbox', { name: 'Company' });
        await waitFor(() => expect(listbox).toBeVisible());
        await expect(
            page.getByRole('option', { name: 'Globex Corporation' })
        ).toHaveAttribute('aria-selected', 'true');
        await closeList();
    },
};

/** Typing filters and highlights the first match; Enter picks. */
export const Typing: Story = {
    play: async ({ canvasElement }) => {
        const input = within(canvasElement).getByRole('combobox');
        await userEvent.click(input);
        await userEvent.keyboard('umb');
        await expect(page.getAllByRole('option')).toHaveLength(1);
        await userEvent.keyboard('{Enter}');
        await expect(input).toHaveValue('Umbrella Holdings');
    },
};

/** Multiple selection: removable Chips; the list stays open. */
export const Multiple: Story = {
    render: () => (
        <div style={column}>
            <Combobox
                multiple
                aria-label="Workflows"
                placeholder="Workflow"
                options={COMPANIES}
                defaultValue={['acme', 'umbrella', 'long']}
                clearable
            />
        </div>
    ),
};

/** Sizes and states (closed). */
export const States: Story = {
    render: () => (
        <div style={column}>
            {(['sm', 'md', 'lg'] as const).map((size) => (
                <Combobox
                    key={size}
                    size={size}
                    aria-label={`Size ${size}`}
                    placeholder={`Size ${size}`}
                    options={COMPANIES}
                />
            ))}
            <Combobox
                aria-label="Selected"
                defaultValue="acme"
                options={COMPANIES}
            />
            <Combobox
                aria-label="Invalid"
                invalid
                placeholder="Invalid"
                options={COMPANIES}
            />
            <Combobox
                aria-label="Disabled"
                disabled
                defaultValue="acme"
                options={COMPANIES}
            />
            <Combobox
                aria-label="Loading"
                loading
                placeholder="Loading"
                options={COMPANIES}
            />
            <Combobox
                aria-label="Clearable"
                clearable
                defaultValue="acme"
                options={COMPANIES}
            />
        </div>
    ),
};

function AsyncDemo() {
    const [options, setOptions] = useState<ComboboxOption[]>([]);
    const [loading, setLoading] = useState(false);
    return (
        <Combobox
            aria-label="Company search"
            placeholder="Type a company name"
            options={options}
            filter={false}
            loading={loading}
            emptyMessage="No companies found"
            onInputChange={(text, reason) => {
                if (reason !== 'input') return;
                setLoading(true);
                setTimeout(() => {
                    setOptions(
                        text.trim() === 'zz'
                            ? []
                            : COMPANIES.filter((c) =>
                                  c.label
                                      .toLowerCase()
                                      .includes(text.toLowerCase())
                              )
                    );
                    setLoading(false);
                }, 400);
            }}
        />
    );
}

/** Async options: loading, results and the empty state, announced politely. */
export const Async: Story = {
    render: () => (
        <div style={column}>
            <AsyncDemo />
        </div>
    ),
    play: async ({ canvasElement }) => {
        const input = within(canvasElement).getByRole('combobox');
        await userEvent.click(input);
        await userEvent.keyboard('acm');
        const status = within(canvasElement).getByRole('status');
        await expect(status).toHaveTextContent('Loading…');
        await expect(
            await page.findByRole('option', { name: 'Acme Ltd.' })
        ).toBeVisible();
        await userEvent.clear(input);
        await userEvent.keyboard('zz');
        await waitFor(() =>
            expect(status).toHaveTextContent('No companies found')
        );
        await closeList();
    },
};

/** Custom values (MUI `freeSolo`): Enter commits the typed text. */
export const CustomValues: Story = {
    render: () => (
        <div style={column}>
            <Combobox
                multiple
                allowCustomValue
                aria-label="Tags"
                placeholder="Add a tag and press Enter"
                options={COMPANIES}
            />
        </div>
    ),
};

/** In a FormField: label, description, error (x-core CountryAutoComplete label/helperText/error). */
export const WithFormField: Story = {
    render: () => (
        <div style={column}>
            <FormField
                label="Country"
                description="Billing country"
                error="Choose a country"
                required
            >
                <Combobox
                    placeholder="Choose a country"
                    options={[
                        { value: 'FRA', label: 'France' },
                        { value: 'ISR', label: 'Israel' },
                        { value: 'JPN', label: 'Japan' },
                    ]}
                />
            </FormField>
        </div>
    ),
};

/** Long values truncate; chips wrap inside the field. */
export const LongText: Story = {
    render: () => (
        <div style={{ ...column, maxInlineSize: 240 }}>
            <Combobox
                aria-label="Long"
                defaultValue="long"
                options={COMPANIES}
            />
            <Combobox
                multiple
                aria-label="Long chips"
                defaultValue={['long', 'globex']}
                options={COMPANIES}
            />
        </div>
    ),
};

/** Right-to-left: the list aligns to the field's inline start (right). */
export const RTL: Story = {
    globals: { direction: 'rtl' },
    render: () => (
        <div style={column}>
            <Combobox
                aria-label="חברה"
                placeholder="חיפוש חברה"
                options={[
                    { value: 'a', label: 'אקמי בע״מ' },
                    { value: 'b', label: 'גלובקס' },
                ]}
                defaultValue="a"
                data-testid="rtl-input"
            />
        </div>
    ),
    play: async ({ canvasElement }) => {
        const input = within(canvasElement).getByTestId('rtl-input');
        await userEvent.click(input);
        const listbox = await page.findByRole('listbox');
        const field = input.closest('[data-combobox-field]');
        const content = listbox.closest('[data-combobox-content]');
        if (!field || !content) throw new Error('parts');
        await settled(content);
        const f = field.getBoundingClientRect();
        const c = content.getBoundingClientRect();
        await expect(Math.abs(c.right - f.right)).toBeLessThanOrEqual(1);
        const toggle = field.querySelector('[data-combobox-toggle]');
        if (!toggle) throw new Error('toggle');
        // The toggle sits at the inline end (left in rtl).
        await expect(toggle.getBoundingClientRect().left).toBeLessThan(
            input.getBoundingClientRect().left
        );
        await closeList();
    },
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
                        <Combobox
                            aria-label={`${brand} placeholder`}
                            placeholder={`${brand} placeholder`}
                            options={COMPANIES}
                        />
                        <Combobox
                            multiple
                            aria-label={`${brand} values`}
                            defaultValue={['acme']}
                            options={COMPANIES}
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
            caption="Combobox responsive specification"
            spec={{
                mobile: {
                    size: 'Field as Input (44px, lg 48px, 16px text); toggle and clear 44px; options 44px rows, 16px text; chip remove 44px hit area.',
                    density: 'List padding 4px; option padding 8px 12px.',
                    layout: 'List anchored under (or above) the field, as wide as the field (full width in forms), at most 320px tall or the space left.',
                    contentVisibility:
                        'Long options and values truncate (title shows the full text); chips wrap onto new lines.',
                    interaction:
                        'Tap the field or toggle to open, type to filter, tap an option.',
                    note: 'Not a bottom sheet: the on-screen keyboard covers a bottom-pinned sheet, and the typed text must stay visible next to its suggestions (same call as Select).',
                },
                tablet: {
                    size: 'Fine pointer: field sm 32, md 40, lg 48; options 36px, 14px text; toggle and clear 32px. Touch (iPad): mobile sizes.',
                    density: 'As mobile.',
                    layout: 'As mobile (min 192px wide).',
                    contentVisibility: 'As mobile.',
                    interaction:
                        'Pointer hover highlights; keyboard: arrows, Alt+arrows, Enter, Escape, Backspace (multiple).',
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
    mobile: { field: 44, row: 44, text: '16px', action: 44 },
    tablet: { field: 40, row: 36, text: '14px', action: 32 },
    laptop: { field: 40, row: 36, text: '14px', action: 32 },
    desktop: { field: 40, row: 36, text: '14px', action: 32 },
} as const;

function Probe() {
    return (
        <div style={{ inlineSize: 320 }}>
            <Combobox
                aria-label="Probe"
                options={COMPANIES}
                clearable
                defaultValue="long"
                data-testid="input"
            />
        </div>
    );
}

async function assertCombobox(canvasElement: HTMLElement, viewport: Viewport) {
    const input = within(canvasElement).getByTestId('input');
    const field = input.closest('[data-combobox-field]');
    if (!field) throw new Error('no field');
    const want = expected[viewport];
    const rect = field.getBoundingClientRect();
    await expect(rect.height, 'field height').toBe(want.field);
    await expect(rect.width).toBe(320);
    await expect(getComputedStyle(input).fontSize).toBe(want.text);
    for (const name of ['Clear', 'Show options']) {
        const button = within(canvasElement).getByRole('button', { name });
        const b = button.getBoundingClientRect();
        await expect(b.width, `${name} width`).toBe(want.action);
        await expect(b.height, `${name} height`).toBe(want.action);
    }
    await userEvent.click(input);
    const listbox = await page.findByRole('listbox');
    const content = listbox.closest('[data-combobox-content]');
    if (!content) throw new Error('no content');
    await settled(content);
    await expect(content.getBoundingClientRect().width).toBe(320);
    await expect(getComputedStyle(content).zIndex).toBe('1400');
    await expect(content.closest('.hz-root')).not.toBeNull();
    const option = page.getByRole('option', { name: 'Acme Ltd.' });
    await expect(option.getBoundingClientRect().height, 'row').toBe(want.row);
    await expect(getComputedStyle(option).fontSize).toBe(want.text);
    await closeList();
}

export const OpenMobile: Story = {
    ...viewportStory('mobile', () => <Probe />, assertCombobox),
    name: 'opens a field-wide list with 44px rows and targets at mobile',
};
export const OpenTablet: Story = {
    ...viewportStory('tablet', () => <Probe />, assertCombobox),
    name: 'opens a dense list with a fine pointer at tablet',
};
export const OpenLaptop: Story = {
    ...viewportStory('laptop', () => <Probe />, assertCombobox),
    name: 'opens a dense list with a fine pointer at laptop',
};
export const OpenDesktop: Story = {
    ...viewportStory('desktop', () => <Probe />, assertCombobox),
    name: 'opens a dense list with a fine pointer at desktop',
};

function ChipsProbe() {
    return (
        <div style={{ inlineSize: 320 }}>
            <Combobox
                multiple
                aria-label="Chips"
                options={COMPANIES}
                defaultValue={['acme', 'globex', 'umbrella', 'long']}
            />
        </div>
    );
}

/** Chips wrap without horizontal overflow; remove targets are 44px at mobile. */
export const ChipsMobile: Story = {
    ...viewportStory(
        'mobile',
        () => <ChipsProbe />,
        async (canvasElement) => {
            const field = canvasElement.querySelector('[data-combobox-field]');
            if (!field) throw new Error('no field');
            const box = field.getBoundingClientRect();
            for (const chip of field.querySelectorAll(':scope > span')) {
                const r = chip.getBoundingClientRect();
                await expect(r.right).toBeLessThanOrEqual(box.right);
                await expect(r.left).toBeGreaterThanOrEqual(box.left);
            }
            await expect(document.documentElement.scrollWidth).toBe(
                window.innerWidth
            );
            await expect(field.getBoundingClientRect().height).toBeGreaterThan(
                44
            );
            const remove = within(canvasElement).getByRole('button', {
                name: 'Remove Acme Ltd.',
            });
            let chip: Element | null = remove;
            while (chip && chip.parentElement !== field)
                chip = chip.parentElement;
            const layers = [
                remove,
                ...(chip?.querySelectorAll('[data-chip-hit]') ?? []),
            ].map((el) => el.getBoundingClientRect());
            await expect(
                Math.max(...layers.map((r) => r.width))
            ).toBeGreaterThanOrEqual(44);
            await expect(
                Math.max(...layers.map((r) => r.height))
            ).toBeGreaterThanOrEqual(44);
        }
    ),
    name: 'wraps chips without overflow at mobile',
};

/** Field and list colours come from the tokens. */
export const ComputedStyles: Story = {
    name: 'applies Horizon tokens to field and list',
    tags: ['!autodocs', '!dev'],
    render: () => (
        <div style={column}>
            <Combobox
                aria-label="Tokens"
                options={COMPANIES}
                data-testid="input"
            />
            <span
                data-testid="probe"
                style={{
                    color: 'var(--control-border)',
                    background: 'var(--popover)',
                    borderColor: 'var(--accent)',
                }}
            />
        </div>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const probe = getComputedStyle(canvas.getByTestId('probe'));
        const input = canvas.getByTestId('input');
        const field = input.closest('[data-combobox-field]');
        if (!field) throw new Error('no field');
        await expect(getComputedStyle(field).boxShadow).toContain(probe.color);
        await expect(getComputedStyle(field).borderRadius).toBe('20px');
        await userEvent.click(input);
        await userEvent.keyboard('{ArrowDown}');
        const listbox = await page.findByRole('listbox');
        const content = listbox.closest('[data-combobox-content]');
        if (!content) throw new Error('no content');
        await expect(getComputedStyle(content).backgroundColor).toBe(
            probe.backgroundColor
        );
        await waitFor(() =>
            expect(
                getComputedStyle(
                    page.getByRole('option', { name: 'Acme Ltd.' })
                ).backgroundColor
            ).toBe(probe.borderTopColor)
        );
        await closeList();
    },
};
