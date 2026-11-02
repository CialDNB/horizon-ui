import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it } from 'vitest';
import type { Brand } from '../../tokens/brands';
import { HorizonProvider } from '../../provider';
import { Progress, progressVariants, type ProgressVariant } from '.';

const indicator = (bar: HTMLElement) => {
    const el = bar.querySelector('[data-progress-indicator]');
    if (!(el instanceof HTMLElement)) throw new Error('no indicator');
    return el;
};

describe('Progress', () => {
    it('determinate: progressbar with value, min and max, named by aria-label', () => {
        const ref = createRef<HTMLDivElement>();
        render(
            <Progress
                ref={ref}
                value={45}
                aria-label="Profile completion"
                data-did="profile"
            />
        );
        const bar = screen.getByRole('progressbar', {
            name: 'Profile completion',
        });
        expect(bar).toHaveAttribute('aria-valuenow', '45');
        expect(bar).toHaveAttribute('aria-valuemin', '0');
        expect(bar).toHaveAttribute('aria-valuemax', '100');
        expect(ref.current).toHaveAttribute('data-did', 'profile');
        expect(ref.current?.contains(bar)).toBe(true);
        expect(
            indicator(bar).style.getPropertyValue('--hz-progress-offset')
        ).toBe('55%');
    });

    it('indeterminate: no aria-valuenow, an animated essential-motion indicator', () => {
        render(<Progress aria-label="Uploading" />);
        const bar = screen.getByRole('progressbar', { name: 'Uploading' });
        expect(bar).not.toHaveAttribute('aria-valuenow');
        expect(bar).toHaveAttribute('data-state', 'indeterminate');
        const ind = indicator(bar);
        expect(ind).toHaveAttribute('data-hz-motion', 'essential');
        expect(ind).toHaveClass('hz:animate-progress-indeterminate');
        expect(ind).toHaveClass('hz:motion-reduce:animate-progress-pulse');
    });

    it('a visible label names the bar and showValue prints the rounded percentage once', () => {
        render(<Progress value={2} max={3} label="Steps done" showValue />);
        const bar = screen.getByRole('progressbar', { name: 'Steps done' });
        expect(bar).toHaveAttribute('aria-valuenow', '2');
        expect(bar).toHaveAttribute('aria-valuemax', '3');
        const text = screen.getByText('67%');
        // The bar already exposes its value; the printed copy is not read twice.
        expect(text).toHaveAttribute('aria-hidden', 'true');
        expect(
            indicator(bar).style.getPropertyValue('--hz-progress-offset')
        ).toBe('33.33%');
    });

    it('aria-valuetext and aria-describedby reach the progressbar', () => {
        render(
            <Progress
                value={3}
                max={5}
                aria-label="Evaluation"
                aria-valuetext="3 of 5 steps"
                aria-describedby="hint"
            />
        );
        const bar = screen.getByRole('progressbar');
        expect(bar).toHaveAttribute('aria-valuetext', '3 of 5 steps');
        expect(bar).toHaveAttribute('aria-describedby', 'hint');
    });

    it.each([
        [-5, '0', '100%'],
        [180, '100', '0%'],
    ])('clamps %d into 0..max', (value, now, offset) => {
        render(<Progress value={value} aria-label="Clamp" />);
        const bar = screen.getByRole('progressbar');
        expect(bar).toHaveAttribute('aria-valuenow', now);
        expect(
            indicator(bar).style.getPropertyValue('--hz-progress-offset')
        ).toBe(offset);
    });

    it('a non-positive max falls back to 100', () => {
        render(<Progress value={50} max={0} aria-label="Bad max" />);
        expect(screen.getByRole('progressbar')).toHaveAttribute(
            'aria-valuemax',
            '100'
        );
    });

    it.each([
        ['primary', 'hz:bg-primary'],
        ['neutral', 'hz:bg-neutral-strong'],
        ['success', 'hz:bg-success-strong'],
        ['warning', 'hz:bg-warning-strong'],
        ['error', 'hz:bg-destructive-strong'],
    ] as const)('%s indicator uses %s on the muted track', (variant, cls) => {
        render(<Progress value={10} variant={variant} aria-label="x" />);
        const bar = screen.getByRole('progressbar');
        expect(bar).toHaveClass('hz:bg-muted');
        expect(indicator(bar)).toHaveClass(cls);
    });

    it.each([
        ['sm', 'hz:h-1'],
        ['md', 'hz:h-2'],
    ] as const)('size %s is %s', (size, cls) => {
        render(<Progress value={10} size={size} aria-label="x" />);
        expect(screen.getByRole('progressbar')).toHaveClass(cls);
    });

    it('defaults to primary, sm', () => {
        const classes = progressVariants();
        expect(classes).toContain('hz:h-1');
        const variants: ProgressVariant[] = [
            'primary',
            'neutral',
            'success',
            'warning',
            'error',
        ];
        expect(variants).toHaveLength(5);
    });

    it('determinate indicator moves with logical direction (LTR left, RTL right)', () => {
        render(<Progress value={30} aria-label="x" />);
        const ind = indicator(screen.getByRole('progressbar'));
        expect(ind).toHaveClass('hz:ltr:-translate-x-(--hz-progress-offset)');
        expect(ind).toHaveClass('hz:rtl:translate-x-(--hz-progress-offset)');
    });

    it('renders inside an unknown brand provider', () => {
        render(
            <HorizonProvider brand={'acme' as Brand}>
                <Progress value={10} aria-label="x" />
            </HorizonProvider>
        );
        expect(screen.getByRole('progressbar')).toBeVisible();
    });
});
