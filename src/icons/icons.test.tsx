import { render } from '@testing-library/react';
import * as Phosphor from '@phosphor-icons/react';
import { describe, expect, it } from 'vitest';
import * as barrel from './index';

type PhosphorExport = (typeof Phosphor)[keyof typeof Phosphor];
const entries = Object.entries(Phosphor) as [string, PhosphorExport][];
const iconNames = entries
    .map(([name]) => name)
    .filter((name) => name.endsWith('Icon'));
// Every 20th icon plus the directional ones: ~1500 renders add little over a sample.
const sample = [
    ...iconNames.filter((_, i) => i % 20 === 0),
    'ArrowLeftIcon',
    'ArrowRightIcon',
    'CaretLeftIcon',
    'CaretRightIcon',
    'ArrowBendUpLeftIcon',
    'CheckIcon',
];

function renderIcon(name: string, props: Record<string, unknown> = {}) {
    const Icon = Phosphor[name as keyof typeof Phosphor] as React.ElementType;
    const { container } = render(<Icon {...props} />);
    return container.querySelector('svg');
}

describe('icons', () => {
    it('every exported icon renders an svg', () => {
        expect(iconNames.length).toBeGreaterThan(1000);
        const failures = sample.filter((name) => renderIcon(name) === null);
        expect(failures).toEqual([]);
    });

    it('barrel re-exports the same set of keys as Phosphor', () => {
        expect(Object.keys(barrel).sort()).toEqual(
            Object.keys(Phosphor).sort()
        );
    });

    it('icon aria-hidden by default', () => {
        // Phosphor sets no aria-hidden itself (documented in src/icons/index.ts):
        // decorative icons must pass aria-hidden, which Phosphor forwards.
        expect(renderIcon('CheckIcon')?.hasAttribute('aria-hidden')).toBe(
            false
        );
        const hidden = renderIcon('CheckIcon', { 'aria-hidden': true });
        expect(hidden?.getAttribute('aria-hidden')).toBe('true');
    });

    it('icon with aria-label is not hidden', () => {
        const svg = renderIcon('CheckIcon', { 'aria-label': 'Done' });
        expect(svg?.getAttribute('aria-hidden')).toBeNull();
        expect(svg?.getAttribute('aria-label')).toBe('Done');
    });

    it('size prop sets width and height', () => {
        const svg = renderIcon('CheckIcon', { size: 32 });
        expect(svg?.getAttribute('width')).toBe('32');
        expect(svg?.getAttribute('height')).toBe('32');
    });

    it('mirrored flips the icon', () => {
        const svg = renderIcon('ArrowLeftIcon', { mirrored: true });
        expect(svg?.getAttribute('transform')).toContain('scale(-1, 1)');
    });
});
