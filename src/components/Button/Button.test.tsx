import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { resetWarnings } from '../../lib/options';
import { Button, buttonVariants } from '.';

describe('Button', () => {
    it('has role button and accessible name from children', () => {
        render(<Button>Save changes</Button>);
        const button = screen.getByRole('button', { name: 'Save changes' });
        expect(button.tagName).toBe('BUTTON');
        expect(button).toHaveAttribute('type', 'button');
    });

    it('is keyboard activatable with Enter and Space', async () => {
        const user = userEvent.setup();
        const onClick = vi.fn();
        render(<Button onClick={onClick}>Save changes</Button>);
        await user.tab();
        expect(screen.getByRole('button')).toHaveFocus();
        await user.keyboard('{Enter}');
        await user.keyboard(' ');
        expect(onClick).toHaveBeenCalledTimes(2);
    });

    it('disabled button is not focusable and does not fire onClick', async () => {
        const user = userEvent.setup();
        const onClick = vi.fn();
        render(
            <Button disabled onClick={onClick}>
                Save changes
            </Button>
        );
        const button = screen.getByRole('button');
        await user.tab();
        expect(button).not.toHaveFocus();
        await user.click(button);
        expect(onClick).not.toHaveBeenCalled();
        expect(button).toBeDisabled();
    });

    it('loading sets aria-busy and blocks onClick', async () => {
        const user = userEvent.setup();
        const onClick = vi.fn();
        render(
            <Button loading onClick={onClick}>
                Save changes
            </Button>
        );
        // Stays focusable and keeps its name, so focus is not lost mid-action.
        const button = screen.getByRole('button', { name: 'Save changes' });
        expect(button).toHaveAttribute('aria-busy', 'true');
        expect(button).toHaveAttribute('aria-disabled', 'true');
        expect(button).not.toBeDisabled();
        await user.tab();
        expect(button).toHaveFocus();
        await user.keyboard('{Enter}');
        await user.keyboard(' ');
        await user.click(button);
        expect(onClick).not.toHaveBeenCalled();
    });

    it('forwards ref and data-did', () => {
        const ref = createRef<HTMLButtonElement>();
        render(
            <Button ref={ref} data-did="checkout-submit">
                Pay now
            </Button>
        );
        const button = screen.getByRole('button');
        expect(ref.current).toBe(button);
        expect(button).toHaveAttribute('data-did', 'checkout-submit');
    });

    it('asChild renders the child element with button styles', () => {
        render(
            <Button asChild variant="secondary" size="lg">
                <a href="/reports">Open reports</a>
            </Button>
        );
        const link = screen.getByRole('link', { name: 'Open reports' });
        expect(screen.queryByRole('button')).toBeNull();
        expect(link).toHaveAttribute('href', '/reports');
        expect(link).not.toHaveAttribute('type');
        for (const cls of buttonVariants({
            variant: 'secondary',
            size: 'lg',
        }).split(' ')) {
            expect(link).toHaveClass(cls);
        }
    });

    it('asChild disabled maps to aria-disabled and blocks the link', () => {
        const onClick = vi.fn();
        render(
            <Button asChild disabled onClick={onClick}>
                <a href="/reports">Open reports</a>
            </Button>
        );
        const link = screen.getByRole('link', { name: 'Open reports' });
        expect(link).not.toHaveAttribute('disabled');
        expect(link).toHaveAttribute('aria-disabled', 'true');
        expect(link).toHaveAttribute('tabindex', '-1');
        // fireEvent returns false when the default action was prevented.
        expect(fireEvent.click(link)).toBe(false);
        expect(onClick).not.toHaveBeenCalled();
    });

    it('asChild loading blocks navigation', () => {
        const onClick = vi.fn();
        render(
            <Button asChild loading onClick={onClick}>
                <a href="/reports">Open reports</a>
            </Button>
        );
        const link = screen.getByRole('link');
        expect(link).toHaveAttribute('aria-busy', 'true');
        expect(fireEvent.click(link)).toBe(false);
        expect(onClick).not.toHaveBeenCalled();
    });

    it('consumer aria-disabled blocks onClick but keeps the button focusable', async () => {
        const user = userEvent.setup();
        const onClick = vi.fn();
        render(
            <Button aria-disabled="true" onClick={onClick}>
                Save changes
            </Button>
        );
        const button = screen.getByRole('button');
        await user.tab();
        expect(button).toHaveFocus();
        await user.click(button);
        expect(onClick).not.toHaveBeenCalled();
    });

    it('displayName is Button', () => {
        expect(Button.displayName).toBe('Button');
    });

    it('merges className last so consumers can override', () => {
        render(<Button className="hz:px-10">Save changes</Button>);
        const button = screen.getByRole('button');
        expect(button).toHaveClass('hz:px-10');
        expect(button.className).not.toMatch(/hz:px-4\b/);
    });

    it('defaults to primary md and respects an explicit type', () => {
        render(<Button type="submit">Submit</Button>);
        const button = screen.getByRole('button');
        expect(button).toHaveAttribute('type', 'submit');
        expect(button).toHaveAttribute('data-variant', 'primary');
        expect(button).toHaveAttribute('data-size', 'md');
    });

    it('renders startIcon before and endIcon after the label, hidden from AT', () => {
        render(
            <Button
                startIcon={<svg data-testid="start" />}
                endIcon={<svg data-testid="end" />}
            >
                Export
            </Button>
        );
        const button = screen.getByRole('button', { name: 'Export' });
        const start = screen.getByTestId('start');
        const end = screen.getByTestId('end');
        expect(start.parentElement).toHaveAttribute('aria-hidden', 'true');
        expect(end.parentElement).toHaveAttribute('aria-hidden', 'true');
        const text = button.textContent ?? '';
        expect(text).toBe('Export');
        // DOM order: start icon, label, end icon.
        expect(
            start.compareDocumentPosition(end) &
                Node.DOCUMENT_POSITION_FOLLOWING
        ).toBeTruthy();
        expect(button).not.toHaveAttribute('starticon');
    });

    describe('untyped callers (x-core ButtonV2 values)', () => {
        afterEach(() => {
            resetWarnings();
            vi.restoreAllMocks();
        });

        it.each([
            [
                'variant',
                'contained',
                'data-variant',
                'primary',
                'hz:bg-primary',
            ],
            ['variant', 'text', 'data-variant', 'primary', 'hz:bg-primary'],
            ['size', 'small', 'data-size', 'md', 'hz:px-5'],
        ])(
            '%s=%j falls back with its classes and warns once',
            (prop, value, attr, expected, cls) => {
                const warn = vi
                    .spyOn(console, 'warn')
                    .mockImplementation(() => undefined);
                const props = { [prop]: value };
                render(<Button {...props}>One</Button>);
                render(<Button {...props}>Two</Button>);
                const [button] = screen.getAllByRole('button');
                expect(button).toHaveAttribute(attr, expected);
                expect(button).toHaveClass(cls);
                expect(warn).toHaveBeenCalledOnce();
                expect(warn.mock.calls[0]?.[0]).toContain(`${prop} "${value}"`);
            }
        );

        it('drops x-core-only props instead of leaking them to the DOM, warning once each', () => {
            const warn = vi
                .spyOn(console, 'warn')
                .mockImplementation(() => undefined);
            const props = {
                color: 'error',
                textColor: '#fff',
                sx: { p: 1 },
                disableElevation: true,
                showTextUnderLine: true,
            };
            const error = vi.spyOn(console, 'error');
            render(<Button {...props}>Save</Button>);
            const button = screen.getByRole('button');
            for (const attr of ['color', 'textcolor', 'sx'])
                expect(button).not.toHaveAttribute(attr);
            expect(warn).toHaveBeenCalledTimes(5);
            expect(error).not.toHaveBeenCalled();
        });
    });
});
