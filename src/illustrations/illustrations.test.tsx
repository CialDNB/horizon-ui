import { render, screen } from '@testing-library/react';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import * as illustrations from './index';

const entries = Object.entries(illustrations) as [
    string,
    React.ComponentType<illustrations.IllustrationProps>,
][];

const svgCount = ['cial', 'il'].flatMap((brand) =>
    readdirSync(join(__dirname, 'assets', brand)).filter((f) =>
        f.endsWith('.svg')
    )
).length;

describe('illustrations', () => {
    it('illustrations render an svg for every export', () => {
        expect(entries).toHaveLength(svgCount);
        for (const [name, Illustration] of entries) {
            const { container, unmount } = render(<Illustration />);
            expect(container.querySelector('svg'), name).not.toBeNull();
            unmount();
        }
    });

    it('illustrations aria-hidden by default and expose role img with aria-label', () => {
        const { container, rerender } = render(<illustrations.EmptyState />);
        const svg = container.querySelector('svg');
        expect(svg?.getAttribute('aria-hidden')).toBe('true');
        expect(svg?.getAttribute('focusable')).toBe('false');
        expect(screen.queryByRole('img')).toBeNull();

        rerender(<illustrations.EmptyState aria-label="No results" />);
        expect(screen.getByRole('img', { name: 'No results' })).toBeTruthy();

        rerender(<illustrations.EmptyState title="Nothing here" />);
        expect(screen.getByRole('img', { name: 'Nothing here' })).toBeTruthy();
    });

    it('illustration size prop sets width and height', () => {
        const { container } = render(<illustrations.EmptyState size={120} />);
        const svg = container.querySelector('svg');
        expect(svg?.getAttribute('width')).toBe('120');
        expect(svg?.getAttribute('height')).toBe('120');
        expect(svg?.getAttribute('viewBox')).toBe('0 0 74 73');
    });

    it('keeps intrinsic size and viewBox without size', () => {
        const { container } = render(<illustrations.Data />);
        const svg = container.querySelector('svg');
        expect(svg?.getAttribute('width')).toBe('72');
        expect(svg?.getAttribute('viewBox')).toBe('0 0 72 73');
    });

    it('forwards ref and data-did', () => {
        let ref: SVGSVGElement | null = null;
        render(
            <illustrations.EmptyState
                ref={(el) => {
                    ref = el;
                }}
                data-did="x"
            />
        );
        expect(ref).toBeInstanceOf(SVGSVGElement);
        expect((ref as unknown as SVGSVGElement).getAttribute('data-did')).toBe(
            'x'
        );
    });

    it('illustration ids are unique across two instances', () => {
        const withIds = entries.filter(([, I]) => {
            const { container, unmount } = render(<I />);
            const has = container.querySelector('[id]') !== null;
            unmount();
            return has;
        });
        expect(withIds.length).toBeGreaterThan(0);
        for (const [name, Illustration] of withIds) {
            const { container, unmount } = render(
                <>
                    <Illustration />
                    <Illustration />
                </>
            );
            const ids = [...container.querySelectorAll('[id]')].map(
                (el) => el.id
            );
            expect(new Set(ids).size, name).toBe(ids.length);
            for (const svg of container.querySelectorAll('svg')) {
                for (const el of svg.querySelectorAll('*')) {
                    for (const attr of ['clip-path', 'mask', 'fill']) {
                        const m = /url\(#([^)]+)\)/.exec(
                            el.getAttribute(attr) ?? ''
                        );
                        if (m?.[1])
                            expect(
                                svg.querySelector(`[id="${m[1]}"]`),
                                `${name} ${attr} dangling`
                            ).not.toBeNull();
                    }
                }
            }
            unmount();
        }
    });
});
