import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, useState, type ReactElement } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { resetWarnings } from '../../lib/options';
import { Input } from '../Input';
import { Checkbox } from '../Checkbox';
import { Switch } from '../Switch';
import { Textarea } from '../Textarea';
import { FormField } from '.';

afterEach(() => {
    resetWarnings();
    vi.restoreAllMocks();
});

describe('FormField', () => {
    it('labels the control and describes it with the description', () => {
        render(
            <FormField label="Email" description="We never share it">
                <Input />
            </FormField>
        );
        const input = screen.getByRole('textbox', { name: 'Email' });
        expect(input).toHaveAccessibleDescription('We never share it');
        expect(input).not.toHaveAttribute('aria-invalid');
        expect(screen.queryByRole('alert')).toBeNull();
    });

    it('error: invalid control, description + error in aria-describedby, role=alert', () => {
        render(
            <FormField
                label="Email"
                description="Work address"
                error="Enter a valid email"
            >
                <Input />
            </FormField>
        );
        const input = screen.getByRole('textbox', { name: 'Email' });
        expect(input).toHaveAttribute('aria-invalid', 'true');
        expect(input).toHaveAccessibleDescription(
            'Work address Enter a valid email'
        );
        expect(screen.getByRole('alert')).toHaveTextContent(
            'Enter a valid email'
        );
    });

    it('announces an error once: the alert appears with the error and stays the same node', () => {
        function Field() {
            const [error, setError] = useState<string>();
            const [n, setN] = useState(0);
            return (
                <>
                    <FormField label="Name" error={error}>
                        <Input />
                    </FormField>
                    <button type="button" onClick={() => setError('Required')}>
                        validate
                    </button>
                    <button type="button" onClick={() => setN(n + 1)}>
                        rerender {n}
                    </button>
                </>
            );
        }
        render(<Field />);
        expect(screen.queryByRole('alert')).toBeNull();
        fireEvent.click(screen.getByRole('button', { name: 'validate' }));
        const alert = screen.getByRole('alert');
        fireEvent.click(screen.getByRole('button', { name: /rerender/ }));
        // A re-render keeps the same live node: nothing is re-announced.
        expect(screen.getByRole('alert')).toBe(alert);
    });

    it('required: aria-required on the control and a hidden asterisk', () => {
        render(
            <FormField label="Company" required>
                <Input />
            </FormField>
        );
        const input = screen.getByRole('textbox', { name: 'Company' });
        expect(input).toHaveAttribute('aria-required', 'true');
        // aria-required, not native required: no browser validation bubble.
        expect(input).not.toHaveAttribute('required');
    });

    it('disabled disables the control and mutes the label', () => {
        render(
            <FormField label="Company" disabled>
                <Textarea />
            </FormField>
        );
        expect(screen.getByRole('textbox', { name: 'Company' })).toBeDisabled();
        expect(screen.getByText('Company')).toHaveAttribute(
            'data-disabled',
            'true'
        );
    });

    it('labels the control when the control brings its own id (x-core call sites pass id)', () => {
        render(
            <FormField label="Email" description="Work">
                <Input id="email" />
            </FormField>
        );
        const input = screen.getByLabelText('Email');
        expect(input).toHaveAttribute('id', 'email');
        expect(input).toHaveAccessibleDescription('Work');
    });

    it('labels the control by the FormField id when the control has none', () => {
        render(
            <FormField label="Phone" id="phone">
                <Input />
            </FormField>
        );
        expect(screen.getByLabelText('Phone')).toHaveAttribute('id', 'phone');
    });

    it('a control id wins over the FormField id and the label follows it', () => {
        render(
            <FormField label="Fax" id="field-id">
                <Input id="own-id" />
            </FormField>
        );
        expect(screen.getByLabelText('Fax')).toHaveAttribute('id', 'own-id');
    });

    it('a Checkbox/Switch with its own label is named once: the FormField label becomes a caption', () => {
        render(
            <>
                <FormField label="Terms" required>
                    <Checkbox label="I accept the terms" />
                </FormField>
                <FormField label="Alerts" description="Email only">
                    <Switch label="Send alerts" />
                </FormField>
            </>
        );
        expect(
            screen.getByRole('checkbox', { name: 'I accept the terms' })
        ).toBeVisible();
        expect(screen.getByText('Terms').tagName).not.toBe('LABEL');
        expect(
            screen.getByRole('switch', { name: 'Send alerts' })
        ).toHaveAccessibleDescription('Email only');
        // Without an own label the FormField label still names it.
        render(
            <FormField label="Bare">
                <Checkbox />
            </FormField>
        );
        expect(screen.getByRole('checkbox', { name: 'Bare' })).toBeVisible();
    });

    it('uses the given id for the control and keeps the control own describedby', () => {
        render(
            <FormField label="Vat" id="vat" description="9 digits">
                <Input aria-describedby="extra" />
            </FormField>
        );
        const input = screen.getByRole('textbox', { name: 'Vat' });
        expect(input).toHaveAttribute('id', 'vat');
        expect(input.getAttribute('aria-describedby')?.split(' ')[0]).toBe(
            'extra'
        );
    });

    it('works with a react-hook-form style register() spread (ref, name, onChange, onBlur)', async () => {
        const user = userEvent.setup();
        const values: Record<string, string> = {};
        const register = (name: string) => ({
            name,
            ref: (el: HTMLInputElement | null) => {
                if (el) values[`${name}:ref`] = el.tagName;
            },
            onChange: (e: { target: { value: string } }) => {
                values[name] = e.target.value;
            },
            onBlur: vi.fn(),
        });
        render(
            <FormField label="City">
                <Input {...register('city')} />
            </FormField>
        );
        await user.type(screen.getByRole('textbox', { name: 'City' }), 'Haifa');
        expect(values).toEqual({ 'city:ref': 'INPUT', city: 'Haifa' });
        expect(screen.getByRole('textbox')).toHaveAttribute('name', 'city');
    });

    it('forwards ref, className and data-did to the wrapper', () => {
        const ref = createRef<HTMLDivElement>();
        render(
            <FormField ref={ref} label="A" className="custom" data-did="f">
                <Input />
            </FormField>
        );
        expect(ref.current).toHaveClass('custom');
        expect(ref.current).toHaveAttribute('data-did', 'f');
    });

    it('drops x-core FormControl props with a warning', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const Untyped = FormField as unknown as (
            p: Record<string, unknown>
        ) => ReactElement;
        render(
            <Untyped label="L" helperText="h" fullWidth margin="dense" sx={{}}>
                <Input />
            </Untyped>
        );
        const wrapper = screen.getByText('L').parentElement;
        expect(wrapper).not.toHaveAttribute('helpertext');
        expect(wrapper).not.toHaveAttribute('fullwidth');
        expect(warn).toHaveBeenCalledWith(
            expect.stringContaining('x-core prop "helperText"')
        );
    });
});
