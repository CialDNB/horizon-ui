import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it } from 'vitest';
import { Badge, BadgeAnchor, badgeVariants } from '.';

describe('Badge', () => {
    it('renders a status label with a decorative tone dot', () => {
        const ref = createRef<HTMLSpanElement>();
        render(
            <Badge ref={ref} variant="success">
                Approved
            </Badge>
        );
        expect(screen.getByText('Approved')).toBeVisible();
        expect(ref.current).toHaveAttribute('data-variant', 'success');
        expect(ref.current).not.toHaveAttribute('role');
        const dot = ref.current?.querySelector('[data-badge-dot]');
        expect(dot).toHaveAttribute('aria-hidden', 'true');
        expect(dot).toHaveClass('hz:bg-success');
    });

    it('defaults to primary', () => {
        const ref = createRef<HTMLSpanElement>();
        render(<Badge ref={ref}>Upcoming</Badge>);
        expect(ref.current).toHaveAttribute('data-variant', 'primary');
    });

    it.each([
        ['neutral', 'hz:bg-muted-foreground'],
        ['primary', 'hz:bg-primary'],
        ['info', 'hz:bg-info'],
        ['success', 'hz:bg-success'],
        ['warning', 'hz:bg-warning'],
        ['error', 'hz:bg-destructive'],
    ] as const)('%s dot uses the tone token', (variant, cls) => {
        const ref = createRef<HTMLSpanElement>();
        render(
            <Badge ref={ref} variant={variant}>
                Status
            </Badge>
        );
        expect(ref.current?.querySelector('[data-badge-dot]')).toHaveClass(cls);
    });

    it('a dot without text needs and exposes an accessible name', () => {
        render(<Badge variant="error" aria-label="Offline" />);
        expect(screen.getByRole('img', { name: 'Offline' })).toBeVisible();
    });

    it('count renders the number on the tone fill, capped at max', () => {
        const { rerender } = render(<Badge variant="error" count={7} />);
        expect(screen.getByText('7')).toBeVisible();
        rerender(<Badge variant="error" count={1200} />);
        expect(screen.getByText('999+')).toBeVisible();
        rerender(<Badge variant="error" count={120} max={99} />);
        expect(screen.getByText('99+')).toBeVisible();
        expect(badgeVariants({ variant: 'error', form: 'count' })).toContain(
            'hz:bg-destructive-strong'
        );
        expect(badgeVariants({ variant: 'primary', form: 'count' })).toContain(
            'hz:bg-primary'
        );
    });

    it('count 0 renders nothing (x-core invisible)', () => {
        const { container } = render(<Badge count={0} />);
        expect(container).toBeEmptyDOMElement();
    });

    it('a labelled count becomes an image with that name', () => {
        render(<Badge count={3} aria-label="3 unread notifications" />);
        expect(
            screen.getByRole('img', { name: '3 unread notifications' })
        ).toBeVisible();
    });

    it('role overrides the derived role (live status)', () => {
        render(
            <Badge
                count={3}
                role="status"
                aria-label="3 unread notifications"
            />
        );
        expect(
            screen.getByRole('status', { name: '3 unread notifications' })
        ).toBeVisible();
    });

    it('ai shows a decorative sparkle next to the label', () => {
        const ref = createRef<HTMLSpanElement>();
        render(
            <Badge ref={ref} variant="ai">
                AI summary
            </Badge>
        );
        expect(screen.getByText('AI summary')).toBeVisible();
        const icon = ref.current?.querySelector('[data-badge-icon]');
        expect(icon).toHaveAttribute('aria-hidden', 'true');
        expect(ref.current?.querySelector('[data-badge-dot]')).toBeNull();
    });

    it('ai keeps its own type and colour over the label form (cn order)', () => {
        const classes = badgeVariants({ variant: 'ai', form: 'label' }).split(
            ' '
        );
        expect(classes).toEqual(
            expect.arrayContaining([
                'hz:text-label-sm',
                'hz:text-primary',
                'hz:normal-case',
            ])
        );
        expect(classes).not.toContain('hz:text-foreground');
        expect(classes).not.toContain('hz:uppercase');
        expect(classes).not.toContain('hz:text-micro');
    });

    it.each([
        ['ai-verified', 'hz:ring-success', 'hz:text-success-strong'],
        ['ai-unverified', 'hz:ring-destructive', 'hz:text-destructive-strong'],
    ] as const)(
        '%s is an outlined pill in its state colour',
        (variant, ring, icon) => {
            const ref = createRef<HTMLSpanElement>();
            render(
                <Badge ref={ref} variant={variant}>
                    Label
                </Badge>
            );
            expect(ref.current).toHaveClass(ring);
            expect(ref.current?.querySelector('[data-badge-icon]')).toHaveClass(
                icon
            );
        }
    );

    it('forwards data-did and className, has a displayName', () => {
        const ref = createRef<HTMLSpanElement>();
        render(
            <Badge ref={ref} data-did="status" className="hz:ms-2">
                Pending
            </Badge>
        );
        expect(ref.current).toHaveAttribute('data-did', 'status');
        expect(ref.current).toHaveClass('hz:ms-2');
        expect(Badge.displayName).toBe('Badge');
    });
});

describe('BadgeAnchor', () => {
    it('positions the badge on the end corner of its child', () => {
        const ref = createRef<HTMLSpanElement>();
        render(
            <BadgeAnchor
                ref={ref}
                badge={<Badge variant="error" count={4} aria-label="4 new" />}
            >
                <button type="button">Inbox</button>
            </BadgeAnchor>
        );
        expect(screen.getByRole('button', { name: 'Inbox' })).toBeVisible();
        expect(screen.getByRole('img', { name: '4 new' })).toBeVisible();
        expect(ref.current).toHaveClass('hz:relative');
        const slot = ref.current?.querySelector('[data-badge-slot]');
        expect(slot).toHaveClass('hz:end-0', 'hz:top-0');
        expect(BadgeAnchor.displayName).toBe('BadgeAnchor');
    });

    it('circular overlap insets the badge for round children', () => {
        const ref = createRef<HTMLSpanElement>();
        render(
            <BadgeAnchor
                ref={ref}
                overlap="circular"
                badge={<Badge aria-label="Online" />}
            >
                <span>AB</span>
            </BadgeAnchor>
        );
        expect(ref.current?.querySelector('[data-badge-slot]')).toHaveClass(
            'hz:end-[14%]',
            'hz:top-[14%]'
        );
    });
});
