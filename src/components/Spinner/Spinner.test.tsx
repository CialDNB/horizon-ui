import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { resetWarnings } from '../../lib/options';
import type { Brand } from '../../tokens/brands';
import { HorizonProvider } from '../../provider';
import { Spinner, spinnerVariants, type SpinnerSize } from '.';

describe('Spinner', () => {
    it('is a progressbar named "Loading" by default, with no value', () => {
        const ref = createRef<HTMLSpanElement>();
        render(<Spinner ref={ref} data-did="loader" />);
        const bar = screen.getByRole('progressbar', { name: 'Loading' });
        expect(bar).toBe(ref.current);
        expect(bar).not.toHaveAttribute('aria-valuenow');
        expect(bar).toHaveAttribute('data-did', 'loader');
        expect(bar).toHaveAttribute('data-hz-motion', 'essential');
    });

    it('takes its accessible name from `label`', () => {
        render(<Spinner label="Loading reports" />);
        expect(
            screen.getByRole('progressbar', { name: 'Loading reports' })
        ).toBeVisible();
    });

    it('aria-labelledby replaces the default name', () => {
        render(
            <>
                <span id="caption">Fetching ratings</span>
                <Spinner aria-labelledby="caption" />
            </>
        );
        const bar = screen.getByRole('progressbar', {
            name: 'Fetching ratings',
        });
        expect(bar).not.toHaveAttribute('aria-label');
    });

    it('aria-hidden makes it decorative: no role, no name', () => {
        const ref = createRef<HTMLSpanElement>();
        render(<Spinner ref={ref} aria-hidden="true" />);
        expect(screen.queryByRole('progressbar')).toBeNull();
        expect(ref.current).not.toHaveAttribute('role');
        expect(ref.current).not.toHaveAttribute('aria-label');
    });

    it('indeterminate spins (and keeps spinning slowly under reduced motion)', () => {
        const classes = spinnerVariants();
        expect(classes).toContain('hz:animate-spin');
        expect(classes).toContain(
            'hz:motion-reduce:animate-[spin_3s_linear_infinite]'
        );
        expect(classes).toContain('hz:border-e-transparent');
    });

    it.each([
        ['xs', 'hz:size-3'],
        ['sm', 'hz:size-4'],
        ['md', 'hz:size-5'],
        ['lg', 'hz:size-6'],
        ['xl', 'hz:size-10'],
    ] as const)('size %s maps to %s', (size, cls) => {
        render(<Spinner size={size} />);
        expect(screen.getByRole('progressbar')).toHaveClass(cls);
        expect(screen.getByRole('progressbar')).toHaveAttribute(
            'data-size',
            size
        );
    });

    it('defaults to xl (x-core CircularProgress default, 40px) and primary', () => {
        render(<Spinner />);
        const bar = screen.getByRole('progressbar');
        expect(bar).toHaveAttribute('data-size', 'xl');
        expect(bar).toHaveClass('hz:text-primary');
    });

    it.each([
        ['primary', 'hz:text-primary'],
        ['muted', 'hz:text-muted-foreground'],
        ['inherit', 'hz:text-inherit'],
    ] as const)('tone %s uses %s', (tone, cls) => {
        render(<Spinner tone={tone} />);
        expect(screen.getByRole('progressbar')).toHaveClass(cls);
    });

    it('determinate exposes value, min and max and draws an arc', () => {
        const { container } = render(<Spinner value={42.4} size="lg" />);
        const bar = screen.getByRole('progressbar', { name: 'Loading' });
        expect(bar).toHaveAttribute('aria-valuenow', '42');
        expect(bar).toHaveAttribute('aria-valuemin', '0');
        expect(bar).toHaveAttribute('aria-valuemax', '100');
        expect(bar).not.toHaveClass('hz:animate-spin');
        const arc = container.querySelector('[data-spinner-arc]');
        expect(arc).toHaveAttribute('stroke-dashoffset', '57.6');
        expect(container.querySelector('svg')).toHaveAttribute(
            'aria-hidden',
            'true'
        );
    });

    it.each([
        [-10, '0', '100'],
        [140, '100', '0'],
    ])('clamps value %d into 0..100', (value, now, offset) => {
        const { container } = render(<Spinner value={value} />);
        expect(screen.getByRole('progressbar')).toHaveAttribute(
            'aria-valuenow',
            now
        );
        expect(container.querySelector('[data-spinner-arc]')).toHaveAttribute(
            'stroke-dashoffset',
            offset
        );
    });

    it('NaN value falls back to indeterminate', () => {
        render(<Spinner value={Number.NaN} />);
        expect(screen.getByRole('progressbar')).not.toHaveAttribute(
            'aria-valuenow'
        );
    });

    it('merges className last', () => {
        render(<Spinner className="hz:text-success-strong" />);
        const bar = screen.getByRole('progressbar');
        expect(bar).toHaveClass('hz:text-success-strong');
        expect(bar).not.toHaveClass('hz:text-primary');
    });

    it('renders without HorizonProvider and with an unknown brand', () => {
        render(
            <HorizonProvider brand={'acme' as Brand}>
                <Spinner />
            </HorizonProvider>
        );
        expect(screen.getByRole('progressbar')).toBeVisible();
    });

    it('every size has a matching stroke', () => {
        const sizes: SpinnerSize[] = ['xs', 'sm', 'md', 'lg', 'xl'];
        for (const size of sizes)
            expect(spinnerVariants({ size })).toMatch(/hz:border-\d/);
    });

    describe('old x-core values from untyped callers', () => {
        afterEach(() => {
            resetWarnings();
            vi.restoreAllMocks();
        });

        it.each([
            [12, 'xs'],
            [14, 'xs'],
            [16, 'sm'],
            ['19px', 'md'],
            [20, 'md'],
            [24, 'lg'],
            [28, 'lg'],
            [32, 'lg'],
            [40, 'xl'],
            [56, 'xl'],
        ] as const)(
            'numeric size %s maps to the nearest step %s and warns',
            (old, step) => {
                const warn = vi
                    .spyOn(console, 'warn')
                    .mockImplementation(() => {});
                render(<Spinner size={old as never} value={50} />);
                expect(screen.getByRole('progressbar')).toHaveAttribute(
                    'data-size',
                    step
                );
                expect(warn).toHaveBeenCalledOnce();
                expect(warn.mock.calls[0]?.[0]).toContain(
                    `size ${JSON.stringify(old)}`
                );
            }
        );

        it('an unknown size or tone falls back to the default (xl, primary)', () => {
            const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
            render(
                <Spinner size={'huge' as never} tone={'secondary' as never} />
            );
            const bar = screen.getByRole('progressbar');
            expect(bar).toHaveAttribute('data-size', 'xl');
            expect(bar).toHaveClass('hz:size-10', 'hz:text-primary');
            expect(warn).toHaveBeenCalledTimes(2);
        });
    });
});
