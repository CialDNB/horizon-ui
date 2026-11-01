import { describe, expect, it } from 'vitest';
import { buildStylesCss } from '../build-styles';

describe('buildStylesCss', () => {
    it('re-scopes the @property fallback Tailwind targets at every element', async () => {
        // ring/shadow utilities register --tw-* properties with a `*` fallback.
        const css = await buildStylesCss(['hz:ring-2', 'hz:shadow-1']);
        expect(css).toContain('@property --tw-ring-shadow');
        expect(css).toContain('@layer properties');
        expect(css).not.toMatch(/(^\s*|,\s*)\*\s*[,{]/m);
        expect(css).toMatch(
            /\.hz-root, \.hz-root \*, \.hz-root :before, \.hz-root :after, \.hz-root ::backdrop \{\s*--tw-/
        );
    });

    it('keeps @property registrations inside @layer horizon', async () => {
        const css = await buildStylesCss(['hz:ring-2']);
        const body = css.slice(css.indexOf('@layer horizon {'));
        expect(body).toContain('@property --tw-ring-shadow');
        expect(css.slice(0, css.indexOf('@layer horizon {'))).not.toContain(
            '@property'
        );
    });

    it('generates arbitrary prefixed utilities with Horizon tokens', async () => {
        const css = await buildStylesCss([
            'hz:bg-primary',
            'hz:p-4',
            'hz:rounded-lg',
            'hz:tablet:flex',
            'hz:shadow-1',
            'hz:md:flex',
            'hz:text-sm',
            'hz:bg-red-500',
        ]);
        expect(css).toContain('background-color: var(--primary)');
        expect(css).toMatch(/padding: calc\(4px \* 4\)|padding: 16px/);
        expect(css).toContain('border-radius: 20px');
        expect(css).toContain('.hz\\:tablet\\:flex');
        // Reset namespaces: no default md breakpoint, text-sm or primitive palette.
        expect(css).not.toContain('.hz\\:md\\:flex');
        expect(css).not.toContain('.hz\\:text-sm');
        expect(css).not.toContain('.hz\\:bg-red-500');
    });
});
