import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';

const srcDir = join(__dirname, '..');

function files(dir: string): string[] {
    return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        const full = join(dir, entry.name);
        if (entry.isDirectory()) return files(full);
        return /\.(ts|tsx)$/.test(entry.name) ? [full] : [];
    });
}

const all = files(srcDir);
const rel = (f: string) => relative(srcDir, f);
const importSpecifiers = (source: string) =>
    [...source.matchAll(/(?:from|import)\s*\(?\s*['"]([^'"]+)['"]/g)].map(
        (m) => m[1] ?? ''
    );
const isTest = (f: string) =>
    /\.(test|stories)\.tsx?$/.test(f) || f.includes('__tests__');

describe('architecture', () => {
    it('tokens and lib import no components', () => {
        const lower = all.filter(
            (f) => /^(tokens|lib)\//.test(rel(f)) && !isTest(f)
        );
        const offenders = lower.filter((f) =>
            importSpecifiers(readFileSync(f, 'utf8')).some((s) =>
                /(^|\/)(components|provider|primitives)(\/|$)/.test(s)
            )
        );
        expect(offenders.map(rel)).toEqual([]);
    });

    it('no deep imports across component folders', () => {
        const components = all.filter((f) =>
            /^components\/[^/]+\//.test(rel(f))
        );
        const offenders = components.flatMap((f) => {
            const own = rel(f).split('/')[1];
            return importSpecifiers(readFileSync(f, 'utf8'))
                .filter((s) => s.startsWith('.'))
                .map((s) => ({
                    s,
                    target: relative(srcDir, resolve(dirname(f), s)).split('/'),
                }))
                .filter(
                    ({ target }) =>
                        target[0] === 'components' &&
                        target[1] !== undefined &&
                        target[1] !== own &&
                        target.length > 2
                )
                .map(({ s }) => `${rel(f)} -> ${s}`);
        });
        expect(offenders).toEqual([]);
    });

    it('src has no default exports', () => {
        const checked = all.filter((f) => !/\.stories\.tsx?$/.test(f));
        expect(checked.length).toBeGreaterThan(0);
        const offenders = checked.filter((f) =>
            /\bexport\s+default\b|export\s*\{[^}]*\bas\s+default\b/m.test(
                readFileSync(f, 'utf8')
            )
        );
        expect(offenders.map(rel)).toEqual([]);
    });

    describe('public API', () => {
        let api: Record<string, unknown>;
        // The test body takes ~200 ms; the first import of src/index.ts is slow
        // because it cold-transforms every Radix-based component, and that
        // stretches under parallel load. The hook timeout covers that, not the test.
        beforeAll(async () => {
            api = await import('../index');
        }, 30_000);

        it('matches snapshot', () => {
            expect(Object.keys(api).sort()).toMatchInlineSnapshot(`
              [
                "Badge",
                "BadgeAnchor",
                "Button",
                "Chip",
                "HorizonProvider",
                "Spinner",
                "Typography",
                "badgeVariants",
                "buttonVariants",
                "chipVariants",
                "cn",
                "spinnerVariants",
                "typographyVariants",
                "usePortalContainer",
              ]
            `);
        });
    });
});
