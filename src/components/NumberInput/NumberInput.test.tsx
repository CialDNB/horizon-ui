import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { resetWarnings } from '../../lib/options';
import { FormField } from '../FormField';
import { NumberInput, type NumberInputProps } from '.';

afterEach(() => {
    resetWarnings();
    vi.restoreAllMocks();
});

const spin = () => screen.getByRole('spinbutton');

function Controlled(props: Partial<NumberInputProps>) {
    const [value, setValue] = useState<number | null>(props.value ?? 5);
    return (
        <>
            <NumberInput
                aria-label="Rows"
                {...props}
                value={value}
                onValueChange={(v) => {
                    setValue(v);
                    props.onValueChange?.(v);
                }}
            />
            <output data-testid="value">{String(value)}</output>
        </>
    );
}

describe('NumberInput', () => {
    it('is a spinbutton with value, min and max', () => {
        render(
            <NumberInput aria-label="Rows" defaultValue={5} min={0} max={10} />
        );
        expect(spin()).toHaveAttribute('aria-valuenow', '5');
        expect(spin()).toHaveAttribute('aria-valuemin', '0');
        expect(spin()).toHaveAttribute('aria-valuemax', '10');
        expect(spin()).toHaveValue('5');
        expect(spin()).toHaveAttribute('inputmode', 'decimal');
    });

    it('arrows step, Page Up/Down step by 10, Home/End jump to the bounds', async () => {
        const user = userEvent.setup();
        const onValueChange = vi.fn();
        render(<Controlled min={0} max={100} onValueChange={onValueChange} />);
        spin().focus();
        await user.keyboard('{ArrowUp}');
        expect(onValueChange).toHaveBeenLastCalledWith(6);
        await user.keyboard('{ArrowDown}{ArrowDown}');
        expect(onValueChange).toHaveBeenLastCalledWith(4);
        await user.keyboard('{PageUp}');
        expect(onValueChange).toHaveBeenLastCalledWith(14);
        await user.keyboard('{End}');
        expect(onValueChange).toHaveBeenLastCalledWith(100);
        await user.keyboard('{ArrowUp}');
        expect(onValueChange).toHaveBeenLastCalledWith(100);
        await user.keyboard('{Home}');
        expect(onValueChange).toHaveBeenLastCalledWith(0);
        expect(spin()).toHaveAttribute('aria-valuenow', '0');
    });

    it('stepper buttons step, stay out of the tab order and disable at the bounds', async () => {
        const user = userEvent.setup();
        render(<Controlled min={4} max={6} />);
        const up = screen.getByRole('button', { name: 'Increase' });
        const down = screen.getByRole('button', { name: 'Decrease' });
        expect(up).toHaveAttribute('tabindex', '-1');
        expect(up).toHaveAttribute('aria-controls', spin().id);
        await user.click(up);
        expect(screen.getByTestId('value')).toHaveTextContent('6');
        expect(up).toBeDisabled();
        await user.click(down);
        await user.click(down);
        expect(screen.getByTestId('value')).toHaveTextContent('4');
        expect(down).toBeDisabled();
        await user.tab();
        expect(spin()).toHaveFocus();
        await user.tab();
        expect(document.body).toHaveFocus();
    });

    it('typing keeps digits, one point and a leading minus; reports in-range numbers only', async () => {
        const user = userEvent.setup();
        const onValueChange = vi.fn();
        render(
            <NumberInput
                aria-label="N"
                max={50}
                onValueChange={onValueChange}
            />
        );
        await user.type(spin(), '-1a2.3.4');
        expect(spin()).toHaveValue('-12.34');
        expect(onValueChange).toHaveBeenLastCalledWith(-12.34);
        await user.clear(spin());
        expect(onValueChange).toHaveBeenLastCalledWith(null);
        await user.type(spin(), '99');
        expect(onValueChange).not.toHaveBeenCalledWith(99);
    });

    it('min >= 0 refuses a minus sign; blur clamps out-of-range text', async () => {
        const user = userEvent.setup();
        const onValueChange = vi.fn();
        render(
            <NumberInput
                aria-label="N"
                min={1}
                max={10}
                onValueChange={onValueChange}
            />
        );
        await user.type(spin(), '-25');
        expect(spin()).toHaveValue('25');
        await user.tab();
        expect(spin()).toHaveValue('10');
        expect(onValueChange).toHaveBeenLastCalledWith(10);
    });

    it('decimalPlaces and step: fixed decimals after stepping and on blur', async () => {
        const user = userEvent.setup();
        render(<Controlled value={1} step={0.1} decimalPlaces={2} />);
        spin().focus();
        await user.keyboard('{ArrowUp}{ArrowUp}{ArrowUp}');
        expect(spin()).toHaveValue('1.30');
        expect(screen.getByTestId('value')).toHaveTextContent('1.3');
    });

    it('thousandSeparator groups on display, not while typing', async () => {
        const user = userEvent.setup();
        const onValueChange = vi.fn();
        render(
            <NumberInput
                aria-label="N"
                thousandSeparator
                defaultValue={1234567.5}
                onValueChange={onValueChange}
            />
        );
        expect(spin()).toHaveValue('1,234,567.5');
        await user.clear(spin());
        await user.type(spin(), '2500');
        expect(onValueChange).toHaveBeenLastCalledWith(2500);
        await user.tab();
        expect(spin()).toHaveValue('2,500');
    });

    it('follows a controlled value set from outside', () => {
        const { rerender } = render(<NumberInput aria-label="N" value={3} />);
        expect(spin()).toHaveValue('3');
        rerender(<NumberInput aria-label="N" value={8} />);
        expect(spin()).toHaveValue('8');
        rerender(<NumberInput aria-label="N" value={null} />);
        expect(spin()).toHaveValue('');
    });

    it('disabled and readOnly do not step', async () => {
        const user = userEvent.setup();
        const onValueChange = vi.fn();
        render(
            <NumberInput
                aria-label="N"
                defaultValue={2}
                readOnly
                onValueChange={onValueChange}
            />
        );
        spin().focus();
        await user.keyboard('{ArrowUp}');
        expect(onValueChange).not.toHaveBeenCalled();
        expect(screen.getByRole('button', { name: 'Increase' })).toBeDisabled();
    });

    it('inside a FormField: label and the steppers control the same id', () => {
        render(
            <FormField label="Rows to add" description="Up to 50">
                <NumberInput min={0} max={50} defaultValue={1} />
            </FormField>
        );
        const input = screen.getByRole('spinbutton', { name: 'Rows to add' });
        expect(input).toHaveAccessibleDescription('Up to 50');
        expect(
            screen.getByRole('button', { name: 'Increase' })
        ).toHaveAttribute('aria-controls', input.id);
    });

    it('forwards ref and data-did; hides steppers on request', () => {
        const ref = createRef<HTMLInputElement>();
        render(
            <NumberInput
                aria-label="N"
                ref={ref}
                data-did="n"
                showSteppers={false}
            />
        );
        expect(ref.current).toBe(spin());
        expect(spin()).toHaveAttribute('data-did', 'n');
        expect(screen.queryByRole('button')).toBeNull();
    });

    it('drops x-core props with a warning', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const legacy = { showArrows: true, isLoading: false, append: 'text' };
        render(<NumberInput aria-label="N" {...(legacy as object)} />);
        const attrs = [...spin().attributes].map((a) => a.name);
        expect(attrs).not.toContain('showarrows');
        expect(warn).toHaveBeenCalledWith(
            expect.stringContaining('showArrows')
        );
    });
});
