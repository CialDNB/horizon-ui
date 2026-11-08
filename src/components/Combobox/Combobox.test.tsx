import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { resetWarnings } from '../../lib/options';
import { HorizonProvider } from '../../provider';
import { FormField } from '../FormField';
import {
    Combobox,
    type ComboboxMultipleProps,
    type ComboboxOption,
    type ComboboxSingleProps,
} from '.';

afterEach(() => {
    resetWarnings();
    vi.restoreAllMocks();
});

const COUNTRIES: ComboboxOption[] = [
    { value: 'fr', label: 'France', group: 'Europe' },
    { value: 'de', label: 'Germany', group: 'Europe', disabled: true },
    { value: 'il', label: 'Israel', group: 'Asia' },
    { value: 'jp', label: 'Japan', group: 'Asia' },
    { value: 'ci', label: "Côte d'Ivoire", group: 'Africa' },
];

function Single(props: Partial<ComboboxSingleProps>) {
    return (
        <HorizonProvider>
            <Combobox
                aria-label="Country"
                placeholder="Choose a country"
                options={COUNTRIES}
                {...props}
            />
        </HorizonProvider>
    );
}

function Multi(props: Partial<ComboboxMultipleProps>) {
    return (
        <HorizonProvider>
            <Combobox
                multiple
                aria-label="Countries"
                options={COUNTRIES}
                {...props}
            />
        </HorizonProvider>
    );
}

const input = () => screen.getByRole('combobox');

