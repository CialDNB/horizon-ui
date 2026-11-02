import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, useState, type ReactElement } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { resetWarnings } from '../../lib/options';
import { HorizonProvider } from '../../provider';
import { FormField } from '../FormField';
import { RadioGroup, RadioGroupItem } from '.';

afterEach(() => {
    resetWarnings();
    vi.restoreAllMocks();
});

function Plans(props: Partial<Parameters<typeof RadioGroup>[0]>) {
    return (
        <RadioGroup aria-label="Plan" defaultValue="basic" {...props}>
            <RadioGroupItem value="basic" label="Basic" />
            <RadioGroupItem value="pro" label="Pro" />
            <RadioGroupItem value="team" label="Team" disabled />
            <RadioGroupItem value="enterprise" label="Enterprise" />
        </RadioGroup>
    );
}

describe('RadioGroup', () => {
    it('is a named radiogroup of radios; the checked one is in the tab order', async () => {
        const user = userEvent.setup();
        render(<Plans />);
        expect(screen.getByRole('radiogroup', { name: 'Plan' })).toBeVisible();
        expect(screen.getAllByRole('radio')).toHaveLength(4);
        await user.tab();
        expect(screen.getByRole('radio', { name: 'Basic' })).toHaveFocus();
        expect(screen.getByRole('radio', { name: 'Basic' })).toBeChecked();
    });

    it('arrow keys move and select, skipping disabled items (roving focus)', async () => {
        const user = userEvent.setup();
        const onValueChange = vi.fn();
        render(<Plans onValueChange={onValueChange} />);
        await user.tab();
        // Held then released: Radix selects on the focus that follows an
        // arrow key press (focus moves in a timeout).
        await user.keyboard('{ArrowDown>}');
        await user.keyboard('{/ArrowDown}');
        expect(screen.getByRole('radio', { name: 'Pro' })).toHaveFocus();
        expect(onValueChange).toHaveBeenLastCalledWith('pro');
        await user.keyboard('{ArrowDown>}');
        await user.keyboard('{/ArrowDown}');
        // Team is disabled: skipped.
        expect(screen.getByRole('radio', { name: 'Enterprise' })).toHaveFocus();
        expect(screen.getByRole('radio', { name: 'Team' })).toBeDisabled();
    });

    it('in RTL ArrowLeft moves to the next item', async () => {
        const user = userEvent.setup();
        render(
            <HorizonProvider dir="rtl">
                <Plans orientation="horizontal" />
            </HorizonProvider>
        );
        await user.tab();
        await user.keyboard('{ArrowLeft>}');
        await user.keyboard('{/ArrowLeft}');
        expect(screen.getByRole('radio', { name: 'Pro' })).toHaveFocus();
    });

    it('clicking a label selects its item', async () => {
        const user = userEvent.setup();
        render(<Plans />);
        await user.click(screen.getByText('Enterprise'));
        expect(screen.getByRole('radio', { name: 'Enterprise' })).toBeChecked();
    });

    it('FormField names the group (aria-labelledby) and wires describedby, invalid, required', () => {
        render(
            <FormField
                label="Billing period"
                description="Change any time"
                error="Choose a period"
                required
            >
                <RadioGroup>
                    <RadioGroupItem value="m" label="Monthly" />
                    <RadioGroupItem value="y" label="Yearly" />
                </RadioGroup>
            </FormField>
        );
        const group = screen.getByRole('radiogroup', {
            name: 'Billing period',
        });
        expect(group).toHaveAttribute('aria-invalid', 'true');
        expect(group).toHaveAttribute('aria-required', 'true');
        expect(group).toHaveAccessibleDescription(
            'Change any time Choose a period'
        );
    });

    it('disabled group disables every item; orientation and size reach the DOM', () => {
        const ref = createRef<HTMLDivElement>();
        render(
            <Plans
                ref={ref}
                disabled
                orientation="horizontal"
                size="sm"
                data-did="plans"
            />
        );
        for (const radio of screen.getAllByRole('radio'))
            expect(radio).toBeDisabled();
        expect(ref.current).toHaveAttribute('aria-orientation', 'horizontal');
        expect(ref.current).toHaveAttribute('data-did', 'plans');
        expect(screen.getAllByRole('radio')[0]).toHaveAttribute(
            'data-size',
            'sm'
        );
    });

    it('drops x-core RadioGroup props with a warning', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const Untyped = RadioGroup as unknown as (
            p: Record<string, unknown>
        ) => ReactElement;
        render(
            <Untyped
                aria-label="Legacy"
                row
                options={[{ label: 'A', value: 'a' }]}
                errorText="x"
                onChange={() => undefined}
                sx={{}}
            >
                <RadioGroupItem value="a" label="A" />
            </Untyped>
        );
        const group = screen.getByRole('radiogroup');
        expect(group).not.toHaveAttribute('row');
        expect(group).not.toHaveAttribute('options');
        expect(warn).toHaveBeenCalledWith(
            expect.stringContaining('x-core prop "row"')
        );
    });
});

describe('RadioGroup direction follows a runtime provider change', () => {
    it('ArrowLeft moves forward after the provider flips to rtl', async () => {
        const user = userEvent.setup();
        function Flip() {
            const [rtl, setRtl] = useState(false);
            return (
                <HorizonProvider dir={rtl ? 'rtl' : 'ltr'}>
                    <button type="button" onClick={() => setRtl(true)}>
                        flip
                    </button>
                    <RadioGroup
                        aria-label="Plan"
                        orientation="horizontal"
                        defaultValue="a"
                    >
                        <RadioGroupItem value="a" label="A" />
                        <RadioGroupItem value="b" label="B" />
                        <RadioGroupItem value="c" label="C" />
                    </RadioGroup>
                </HorizonProvider>
            );
        }
        render(<Flip />);
        await user.click(screen.getByRole('button', { name: 'flip' }));
        screen.getByRole('radio', { name: 'A' }).focus();
        await user.keyboard('{ArrowLeft>}');
        await user.keyboard('{/ArrowLeft}');
        expect(screen.getByRole('radio', { name: 'B' })).toHaveFocus();
    });
});
