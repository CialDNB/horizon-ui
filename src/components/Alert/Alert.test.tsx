import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import type { Brand } from '../../tokens/brands';
import { HorizonProvider } from '../../provider';
import { Button } from '../Button';
import { Alert, alertVariants, type AlertVariant } from '.';

describe('Alert', () => {
    it('defaults to info, announced politely as a status', () => {
        const ref = createRef<HTMLDivElement>();
        render(
            <Alert ref={ref} data-did="credits">
                You have few data credits left.
            </Alert>
        );
        const alert = screen.getByRole('status');
        expect(alert).toBe(ref.current);
        expect(alert).toHaveTextContent('You have few data credits left.');
        expect(alert).toHaveAttribute('data-variant', 'info');
        expect(alert).toHaveAttribute('data-did', 'credits');
    });

    it.each([
        ['info', 'status'],
        ['success', 'status'],
        ['neutral', 'status'],
        ['warning', 'alert'],
        ['error', 'alert'],
    ] as const)('%s renders role="%s"', (variant, role) => {
        render(<Alert variant={variant}>Message</Alert>);
        expect(screen.getByRole(role)).toHaveAttribute('data-variant', variant);
    });

    it('an explicit role wins (x-core footer used role="status" on errors)', () => {
        render(
            <Alert variant="error" role="status">
                Report failed
            </Alert>
        );
        expect(screen.getByRole('status')).toBeInTheDocument();
        expect(screen.queryByRole('alert')).toBeNull();
    });

    it.each([
        ['info', 'hz:bg-info-subtle', 'hz:text-info-strong'],
        ['success', 'hz:bg-success-subtle', 'hz:text-success-strong'],
        ['warning', 'hz:bg-warning-subtle', 'hz:text-warning-strong'],
        ['error', 'hz:bg-destructive-subtle', 'hz:text-destructive-strong'],
        ['neutral', 'hz:bg-neutral-subtle', 'hz:text-neutral-strong'],
    ] as const)('%s uses %s and %s', (variant, bg, text) => {
        const classes = alertVariants({ variant });
        expect(classes).toContain(bg);
        expect(classes).toContain(text);
    });

    it('renders title and description; the title is not a heading', () => {
        render(
            <Alert variant="warning" title="Contract expired">
                Renew to keep ordering reports.
            </Alert>
        );
        const alert = screen.getByRole('alert');
        expect(screen.getByText('Contract expired')).toHaveAttribute(
            'data-alert-title'
        );
        expect(screen.queryByRole('heading')).toBeNull();
        expect(alert).toHaveTextContent(
            'Contract expiredRenew to keep ordering reports.'
        );
    });

    it.each([
        ['info', 'Info'],
        ['success', 'CheckCircle'],
        ['warning', 'Warning'],
        ['error', 'WarningCircle'],
        ['neutral', 'Info'],
    ] as const)('%s shows a decorative %s icon', (variant, icon) => {
        const { container } = render(
            <Alert variant={variant as AlertVariant}>Message</Alert>
        );
        const slot = container.querySelector('[data-alert-icon]');
        expect(slot).toHaveAttribute('aria-hidden', 'true');
        expect(slot).toHaveAttribute('data-icon', icon);
        expect(slot?.querySelector('svg')).not.toBeNull();
    });

    it('icon={false} hides it; a custom icon replaces it', () => {
        const { container, rerender } = render(
            <Alert icon={false}>Plain</Alert>
        );
        expect(container.querySelector('[data-alert-icon]')).toBeNull();
        rerender(
            <Alert icon={<span data-testid="custom">*</span>}>Custom</Alert>
        );
        expect(
            screen.getByTestId('custom').closest('[data-alert-icon]')
        ).toHaveAttribute('aria-hidden', 'true');
    });

    it('renders an action', async () => {
        const user = userEvent.setup();
        const onReview = vi.fn();
        render(
            <Alert
                variant="warning"
                action={
                    <Button variant="tertiary" size="sm" onClick={onReview}>
                        Review now
                    </Button>
                }
            >
                A decision is pending review.
            </Alert>
        );
        await user.click(screen.getByRole('button', { name: 'Review now' }));
        expect(onReview).toHaveBeenCalledOnce();
    });

    it('onDismiss renders a named Dismiss button, keyboard operable', async () => {
        const user = userEvent.setup();
        const onDismiss = vi.fn();
        render(<Alert onDismiss={onDismiss}>Saved</Alert>);
        const dismiss = screen.getByRole('button', { name: 'Dismiss' });
        expect(dismiss).toHaveAttribute('type', 'button');
        await user.tab();
        expect(dismiss).toHaveFocus();
        await user.keyboard('{Enter}');
        expect(onDismiss).toHaveBeenCalledOnce();
    });

    it('dismissLabel localises the button name', () => {
        render(
            <Alert onDismiss={() => undefined} dismissLabel="סגירה">
                נשמר
            </Alert>
        );
        expect(screen.getByRole('button', { name: 'סגירה' })).toBeVisible();
    });

    it('no dismiss button without onDismiss', () => {
        render(<Alert>Info</Alert>);
        expect(screen.queryByRole('button')).toBeNull();
    });

    it('stacks the action below the text at mobile and puts it inline from tablet', () => {
        const { container } = render(
            <Alert action={<button type="button">Act</button>}>Text</Alert>
        );
        const body = container.querySelector('[data-alert-body]');
        expect(body).toHaveClass('hz:flex-col', 'hz:tablet:flex-row');
    });

    it('merges className last', () => {
        render(<Alert className="hz:rounded-none">Square</Alert>);
        expect(screen.getByRole('status')).toHaveClass('hz:rounded-none');
        expect(screen.getByRole('status')).not.toHaveClass('hz:rounded-md');
    });

    it('renders inside an unknown brand provider', () => {
        render(
            <HorizonProvider brand={'acme' as Brand}>
                <Alert variant="error">Failed</Alert>
            </HorizonProvider>
        );
        expect(screen.getByRole('alert')).toBeVisible();
    });
});
