import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it } from 'vitest';
import type { Brand } from '../../tokens/brands';
import { HorizonProvider } from '../../provider';
import { Separator, separatorVariants } from '.';

describe('Separator', () => {
    it('is decorative by default: hidden from assistive tech', () => {
        const ref = createRef<HTMLDivElement>();
        render(<Separator ref={ref} data-did="rule" />);
        expect(screen.queryByRole('separator')).toBeNull();
        expect(ref.current?.tagName).toBe('DIV');
        expect(ref.current).toHaveAttribute('role', 'none');
        expect(ref.current).not.toHaveAttribute('aria-orientation');
        expect(ref.current).toHaveAttribute('data-orientation', 'horizontal');
        expect(ref.current).toHaveAttribute('data-did', 'rule');
    });

    it('semantic horizontal separator: role separator, no orientation attribute needed', () => {
        render(<Separator decorative={false} />);
        const sep = screen.getByRole('separator');
        expect(sep).toHaveAttribute('aria-orientation', 'horizontal');
    });

    it('semantic vertical separator exposes aria-orientation', () => {
        render(<Separator decorative={false} orientation="vertical" />);
        expect(screen.getByRole('separator')).toHaveAttribute(
            'aria-orientation',
            'vertical'
        );
    });

    it('is never a <hr> (Bootstrap reboot styles hr margins and borders)', () => {
        const { container } = render(<Separator decorative={false} />);
        expect(container.querySelector('hr')).toBeNull();
    });

    it.each([
        ['horizontal', ['hz:h-px', 'hz:w-full']],
        ['vertical', ['hz:w-px', 'hz:self-stretch']],
    ] as const)(
        '%s uses a 1px line in the border token',
        (orientation, cls) => {
            render(<Separator orientation={orientation} data-testid="sep" />);
            const sep = screen.getByTestId('sep');
            for (const c of [...cls, 'hz:bg-border', 'hz:shrink-0'])
                expect(sep).toHaveClass(c);
        }
    );

    it('separatorVariants defaults to horizontal', () => {
        expect(separatorVariants()).toContain('hz:h-px');
    });

    it('merges className last', () => {
        render(<Separator data-testid="sep" className="hz:bg-input" />);
        expect(screen.getByTestId('sep')).toHaveClass('hz:bg-input');
        expect(screen.getByTestId('sep')).not.toHaveClass('hz:bg-border');
    });

    it('renders inside an unknown brand provider', () => {
        render(
            <HorizonProvider brand={'acme' as Brand}>
                <Separator decorative={false} />
            </HorizonProvider>
        );
        expect(screen.getByRole('separator')).toBeInTheDocument();
    });
});