describe('Combobox', () => {
    it('is an ARIA 1.2 combobox: collapsed until opened, then controls a named listbox', async () => {
        const user = userEvent.setup();
        render(<Single />);
        expect(input()).toHaveAttribute('aria-expanded', 'false');
        expect(input()).toHaveAttribute('aria-autocomplete', 'list');
        expect(input()).not.toHaveAttribute('aria-controls');
        await user.click(input());
        const listbox = await screen.findByRole('listbox', { name: 'Country' });
        expect(input()).toHaveAttribute('aria-expanded', 'true');
        expect(input()).toHaveAttribute('aria-controls', listbox.id);
        expect(screen.getAllByRole('option')).toHaveLength(5);
        expect(screen.getByRole('group', { name: 'Europe' })).toBeVisible();
        expect(screen.getByRole('option', { name: 'Germany' })).toHaveAttribute(
            'aria-disabled',
            'true'
        );
        expect(listbox.closest('.hz-root')).not.toBeNull();
        expect(listbox.closest('[data-combobox-content]')?.className).toContain(
            'hz:z-dropdown'
        );
    });

    it('typing filters case- and accent-insensitively and highlights the first match', async () => {
        const user = userEvent.setup();
        const onInputChange = vi.fn();
        render(<Single onInputChange={onInputChange} />);
        await user.type(input(), 'cote');
        const options = screen.getAllByRole('option');
        expect(options.map((o) => o.textContent)).toEqual(["Côte d'Ivoire"]);
        expect(input()).toHaveAttribute(
            'aria-activedescendant',
            options[0]?.id
        );
        expect(onInputChange).toHaveBeenLastCalledWith('cote', 'input');
    });

    it('keyboard: ArrowDown opens and moves (skipping disabled, wrapping), Enter selects and closes', async () => {
        const user = userEvent.setup();
        const onValueChange = vi.fn();
        render(<Single onValueChange={onValueChange} />);
        input().focus();
        await user.keyboard('{ArrowDown}');
        const ids = () => input().getAttribute('aria-activedescendant');
        const option = (name: string) =>
            screen.getByRole('option', { name }).id;
        expect(ids()).toBe(option('France'));
        await user.keyboard('{ArrowDown}');
        expect(ids()).toBe(option('Israel'));
        await user.keyboard('{ArrowUp}{ArrowUp}');
        expect(ids()).toBe(option("Côte d'Ivoire"));
        await user.keyboard('{ArrowUp}{Enter}');
        expect(onValueChange).toHaveBeenCalledWith('jp');
        expect(input()).toHaveValue('Japan');
        expect(screen.queryByRole('listbox')).toBeNull();
        expect(input()).toHaveFocus();
    });

    it('marks the selected option and reopens with it highlighted', async () => {
        const user = userEvent.setup();
        render(<Single defaultValue="il" />);
        expect(input()).toHaveValue('Israel');
        input().focus();
        await user.keyboard('{ArrowDown}');
        const israel = screen.getByRole('option', { name: 'Israel' });
        expect(israel).toHaveAttribute('aria-selected', 'true');
        expect(input()).toHaveAttribute('aria-activedescendant', israel.id);
        // A pristine text (the selected label) does not filter the list.
        expect(screen.getAllByRole('option')).toHaveLength(5);
    });

    it('selects with the pointer; a disabled option does nothing', async () => {
        const user = userEvent.setup();
        const onValueChange = vi.fn();
        render(<Single onValueChange={onValueChange} />);
        await user.click(input());
        await user.click(screen.getByRole('option', { name: 'Germany' }));
        expect(onValueChange).not.toHaveBeenCalled();
        await user.click(screen.getByRole('option', { name: 'France' }));
        expect(onValueChange).toHaveBeenCalledWith('fr');
        expect(input()).toHaveFocus();
    });

    it('Escape closes and restores the selected label; blur does too', async () => {
        const user = userEvent.setup();
        render(<Single defaultValue="fr" />);
        await user.clear(input());
        await user.type(input(), 'ja');
        expect(screen.getByRole('listbox')).toBeVisible();
        await user.keyboard('{Escape}');
        await waitFor(() => expect(screen.queryByRole('listbox')).toBeNull());
        expect(input()).toHaveValue('France');
        await user.type(input(), 'x');
        // Tab reaches the clear button (still the field), then leaves it.
        await user.tab();
        expect(screen.getByRole('button', { name: 'Clear' })).toHaveFocus();
        expect(input()).toHaveValue('Francex');
        await user.tab();
        expect(input()).toHaveValue('France');
    });

    it('blur restores the selected label even after the list was closed with Alt+ArrowUp', async () => {
        const user = userEvent.setup();
        render(<Single defaultValue="fr" />);
        await user.type(input(), 'zz');
        await user.keyboard('{Alt>}{ArrowUp}{/Alt}');
        await waitFor(() =>
            expect(document.querySelector('[data-combobox-content]')).toBeNull()
        );
        await user.click(document.body);
        expect(input()).toHaveValue('France');
    });

    it('allowCustomValue: Enter commits typed text, kept on blur', async () => {
        const user = userEvent.setup();
        const onValueChange = vi.fn();
        render(<Single allowCustomValue onValueChange={onValueChange} />);
        await user.type(input(), 'Narnia{Enter}');
        expect(onValueChange).toHaveBeenCalledWith('Narnia');
        await user.tab();
        expect(input()).toHaveValue('Narnia');
    });

    it('clearable resets value and text and refocuses', async () => {
        const user = userEvent.setup();
        const onValueChange = vi.fn();
        const onInputChange = vi.fn();
        render(
            <Single
                clearable
                defaultValue="il"
                onValueChange={onValueChange}
                onInputChange={onInputChange}
            />
        );
        await user.click(screen.getByRole('button', { name: 'Clear' }));
        expect(onValueChange).toHaveBeenCalledWith(null);
        expect(onInputChange).toHaveBeenCalledWith('', 'clear');
        expect(input()).toHaveValue('');
        expect(input()).toHaveFocus();
        expect(screen.queryByRole('button', { name: 'Clear' })).toBeNull();
    });

    it('announces the empty state politely, once, and shows it without a listbox', async () => {
        const user = userEvent.setup();
        render(<Single emptyMessage="No countries" />);
        const status = screen.getByRole('status');
        expect(status).toHaveTextContent('');
        await user.type(input(), 'zz');
        expect(status).toHaveTextContent('No countries');
        expect(screen.queryByRole('listbox')).toBeNull();
        expect(input()).toHaveAttribute('aria-expanded', 'false');
        // The visible copy is not a second live region.
        expect(screen.getAllByText('No countries')).toHaveLength(2);
        const node = status.firstChild;
        await user.type(input(), 'z');
        expect(status.firstChild).toBe(node);
    });

    it('loading: spinner, aria-busy and a polite loading message; options arrive', async () => {
        const user = userEvent.setup();
        function Async() {
            const [options, setOptions] = useState<ComboboxOption[]>([]);
            const [loading, setLoading] = useState(false);
            return (
                <HorizonProvider>
                    <Combobox
                        aria-label="Company"
                        options={options}
                        loading={loading}
                        filter={false}
                        onInputChange={(text, reason) => {
                            if (reason !== 'input') return;
                            setLoading(true);
                            setTimeout(() => {
                                setOptions([
                                    { value: 'a', label: `${text} Ltd` },
                                ]);
                                setLoading(false);
                            }, 300);
                        }}
                    />
                </HorizonProvider>
            );
        }
        render(<Async />);
        await user.type(input(), 'acme');
        expect(input()).toHaveAttribute('aria-busy', 'true');
        expect(screen.getByRole('status')).toHaveTextContent('Loading…');
        expect(
            document.querySelector('[data-combobox-loading]')
        ).not.toBeNull();
        expect(
            await screen.findByRole('option', { name: 'acme Ltd' })
        ).toBeVisible();
        expect(screen.getByRole('status')).toHaveTextContent('');
    });

    it('multiple: toggles values as chips, keeps the list open, Backspace removes the last', async () => {
        const user = userEvent.setup();
        const onValueChange = vi.fn();
        render(<Multi onValueChange={onValueChange} />);
        await user.click(input());
        expect(screen.getByRole('listbox')).toHaveAttribute(
            'aria-multiselectable',
            'true'
        );
        await user.click(screen.getByRole('option', { name: 'France' }));
        await user.click(screen.getByRole('option', { name: 'Japan' }));
        expect(onValueChange).toHaveBeenLastCalledWith(['fr', 'jp']);
        expect(screen.getByRole('listbox')).toBeVisible();
        expect(screen.getByRole('option', { name: 'Japan' })).toHaveAttribute(
            'aria-selected',
            'true'
        );
        expect(
            screen.getByRole('button', { name: 'Remove France' })
        ).toBeVisible();
        await user.keyboard('{Backspace}');
        expect(onValueChange).toHaveBeenLastCalledWith(['fr']);
        await user.click(screen.getByRole('button', { name: 'Remove France' }));
        expect(onValueChange).toHaveBeenLastCalledWith([]);
        expect(input()).toHaveFocus();
    });

    it('multiple + allowCustomValue adds typed text as a chip', async () => {
        const user = userEvent.setup();
        const onValueChange = vi.fn();
        render(<Multi allowCustomValue onValueChange={onValueChange} />);
        await user.type(input(), 'Atlantis{Enter}');
        expect(onValueChange).toHaveBeenLastCalledWith(['Atlantis']);
        expect(input()).toHaveValue('');
        expect(
            screen.getByRole('button', { name: 'Remove Atlantis' })
        ).toBeVisible();
    });

    it('is controlled by value and follows outside changes', () => {
        const { rerender } = render(<Single value="fr" />);
        expect(input()).toHaveValue('France');
        rerender(<Single value="jp" />);
        expect(input()).toHaveValue('Japan');
    });

    it('inside a FormField: label, description, error and the listbox name', async () => {
        const user = userEvent.setup();
        render(
            <HorizonProvider>
                <FormField
                    label="Country"
                    description="Billing"
                    error="Pick one"
                    required
                >
                    <Combobox options={COUNTRIES} />
                </FormField>
            </HorizonProvider>
        );
        const box = screen.getByRole('combobox', { name: 'Country' });
        expect(box).toHaveAccessibleDescription('Billing Pick one');
        expect(box).toHaveAttribute('aria-invalid', 'true');
        expect(box).toHaveAttribute('aria-required', 'true');
        await user.click(box);
        expect(screen.getByRole('listbox', { name: 'Country' })).toBeVisible();
    });

    it('submits selected values under name', () => {
        render(
            <HorizonProvider>
                <form id="f">
                    <Combobox
                        multiple
                        aria-label="C"
                        name="countries"
                        options={COUNTRIES}
                        defaultValue={['fr', 'il']}
                    />
                </form>
            </HorizonProvider>
        );
        const data = new FormData(
            document.getElementById('f') as HTMLFormElement
        );
        expect(data.getAll('countries')).toEqual(['fr', 'il']);
    });

    it('forwards ref and data-did to the input; disabled never opens', async () => {
        const user = userEvent.setup();
        const ref = createRef<HTMLInputElement>();
        render(
            <Combobox
                ref={ref}
                aria-label="Country"
                options={COUNTRIES}
                data-did="country"
                disabled
            />
        );
        expect(ref.current).toBe(input());
        expect(input()).toHaveAttribute('data-did', 'country');
        await user.click(input());
        expect(screen.queryByRole('listbox')).toBeNull();
    });

    it('renders without a provider and falls back for an unknown size', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        render(
            // @ts-expect-error plain-JS callers pass x-core sizes
            <Combobox aria-label="X" options={COUNTRIES} size="medium" />
        );
        expect(document.querySelector('[data-combobox-field]')).toHaveAttribute(
            'data-size',
            'md'
        );
        expect(warn).toHaveBeenCalledWith(expect.stringContaining('size'));
    });

    it('drops x-core Autocomplete props with a warning instead of leaking them', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const legacy = {
            getOptionLabel: (o: unknown) => String(o),
            freeSolo: true,
            disablePortal: true,
            sx: { p: 1 },
        };
        render(<Single {...(legacy as object)} />);
        const attrs = [...input().attributes].map((a) => a.name);
        expect(attrs).not.toContain('freesolo');
        expect(attrs).not.toContain('getoptionlabel');
        expect(warn).toHaveBeenCalledWith(expect.stringContaining('freeSolo'));
    });

    it('warns once when given option objects as value (x-core) and ignores them', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        render(<Single value={{ value: 'fr' } as unknown as string} />);
        expect(input()).toHaveValue('');
        expect(warn).toHaveBeenCalledTimes(1);
    });

    it('limit caps the rendered options (x-core filterOptionsLimit 100)', async () => {
        const user = userEvent.setup();
        const many = Array.from({ length: 150 }, (_, i) => ({
            value: `v${i}`,
            label: `Item ${i}`,
        }));
        render(<Single options={many} />);
        await user.click(input());
        expect(screen.getAllByRole('option')).toHaveLength(100);
        act(() => input().blur());
    });

    it('shows the clear button by default (MUI parity); clearable={false} hides it', () => {
        const { rerender } = render(<Single defaultValue="fr" />);
        expect(screen.getByRole('button', { name: 'Clear' })).toBeVisible();
        rerender(<Single defaultValue="fr" clearable={false} />);
        expect(screen.queryByRole('button', { name: 'Clear' })).toBeNull();
    });

    it('announces picks and removals once in the polite status region', async () => {
        const user = userEvent.setup();
        render(<Multi />);
        const status = screen.getByRole('status');
        await user.click(input());
        await user.click(screen.getByRole('option', { name: 'France' }));
        expect(status).toHaveTextContent('France selected');
        await user.click(screen.getByRole('option', { name: 'Japan' }));
        expect(status).toHaveTextContent('Japan selected');
        await user.click(screen.getByRole('option', { name: 'Japan' }));
        expect(status).toHaveTextContent('Japan removed');
        await user.click(screen.getByRole('button', { name: 'Remove France' }));
        expect(status).toHaveTextContent('France removed');
        await user.click(screen.getByRole('option', { name: 'Israel' }));
        input().focus();
        await user.keyboard('{Backspace}');
        expect(status).toHaveTextContent('Israel removed');
        // Typing replaces the announcement (empty, or the list state).
        await user.type(input(), 'j');
        expect(status).toHaveTextContent('');
    });

    it('single pick is announced', async () => {
        const user = userEvent.setup();
        render(<Single />);
        await user.click(input());
        await user.click(screen.getByRole('option', { name: 'Israel' }));
        expect(screen.getByRole('status')).toHaveTextContent('Israel selected');
    });

    it('required multiple: an empty selection blocks form submission; a value unblocks it', async () => {
        const user = userEvent.setup();
        render(
            <HorizonProvider>
                <form id="req">
                    <Combobox
                        multiple
                        required
                        aria-label="Countries"
                        options={COUNTRIES}
                    />
                </form>
            </HorizonProvider>
        );
        const form = document.getElementById('req') as HTMLFormElement;
        expect(form.checkValidity()).toBe(false);
        expect(input()).toHaveAttribute('aria-required', 'true');
        expect((input() as HTMLInputElement).validationMessage).toBe(
            'Select at least one option'
        );
        await user.click(input());
        await user.click(screen.getByRole('option', { name: 'France' }));
        expect(form.checkValidity()).toBe(true);
    });
});
