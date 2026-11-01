import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
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
});
