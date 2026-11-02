import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState, type FormEvent } from 'react';
import { expect, userEvent, within } from 'storybook/test';
import { HorizonProvider } from '../../provider';
import { ResponsiveSpec } from '../../stories/ResponsiveSpec';
import { storyLayout as layout, viewportStory } from '../../stories/viewports';
import { Button } from '../Button';
import { Input } from '../Input';
import { Textarea } from '../Textarea';
import { FormField } from '.';

const column = { display: 'grid', gap: 16, maxInlineSize: 400 } as const;

const meta = {
    title: 'Components/FormField',
    component: FormField,
    parameters: {
        layout: 'padded',
        docs: {
            description: {
                component: [
                    'Label + control + description + error, wired for you: `htmlFor`/`id`, `aria-describedby` (description, then error), `aria-invalid`, `aria-required`, `disabled`. The error is mounted only while present with `role="alert"`, so it is announced once when it appears. Replaces the `label`, `helperText` and `error` props of x-core TextField/TextInput/TextArea/Select and MUI FormControl/FormHelperText. Works with Input, Textarea, Select, Checkbox, Switch and RadioGroup (named through `aria-labelledby`).',
                    '',
                    '**react-hook-form** (no dependency needed): `register` spreads onto the control (Input/Textarea forward `ref`, `name`, `onChange`, `onBlur` to the native element):',
                    '```tsx',
                    '<FormField label="Email" error={errors.email?.message} required>\n    <Input type="email" {...register(\'email\', { required: \'Enter an email\' })} />\n</FormField>',
                    '```',
                    'For Select, Checkbox, Switch and RadioGroup use `Controller` and map `field.value`/`field.onChange` to `value`/`onValueChange` (or `checked`/`onCheckedChange`). Formik: pass `touched.x && errors.x` as `error` and `getFieldProps` to the control.',
                ].join('\n'),
            },
        },
    },
    args: {
        label: 'Email',
        description: 'We send the report to this address.',
        children: <Input type="email" placeholder="name@company.com" />,
    },
    argTypes: { children: { control: false } },
    render: (args) => (
        <div style={column}>
            <FormField {...args} />
        </div>
    ),
} satisfies Meta<typeof FormField>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Controls playground. */
export const Playground: Story = {};

/** Description, error, required and disabled. */
export const States: Story = {
    render: () => (
        <div style={column}>
            <FormField label="Company" description="As registered" required>
                <Input />
            </FormField>
            <FormField
                label="Email"
                description="Work address"
                error="Enter a valid email address"
            >
                <Input type="email" defaultValue="acme@" />
            </FormField>
            <FormField label="Notes" disabled>
                <Textarea rows={2} defaultValue="Locked after approval" />
            </FormField>
        </div>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(
            canvas.getByRole('textbox', { name: /Email/ })
        ).toHaveAccessibleDescription(
            'Work address Enter a valid email address'
        );
    },
};

function SubmitDemo() {
    const [error, setError] = useState<string>();
    const onSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const value = new FormData(event.currentTarget).get('duns');
        setError(
            /^\d{9}$/.test(String(value))
                ? undefined
                : 'Enter the 9-digit DUNS number'
        );
    };
    return (
        <form onSubmit={onSubmit} noValidate style={column}>
            <FormField label="DUNS number" required error={error}>
                <Input name="duns" inputMode="numeric" />
            </FormField>
            <div>
                <Button type="submit">Check</Button>
            </div>
        </form>
    );
}

/** Validation on submit: the error appears once, linked and announced. */
export const ValidationOnSubmit: Story = {
    render: () => <SubmitDemo />,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.queryByRole('alert')).toBeNull();
        await userEvent.type(canvas.getByRole('textbox'), '12');
        await userEvent.click(canvas.getByRole('button', { name: 'Check' }));
        const alert = await canvas.findByRole('alert');
        await expect(alert).toHaveTextContent('Enter the 9-digit DUNS number');
        await expect(canvas.getByRole('textbox')).toHaveAttribute(
            'aria-invalid',
            'true'
        );
        await userEvent.type(canvas.getByRole('textbox'), '3456789');
        await userEvent.click(canvas.getByRole('button', { name: 'Check' }));
        await expect(canvas.queryByRole('alert')).toBeNull();
    },
};

/** Long label, description and error wrap at 280px. */
export const LongText: Story = {
    render: () => (
        <div style={{ ...column, maxInlineSize: 280 }}>
            <FormField
                label="Name of the legal representative authorised to sign"
                description="Must match the name in the commercial register exactly, including middle names."
                error="This name does not match the commercial register; check the spelling."
                required
            >
                <Input />
            </FormField>
        </div>
    ),
};

