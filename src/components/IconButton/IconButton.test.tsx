import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { resetWarnings } from '../../lib/options';
import { HorizonProvider } from '../../provider';
import type { Brand } from '../../tokens';
import { IconButton, iconButtonVariants } from '.';

function Pencil() {
    return (
        <svg data-testid="icon" viewBox="0 0 16 16">
            <title>pencil</title>
            <path d="M2 14 14 2" />
        </svg>
    );
}

describe('IconButton', () => {
    it('is a type="button" named once by aria-label; the icon is hidden', () => {
        render(
            <IconButton aria-label="Edit email">
                <Pencil />
            </IconButton>
        );
        // The svg <title> would add "pencil" to the name if it were exposed.
        const button = screen.getByRole('button', { name: 'Edit email' });
        expect(button.tagName).toBe('BUTTON');
        expect(button).toHaveAttribute('type', 'button');
        expect(screen.getByTestId('icon').parentElement).toHaveAttribute(
            'aria-hidden',
            'true'
        );
    });

    it('can be named by aria-labelledby', () => {
        render(
            <>
                <span id="lbl">Close panel</span>
                <IconButton aria-labelledby="lbl">
                    <Pencil />
                </IconButton>
            </>
        );
        expect(
            screen.getByRole('button', { name: 'Close panel' })
        ).toBeInTheDocument();
    });

    it('is keyboard activatable with Enter and Space', async () => {
        const user = userEvent.setup();
        const onClick = vi.fn();
        render(
            <IconButton aria-label="Edit" onClick={onClick}>
                <Pencil />
            </IconButton>
        );
        await user.tab();
        expect(screen.getByRole('button')).toHaveFocus();
        await user.keyboard('{Enter}');
        await user.keyboard(' ');
        expect(onClick).toHaveBeenCalledTimes(2);
    });

    it('disabled is not focusable and does not fire onClick', async () => {
        const user = userEvent.setup();
        const onClick = vi.fn();
        render(
            <IconButton aria-label="Edit" disabled onClick={onClick}>
                <Pencil />
            </IconButton>
        );
        const button = screen.getByRole('button');
        await user.tab();
        expect(button).not.toHaveFocus();
        await user.click(button);
        expect(onClick).not.toHaveBeenCalled();
        expect(button).toBeDisabled();
    });

    it('loading keeps focus and name, shows a spinner, blocks onClick', async () => {
        const user = userEvent.setup();
        const onClick = vi.fn();
        render(
            <IconButton aria-label="Save file" loading onClick={onClick}>
                <Pencil />
            </IconButton>
        );
        const button = screen.getByRole('button', { name: 'Save file' });
        expect(button).toHaveAttribute('aria-busy', 'true');
        expect(button).toHaveAttribute('aria-disabled', 'true');
        expect(button).not.toBeDisabled();
        expect(
            button.querySelector('[data-hz-motion="essential"]')
        ).not.toBeNull();
        await user.tab();
        expect(button).toHaveFocus();
        await user.keyboard('{Enter}');
        await user.click(button);
        expect(onClick).not.toHaveBeenCalled();
    });

    it('consumer aria-disabled blocks onClick but stays focusable', async () => {
        const user = userEvent.setup();
        const onClick = vi.fn();
        render(
            <IconButton
                aria-label="Edit"
                aria-disabled="true"
                onClick={onClick}
            >
                <Pencil />
            </IconButton>
        );
        const button = screen.getByRole('button');
        await user.tab();
        expect(button).toHaveFocus();
        await user.click(button);
        expect(onClick).not.toHaveBeenCalled();
    });

    it('asChild renders the child link with the styles and the name', () => {
        render(
            <IconButton
                asChild
                aria-label="Open report"
                variant="ghost"
                size="lg"
            >
                <a href="/reports">
                    <Pencil />
                </a>
            </IconButton>
        );
        const link = screen.getByRole('link', { name: 'Open report' });
        expect(screen.queryByRole('button')).toBeNull();
        expect(link).toHaveAttribute('href', '/reports');
        for (const cls of iconButtonVariants({
            variant: 'ghost',
            size: 'lg',
        }).split(' '))
            expect(link).toHaveClass(cls);
        // anchorGuard: hover and touch-hover keep the colour, no underline.
        expect(link).toHaveClass(
            'hz:hover:no-underline',
            'hz:touch-hover:no-underline',
            'hz:touch-hover:text-foreground'
        );
    });

    it('asChild disabled maps to aria-disabled, leaves the tab order, blocks the link', () => {
        const onClick = vi.fn();
        render(
            <IconButton asChild disabled aria-label="Open" onClick={onClick}>
                <a href="/reports">
                    <Pencil />
                </a>
            </IconButton>
        );
        const link = screen.getByRole('link', { name: 'Open' });
        expect(link).toHaveAttribute('aria-disabled', 'true');
        expect(link).toHaveAttribute('tabindex', '-1');
        expect(fireEvent.click(link)).toBe(false);
        expect(onClick).not.toHaveBeenCalled();
    });

    it('asChild loading blocks navigation', () => {
        render(
            <IconButton asChild loading aria-label="Open">
                <a href="/reports">
                    <Pencil />
                </a>
            </IconButton>
        );
        const link = screen.getByRole('link');
        expect(link).toHaveAttribute('aria-busy', 'true');
        expect(fireEvent.click(link)).toBe(false);
    });

    it.each([
        ['primary', 'hz:bg-primary'],
        ['secondary', 'hz:border-primary'],
        ['tertiary', 'hz:text-primary'],
        ['destructive', 'hz:bg-destructive'],
        ['ghost', 'hz:text-foreground'],
    ] as const)('variant %s has %s', (variant, cls) => {
        render(
            <IconButton aria-label="Edit" variant={variant}>
                <Pencil />
            </IconButton>
        );
        const button = screen.getByRole('button');
        expect(button).toHaveClass(cls, 'hz:rounded-full');
        expect(button).toHaveAttribute('data-variant', variant);
    });

    it.each([
        ['sm', 'hz:size-11', 'hz:tablet:pointer-fine:size-8'],
        ['md', 'hz:size-11', 'hz:tablet:pointer-fine:size-9'],
        ['lg', 'hz:size-12', 'hz:tablet:pointer-fine:size-11'],
    ] as const)(
        'size %s is %s at mobile, %s with a fine pointer',
        (size, base, fine) => {
            render(
                <IconButton aria-label="Edit" size={size}>
                    <Pencil />
                </IconButton>
            );
            expect(screen.getByRole('button')).toHaveClass(base, fine);
        }
    );

    it('defaults to primary md, keeps an explicit type, merges className last', () => {
        render(
            <IconButton
                aria-label="Submit"
                type="submit"
                className="hz:size-14"
            >
                <Pencil />
            </IconButton>
        );
        const button = screen.getByRole('button');
        expect(button).toHaveAttribute('type', 'submit');
        expect(button).toHaveAttribute('data-variant', 'primary');
        expect(button).toHaveAttribute('data-size', 'md');
        expect(button).toHaveClass('hz:size-14');
        expect(button).not.toHaveClass('hz:size-11');
    });

    it('forwards ref and data-did; displayName is IconButton', () => {
        const ref = createRef<HTMLButtonElement>();
        render(
            <IconButton ref={ref} aria-label="Edit" data-did="edit-email">
                <Pencil />
            </IconButton>
        );
        expect(ref.current).toBe(screen.getByRole('button'));
        expect(ref.current).toHaveAttribute('data-did', 'edit-email');
        expect(IconButton.displayName).toBe('IconButton');
    });

    it('renders inside an unknown brand provider', () => {
        render(
            <HorizonProvider brand={'acme' as Brand}>
                <IconButton aria-label="Edit">
                    <Pencil />
                </IconButton>
            </HorizonProvider>
        );
        expect(screen.getByRole('button', { name: 'Edit' })).toBeVisible();
    });

    describe('untyped callers', () => {
        afterEach(() => {
            resetWarnings();
            vi.restoreAllMocks();
        });

        it.each([
            ['variant', 'default', 'data-variant', 'primary'],
            ['variant', 'error', 'data-variant', 'primary'],
            ['size', 'small', 'data-size', 'md'],
        ])(
            '%s=%j falls back without throwing and warns once',
            (prop, value, attr, expected) => {
                const warn = vi
                    .spyOn(console, 'warn')
                    .mockImplementation(() => undefined);
                const props = { [prop]: value, 'aria-label': 'Edit' };
                render(
                    <IconButton {...props}>
                        <Pencil />
                    </IconButton>
                );
                render(
                    <IconButton {...props}>
                        <Pencil />
                    </IconButton>
                );
                expect(screen.getAllByRole('button')[0]).toHaveAttribute(
                    attr,
                    expected
                );
                expect(warn).toHaveBeenCalledOnce();
                expect(warn.mock.calls[0]?.[0]).toContain(`${prop} "${value}"`);
            }
        );

        it('warns when there is no accessible name', () => {
            const warn = vi
                .spyOn(console, 'warn')
                .mockImplementation(() => undefined);
            const props = { 'aria-label': '' };
            render(
                <IconButton {...props}>
                    <Pencil />
                </IconButton>
            );
            expect(warn).toHaveBeenCalledOnce();
            expect(warn.mock.calls[0]?.[0]).toContain('aria-label');
        });

        it('drops x-core-only props (palette color, tooltipInfo, sx) instead of leaking them', () => {
            const warn = vi
                .spyOn(console, 'warn')
                .mockImplementation(() => undefined);
            const error = vi.spyOn(console, 'error');
            const props = {
                'aria-label': 'Edit',
                color: 'neutralDark.option_2',
                tooltipInfo: 'Edit',
                sx: { p: '4px' },
            };
            render(
                <IconButton {...props}>
                    <Pencil />
                </IconButton>
            );
            const button = screen.getByRole('button');
            for (const attr of ['color', 'tooltipinfo', 'sx'])
                expect(button).not.toHaveAttribute(attr);
            expect(warn).toHaveBeenCalledTimes(3);
            expect(error).not.toHaveBeenCalled();
        });
    });
});
