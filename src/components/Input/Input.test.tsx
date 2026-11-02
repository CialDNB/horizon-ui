import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, useState, type ReactElement } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { resetWarnings } from '../../lib/options';
import { Input, inputVariants } from '.';

afterEach(() => {
    resetWarnings();
    vi.restoreAllMocks();
});

const field = (input: HTMLElement) => input.closest('[data-input-field]');

describe('Input', () => {
    it('is a native text input named by aria-label, md by default', () => {
        render(<Input aria-label="Company" />);
        const input = screen.getByRole('textbox', { name: 'Company' });
        expect(input.tagName).toBe('INPUT');
        expect(field(input)).toHaveAttribute('data-size', 'md');
        expect(input).not.toHaveAttribute('aria-invalid');
    });

    it('accepts native types (email, number, search, password)', () => {
        render(
            <>
                <Input type="email" aria-label="Email" />
                <Input type="number" aria-label="Amount" />
                <Input type="search" aria-label="Search" />
                <Input type="password" aria-label="Password" />
            </>
        );
        expect(screen.getByRole('textbox', { name: 'Email' })).toHaveAttribute(
            'type',
            'email'
        );
        expect(
            screen.getByRole('spinbutton', { name: 'Amount' })
        ).toBeVisible();
        expect(screen.getByRole('searchbox', { name: 'Search' })).toBeVisible();
        expect(screen.getByLabelText('Password')).toHaveAttribute(
            'type',
            'password'
        );
    });

    it('invalid sets aria-invalid, the invalid look and a hidden icon', () => {
        render(<Input aria-label="Email" invalid />);
        const input = screen.getByRole('textbox');
        expect(input).toHaveAttribute('aria-invalid', 'true');
        expect(field(input)).toHaveAttribute('data-invalid', 'true');
        expect(field(input)?.className).toContain('hz:ring-destructive');
        const icon = field(input)?.querySelector('[data-input-invalid-icon]');
        expect(icon).toHaveAttribute('aria-hidden', 'true');
    });

    it('passes aria-describedby, required, readOnly and placeholder to the input', () => {
        render(
            <Input
                aria-label="Name"
                aria-describedby="hint"
                required
                readOnly
                placeholder="Jane Doe"
            />
        );
        const input = screen.getByRole('textbox');
        expect(input).toHaveAttribute('aria-describedby', 'hint');
        expect(input).toBeRequired();
        expect(input).toHaveAttribute('readonly');
        expect(input).toHaveAttribute('placeholder', 'Jane Doe');
        expect(field(input)).toHaveAttribute('data-readonly', 'true');
    });

    it('disabled: not focusable, muted field', async () => {
        const user = userEvent.setup();
        render(<Input aria-label="Name" disabled />);
        const input = screen.getByRole('textbox');
        await user.tab();
        expect(input).not.toHaveFocus();
        expect(input).toBeDisabled();
        expect(field(input)?.className).toContain('hz:bg-muted');
    });

    it('renders start and end adornments around the input', () => {
        render(
            <Input
                aria-label="Price"
                startAdornment={<span data-testid="start">$</span>}
                endAdornment={<span data-testid="end">USD</span>}
            />
        );
        const input = screen.getByRole('textbox');
        const box = field(input);
        const children = Array.from(box?.children ?? []);
        const order = children.map((c) =>
            c.contains(screen.getByTestId('start'))
                ? 'start'
                : c === input
                  ? 'input'
                  : c.contains(screen.getByTestId('end'))
                    ? 'end'
                    : 'other'
        );
        expect(order).toEqual(['start', 'input', 'end']);
    });

    it('uncontrolled clearable: the clear button appears with text, clears and refocuses', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        const onClear = vi.fn();
        render(
            <Input
                aria-label="Search"
                clearable
                onChange={onChange}
                onClear={onClear}
            />
        );
        expect(screen.queryByRole('button', { name: 'Clear' })).toBeNull();
        const input = screen.getByRole('textbox');
        await user.type(input, 'acme');
        const clear = screen.getByRole('button', { name: 'Clear' });
        expect(clear).toHaveAttribute('type', 'button');
        await user.click(clear);
        expect(input).toHaveValue('');
        expect(input).toHaveFocus();
        expect(onClear).toHaveBeenCalledOnce();
        expect(onChange).toHaveBeenLastCalledWith(
            expect.objectContaining({ target: input })
        );
        expect(screen.queryByRole('button', { name: 'Clear' })).toBeNull();
    });

    it('controlled clearable: onChange receives the empty value', async () => {
        const user = userEvent.setup();
        function Controlled() {
            const [value, setValue] = useState('acme');
            return (
                <Input
                    aria-label="Search"
                    clearable
                    clearLabel="Clear search"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                />
            );
        }
        render(<Controlled />);
        await user.click(screen.getByRole('button', { name: 'Clear search' }));
        expect(screen.getByRole('textbox')).toHaveValue('');
        expect(
            screen.queryByRole('button', { name: 'Clear search' })
        ).toBeNull();
    });

    it('does not offer clearing when disabled or read-only', () => {
        render(
            <>
                <Input aria-label="A" clearable defaultValue="x" disabled />
                <Input aria-label="B" clearable defaultValue="x" readOnly />
            </>
        );
        expect(screen.queryByRole('button')).toBeNull();
    });

    it('loading sets aria-busy and shows a hidden spinner', () => {
        render(<Input aria-label="Company" loading />);
        const input = screen.getByRole('textbox');
        expect(input).toHaveAttribute('aria-busy', 'true');
        const spinner = field(input)?.querySelector('[data-input-loading]');
        expect(spinner).toHaveAttribute('aria-hidden', 'true');
    });

    it('forwards ref and data-did to the input; className to the field', () => {
        const ref = createRef<HTMLInputElement>();
        render(
            <Input
                ref={ref}
                aria-label="Name"
                data-did="name"
                className="custom"
            />
        );
        const input = screen.getByRole('textbox');
        expect(ref.current).toBe(input);
        expect(input).toHaveAttribute('data-did', 'name');
        expect(field(input)).toHaveClass('custom');
    });

    it('maps size to data-size and classes', () => {
        render(<Input aria-label="S" size="sm" />);
        expect(field(screen.getByRole('textbox'))).toHaveAttribute(
            'data-size',
            'sm'
        );
        expect(inputVariants({ size: 'lg' })).toContain('hz:h-12');
    });

    it('falls back to md with a warning for x-core size names', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const Untyped = Input as unknown as (
            p: Record<string, unknown>
        ) => ReactElement;
        render(<Untyped aria-label="Old" size="small" />);
        expect(field(screen.getByRole('textbox'))).toHaveAttribute(
            'data-size',
            'md'
        );
        expect(warn).toHaveBeenCalledWith(
            expect.stringContaining('unknown size "small"')
        );
    });

    it('drops x-core TextField/TextInput props with a warning', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const Untyped = Input as unknown as (
            p: Record<string, unknown>
        ) => ReactElement;
        render(
            <Untyped
                aria-label="Legacy"
                label="Name"
                helperText="Help"
                error
                fullWidth
                InputProps={{ endAdornment: 'x' }}
                inputProps={{ maxLength: 3 }}
                sx={{ p: 1 }}
                variant="outlined"
                isLoading
            />
        );
        const input = screen.getByRole('textbox');
        for (const attr of [
            'label',
            'helpertext',
            'error',
            'fullwidth',
            'inputprops',
            'sx',
            'variant',
            'isloading',
        ])
            expect(input).not.toHaveAttribute(attr);
        expect(warn).toHaveBeenCalledWith(
            expect.stringContaining('x-core prop "helperText"')
        );
    });
});

describe('Input clear button follows DOM value changes', () => {
    it('hides the clear button after form.reset() empties an uncontrolled input', async () => {
        const user = userEvent.setup();
        render(
            <form data-testid="form">
                <Input aria-label="Search" clearable name="q" />
            </form>
        );
        await user.type(screen.getByRole('textbox'), 'acme');
        expect(screen.getByRole('button', { name: 'Clear' })).toBeVisible();
        const form = screen.getByTestId('form') as HTMLFormElement;
        await act(async () => {
            form.reset();
            await new Promise((r) => setTimeout(r, 0));
        });
        expect(screen.getByRole('textbox')).toHaveValue('');
        expect(screen.queryByRole('button', { name: 'Clear' })).toBeNull();
    });

    it('re-reads a value written to the DOM (react-hook-form setValue) on the next render', () => {
        const { rerender } = render(
            <Input aria-label="Search" clearable data-n="1" />
        );
        const input = screen.getByRole<HTMLInputElement>('textbox');
        input.value = 'set by setValue';
        rerender(<Input aria-label="Search" clearable data-n="2" />);
        expect(screen.getByRole('button', { name: 'Clear' })).toBeVisible();
    });
});
