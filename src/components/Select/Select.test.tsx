import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, useState, type ReactElement } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { resetWarnings } from '../../lib/options';
import { HorizonProvider } from '../../provider';
import { resetFallbackPortalRoot } from '../../provider/portal-context';
import { FormField } from '../FormField';
import { Select, SelectGroup, SelectItem, SelectSeparator } from '.';

afterEach(() => {
    resetWarnings();
    vi.restoreAllMocks();
});

function Countries(props: Partial<Parameters<typeof Select>[0]>) {
    return (
        <HorizonProvider>
            <Select
                aria-label="Country"
                placeholder="Choose a country"
                {...props}
            >
                <SelectGroup label="Europe">
                    <SelectItem value="fr">France</SelectItem>
                    <SelectItem value="de" disabled>
                        Germany
                    </SelectItem>
                </SelectGroup>
                <SelectSeparator />
                <SelectGroup label="Asia">
                    <SelectItem value="il">Israel</SelectItem>
                    <SelectItem value="jp">Japan</SelectItem>
                </SelectGroup>
            </Select>
        </HorizonProvider>
    );
}

describe('Select', () => {
    it('is a combobox showing the placeholder; opens a listbox with grouped options', async () => {
        const user = userEvent.setup();
        render(<Countries />);
        const trigger = screen.getByRole('combobox', { name: 'Country' });
        expect(trigger).toHaveTextContent('Choose a country');
        expect(trigger).toHaveAttribute('data-placeholder');
        await user.click(trigger);
        const listbox = await screen.findByRole('listbox');
        expect(screen.getAllByRole('option')).toHaveLength(4);
        expect(screen.getByRole('group', { name: 'Europe' })).toBeVisible();
        expect(screen.getByRole('option', { name: 'Germany' })).toHaveAttribute(
            'aria-disabled',
            'true'
        );
        // Portalled into the provider's .hz-root, above the MUI modal layer.
        expect(listbox.closest('.hz-root')).not.toBeNull();
        expect(listbox.closest('[data-select-content]')?.className).toContain(
            'hz:z-dropdown'
        );
    });

    it('selects with the pointer and calls onValueChange', async () => {
        const user = userEvent.setup();
        const onValueChange = vi.fn();
        render(<Countries onValueChange={onValueChange} />);
        await user.click(screen.getByRole('combobox'));
        await user.click(await screen.findByRole('option', { name: 'Israel' }));
        expect(onValueChange).toHaveBeenCalledWith('il');
        expect(screen.getByRole('combobox')).toHaveTextContent('Israel');
        expect(screen.queryByRole('listbox')).toBeNull();
    });

    it('keyboard: Enter opens, arrows skip disabled, Enter selects, focus returns', async () => {
        const user = userEvent.setup();
        render(<Countries defaultValue="fr" />);
        const trigger = screen.getByRole('combobox');
        trigger.focus();
        await user.keyboard('{Enter}');
        await screen.findByRole('listbox');
        await waitFor(() =>
            expect(screen.getByRole('option', { name: 'France' })).toHaveFocus()
        );
        await user.keyboard('{ArrowDown}');
        expect(screen.getByRole('option', { name: 'Israel' })).toHaveFocus();
        await user.keyboard('{Enter}');
        expect(trigger).toHaveTextContent('Israel');
        await waitFor(() => expect(trigger).toHaveFocus());
    });

    it('typeahead on the closed trigger selects the matching option', async () => {
        const user = userEvent.setup();
        render(<Countries />);
        screen.getByRole('combobox').focus();
        await user.keyboard('j');
        expect(screen.getByRole('combobox')).toHaveTextContent('Japan');
    });

    it('clearable: a separate clear button resets to the placeholder', async () => {
        const user = userEvent.setup();
        function Controlled() {
            const [value, setValue] = useState('il');
            return (
                <HorizonProvider>
                    <Select
                        aria-label="Country"
                        placeholder="Any country"
                        clearable
                        value={value}
                        onValueChange={setValue}
                    >
                        <SelectItem value="il">Israel</SelectItem>
                    </Select>
                </HorizonProvider>
            );
        }
        render(<Controlled />);
        await user.click(screen.getByRole('button', { name: 'Clear' }));
        expect(screen.getByRole('combobox')).toHaveTextContent('Any country');
        expect(screen.queryByRole('button', { name: 'Clear' })).toBeNull();
        expect(screen.getByRole('combobox')).toHaveFocus();
    });

    it('uncontrolled clearable clears too', async () => {
        const user = userEvent.setup();
        render(
            <Countries defaultValue="jp" clearable clearLabel="Clear country" />
        );
        await user.click(screen.getByRole('button', { name: 'Clear country' }));
        expect(screen.getByRole('combobox')).toHaveTextContent(
            'Choose a country'
        );
    });

    it('shows the empty message when there are no options', async () => {
        const user = userEvent.setup();
        render(
            <HorizonProvider>
                <Select aria-label="Owner" emptyMessage="No owners yet" />
            </HorizonProvider>
        );
        await user.click(screen.getByRole('combobox'));
        expect(await screen.findByText('No owners yet')).toBeVisible();
    });

    it('FormField names it and wires describedby, invalid and required', () => {
        render(
            <HorizonProvider>
                <FormField
                    label="Owner"
                    description="Assign one"
                    error="Required"
                    required
                >
                    <Select>
                        <SelectItem value="a">Ann</SelectItem>
                    </Select>
                </FormField>
            </HorizonProvider>
        );
        const trigger = screen.getByRole('combobox', { name: 'Owner' });
        expect(trigger).toHaveAttribute('aria-invalid', 'true');
        expect(trigger).toHaveAttribute('aria-required', 'true');
        expect(trigger).toHaveAccessibleDescription('Assign one Required');
    });

    it('disabled trigger does not open', async () => {
        const user = userEvent.setup();
        render(<Countries disabled />);
        await user.click(screen.getByRole('combobox'));
        expect(screen.queryByRole('listbox')).toBeNull();
        expect(screen.getByRole('combobox')).toBeDisabled();
    });

    it('forwards ref, data-did and className to the trigger; size reaches the DOM', () => {
        const ref = createRef<HTMLButtonElement>();
        render(
            <Countries
                ref={ref}
                data-did="country"
                className="custom"
                size="lg"
            />
        );
        const trigger = screen.getByRole('combobox');
        expect(ref.current).toBe(trigger);
        expect(trigger).toHaveAttribute('data-did', 'country');
        expect(trigger).toHaveClass('custom');
        expect(trigger).toHaveAttribute('data-size', 'lg');
    });

    it('outside any provider the list still opens in a styled .hz-root fallback (warns once)', async () => {
        const user = userEvent.setup();
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        resetFallbackPortalRoot();
        render(
            <Select aria-label="Bare" placeholder="Pick">
                <SelectItem value="a">Alpha</SelectItem>
            </Select>
        );
        await user.click(screen.getByRole('combobox'));
        const listbox = await screen.findByRole('listbox');
        const root = listbox.closest('.hz-root');
        expect(root).toHaveAttribute('data-hz-portal-root');
        expect(root).toHaveAttribute('data-brand', 'cial');
        expect(warn).toHaveBeenCalledWith(
            expect.stringContaining('outside <HorizonProvider>')
        );
        resetFallbackPortalRoot();
    });

    it('drops x-core SelectV2 props with a warning; size="small" falls back to md', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const Untyped = Select as unknown as (
            p: Record<string, unknown>
        ) => ReactElement;
        render(
            <HorizonProvider>
                <Untyped
                    aria-label="Legacy"
                    options={[{ label: 'A', value: 'a' }]}
                    multiple
                    variant="check"
                    placeholderValue="Pick"
                    helperText="h"
                    muiSelectProps={{}}
                    size="small"
                    onChange={() => undefined}
                >
                    <SelectItem value="a">A</SelectItem>
                </Untyped>
            </HorizonProvider>
        );
        const trigger = screen.getByRole('combobox');
        expect(trigger).not.toHaveAttribute('options');
        expect(trigger).not.toHaveAttribute('multiple');
        expect(trigger).toHaveAttribute('data-size', 'md');
        expect(warn).toHaveBeenCalledWith(
            expect.stringContaining('x-core prop "multiple"')
        );
    });
});
