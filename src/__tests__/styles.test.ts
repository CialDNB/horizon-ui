import { readFileSync } from 'node:fs';
import { describe, expect, inject, it } from 'vitest';
import { buildStylesCss } from '../../scripts/build-styles';
import { breakpoints } from '../tokens/breakpoints';
import { typeScale } from '../tokens/typography';

// Rule assertions run on the same function the Vite plugin emits; one smoke test
// below checks the file `vite build` actually wrote (scripts/vitest-global-setup.ts).
const css = await buildStylesCss();

interface Node {
    prelude: string;
    children: Node[];
    /** Enclosing at-rule preludes, outermost first. */
    ancestors: string[];
    /** Declarations directly inside this block. */
    decls: string[];
}

/** Minimal CSS block parser: enough structure to inspect selectors and nesting. */
function parse(source: string): Node[] {
    const text = source.replace(/\/\*[\s\S]*?\*\//g, '');
    const root: Node = { prelude: '', children: [], ancestors: [], decls: [] };
    const stack: Node[] = [root];
    let buffer = '';
    let quote: string | null = null;
    for (const ch of text) {
        if (quote) {
            buffer += ch;
            if (ch === quote) quote = null;
            continue;
        }
        if (ch === '"' || ch === "'") {
            quote = ch;
            buffer += ch;
        } else if (ch === '{') {
            const parent = stack[stack.length - 1] ?? root;
            const node: Node = {
                prelude: buffer.trim(),
                children: [],
                decls: [],
                ancestors:
                    parent === root
                        ? []
                        : [...parent.ancestors, parent.prelude],
            };
            parent.children.push(node);
            stack.push(node);
            buffer = '';
        } else if (ch === '}') {
            const last = buffer.trim();
            if (last) stack[stack.length - 1]?.decls.push(last);
            stack.pop();
            buffer = '';
        } else if (ch === ';') {
            const statement = buffer.trim();
            const parent = stack[stack.length - 1] ?? root;
            if (statement.startsWith('@')) {
                parent.children.push({
                    prelude: statement,
                    children: [],
                    decls: [],
                    ancestors:
                        parent === root
                            ? []
                            : [...parent.ancestors, parent.prelude],
                });
            } else if (statement) {
                parent.decls.push(statement);
            }
            buffer = '';
        } else {
            buffer += ch;
        }
    }
    return root.children;
}

const walk = (nodes: Node[]): Node[] =>
    nodes.flatMap((n) => [n, ...walk(n.children)]);

const styleRulesOf = (nodes: Node[]): Node[] =>
    walk(nodes).filter(
        (n) =>
            !n.prelude.startsWith('@') &&
            n.children.length === 0 &&
            // declarations inside @property / keyframe steps are not selectors
            !n.ancestors.some((a) => /^@(property|keyframes)\b/.test(a))
    );

const tree = parse(css);
const all = walk(tree);
const styleRules = styleRulesOf(tree);
/**
 * Splits a selector list on top-level commas (not those inside `:where()`, nor
 * escaped ones in arbitrary-value class names such as `.hz\:grid-cols-\[a\,b\]`).
 */
function splitSelectors(list: string): string[] {
    const out: string[] = [];
    let depth = 0;
    let current = '';
    let escaped = false;
    for (const ch of list) {
        if (escaped) {
            current += ch;
            escaped = false;
            continue;
        }
        if (ch === '\\') escaped = true;
        if (ch === '(') depth++;
        if (ch === ')') depth--;
        if (ch === ',' && depth === 0) {
            out.push(current.trim());
            current = '';
        } else {
            current += ch;
        }
    }
    out.push(current.trim());
    return out;
}

const selectors = styleRules.flatMap((r) => splitSelectors(r.prelude));

/**
 * Selectors that declare a custom property without being horizon-owned: only
 * `.hz-root*` scope rules and `.hz\\:` utilities may declare variables.
 */
function foreignVariableDeclarations(source: string): string[] {
    return styleRulesOf(parse(source))
        .filter((r) => r.decls.some((d) => /^--[\w-]+\s*:/.test(d)))
        .flatMap((r) => splitSelectors(r.prelude))
        .filter(
            (sel) =>
                /^(:root|:host|html|\*)/.test(sel) ||
                !(sel.startsWith('.hz-root') || sel.startsWith('.hz\\:'))
        );
}
const slug = (role: string) => role.replace('/', '-');

describe('dist/styles.css', () => {
    it('vite build emits the compiled stylesheet', () => {
        const emitted = readFileSync(inject('stylesCssPath'), 'utf8');
        expect(emitted).toBe(css);
    });

    it('contains no global preflight', () => {
        expect(selectors.length).toBeGreaterThan(0);
        const global =
            /^(html|body|\*|:root|:host|::?before|::?after|::backdrop|button|input|h1|a)\b/;
        expect(selectors.filter((s) => global.test(s))).toEqual([]);
        // Every selector is either scoped under .hz-root or a prefixed hz: utility.
        expect(
            selectors.filter(
                (s) => !s.startsWith('.hz-root') && !s.startsWith('.hz\\:')
            )
        ).toEqual([]);
    });

    it('all rules are inside @layer horizon', () => {
        expect(tree.map((n) => n.prelude)).toEqual(['@layer horizon']);
    });

    it('utilities carry hz prefix', () => {
        expect(css).toContain(`.hz\\:text-${slug('body/default')}`);
        const utilitySelectors = all
            .filter((n) => n.ancestors.includes('@layer utilities'))
            .filter((n) => !n.prelude.startsWith('@'))
            .map((n) => n.prelude);
        expect(utilitySelectors.length).toBeGreaterThan(0);
        for (const s of utilitySelectors) expect(s).toMatch(/^\.hz\\:/);
        // Unprefixed utility names must not be emitted.
        expect(css).not.toMatch(/(^|[\s,}])\.text-body-default\b/m);
    });

    it('defines all 14 typography utilities', () => {
        const roles = Object.keys(typeScale);
        expect(roles).toHaveLength(14);
        for (const role of roles) {
            const name = slug(role);
            const body = styleRules.find(
                (r) =>
                    r.prelude === `.hz\\:text-${name}` &&
                    !r.ancestors.some((a) => a.startsWith('@media'))
            );
            expect(body, `.hz:text-${name}`).toBeDefined();
            const block = css.slice(css.indexOf(`.hz\\:text-${name} {`));
            const decls = block.slice(0, block.indexOf('}'));
            expect(decls).toContain(`font-size: var(--text-${name}-size)`);
            expect(decls).toContain(
                `line-height: var(--text-${name}-line-height)`
            );
            expect(decls).toContain(`font-weight: var(--text-${name}-weight)`);
            expect(decls).toContain('font-family: var(--font-family)');
        }
    });

    it('no :root variable declarations', () => {
        expect(css).not.toMatch(/:root/);
        expect(css).not.toMatch(/:host/);
        expect(foreignVariableDeclarations(css)).toEqual([]);
    });

    it('allows prefixed utilities to declare variables', async () => {
        const withRing = await buildStylesCss(['hz:ring-2', 'hz:shadow-1']);
        expect(withRing).toMatch(/\.hz\\:ring-2 \{\s*--hz-tw-ring-shadow:/);
        expect(foreignVariableDeclarations(withRing)).toEqual([]);
        // The checker itself rejects a global declaration.
        expect(
            foreignVariableDeclarations(
                ':root { --primary: red; } * { --x: 1 }'
            )
        ).toEqual([':root', '*']);
    });

    it('never uses the shared --tw- variable namespace', () => {
        expect(css).not.toContain('--tw-');
    });

    it('reduced motion media query present', () => {
        const reduced = all.filter((n) =>
            /^@media\s*\(prefers-reduced-motion:\s*reduce\)/.test(n.prelude)
        );
        expect(reduced.length).toBeGreaterThan(0);
        const inner = walk(reduced).filter((n) => !n.prelude.startsWith('@'));
        for (const n of inner) expect(n.prelude).toMatch(/^\.hz-root/);
    });

    it('defines tablet, laptop, desktop breakpoints at 768, 1280, 1920px and no sm/md/lg/xl', () => {
        expect(breakpoints).toEqual({
            mobile: 0,
            tablet: 768,
            laptop: 1280,
            desktop: 1920,
        });
        const media = all
            .map((n) => n.prelude)
            .filter((p) => p.startsWith('@media') && /width/.test(p));
        for (const px of [768, 1280, 1920]) {
            const query = new RegExp(
                `^@media \\((min-width: ${px}px|width >= ${px}px)\\)$`
            );
            expect(
                media.some((m) => query.test(m)),
                `${px}px`
            ).toBe(true);
        }
        for (const name of ['tablet', 'laptop', 'desktop']) {
            expect(css).toContain(
                `.hz\\:${name}\\:text-${slug('body/default')}`
            );
        }
        // Tailwind defaults: sm 40rem, md 48rem, lg 64rem, xl 80rem, 2xl 96rem.
        expect(css).not.toMatch(/(40|48|64|80|96)rem\)/);
        expect(css).not.toMatch(/\.hz\\:(sm|md|lg|xl|2xl)\\:/);
    });
});
