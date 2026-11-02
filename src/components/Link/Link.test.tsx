import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, forwardRef, type AnchorHTMLAttributes } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { resetWarnings } from '../../lib/options';
import { HorizonProvider } from '../../provider';
import type { Brand } from '../../tokens';
import { Link, linkVariants } from '.';

/** Stand-in for react-router's Link: renders an <a href> from `to`. */
const RouterLink = forwardRef<
    HTMLAnchorElement,
    AnchorHTMLAttributes<HTMLAnchorElement> & { to: string }
>(function RouterLink({ to, children, ...rest }, ref) {
    return (
        <a ref={ref} href={to} {...rest}>
            {children}
        </a>
    );
});

describe('Link', () => {
    it('renders an anchor with role link and its text as the name', () => {
        render(<Link href="/reports">Open reports</Link>);
        const link = screen.getByRole('link', { name: 'Open reports' });
        expect(link.tagName).toBe('A');
        expect(link).toHaveAttribute('href', '/reports');
        expect(link).not.toHaveAttribute('target');
    });

    it('defaults to the inline variant: underlined primary text', () => {
        render(<Link href="/a">terms</Link>);
        const link = screen.getByRole('link');
        expect(link).toHaveAttribute('data-variant', 'inline');
        expect(link).toHaveClass('hz:text-primary', 'hz:underline');
        // anchorGuard: the underline survives a host a:hover on touch too.
        expect(link).toHaveClass(
            'hz:hover:text-primary-hover',
            'hz:touch-hover:text-primary',
            'hz:touch-hover:underline'
        );
    });

    it.each([
        [
            'standalone',
            ['hz:no-underline', 'hz:min-h-11', 'hz:hover:underline'],
        ],
        [
            'subtle',
            ['hz:text-inherit', 'hz:no-underline', 'hz:hover:underline'],
        ],
    ] as const)('variant %s has its underline rule', (variant, classes) => {
        render(
            <Link href="/a" variant={variant}>
                Profile
            </Link>
        );
        const link = screen.getByRole('link');
        expect(link).toHaveClass(...classes);
        expect(link).toHaveClass('hz:touch-hover:no-underline');
    });

    it.each([
        ['sm', 'hz:text-label-sm'],
        ['md', 'hz:text-label-md'],
    ] as const)('standalone size %s uses %s', (size, cls) => {
        render(
            <Link href="/a" variant="standalone" size={size}>
                Profile
            </Link>
        );
        expect(screen.getByRole('link')).toHaveClass(cls);
    });

    it('inline and subtle inherit the surrounding type (no size classes)', () => {
        render(
            <>
                <Link href="/a" size="sm">
                    a
                </Link>
                <Link href="/b" variant="subtle">
                    b
                </Link>
            </>
        );
        for (const link of screen.getAllByRole('link'))
            expect(link.className).not.toMatch(/text-label/);
    });

    describe('isExternal', () => {
        it('opens in a new tab with safe rel and says so to screen readers', () => {
            render(
                <Link href="https://example.com" isExternal>
                    Decision document
                </Link>
            );
            const link = screen.getByRole('link', {
                name: 'Decision document (opens in new tab)',
            });
            expect(link).toHaveAttribute('target', '_blank');
            expect(link).toHaveAttribute('rel', 'noopener noreferrer');
            const icon = link.querySelector('svg');
            expect(icon).not.toBeNull();
            expect(icon).toHaveAttribute('aria-hidden', 'true');
            expect(screen.getByText('(opens in new tab)')).toHaveClass(
                'hz:sr-only'
            );
        });

        it('keeps consumer rel tokens, translates the hint, hides the icon on request', () => {
            render(
                <Link
                    href="https://example.com"
                    isExternal
                    rel="nofollow noopener"
                    externalLabel="(נפתח בלשונית חדשה)"
                    showExternalIcon={false}
                >
                    מסמך
                </Link>
            );
            const link = screen.getByRole('link', {
                name: 'מסמך (נפתח בלשונית חדשה)',
            });
            expect(link.getAttribute('rel')?.split(' ').sort()).toEqual([
                'nofollow',
                'noopener',
                'noreferrer',
            ]);
            expect(link.querySelector('svg')).toBeNull();
        });

        it('works with asChild, inside the child element', () => {
            render(
                <Link asChild isExternal>
                    <RouterLink to="/decision">Decision</RouterLink>
                </Link>
            );
            const link = screen.getByRole('link', {
                name: 'Decision (opens in new tab)',
            });
            expect(link).toHaveAttribute('href', '/decision');
            expect(link).toHaveAttribute('target', '_blank');
            expect(link.querySelector('svg')).not.toBeNull();
        });
    });

    it('asChild renders the router link with the Link styles', () => {
        render(
            <Link asChild variant="standalone">
                <RouterLink to="/groups">Groups</RouterLink>
            </Link>
        );
        const link = screen.getByRole('link', { name: 'Groups' });
        expect(link).toHaveAttribute('href', '/groups');
        for (const cls of linkVariants({ variant: 'standalone' }).split(' '))
            expect(link).toHaveClass(cls);
    });

    it('disabled drops href, stays named as a disabled link, and is not focusable', async () => {
        const user = userEvent.setup();
        const onClick = vi.fn();
        render(
            <Link href="/reports" disabled onClick={onClick}>
                Open reports
            </Link>
        );
        const link = screen.getByRole('link', { name: 'Open reports' });
        expect(link).not.toHaveAttribute('href');
        expect(link).toHaveAttribute('aria-disabled', 'true');
        await user.tab();
        expect(link).not.toHaveFocus();
        expect(fireEvent.click(link)).toBe(false);
        expect(onClick).not.toHaveBeenCalled();
    });

    it('asChild disabled keeps href but blocks it and leaves the tab order', () => {
        const onClick = vi.fn();
        render(
            <Link asChild disabled onClick={onClick}>
                <RouterLink to="/groups">Groups</RouterLink>
            </Link>
        );
        const link = screen.getByRole('link', { name: 'Groups' });
        expect(link).toHaveAttribute('aria-disabled', 'true');
        expect(link).toHaveAttribute('tabindex', '-1');
        expect(fireEvent.click(link)).toBe(false);
        expect(onClick).not.toHaveBeenCalled();
    });

    it('consumer aria-disabled is treated as disabled', () => {
        render(
            <Link href="/a" aria-disabled="true">
                a
            </Link>
        );
        const link = screen.getByRole('link');
        expect(link).not.toHaveAttribute('href');
        expect(fireEvent.click(link)).toBe(false);
    });

    it('is keyboard-activatable through the native anchor', async () => {
        const user = userEvent.setup();
        const onClick = vi.fn((e: { preventDefault: () => void }) =>
            e.preventDefault()
        );
        render(
            <Link href="/a" onClick={onClick}>
                a
            </Link>
        );
        await user.tab();
        expect(screen.getByRole('link')).toHaveFocus();
        await user.keyboard('{Enter}');
        expect(onClick).toHaveBeenCalledOnce();
    });

    it('forwards ref, data-did and className last; displayName is Link', () => {
        const ref = createRef<HTMLAnchorElement>();
        render(
            <Link
                ref={ref}
                href="/a"
                data-did="docs"
                className="hz:text-foreground"
            >
                a
            </Link>
        );
        const link = screen.getByRole('link');
        expect(ref.current).toBe(link);
        expect(link).toHaveAttribute('data-did', 'docs');
        expect(link).toHaveClass('hz:text-foreground');
        expect(link).not.toHaveClass('hz:text-primary');
        expect(Link.displayName).toBe('Link');
    });

    it('renders inside an unknown brand provider', () => {
        render(
            <HorizonProvider brand={'acme' as Brand}>
                <Link href="/a">a</Link>
            </HorizonProvider>
        );
        expect(screen.getByRole('link', { name: 'a' })).toBeVisible();
    });

    describe('untyped callers', () => {
        afterEach(() => {
            resetWarnings();
            vi.restoreAllMocks();
        });

        it.each([
            ['variant', 'body2', 'data-variant', 'inline'],
            ['size', 'small', 'data-size', 'md'],
        ])(
            '%s=%j falls back without throwing and warns once',
            (prop, value, attr, expected) => {
                const warn = vi
                    .spyOn(console, 'warn')
                    .mockImplementation(() => undefined);
                const props = { [prop]: value, href: '/a' };
                render(<Link {...props}>a</Link>);
                render(<Link {...props}>a</Link>);
                expect(screen.getAllByRole('link')[0]).toHaveAttribute(
                    attr,
                    expected
                );
                expect(warn).toHaveBeenCalledOnce();
                expect(warn.mock.calls[0]?.[0]).toContain(`${prop} "${value}"`);
            }
        );

        it('drops MUI/x-core-only props (color, underline, sx) instead of leaking them', () => {
            const warn = vi
                .spyOn(console, 'warn')
                .mockImplementation(() => undefined);
            const props = {
                href: '/a',
                color: 'inherit',
                underline: 'hover',
                sx: { p: 1 },
            };
            render(<Link {...props}>a</Link>);
            const link = screen.getByRole('link');
            for (const attr of ['color', 'underline', 'sx'])
                expect(link).not.toHaveAttribute(attr);
            expect(warn).toHaveBeenCalledTimes(3);
        });
    });
});
