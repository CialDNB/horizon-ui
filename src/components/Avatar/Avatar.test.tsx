import { act, fireEvent, render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { resetWarnings } from '../../lib/options';
import { HorizonProvider } from '../../provider';
import type { Brand } from '../../tokens';
import { Avatar, AvatarGroup, avatarVariants, getInitials } from '.';

const img = (container: HTMLElement) => container.querySelector('img');

describe('getInitials', () => {
    it.each([
        ['Dana Levi', 'DL'],
        ['  dana   levi  cohen ', 'DL'],
        ['dana', 'D'],
        ["O'Brien, Pat", 'OP'],
        ['דנה לוי', 'דל'],
        ['Émile Zola', 'ÉZ'],
        ['', ''],
        ['  ', ''],
        ['- ?', ''],
    ])('%j -> %j', (name, expected) => {
        expect(getInitials(name)).toBe(expected);
    });
});

describe('Avatar', () => {
    it('names the avatar once with role img from `name`', () => {
        render(<Avatar name="Dana Levi" />);
        const avatar = screen.getByRole('img', { name: 'Dana Levi' });
        expect(avatar.tagName).toBe('SPAN');
        // The visible initials are hidden from the accessibility tree.
        expect(avatar).toHaveTextContent('DL');
        expect(screen.getByText('DL')).toHaveAttribute('aria-hidden', 'true');
    });

    it('alt overrides the accessible name; alt="" makes it decorative', () => {
        const { rerender, container } = render(
            <Avatar name="Dana Levi" alt="Dana Levi, approver" />
        );
        expect(
            screen.getByRole('img', { name: 'Dana Levi, approver' })
        ).toBeInTheDocument();
        rerender(<Avatar name="Dana Levi" alt="" />);
        expect(screen.queryByRole('img')).toBeNull();
        expect(container.firstElementChild).toHaveAttribute(
            'aria-hidden',
            'true'
        );
        // Initials still render for sighted users.
        expect(container).toHaveTextContent('DL');
    });

    it('is decorative without name or alt and shows a person icon', () => {
        const { container } = render(<Avatar />);
        const root = container.firstElementChild;
        expect(root).toHaveAttribute('aria-hidden', 'true');
        expect(root?.querySelector('svg')).not.toBeNull();
    });

    it('shows the fallback until the image loads, then the image', () => {
        const { container } = render(
            <Avatar src="/dana.png" name="Dana Levi" />
        );
        const image = img(container);
        expect(image).not.toBeNull();
        // Image announced through the root, not twice.
        expect(image).toHaveAttribute('alt', '');
        expect(container.firstElementChild).toHaveAttribute(
            'data-status',
            'loading'
        );
        expect(screen.getByText('DL')).toBeInTheDocument();
        act(() => {
            if (image) fireEvent.load(image);
        });
        expect(container.firstElementChild).toHaveAttribute(
            'data-status',
            'loaded'
        );
        expect(screen.queryByText('DL')).toBeNull();
        expect(
            screen.getByRole('img', { name: 'Dana Levi' })
        ).toBeInTheDocument();
    });

    it('falls back to initials when the image fails, and retries a new src', () => {
        const { container, rerender } = render(
            <Avatar src="/broken.png" name="Dana Levi" />
        );
        act(() => {
            const image = img(container);
            if (image) fireEvent.error(image);
        });
        expect(img(container)).toBeNull();
        expect(container.firstElementChild).toHaveAttribute(
            'data-status',
            'error'
        );
        expect(screen.getByText('DL')).toBeInTheDocument();
        rerender(<Avatar src="/dana.png" name="Dana Levi" />);
        expect(img(container)).not.toBeNull();
        expect(container.firstElementChild).toHaveAttribute(
            'data-status',
            'loading'
        );
    });

    it('custom children replace the initials', () => {
        render(
            <Avatar name="Acme Ltd">
                <svg data-testid="logo" />
            </Avatar>
        );
        expect(screen.getByTestId('logo')).toBeInTheDocument();
        expect(screen.queryByText('AL')).toBeNull();
        expect(
            screen.getByRole('img', { name: 'Acme Ltd' })
        ).toBeInTheDocument();
    });

    it.each([
        ['xs', 'hz:size-4', 'D'],
        ['sm', 'hz:size-6', 'DL'],
        ['md', 'hz:size-8', 'DL'],
        ['lg', 'hz:size-10', 'DL'],
        ['xl', 'hz:size-16', 'DL'],
    ] as const)('size %s maps to %s and shows %s', (size, cls, initials) => {
        render(<Avatar size={size} name="Dana Levi" />);
        const avatar = screen.getByRole('img');
        expect(avatar).toHaveClass(cls);
        expect(avatar).toHaveAttribute('data-size', size);
        expect(avatar.textContent).toBe(initials);
    });

    it.each([
        ['primary', 'hz:bg-primary', 'hz:text-primary-foreground'],
        ['neutral', 'hz:bg-neutral-subtle', 'hz:text-neutral-strong'],
        ['info', 'hz:bg-info-subtle', 'hz:text-info-strong'],
        ['success', 'hz:bg-success-subtle', 'hz:text-success-strong'],
        ['warning', 'hz:bg-warning-subtle', 'hz:text-warning-strong'],
        ['error', 'hz:bg-destructive-subtle', 'hz:text-destructive-strong'],
    ] as const)('tone %s uses %s / %s', (tone, bg, text) => {
        render(<Avatar tone={tone} name="Dana Levi" />);
        const avatar = screen.getByRole('img');
        expect(avatar).toHaveClass(bg, text);
    });

    it('defaults to sm, circle, primary; rounded shape changes the radius', () => {
        const { rerender } = render(<Avatar name="Dana Levi" />);
        const avatar = screen.getByRole('img');
        expect(avatar).toHaveAttribute('data-size', 'sm');
        expect(avatar).toHaveAttribute('data-shape', 'circle');
        expect(avatar).toHaveClass('hz:rounded-full', 'hz:bg-primary');
        rerender(<Avatar name="Dana Levi" shape="rounded" size="lg" />);
        expect(screen.getByRole('img')).toHaveClass('hz:rounded-sm');
        expect(screen.getByRole('img')).not.toHaveClass('hz:rounded-full');
    });

    it('forwards ref, data-did and className last', () => {
        const ref = createRef<HTMLSpanElement>();
        render(
            <Avatar
                ref={ref}
                name="Dana Levi"
                data-did="approver"
                className="hz:size-24"
            />
        );
        const avatar = screen.getByRole('img');
        expect(ref.current).toBe(avatar);
        expect(avatar).toHaveAttribute('data-did', 'approver');
        expect(avatar).toHaveClass('hz:size-24');
        expect(avatar).not.toHaveClass('hz:size-6');
    });

    it('avatarVariants returns the conflict-resolved class string', () => {
        expect(avatarVariants({ size: 'xl', tone: 'info' })).toContain(
            'hz:size-16'
        );
        expect(avatarVariants({ size: 'xl', tone: 'info' })).toContain(
            'hz:bg-info-subtle'
        );
    });

    it('renders inside an unknown brand provider', () => {
        render(
            <HorizonProvider brand={'acme' as Brand}>
                <Avatar name="Dana Levi" />
            </HorizonProvider>
        );
        expect(screen.getByRole('img', { name: 'Dana Levi' })).toBeVisible();
    });

    it('displayName is Avatar', () => {
        expect(Avatar.displayName).toBe('Avatar');
    });

    describe('x-core values from untyped callers', () => {
        afterEach(() => {
            resetWarnings();
            vi.restoreAllMocks();
        });

        it.each([
            ['size', 'small', 'data-size', 'sm'],
            ['size', 'medium', 'data-size', 'sm'],
            ['shape', 'circular', 'data-shape', 'circle'],
            ['tone', 'grey', 'data-tone', 'primary'],
        ])(
            '%s=%j falls back without throwing and warns once',
            (prop, value, attr, expected) => {
                const warn = vi
                    .spyOn(console, 'warn')
                    .mockImplementation(() => undefined);
                const props = { [prop]: value, name: 'Dana Levi' };
                render(<Avatar {...props} />);
                render(<Avatar {...props} />);
                expect(screen.getAllByRole('img')[0]).toHaveAttribute(
                    attr,
                    expected
                );
                expect(warn).toHaveBeenCalledOnce();
                expect(warn.mock.calls[0]?.[0]).toContain(`${prop} "${value}"`);
            }
        );
    });
});

describe('AvatarGroup', () => {
    const people = [
        'Dana Levi',
        'Omer Katz',
        'Noa Peretz',
        'Yael Ben',
        'Tom Gil',
    ];
    const group = (max?: number) => (
        <AvatarGroup aria-label="Assignees" {...(max !== undefined && { max })}>
            {people.map((name) => (
                <Avatar key={name} name={name} />
            ))}
        </AvatarGroup>
    );

    it('is a named group showing max - 1 avatars and a "+N" overflow', () => {
        render(group(3));
        const root = screen.getByRole('group', { name: 'Assignees' });
        expect(
            screen.getByRole('img', { name: 'Dana Levi' })
        ).toBeInTheDocument();
        expect(
            screen.getByRole('img', { name: 'Omer Katz' })
        ).toBeInTheDocument();
        expect(screen.queryByRole('img', { name: 'Noa Peretz' })).toBeNull();
        // Overflow announced once by name, the visible "+3" hidden.
        const more = screen.getByRole('img', { name: '3 more' });
        expect(more).toHaveTextContent('+3');
        expect(root.children).toHaveLength(3);
    });

    it('shows every avatar when they fit within max', () => {
        render(group(5));
        expect(screen.getAllByRole('img')).toHaveLength(5);
        expect(screen.queryByRole('img', { name: /more$/ })).toBeNull();
    });

    it('defaults max to 3 and clamps max below 2 to 2', () => {
        const { rerender } = render(group());
        expect(screen.getAllByRole('img')).toHaveLength(3);
        rerender(group(0));
        expect(screen.getAllByRole('img')).toHaveLength(2);
        expect(screen.getByRole('img', { name: '4 more' })).toBeInTheDocument();
    });

    it('`total` counts people not passed as children', () => {
        render(
            <AvatarGroup total={12}>
                <Avatar name="Dana Levi" />
                <Avatar name="Omer Katz" />
            </AvatarGroup>
        );
        expect(screen.getByRole('img', { name: '10 more' })).toHaveTextContent(
            '+10'
        );
    });

    it('translates the overflow name with overflowLabel', () => {
        render(
            <AvatarGroup max={2} overflowLabel={(n) => `עוד ${n}`}>
                <Avatar name="Dana Levi" />
                <Avatar name="Omer Katz" />
                <Avatar name="Noa Peretz" />
            </AvatarGroup>
        );
        expect(screen.getByRole('img', { name: 'עוד 2' })).toBeInTheDocument();
    });

    it('passes size and shape to children, which can override', () => {
        render(
            <AvatarGroup size="lg" shape="rounded">
                <Avatar name="Dana Levi" />
                <Avatar name="Omer Katz" size="sm" />
            </AvatarGroup>
        );
        const [first, second] = screen.getAllByRole('img');
        expect(first).toHaveAttribute('data-size', 'lg');
        expect(first).toHaveAttribute('data-shape', 'rounded');
        expect(second).toHaveAttribute('data-size', 'sm');
    });

    it('overflow avatar takes the group size', () => {
        render(
            <AvatarGroup size="md" max={2}>
                <Avatar name="Dana Levi" />
                <Avatar name="Omer Katz" />
                <Avatar name="Noa Peretz" />
            </AvatarGroup>
        );
        expect(screen.getByRole('img', { name: '2 more' })).toHaveAttribute(
            'data-size',
            'md'
        );
    });

    it('forwards ref and data-did; displayName is AvatarGroup', () => {
        const ref = createRef<HTMLDivElement>();
        render(
            <AvatarGroup ref={ref} data-did="assignees">
                <Avatar name="Dana Levi" />
            </AvatarGroup>
        );
        expect(ref.current).toHaveAttribute('data-did', 'assignees');
        expect(AvatarGroup.displayName).toBe('AvatarGroup');
    });
});