/** Right-to-left. */
export const RTL: Story = {
    globals: { direction: 'rtl' },
    render: () => (
        <div style={column}>
            <FormField
                label="אימייל"
                description="כתובת עבודה"
                error="כתובת לא תקינה"
                required
            >
                <Input type="email" />
            </FormField>
        </div>
    ),
};

/** All three brands: description and error contrast per brand. */
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
                        <FormField
                            label={`${brand} email`}
                            description="Work address"
                            error="Enter a valid email"
                            required
                        >
                            <Input type="email" />
                        </FormField>
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
            caption="FormField responsive specification"
            spec={{
                mobile: {
                    size: 'Label 14/20 semibold; description and error caption (12px); the control follows its own spec (44px at mobile).',
                    density:
                        '4px gap between label, control, description and error.',
                    layout: 'Stacked, full width; text wraps, never overflows 320px.',
                    contentVisibility:
                        'Description always shown; error shown only while invalid, with an icon (not colour alone).',
                    interaction:
                        'Tapping the label focuses the control; the error is announced once when it appears.',
                },
                tablet: {
                    size: 'As mobile (the control densifies with a fine pointer).',
                    density: 'As mobile.',
                    layout: 'As mobile.',
                    contentVisibility: 'As mobile.',
                    interaction: 'As mobile, with pointer and keyboard.',
                    note: 'The field itself does not change: side-by-side label layouts belong to the form layout, not to FormField.',
                },
                laptop: {
                    size: 'As tablet.',
                    density: 'As tablet.',
                    layout: 'As tablet.',
                    contentVisibility: 'As tablet.',
                    interaction: 'As tablet.',
                    note: 'Identical (see tablet).',
                },
                desktop: {
                    size: 'As tablet.',
                    density: 'As tablet.',
                    layout: 'As tablet.',
                    contentVisibility: 'As tablet.',
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
            <FormField
                data-testid="field"
                label="Name of the legal representative authorised to sign"
                description="Must match the commercial register."
                error="Does not match the commercial register."
            >
                <Input />
            </FormField>
        </div>
    );
}

async function assertField(canvasElement: HTMLElement) {
    const field = within(canvasElement).getByTestId('field');
    await expect(getComputedStyle(field).rowGap).toBe('4px');
    await expect(field.getBoundingClientRect().width).toBe(320);
    await expect(field.scrollWidth).toBeLessThanOrEqual(320);
    const [label, control, description, error] = Array.from(field.children);
    await expect(label?.tagName).toBe('LABEL');
    await expect(getComputedStyle(description as Element).fontSize).toBe(
        '12px'
    );
    await expect(error?.getAttribute('role')).toBe('alert');
    // Stacked: each part starts below the previous one.
    const tops = [label, control, description, error].map(
        (el) => el?.getBoundingClientRect().top ?? 0
    );
    await expect([...tops].sort((a, b) => a - b)).toEqual(tops);
}

export const SpecMobile: Story = {
    ...viewportStory('mobile', () => <Probe />, assertField),
    name: 'stacks with 4px gaps and wraps at mobile',
};
export const SpecTablet: Story = {
    ...viewportStory('tablet', () => <Probe />, assertField),
    name: 'stacks with 4px gaps and wraps at tablet',
};
export const SpecLaptop: Story = {
    ...viewportStory('laptop', () => <Probe />, assertField),
    name: 'stacks with 4px gaps and wraps at laptop',
};
export const SpecDesktop: Story = {
    ...viewportStory('desktop', () => <Probe />, assertField),
    name: 'stacks with 4px gaps and wraps at desktop',
};

/** Description and error colours come from the tokens. */
export const ComputedStyles: Story = {
    name: 'applies Horizon tokens to description and error',
    tags: ['!autodocs', '!dev'],
    render: () => (
        <div style={column}>
            <FormField label="A" description="Help" error="Wrong">
                <Input />
            </FormField>
            <span
                data-testid="probe"
                style={{
                    color: 'var(--muted-foreground)',
                    background: 'var(--destructive-strong)',
                }}
            />
        </div>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const probe = getComputedStyle(canvas.getByTestId('probe'));
        await expect(getComputedStyle(canvas.getByText('Help')).color).toBe(
            probe.color
        );
        await expect(getComputedStyle(canvas.getByRole('alert')).color).toBe(
            probe.backgroundColor
        );
        await expect(
            getComputedStyle(canvas.getByText('Help')).marginBottom
        ).toBe('0px');
    },
};
