import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { resetWarnings } from '../../lib/options';
import { FormField } from '../FormField';
import { SearchBar, type SearchBarProps } from '.';

afterEach(() => {
    resetWarnings();
    vi.restoreAllMocks();
});

function Controlled(props: Partial<SearchBarProps>) {
    const [value, setValue] = useState('');
    return (
        <SearchBar
            aria-label="Search companies"
            value={value}
            onValueChange={setValue}
            {...props}
        />
    );
}

describe('SearchBar', () => {
    it('is a searchbox inside a named search landmark', () => {
        render(<SearchBar aria-label="Search companies" />);
        const box = screen.getByRole('searchbox', { name: 'Search companies' });
        expect(box).toHaveAttribute('type', 'search');
        expect(
            screen.getByRole('search', { name: 'Search companies' })
        ).toContainElement(box);
    });

    it('Enter calls onSearch with the text and does not submit an enclosing form', async () => {
        const user = userEvent.setup();
        const onSearch = vi.fn();
        const onSubmit = vi.fn((e: Event) => e.preventDefault());
        render(
            <form onSubmit={(e) => onSubmit(e.nativeEvent)}>
                <Controlled onSearch={onSearch} />
            </form>
        );
        await user.type(screen.getByRole('searchbox'), 'acme{Enter}');
        expect(onSearch).toHaveBeenCalledWith('acme');
        expect(onSubmit).not.toHaveBeenCalled();
    });

    it('the search button searches; clear empties, searches with "" and refocuses', async () => {
        const user = userEvent.setup();
        const onSearch = vi.fn();
        const onValueChange = vi.fn();
        render(
            <SearchBar
                aria-label="Search"
                defaultValue="acme"
                onSearch={onSearch}
                onValueChange={onValueChange}
            />
        );
        await user.click(screen.getByRole('button', { name: 'Search' }));
        expect(onSearch).toHaveBeenLastCalledWith('acme');
        await user.click(screen.getByRole('button', { name: 'Clear' }));
        expect(onValueChange).toHaveBeenLastCalledWith('');
        expect(onSearch).toHaveBeenLastCalledWith('');
        expect(screen.getByRole('searchbox')).toHaveValue('');
        expect(screen.getByRole('searchbox')).toHaveFocus();
        expect(screen.queryByRole('button', { name: 'Clear' })).toBeNull();
    });

    it('does not debounce: every keystroke reaches onValueChange', async () => {
        const user = userEvent.setup();
        const onValueChange = vi.fn();
        render(<SearchBar aria-label="S" onValueChange={onValueChange} />);
        await user.type(screen.getByRole('searchbox'), 'abc');
        expect(onValueChange.mock.calls.map((c) => c[0])).toEqual([
            'a',
            'ab',
            'abc',
        ]);
    });

    it('loading shows a spinner and aria-busy; invalid sets aria-invalid', () => {
        render(<SearchBar aria-label="S" loading invalid />);
        const box = screen.getByRole('searchbox');
        expect(box).toHaveAttribute('aria-busy', 'true');
        expect(document.querySelector('[data-input-loading]')).not.toBeNull();
        expect(box).toHaveAttribute('aria-invalid', 'true');
    });

    it('disabled disables the field and the search button', () => {
        render(<SearchBar aria-label="S" defaultValue="x" disabled />);
        expect(screen.getByRole('searchbox')).toBeDisabled();
        expect(screen.getByRole('button', { name: 'Search' })).toBeDisabled();
        expect(screen.queryByRole('button', { name: 'Clear' })).toBeNull();
    });

    it('works inside a FormField (label and description)', () => {
        render(
            <FormField label="Find" description="Name or DUNS">
                <SearchBar />
            </FormField>
        );
        expect(
            screen.getByRole('searchbox', { name: 'Find' })
        ).toHaveAccessibleDescription('Name or DUNS');
    });

    it('forwards ref and data-did to the input', () => {
        const ref = createRef<HTMLInputElement>();
        render(<SearchBar aria-label="S" ref={ref} data-did="find" />);
        expect(ref.current).toBe(screen.getByRole('searchbox'));
        expect(ref.current).toHaveAttribute('data-did', 'find');
    });

    it('drops x-core SearchBarV2 props with a warning', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const legacy = { searchValue: 'a', loader: true, iconSize: 'small' };
        render(<SearchBar aria-label="S" {...(legacy as object)} />);
        const attrs = [...screen.getByRole('searchbox').attributes].map(
            (a) => a.name
        );
        expect(attrs).not.toContain('searchvalue');
        expect(attrs).not.toContain('iconsize');
        expect(warn).toHaveBeenCalledWith(expect.stringContaining('loader'));
    });
});
