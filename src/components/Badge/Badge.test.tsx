import { render, screen, within } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it } from 'vitest';
import { brands, type Brand, type SemanticKey } from '../../tokens/brands';
import { contrastRatio } from '../../tokens/contrast';
import { Badge, BadgeAnchor, badgeVariants, type BadgeTone } from '.';

const tones: BadgeTone[] = [
    'neutral',
    'primary',
    'info',
    'success',
    'warning',
    'error',
];

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

    it.each(tones)(
        'a %s dot alone has a boundary of at least 3:1 on background in every brand (WCAG 1.4.11)',
        (tone) => {
            const tokens = badgeVariants({ variant: tone, form: 'dot' })
                .split(' ')
                .map((c) => /^hz:(?:bg|ring)-([a-z-]+)$/.exec(c)?.[1])
                .filter((t): t is SemanticKey =>
                    Boolean(t && t in brands.cial)
                );
            expect(tokens.length).toBeGreaterThan(0);
            for (const brand of Object.keys(brands) as Brand[]) {
                const best = Math.max(
                    ...tokens.map((t) =>
                        contrastRatio(
                            brands[brand][t],
                            brands[brand].background
                        )
                    )
                );
                expect(
                    best,
                    `${brand} ${tokens.join(',')}`
                ).toBeGreaterThanOrEqual(3);
            }
        }
    );

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

    it('a labelled count as an image exposes exactly the label', () => {
        render(<Badge count={3} aria-label="3 unread notifications" />);
        const img = screen.getByRole('img', { name: '3 unread notifications' });
        expect(img).toHaveAttribute('aria-label', '3 unread notifications');
        expect(within(img).getByText('3')).toHaveAttribute(
            'aria-hidden',
            'true'
        );
    });

    it('a live status count announces its label once through visible-to-AT text', () => {
        render(
            <Badge
                count={3}
                role="status"
                aria-label="3 unread notifications"
            />
        );
        const status = screen.getByRole('status', {
            name: '3 unread notifications',
        });
        // Live regions announce content, not the name: the label is real text.
        const label = within(status).getByText('3 unread notifications');
        expect(label).toHaveClass('hz:sr-only');
        expect(label).not.toHaveAttribute('aria-hidden');
        // The visible number is hidden so only one string is announced.
        expect(within(status).getByText('3')).toHaveAttribute(
            'aria-hidden',
            'true'
        );
    });

    it('a status count without a label keeps the number readable', () => {
        render(<Badge count={5} role="status" />);
        const status = screen.getByRole('status');
        expect(status).toHaveTextContent(/^5$/);
        expect(within(status).getByText('5')).not.toHaveAttribute(
            'aria-hidden'
        );
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
