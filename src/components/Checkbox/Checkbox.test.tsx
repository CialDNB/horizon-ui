import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, useState, type ReactElement } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { resetWarnings } from '../../lib/options';
import { FormField } from '../FormField';
import { Checkbox, checkboxVariants } from '.';

afterEach(() => {
    resetWarnings();
    vi.restoreAllMocks();
});

describe('Checkbox', () => {
    it('is a checkbox named by its label; clicking the label toggles it', async () => {
        const user = userEvent.setup();
        const onCheckedChange = vi.fn();
        render(
            <Checkbox
                label="Email me updates"
                onCheckedChange={onCheckedChange}
            />
        );
        const box = screen.getByRole('checkbox', { name: 'Email me updates' });
        expect(box).not.toBeChecked();
        await user.click(screen.getByText('Email me updates'));
        expect(box).toBeChecked();
        expect(onCheckedChange).toHaveBeenLastCalledWith(true);
    });

    it('toggles with Space and is reachable with Tab', async () => {
        const user = userEvent.setup();
        render(<Checkbox aria-label="Select row" />);
        await user.tab();
        const box = screen.getByRole('checkbox', { name: 'Select row' });
        expect(box).toHaveFocus();
        await user.keyboard(' ');
        expect(box).toBeChecked();
        await user.keyboard(' ');
        expect(box).not.toBeChecked();
    });

    it('supports controlled indeterminate (mixed)', async () => {
        const user = userEvent.setup();
        function Parent() {
            const [checked, setChecked] = useState<boolean | 'indeterminate'>(
                'indeterminate'
            );
            return (
                <Checkbox
                    label="All"
                    checked={checked}
                    onCheckedChange={setChecked}
                />
            );
        }
        render(<Parent />);
        const box = screen.getByRole('checkbox', { name: 'All' });
        expect(box).toHaveAttribute('aria-checked', 'mixed');
        expect(
            box.querySelector('[data-checkbox-icon="indeterminate"]')
        ).not.toBeNull();
        await user.click(box);
        expect(box).toHaveAttribute('aria-checked', 'true');
    });

    it('disabled: not focusable, does not toggle, muted label', async () => {
        const user = userEvent.setup();
        render(<Checkbox label="Locked" disabled />);
        const box = screen.getByRole('checkbox', { name: 'Locked' });
        await user.tab();
        expect(box).not.toHaveFocus();
        await user.click(screen.getByText('Locked'));
        expect(box).not.toBeChecked();
        expect(screen.getByText('Locked').className).toContain(
            'hz:text-muted-foreground'
        );
    });

    it('invalid sets aria-invalid; FormField wires description, invalid and required', () => {
        render(
            <FormField
                label="Terms"
                description="Required to continue"
                error="Accept the terms"
                required
            >
                <Checkbox label="I accept the terms" />
            </FormField>
        );
        const box = screen.getByRole('checkbox', {
            name: 'Terms I accept the terms',
        });
        expect(box).toHaveAttribute('aria-invalid', 'true');
        expect(box).toHaveAttribute('aria-required', 'true');
        expect(box).toHaveAccessibleDescription(
            'Required to continue Accept the terms'
        );
    });

    it('submits name/value inside a form', async () => {
        const user = userEvent.setup();
        let data: FormData | undefined;
        render(
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    data = new FormData(e.currentTarget);
                }}
            >
                <Checkbox label="Newsletter" name="news" value="yes" />
                <button type="submit">Send</button>
            </form>
        );
        await user.click(screen.getByRole('checkbox'));
        await user.click(screen.getByRole('button', { name: 'Send' }));
        expect(data?.get('news')).toBe('yes');
    });

    it('forwards ref and data-did to the checkbox; className to the wrapper', () => {
        const ref = createRef<HTMLButtonElement>();
        render(
            <Checkbox
                ref={ref}
                aria-label="Row"
                data-did="row"
                className="custom"
                size="sm"
            />
        );
        const box = screen.getByRole('checkbox');
        expect(ref.current).toBe(box);
        expect(box).toHaveAttribute('data-did', 'row');
        expect(box.closest('[data-checkbox]')).toHaveClass('custom');
        expect(box).toHaveAttribute('data-size', 'sm');
        expect(checkboxVariants({ size: 'md' })).toContain('hz:size-11');
    });

    it('x-core size="small" falls back to md; onChange/indeterminate are dropped with a warning', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const Untyped = Checkbox as unknown as (
            p: Record<string, unknown>
        ) => ReactElement;
        render(
            <Untyped
                aria-label="Old"
                size="small"
                onChange={() => undefined}
                indeterminate
                color="primary"
                sx={{}}
                edge="start"
                inputProps={{}}
            />
        );
        const box = screen.getByRole('checkbox');
        expect(box).toHaveAttribute('data-size', 'md');
        expect(box).not.toHaveAttribute('indeterminate');
        expect(box).not.toHaveAttribute('color');
        expect(box).not.toHaveAttribute('edge');
        expect(warn).toHaveBeenCalledWith(
            expect.stringContaining('x-core prop "onChange"')
        );
        expect(warn).toHaveBeenCalledWith(
            expect.stringContaining('unknown size "small"')
        );
    });
});
