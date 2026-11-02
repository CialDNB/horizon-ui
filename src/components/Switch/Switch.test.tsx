import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, type ReactElement } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { resetWarnings } from '../../lib/options';
import { FormField } from '../FormField';
import { Switch } from '.';

afterEach(() => {
    resetWarnings();
    vi.restoreAllMocks();
});

describe('Switch', () => {
    it('is role=switch named by its label; label click and Space toggle', async () => {
        const user = userEvent.setup();
        const onCheckedChange = vi.fn();
        render(<Switch label="Auto-renew" onCheckedChange={onCheckedChange} />);
        const sw = screen.getByRole('switch', { name: 'Auto-renew' });
        expect(sw).not.toBeChecked();
        await user.click(screen.getByText('Auto-renew'));
        expect(sw).toBeChecked();
        expect(onCheckedChange).toHaveBeenLastCalledWith(true);
        sw.focus();
        await user.keyboard(' ');
        expect(sw).not.toBeChecked();
    });

    it('defaultChecked and disabled', async () => {
        const user = userEvent.setup();
        render(<Switch label="Locked" defaultChecked disabled />);
        const sw = screen.getByRole('switch', { name: 'Locked' });
        expect(sw).toBeChecked();
        await user.click(sw);
        expect(sw).toBeChecked();
        expect(sw).toBeDisabled();
        expect(screen.getByText('Locked').className).toContain(
            'hz:text-muted-foreground'
        );
    });

    it('the thumb moves by logical direction (rtl classes)', () => {
        render(<Switch aria-label="Dark" />);
        const thumb = screen
            .getByRole('switch')
            .querySelector('[data-switch-thumb]');
        expect(thumb?.className).toContain(
            'hz:data-[state=checked]:translate-x-4.5'
        );
        expect(thumb?.className).toContain(
            'hz:rtl:data-[state=checked]:-translate-x-4.5'
        );
    });

    it('FormField wires description, invalid and required', () => {
        render(
            <FormField label="Alerts" description="Email only" error="Required">
                <Switch />
            </FormField>
        );
        const sw = screen.getByRole('switch', { name: 'Alerts' });
        expect(sw).toHaveAttribute('aria-invalid', 'true');
        expect(sw).toHaveAccessibleDescription('Email only Required');
    });

    it('forwards ref and data-did to the switch; className to the wrapper', () => {
        const ref = createRef<HTMLButtonElement>();
        render(
            <Switch ref={ref} aria-label="S" data-did="s" className="custom" />
        );
        const sw = screen.getByRole('switch');
        expect(ref.current).toBe(sw);
        expect(sw).toHaveAttribute('data-did', 's');
        expect(sw.closest('[data-switch]')).toHaveClass('custom');
    });

    it('drops x-core SwitchV2 (MUI) props with a warning', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const Untyped = Switch as unknown as (
            p: Record<string, unknown>
        ) => ReactElement;
        render(
            <Untyped
                aria-label="Old"
                onChange={() => undefined}
                color="primary"
                size="small"
                sx={{}}
                edge="end"
            />
        );
        const sw = screen.getByRole('switch');
        for (const attr of ['color', 'size', 'sx', 'edge'])
            expect(sw).not.toHaveAttribute(attr);
        expect(warn).toHaveBeenCalledWith(
            expect.stringContaining('x-core prop "onChange"')
        );
    });
});
