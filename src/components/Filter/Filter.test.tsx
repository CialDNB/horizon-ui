import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { resetWarnings } from '../../lib/options';
import { HorizonProvider } from '../../provider';
import { Filter, type FilterOption, type FilterProps } from '.';

afterEach(() => {
    resetWarnings();
    vi.restoreAllMocks();
});

const OPTIONS: FilterOption[] = [
    { value: 'high', label: 'High' },
    { value: 'medium', label: 'Medium' },
    { value: 'low', label: 'Low' },
    { value: 'none', label: 'None', disabled: true },
];

function Controlled(props: Partial<FilterProps>) {
    const [value, setValue] = useState<string[]>([...(props.value ?? [])]);
    return (
        <HorizonProvider>
            <Filter
                label="Severity"
                options={OPTIONS}
                {...props}
                value={value}
                onChange={(next) => {
                    setValue(next);
                    props.onChange?.(next);
                }}
            />
        </HorizonProvider>
    );
}

const pill = () => screen.getByRole('button', { name: /Severity/ });

describe('Filter', () => {
    it('the pill opens a dialog named by the label; the count is in the name', async () => {
        const user = userEvent.setup();
        render(<Controlled value={['high', 'low']} totalCount={12} />);
        expect(pill()).toHaveAccessibleName(
            /^Severity ?, 2 selected, 12 total$/
        );
        expect(pill()).toHaveAttribute('aria-haspopup', 'dialog');
        expect(pill()).toHaveAttribute('aria-expanded', 'false');
        await user.click(pill());
        expect(
            await screen.findByRole('dialog', { name: 'Severity' })
        ).toBeVisible();
        expect(pill()).toHaveAttribute('aria-expanded', 'true');
        expect(screen.getByRole('checkbox', { name: 'High' })).toBeChecked();
        expect(screen.getByRole('checkbox', { name: 'None' })).toBeDisabled();
    });

    it('a caller aria-label keeps the counts in the name', () => {
        render(<Controlled aria-label="Filter by Severity" value={['high']} />);
        expect(
            screen.getByRole('button', {
                name: 'Filter by Severity, 1 selected',
            })
        ).toBeVisible();
    });

    it('multiple without Apply commits once, when the panel closes', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        render(<Controlled onChange={onChange} />);
        // Opening and closing without a change reports nothing.
        await user.click(pill());
        await screen.findByRole('dialog');
        await user.keyboard('{Escape}');
        await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
        expect(onChange).not.toHaveBeenCalled();
        await user.click(pill());
        await user.click(await screen.findByRole('checkbox', { name: 'High' }));
        await user.click(screen.getByRole('checkbox', { name: 'Low' }));
        expect(onChange).not.toHaveBeenCalled();
        await user.keyboard('{Escape}');
        await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith(['high', 'low']);
        expect(pill()).toHaveFocus();
    });

    it('Apply stages changes; closing without Apply discards them; Reset clears and closes', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        render(
            <Controlled
                applyLabel="Apply"
                resetLabel="Clear"
                value={['medium']}
                onChange={onChange}
            />
        );
        await user.click(pill());
        await user.click(await screen.findByRole('checkbox', { name: 'High' }));
        await user.keyboard('{Escape}');
        await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
        expect(onChange).not.toHaveBeenCalled();
        await user.click(pill());
        const apply = await screen.findByRole('button', { name: 'Apply' });
        expect(apply).toBeDisabled();
        await user.click(screen.getByRole('checkbox', { name: 'High' }));
        await user.click(apply);
        expect(onChange).toHaveBeenLastCalledWith(['medium', 'high']);
        await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
        await user.click(pill());
        await user.click(await screen.findByRole('button', { name: 'Clear' }));
        expect(onChange).toHaveBeenLastCalledWith([]);
    });

    it('single: radios; picking commits and closes', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        render(<Controlled variant="single" onChange={onChange} />);
        await user.click(pill());
        await user.click(await screen.findByRole('radio', { name: 'Medium' }));
        expect(onChange).toHaveBeenCalledWith(['medium']);
        await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    });

    it('search filters the options; no match says so', async () => {
        const user = userEvent.setup();
        render(<Controlled searchable />);
        await user.click(pill());
        const search = await screen.findByRole('searchbox', { name: 'Search' });
        await user.type(search, 'lo');
        expect(
            screen
                .getAllByRole('checkbox')
                .map((c) => c.getAttribute('aria-label') ?? c.textContent)
        ).toHaveLength(1);
        const region = screen.getByRole('status');
        const node = region;
        await user.type(search, 'zz');
        expect(region).toHaveTextContent('No options');
        // The same element (mounted before the text) carries the message.
        expect(screen.getByRole('status')).toBe(node);
    });

    it('loading: the always-mounted status region (present before opening) announces it', async () => {
        const user = userEvent.setup();
        render(<Controlled loading loadingMessage="Loading severities" />);
        const region = screen.getByRole('status');
        expect(region).toHaveTextContent('');
        await user.click(pill());
        const status = screen.getByRole('status');
        expect(
            await screen.findByText('Loading severities', {
                selector: '[data-filter-message]',
            })
        ).toBeVisible();
        expect(status).toHaveTextContent('Loading severities');
    });

    it('toggle: no panel, aria-pressed follows the value, onClick does the work', async () => {
        const user = userEvent.setup();
        const onClick = vi.fn();
        render(
            <Filter
                toggle
                label="Expired"
                options={[]}
                value={['1']}
                onChange={() => undefined}
                onClick={onClick}
            />
        );
        const button = screen.getByRole('button', { name: /Expired/ });
        expect(button).toHaveAttribute('aria-pressed', 'true');
        expect(button).not.toHaveAttribute('aria-haspopup');
        await user.click(button);
        expect(onClick).toHaveBeenCalledTimes(1);
        expect(screen.queryByRole('dialog')).toBeNull();
    });

    it('forwards ref and data-did to the pill; disabled does not open', async () => {
        const user = userEvent.setup();
        const ref = createRef<HTMLButtonElement>();
        render(
            <Filter
                ref={ref}
                data-did="sev"
                disabled
                label="Severity"
                options={OPTIONS}
                value={[]}
                onChange={() => undefined}
            />
        );
        expect(ref.current).toBe(pill());
        expect(pill()).toHaveAttribute('data-did', 'sev');
        await user.click(pill());
        expect(screen.queryByRole('dialog')).toBeNull();
    });

    it('maps x-core variants and props with warnings (clean -> single, applyButtonText dropped)', async () => {
        const user = userEvent.setup();
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const legacy = {
            variant: 'clean',
            applyButtonText: 'Apply',
            disableFilterIcon: true,
            dataTestId: 'x',
        };
        render(<Controlled {...(legacy as object)} />);
        expect(warn).toHaveBeenCalledWith(expect.stringContaining('variant'));
        expect(warn).toHaveBeenCalledWith(
            expect.stringContaining('applyButtonText')
        );
        const attrs = [...pill().attributes].map((a) => a.name);
        expect(attrs).not.toContain('applybuttontext');
        expect(attrs).not.toContain('datatestid');
        await user.click(pill());
        expect(await screen.findAllByRole('radio')).toHaveLength(4);
    });
});
