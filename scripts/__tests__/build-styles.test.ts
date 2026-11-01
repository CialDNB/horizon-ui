import { describe, expect, it } from 'vitest';
import { buildStylesCss, flattenLayers } from '../build-styles';

describe('buildStylesCss', () => {
    it('re-scopes the @property fallback Tailwind targets at every element', async () => {
        // ring/shadow utilities register --tw-* properties with a `*` fallback.
        const css = await buildStylesCss(['hz:ring-2', 'hz:shadow-1']);
        expect(css).toContain('@property --hz-tw-ring-shadow');
        expect(css).toContain('@layer properties');
        expect(css).not.toMatch(/(^\s*|,\s*)\*\s*[,{]/m);
        expect(css).toMatch(
            /\.hz-root, \.hz-root \*, \.hz-root :before, \.hz-root :after, \.hz-root ::backdrop \{\s*--hz-tw-/
        );
    });

    it('keeps @property registrations inside @layer horizon', async () => {
        const css = await buildStylesCss(['hz:ring-2']);
        const body = css.slice(css.indexOf('@layer horizon {'));
        expect(body).toContain('@property --hz-tw-ring-shadow');
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

    it('renames every Tailwind --tw-* variable to --hz-tw-*', async () => {
        const css = await buildStylesCss([
            'hz:ring-2',
            'hz:shadow-1',
            'hz:border',
            'hz:transition',
            'hz:ease-standard',
            'hz:translate-x-2',
        ]);
        expect(css).not.toContain('--tw-');
        // The ring still resolves through the renamed chain.
        expect(css).toMatch(/\.hz\\:ring-2 \{\s*--hz-tw-ring-shadow:/);
        expect(css).toContain('var(--hz-tw-ring-shadow)');
        expect(css).toContain('@property --hz-tw-ring-offset-width');
    });
});

describe('flattenLayers', () => {
    const squash = (css: string) => css.replace(/\s+/g, ' ').trim();

    it('orders layer contents by layer declaration, not by text position', () => {
        // Tailwind's raw output: `@layer utilities` text comes before `@layer
        // theme`, but the statement declares theme first, so theme ranks lower.
        const out = flattenLayers(
            '@layer theme, base, utilities;\n@layer utilities { .u { a: 1 } }\n@layer theme { .t { a: 2 } }\n@layer base { .b { a: 3 } }\n'
        );
        expect(squash(out)).toBe('.t { a: 2 } .b { a: 3 } .u { a: 1 }');
    });

    it('drops layer statements and empty layers, flattens nested layers, keeps unlayered rules last', () => {
        const out = flattenLayers(
            '@layer horizon {\n  @layer x { .x { a: 1 } }\n  @layer components;\n  @property --p { syntax: "*"; inherits: false }\n  @layer y { @media (min-width: 768px) { .y { a: 2 } } }\n}\n'
        );
        expect(out).not.toMatch(/@layer/);
        expect(squash(out)).toBe(
            '.x { a: 1 } @media (min-width: 768px) { .y { a: 2 } } @property --p { syntax: "*"; inherits: false }'
        );
    });

    it('merges repeated blocks of the same layer at its first declaration', () => {
        const out = flattenLayers(
            '@layer a { .a1 { x: 1 } }\n@layer b { .b { x: 2 } }\n@layer a { .a2 { x: 3 } }\n'
        );
        expect(squash(out)).toBe('.a1 { x: 1 } .a2 { x: 3 } .b { x: 2 }');
    });

    it('ignores braces and semicolons inside strings and comments', () => {
        const out = flattenLayers(
            '@layer a { .a { content: "}"; } /* @layer z { */ }\n@layer b { .b { content: \'{;\' } }\n'
        );
        expect(squash(out)).toBe(
            '.a { content: "}"; } /* @layer z { */ .b { content: \'{;\' }'
        );
    });
});
