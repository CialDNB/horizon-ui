import { fireEvent, render, screen } from '@testing-library/react';
import { createRef, Profiler, useState } from 'react';
import { createPortal } from 'react-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { HorizonProvider } from './HorizonProvider';
import {
    resetFallbackPortalRoot,
    resolvePortalContainer,
    usePortalContainer,
} from './portal-context';

function Probe({
    onContainer,
}: {
    onContainer: (el: HTMLElement | null) => void;
}) {
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
        const seen: (HTMLElement | null)[] = [];
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
        const seen: (HTMLElement | null)[] = [];
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
        const seen: (HTMLElement | null)[] = [];
        render(<Probe onContainer={(el) => seen.push(el)} />);
        resetFallbackPortalRoot();
        expect(document.body.contains(seen[0] ?? null)).toBe(false);
        render(<Probe onContainer={(el) => seen.push(el)} />);
        expect(seen.at(-1)).not.toBe(seen[0]);
    });

    it('sets displayName', () => {
        expect(HorizonProvider.displayName).toBe('HorizonProvider');
    });

    it('returns null on the provider first render, then the wrapper element after mount', () => {
        const seen: (HTMLElement | null)[] = [];
        function Spy() {
            seen.push(usePortalContainer());
            return null;
        }
        render(
            <HorizonProvider data-testid="root">
                <Spy />
            </HorizonProvider>
        );
        expect(seen[0]).toBeNull();
        expect(seen.at(-1)).toBe(screen.getByTestId('root'));
    });

    it('never returns a detached element', () => {
        vi.spyOn(console, 'warn').mockImplementation(() => {});
        const seen: (HTMLElement | null)[] = [];
        function Spy() {
            seen.push(usePortalContainer());
            return null;
        }
        render(
            <HorizonProvider>
                <Spy />
            </HorizonProvider>
        );
        render(<Spy />);
        const values = seen.filter((v): v is HTMLElement => v !== null);
        expect(values.length).toBeGreaterThan(1);
        for (const el of values) expect(el.isConnected).toBe(true);
    });

    it('returns null when document is undefined', () => {
        vi.stubGlobal('document', undefined);
        try {
            expect(resolvePortalContainer(undefined)).toBeNull();
        } finally {
            vi.unstubAllGlobals();
        }
    });

    it('portal consumer renders after the container is available and keeps its state', () => {
        function Overlay() {
            const container = usePortalContainer();
            const [open] = useState(true);
            const [count, setCount] = useState(0);
            if (!container || !open) return null;
            return createPortal(
                <button onClick={() => setCount((c) => c + 1)}>
                    clicks {count}
                </button>,
                container
            );
        }
        render(
            <HorizonProvider data-testid="root">
                <Overlay />
            </HorizonProvider>
        );
        const btn = screen.getByRole('button');
        expect(screen.getByTestId('root')).toContainElement(btn);
        fireEvent.click(btn);
        expect(screen.getByRole('button')).toHaveTextContent('clicks 1');
    });

    it('does not re-render the provider more than once per parent render with an inline ref', () => {
        let commits = 0;
        const refs: (HTMLDivElement | null)[] = [];
        function Parent() {
            const [, setN] = useState(0);
            return (
                <Profiler id="p" onRender={() => commits++}>
                    <HorizonProvider
                        ref={(n) => {
                            refs.push(n);
                        }}
                    >
                        <button onClick={() => setN((n) => n + 1)}>go</button>
                    </HorizonProvider>
                </Profiler>
            );
        }
        render(<Parent />);
        const before = commits;
        fireEvent.click(screen.getByRole('button'));
        expect(commits - before).toBe(1);
        expect(refs.filter((r) => r === null)).toHaveLength(0);
    });
});
