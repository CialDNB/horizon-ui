import { render, screen } from '@testing-library/react';
import { createRef, type ReactElement } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { resetWarnings } from '../../lib/options';
import { Label, labelVariants } from '.';

afterEach(() => {
    resetWarnings();
    vi.restoreAllMocks();
});

describe('Label', () => {
    it('is a native label associated with its control by htmlFor', () => {
        render(
            <>
                <Label htmlFor="email">Email</Label>
                <input id="email" />
            </>
        );
        expect(screen.getByLabelText('Email')).toHaveAttribute('id', 'email');
        expect(screen.getByText('Email').tagName).toBe('LABEL');
    });

    it('marks required with a hidden asterisk (the control carries aria-required)', () => {
        render(
            <>
                <Label htmlFor="name" required>
                    Name
                </Label>
                <input id="name" aria-required="true" />
            </>
        );
        // The name is "Name", not "Name *": the asterisk is decorative.
        expect(screen.getByRole('textbox', { name: 'Name' })).toBeRequired();
        const star = screen.getByText('*');
        expect(star).toHaveAttribute('aria-hidden', 'true');
        expect(screen.getByText('Name', { selector: 'label' })).toHaveAttribute(
            'data-required',
            'true'
        );
    });

    it('styles disabled and exposes data-disabled', () => {
        render(<Label disabled>Off</Label>);
        const label = screen.getByText('Off');
        expect(label).toHaveAttribute('data-disabled', 'true');
        expect(label.className).toContain('hz:text-muted-foreground');
    });

    it('sets display, margin, colour and type explicitly (host label rules)', () => {
        const classes = labelVariants().split(' ');
        for (const c of [
            'hz:inline-flex',
            'hz:m-0',
            'hz:text-label-md',
            'hz:text-foreground',
        ])
            expect(classes).toContain(c);
    });

    it('forwards ref, className and data-did', () => {
        const ref = createRef<HTMLLabelElement>();
        render(
            <Label ref={ref} className="custom" data-did="lbl">
                Text
            </Label>
        );
        expect(ref.current).toBe(screen.getByText('Text'));
        expect(ref.current).toHaveClass('custom');
        expect(ref.current).toHaveAttribute('data-did', 'lbl');
    });

    it('drops x-core FormLabel props with a warning', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const Untyped = Label as unknown as (
            p: Record<string, unknown>
        ) => ReactElement;
        render(
            <Untyped sx={{ p: 1 }} color="primary" focused error>
                Legacy
            </Untyped>
        );
        const label = screen.getByText('Legacy');
        expect(label).not.toHaveAttribute('sx');
        expect(label).not.toHaveAttribute('color');
        expect(label).not.toHaveAttribute('focused');
        expect(warn).toHaveBeenCalled();
    });
});
