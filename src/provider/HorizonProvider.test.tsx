import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { HorizonProvider } from './HorizonProvider';
import { resetFallbackPortalRoot } from './portal-context';
import { usePortalContainer } from './portal-context';

function Probe({ onContainer }: { onContainer: (el: HTMLElement) => void }) {
    onContainer(usePortalContainer());
    return null;
}

afterEach(() => {
    resetFallbackPortalRoot();
    vi.restoreAllMocks();
});

describe('HorizonProvider', () => {
    it('renders wrapper with hz-root, data-brand and dir', () => {
        render(
            <HorizonProvider brand="dnb" dir="rtl" data-testid="root">
                x
            </HorizonProvider>
        );
        const el = screen.getByTestId('root');
        expect(el).toHaveClass('hz-root');
        expect(el).toHaveAttribute('data-brand', 'dnb');
        expect(el).toHaveAttribute('dir', 'rtl');
    });

    it('defaults to cial and ltr', () => {
        render(<HorizonProvider data-testid="root">x</HorizonProvider>);
        const el = screen.getByTestId('root');
        expect(el).toHaveAttribute('data-brand', 'cial');
        expect(el).toHaveAttribute('dir', 'ltr');
    });

    it('unknown brand falls back to cial', () => {
        render(
            <HorizonProvider
                brand={'nope' as unknown as 'cial'}
                data-testid="root"
            >
                x
            </HorizonProvider>
        );
        expect(screen.getByTestId('root')).toHaveAttribute(
            'data-brand',
            'cial'
        );
    });

    it('merges consumer className and props, and forwards the ref', () => {
        const ref = createRef<HTMLDivElement>();
        render(
            <HorizonProvider
                ref={ref}
                className="mine"
                data-did="d1"
                id="a"
                data-testid="root"
            >
                x
            </HorizonProvider>
        );
        const el = screen.getByTestId('root');
        expect(el).toHaveClass('hz-root', 'mine');
        expect(el).toHaveAttribute('data-did', 'd1');
        expect(el).toHaveAttribute('id', 'a');
        expect(ref.current).toBe(el);
    });

    it('usePortalContainer returns the provider element inside provider', () => {
        const seen: HTMLElement[] = [];
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        render(
            <HorizonProvider data-testid="root">
                <Probe onContainer={(el) => seen.push(el)} />
            </HorizonProvider>
        );
        const root = screen.getByTestId('root');
        expect(seen.at(-1)).toBe(root);
        expect(warn).not.toHaveBeenCalled();
        expect(document.querySelectorAll('[data-hz-portal-root]')).toHaveLength(
            0
        );
    });

    it('usePortalContainer outside provider returns a lazily created hz-root portal root on document.body and warns once', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const seen: HTMLElement[] = [];
        const { rerender } = render(
            <Probe onContainer={(el) => seen.push(el)} />
        );
        rerender(<Probe onContainer={(el) => seen.push(el)} />);
        render(<Probe onContainer={(el) => seen.push(el)} />);
        const first = seen[0];
        expect(first).toBeDefined();
        expect(first?.parentElement).toBe(document.body);
        expect(first).toHaveClass('hz-root');
        expect(first).toHaveAttribute('data-brand', 'cial');
        expect(first).toHaveAttribute('dir', 'ltr');
        expect(new Set(seen).size).toBe(1);
        expect(warn).toHaveBeenCalledTimes(1);
    });

    it('reset helper removes the fallback root so a new one is created', () => {
        vi.spyOn(console, 'warn').mockImplementation(() => {});
        const seen: HTMLElement[] = [];
        render(<Probe onContainer={(el) => seen.push(el)} />);
        resetFallbackPortalRoot();
        expect(document.body.contains(seen[0] ?? null)).toBe(false);
        render(<Probe onContainer={(el) => seen.push(el)} />);
        expect(seen.at(-1)).not.toBe(seen[0]);
    });

    it('sets displayName', () => {
        expect(HorizonProvider.displayName).toBe('HorizonProvider');
    });
});
