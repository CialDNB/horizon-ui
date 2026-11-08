import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { resetWarnings } from '../../lib/options';
import { HorizonProvider } from '../../provider';
import { SplitButton, type SplitButtonProps } from '.';

afterEach(() => {
    resetWarnings();
    vi.restoreAllMocks();
});

const OPTIONS = [
    { label: 'New Decision V1', mode: 'v1' },
    { label: 'New Decision V2', mode: 'v2' },
    { label: 'Archived', disabled: true },
];

function Split(props: Partial<SplitButtonProps>) {
    return (
        <HorizonProvider>
            <SplitButton options={OPTIONS} {...props} />
        </HorizonProvider>
    );
}

describe('SplitButton', () => {
    it('is a named group of a main button and a menu button', () => {
        render(<Split />);
        const group = screen.getByRole('group', { name: 'New Decision V1' });
        const main = screen.getByRole('button', { name: 'New Decision V1' });
        const menu = screen.getByRole('button', { name: 'More options' });
        expect(group).toContainElement(main);
        expect(menu).toHaveAttribute('aria-haspopup', 'menu');
        expect(menu).toHaveAttribute('aria-expanded', 'false');
    });

    it('the main button runs the selected option (onOptionClick with the option and index)', async () => {
        const user = userEvent.setup();
        const onOptionClick = vi.fn();
        render(<Split onOptionClick={onOptionClick} />);
        await user.click(
            screen.getByRole('button', { name: 'New Decision V1' })
        );
        expect(onOptionClick).toHaveBeenCalledWith(OPTIONS[0], 0);
    });

    it('the menu lists options as radio items; picking selects and runs it', async () => {
        const user = userEvent.setup();
        const onOptionClick = vi.fn();
        render(<Split onOptionClick={onOptionClick} />);
        await user.click(screen.getByRole('button', { name: 'More options' }));
        const items = await screen.findAllByRole('menuitemradio');
        expect(items).toHaveLength(3);
        expect(items[0]).toHaveAttribute('aria-checked', 'true');
        expect(items[2]).toHaveAttribute('aria-disabled', 'true');
        await user.click(items[1] as HTMLElement);
        expect(onOptionClick).toHaveBeenLastCalledWith(OPTIONS[1], 1);
        expect(screen.queryByRole('menu')).toBeNull();
        expect(
            screen.getByRole('button', { name: 'New Decision V2' })
        ).toBeVisible();
        await user.click(
            screen.getByRole('button', { name: 'New Decision V2' })
        );
        expect(onOptionClick).toHaveBeenLastCalledWith(OPTIONS[1], 1);
    });

    it('keyboard: Enter on the menu button opens the menu with focus inside; Escape returns focus', async () => {
        const user = userEvent.setup();
        render(<Split />);
        const menu = screen.getByRole('button', { name: 'More options' });
        menu.focus();
        await user.keyboard('{Enter}');
        expect(await screen.findByRole('menu')).toBeVisible();
        expect(document.activeElement?.getAttribute('role')).toBe(
            'menuitemradio'
        );
        await user.keyboard('{Escape}');
        expect(menu).toHaveFocus();
    });

    it('an option with its own onClick runs that instead of onOptionClick', async () => {
        const user = userEvent.setup();
        const own = vi.fn();
        const onOptionClick = vi.fn();
        render(
            <Split
                options={[{ label: 'Export', onClick: own }, 'Print']}
                onOptionClick={onOptionClick}
            />
        );
        await user.click(screen.getByRole('button', { name: 'Export' }));
        expect(own).toHaveBeenCalledTimes(1);
        expect(onOptionClick).not.toHaveBeenCalled();
    });

    it('headline replaces the main label; string options work', async () => {
        const user = userEvent.setup();
        const onOptionClick = vi.fn();
        render(
            <Split
                options={['A', 'B']}
                headline="Create"
                onOptionClick={onOptionClick}
            />
        );
        await user.click(screen.getByRole('button', { name: 'Create' }));
        expect(onOptionClick).toHaveBeenCalledWith('A', 0);
    });

    it('disabled disables both; loading busies the main button and disables the menu', () => {
        const { rerender } = render(<Split disabled />);
        for (const b of screen.getAllByRole('button')) expect(b).toBeDisabled();
        rerender(<Split loading />);
        expect(
            screen.getByRole('button', { name: 'New Decision V1' })
        ).toHaveAttribute('aria-busy', 'true');
        expect(
            screen.getByRole('button', { name: 'More options' })
        ).toBeDisabled();
    });

    it('forwards ref and data-did to the group', () => {
        const ref = createRef<HTMLDivElement>();
        render(<SplitButton options={OPTIONS} ref={ref} data-did="split" />);
        expect(ref.current).toBe(screen.getByRole('group'));
        expect(ref.current).toHaveAttribute('data-did', 'split');
    });

    it('falls back for x-core variants and drops x-core/customer360 props with a warning', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const legacy = {
            variant: 'outlined',
            color: 'bright',
            isHeaderButton: true,
            sx: { p: 1 },
        };
        render(<Split {...(legacy as object)} />);
        const attrs = [...screen.getByRole('group').attributes].map(
            (a) => a.name
        );
        expect(attrs).not.toContain('color');
        expect(attrs).not.toContain('isheaderbutton');
        expect(warn).toHaveBeenCalledWith(expect.stringContaining('variant'));
        expect(warn).toHaveBeenCalledWith(
            expect.stringContaining('isHeaderButton')
        );
    });
});
