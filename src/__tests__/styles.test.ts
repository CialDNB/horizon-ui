import { readFileSync } from 'node:fs';
import { describe, expect, inject, it } from 'vitest';
import { buildStylesCss } from '../../scripts/build-styles';
import { breakpoints } from '../tokens/breakpoints';
import { typeScale } from '../tokens/typography';

// Rule assertions run on the same function the Vite plugin emits; one smoke test
// below checks the file `vite build` actually wrote (scripts/vitest-global-setup.ts).
const css = await buildStylesCss();
const unlayeredCss = await buildStylesCss([], { layered: false });

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

/** Every style rule, @media/@supports block and @property/@keyframes, with
 * enclosing @layer blocks removed from its ancestry, in document order. */
const normalizedRules = (source: string): string[] =>
    walk(parse(source))
        .filter((n) => !n.prelude.startsWith('@layer'))
        .map((n) =>
            [
                n.ancestors.filter((a) => !a.startsWith('@layer')).join(' > '),
                n.prelude,
                n.decls.join('; '),
            ].join(' | ')
        );

/**
 * Specificity (a, b, c) of a simple selector. `:where()` counts zero, `:is()`
 * counts its most specific argument; enough for the selectors this build emits.
 */
function specificity(selector: string): [number, number, number] {
    let s = selector.replace(/\\./g, 'x');
    s = s.replace(/:where\((?:[^()]|\([^()]*\))*\)/g, '');
    let b = 0;
    let c = 0;
    s = s.replace(/:is\(((?:[^()]|\([^()]*\))*)\)/g, (_, inner: string) => {
        const best = splitSelectors(inner)
            .map(specificity)
            .sort((x, y) => y[1] - x[1] || y[2] - x[2])[0];
        b += best?.[1] ?? 0;
        c += best?.[2] ?? 0;
        return '';
    });
    s = s.replace(/:not\(((?:[^()]|\([^()]*\))*)\)/g, (_, inner: string) => {
        const [, nb, nc] = specificity(inner);
        b += nb;
        c += nc;
        return '';
    });
    const a = (s.match(/#[\w-]+/g) ?? []).length;
    b += (s.match(/\.[\w-]+/g) ?? []).length;
    b += (s.match(/\[[^\]]*\]/g) ?? []).length;
    s = s.replace(/\[[^\]]*\]/g, '');
    c += (
        s.match(
            /::?(before|after|backdrop|placeholder|file-selector-button)\b/g
        ) ?? []
    ).length;
    s = s.replace(
        /::?(before|after|backdrop|placeholder|file-selector-button)\b/g,
        ''
    );
    b += (s.match(/:[\w-]+/g) ?? []).length;
    c += (s.replace(/[.:#][\w-]+/g, '').match(/(^|[\s>+~])[a-z][\w-]*/gi) ?? [])
        .length;
    return [a, b, c];
}

describe('dist/styles.unlayered.css (legacy hosts, ADR 0001)', () => {
    const tree2 = parse(unlayeredCss);
    const rules2 = styleRulesOf(tree2);
    const selectors2 = rules2.flatMap((r) => splitSelectors(r.prelude));
    const preludes = rules2.map((r) => r.prelude);

    it('vite build emits the unlayered stylesheet', () => {
        const emitted = readFileSync(inject('stylesUnlayeredCssPath'), 'utf8');
        expect(emitted).toBe(unlayeredCss);
    });

    it('unlayered build contains no @layer', () => {
        expect(unlayeredCss).not.toMatch(/@layer\b/);
        expect(walk(tree2).some((n) => n.prelude.startsWith('@layer'))).toBe(
            false
        );
        expect(rules2.length).toBeGreaterThan(0);
    });

    it('unlayered build has the same rule set as the layered build modulo the layer wrapper', () => {
        const layered = normalizedRules(css);
        expect(layered.length).toBeGreaterThan(100);
        expect(normalizedRules(unlayeredCss)).toEqual(layered);
        expect(unlayeredCss.startsWith('/*! tailwindcss')).toBe(true);
    });

    it('unlayered build keeps cascade order: base before utilities, breakpoints after base utilities', () => {
        const at = (prelude: string) => {
            const i = preludes.indexOf(prelude);
            expect(i, prelude).toBeGreaterThanOrEqual(0);
            return i;
        };
        const theme = rules2.findIndex((r) =>
            r.decls.some((d) => d.startsWith('--hz-grey-50:'))
        );
        const base = at(
            '.hz-root :where(button, input, select, optgroup, textarea)'
        );
        const firstUtility = preludes.findIndex((p) => p.startsWith('.hz\\:'));
        expect(theme).toBeGreaterThanOrEqual(0);
        expect(theme).toBeLessThan(base);
        expect(base).toBeLessThan(firstUtility);
        // Nothing from theme/base (all `.hz-root` rules) follows a utility.
        expect(
            preludes.slice(firstUtility).filter((p) => p.startsWith('.hz-root'))
        ).toEqual([]);

        // Each variant rule follows the rule of the utility it modifies.
        const variant =
            /^\.hz\\:((?:(?:tablet|laptop|desktop|hover|touch-hover|focus-visible|focus|active|inactive|aria-busy|pointer-fine)\\:)+)([\w-]+)/;
        const pairs = preludes.flatMap((p, i) => {
            const m = variant.exec(p);
            const base2 = m ? preludes.indexOf(`.hz\\:${m[2]}`) : -1;
            return base2 >= 0 ? [{ p, i, base: base2 }] : [];
        });
        expect(pairs.length).toBeGreaterThanOrEqual(5);
        for (const { p, i, base: b } of pairs)
            expect(b, `${p} after its base utility`).toBeLessThan(i);

        // Breakpoint blocks: after every unprefixed utility, in min-width order.
        const media = walk(tree2).map((n) => n.prelude);
        const mediaAt = (px: number) =>
            media.findIndex((p) =>
                new RegExp(
                    `^@media \\((min-width: ${px}px|width >= ${px}px)\\)$`
                ).test(p)
            );
        const allIdx = walk(tree2).map((n) => n.prelude);
        const lastTypeUtility = allIdx.lastIndexOf('.hz\\:text-label-md');
        expect(lastTypeUtility).toBeGreaterThanOrEqual(0);
        expect(mediaAt(768)).toBeGreaterThan(lastTypeUtility);
        expect(mediaAt(1280)).toBeGreaterThan(mediaAt(768));
        expect(mediaAt(1920)).toBeGreaterThan(mediaAt(1280));
    });

    it('unlayered build: theme and base rules never out-rank utilities', () => {
        // Without a layer, the reset competes with utilities by specificity:
        // it must stay at (0,1,0), or (0,1,1) where it targets a pseudo-element.
        const firstUtility = preludes.findIndex((p) => p.startsWith('.hz\\:'));
        const early = rules2
            .slice(0, firstUtility)
            .filter((r) => !r.decls.every((d) => d.startsWith('--')));
        expect(early.length).toBeGreaterThan(3);
        for (const sel of early.flatMap((r) => splitSelectors(r.prelude))) {
            const [a, b, c] = specificity(sel);
            const pseudoElement =
                /::?(before|after|backdrop|placeholder|file-selector-button)/.test(
                    sel
                );
            expect([a, b, c], sel).toEqual([0, 1, pseudoElement ? 1 : 0]);
        }
        // Utilities beat Bootstrap reboot element selectors by specificity.
        expect(specificity('.hz\\:rounded-lg')).toEqual([0, 1, 0]);
        expect(
            specificity('.hz\\:focus-visible\\:outline-2:focus-visible')
        ).toEqual([0, 2, 0]);
        expect(specificity('button:focus')).toEqual([0, 1, 1]);
        expect(specificity('.hz-root :where(button, input)')).toEqual([
            0, 1, 0,
        ]);
    });

    it('unlayered build: Button state utilities out-rank Bootstrap reboot pseudo-class rules', () => {
        // Reboot: `button:focus { outline: 5px auto -webkit-focus-ring-color }`
        // (0,1,1) and `[type="button"]:not(:disabled) { cursor: pointer }`
        // (0,2,0). Equal specificity would make the result depend on load order.
        const beats = (sel: string, other: [number, number, number]) => {
            const [a, b, c] = specificity(sel);
            return (
                a > other[0] ||
                (a === other[0] &&
                    (b > other[1] || (b === other[1] && c > other[2])))
            );
        };
        const utilitySelectors = (decl: RegExp) =>
            rules2
                .filter((r) => r.prelude.startsWith('.hz\\:'))
                .filter((r) => r.decls.some((d) => decl.test(d)))
                .flatMap((r) => splitSelectors(r.prelude));
        // Focus-state outline utilities (the unconditional `outline-ring` only
        // pre-sets the colour so it does not transition in).
        const outline = utilitySelectors(
            /^outline-(color|style|width)\b/
        ).filter((sel) => /:focus(-visible)?\b/.test(sel));
        const cursor = utilitySelectors(/^cursor:\s*progress/);
        for (const prop of ['color', 'style', 'width'])
            expect(
                utilitySelectors(new RegExp(`^outline-${prop}\\b`)).some(
                    (sel) => sel.endsWith(':focus-visible')
                ),
                `focus-visible outline-${prop}`
            ).toBe(true);
        expect(outline.length).toBeGreaterThanOrEqual(4);
        expect(cursor.length).toBeGreaterThanOrEqual(1);
        for (const sel of outline)
            expect(beats(sel, [0, 1, 1]), sel).toBe(true);
        for (const sel of cursor) expect(beats(sel, [0, 2, 0]), sel).toBe(true);
    });

    it('unlayered build still has no preflight or global selectors', () => {
        expect(selectors2.length).toBeGreaterThan(0);
        const global =
            /^(html|body|\*|:root|:host|::?before|::?after|::backdrop|button|input|h1|a)\b/;
        expect(selectors2.filter((s) => global.test(s))).toEqual([]);
        expect(
            selectors2.filter(
                (s) => !s.startsWith('.hz-root') && !s.startsWith('.hz\\:')
            )
        ).toEqual([]);
        expect(unlayeredCss).not.toMatch(/:root|:host/);
        expect(foreignVariableDeclarations(unlayeredCss)).toEqual([]);
        expect(unlayeredCss).not.toContain('--tw-');
        expect(unlayeredCss).toContain(`.hz\\:text-${slug('body/default')}`);
        expect(unlayeredCss).not.toMatch(/(^|[\s,}])\.text-body-default\b/m);
        // Type sizes stay px (a 14px host root must not shrink them).
        const sizes = [
            ...unlayeredCss.matchAll(/--text-[\w-]+-size:\s*([^;]+);/g),
        ].map((m) => m[1]);
        expect(sizes.length).toBeGreaterThanOrEqual(14);
        for (const v of sizes) expect(v).toMatch(/^\d+(\.\d+)?px$/);
        // @property registrations and the reduced-motion rule are kept.
        const props = (s: string) => s.match(/@property --hz-tw-[\w-]+/g) ?? [];
        expect(props(unlayeredCss)).toEqual(props(css));
        expect(props(unlayeredCss).length).toBeGreaterThan(0);
        expect(unlayeredCss).toMatch(
            /@media \(prefers-reduced-motion: reduce\) \{\s*\.hz-root, \.hz-root \*/
        );
    });

    it('unlayered build forced utilities keep the --hz-tw- rename and scoped fallback', async () => {
        const withRing = await buildStylesCss(['hz:ring-2', 'hz:shadow-1'], {
            layered: false,
        });
        expect(withRing).not.toMatch(/@layer\b/);
        expect(withRing).not.toContain('--tw-');
        expect(withRing).toMatch(/\.hz\\:ring-2 \{\s*--hz-tw-ring-shadow:/);
        expect(foreignVariableDeclarations(withRing)).toEqual([]);
        expect(withRing).not.toMatch(/(^\s*|,\s*)\*\s*[,{]/m);
    });
});

describe('keyframes are namespaced (no global animation names)', () => {
    const keyframeNames = (source: string) =>
        [...source.matchAll(/@keyframes\s+([\w-]+)/g)].map((m) => m[1]);
    const builds = [
        ['layered', css],
        ['unlayered', unlayeredCss],
    ] as const;

    for (const [name, source] of builds) {
        it(`${name} build: every @keyframes name starts with hz-`, () => {
            const names = keyframeNames(source);
            expect(names.length).toBeGreaterThan(0);
            for (const n of names) expect(n).toMatch(/^hz-/);
        });

        it(`${name} build: animate-spin references hz-spin`, () => {
            const rule = styleRulesOf(parse(source)).find(
                (r) => r.prelude === '.hz\\:animate-spin'
            );
            // Lightning CSS may reorder the shorthand (`1s linear infinite hz-spin`).
            expect(rule?.decls).toEqual([
                expect.stringMatching(
                    /^animation: (?=.*(^|\s)hz-spin(\s|$))(?!.*(^|\s)spin(\s|$))/
                ),
            ]);
            expect(keyframeNames(source)).toContain('hz-spin');
        });
    }

    it('renames every Tailwind animation (definitions and references) in both builds', async () => {
        const extra = [
            'hz:animate-ping',
            'hz:animate-pulse',
            'hz:animate-bounce',
        ];
        for (const layered of [true, false]) {
            const out = await buildStylesCss(extra, { layered });
            const names = keyframeNames(out);
            expect(names).toEqual(
                expect.arrayContaining([
                    'hz-spin',
                    'hz-ping',
                    'hz-pulse',
                    'hz-bounce',
                ])
            );
            for (const n of names) expect(n).toMatch(/^hz-/);
            const keywords =
                /^(linear|infinite|ease(-in|-out|-in-out)?|normal|reverse|alternate(-reverse)?|forwards|backwards|both|none|running|paused|step-(start|end)|initial|inherit|unset)$/;
            const animationNames = [
                ...out.matchAll(/animation(?:-name)?:\s*([^;}]+)/g),
            ].flatMap((m) =>
                (m[1] ?? '')
                    .replace(/[\w-]+\([^)]*\)/g, ' ')
                    .split(/[\s,]+/)
                    .filter((t) => /^[a-z_-][\w-]*$/i.test(t))
                    .filter((t) => !keywords.test(t))
            );
            expect(animationNames.length).toBeGreaterThanOrEqual(4);
            for (const n of animationNames) expect(n).toMatch(/^hz-/);
        }
    });
});
