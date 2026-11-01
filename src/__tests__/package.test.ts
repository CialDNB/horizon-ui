import {
    existsSync,
    mkdtempSync,
    rmSync,
    readdirSync,
    readFileSync,
    writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { build } from 'vite';
import { describe, expect, inject, it } from 'vitest';

const root = join(__dirname, '..', '..');
const forbidden = /@mui|@emotion/;

function sourceFiles(dir: string): string[] {
    return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        const full = join(dir, entry.name);
        if (entry.isDirectory()) return sourceFiles(full);
        return /\.(ts|tsx)$/.test(entry.name) ? [full] : [];
    });
}

describe('package', () => {
    it('has no mui or emotion dependency', () => {
        const pkg = JSON.parse(
            readFileSync(join(root, 'package.json'), 'utf8')
        ) as Record<string, Record<string, string> | undefined>;
        const names = [
            ...Object.keys(pkg['dependencies'] ?? {}),
            ...Object.keys(pkg['peerDependencies'] ?? {}),
        ];
        expect(names.filter((n) => forbidden.test(n))).toEqual([]);
    });

    it('src never imports mui or emotion', () => {
        const files = sourceFiles(join(root, 'src'));
        expect(files.length).toBeGreaterThan(0);
        const offenders = files
            .filter((f) => !f.endsWith('package.test.ts'))
            .filter((f) => forbidden.test(readFileSync(f, 'utf8')));
        expect(offenders).toEqual([]);
    });
});

describe('built package (real vite build, scripts/vitest-global-setup.ts)', () => {
    const outDir = inject('buildOutDir');
    const imports = (rel: string) =>
        [
            ...readFileSync(join(outDir, rel), 'utf8').matchAll(
                /\bfrom\s*['"]([^'"]+)['"]/g
            ),
        ].map((m) => m[1]);

    it('does not vendor dependencies into the output', () => {
        expect(existsSync(join(outDir, 'node_modules'))).toBe(false);
    });

    it('imports runtime dependencies by bare specifier', () => {
        expect(imports('components/Button/Button.js')).toEqual(
            expect.arrayContaining([
                'class-variance-authority',
                '@radix-ui/react-slot',
            ])
        );
        expect(imports('lib/cn.js')).toEqual(
            expect.arrayContaining(['clsx', 'tailwind-merge'])
        );
    });

    const pkg = JSON.parse(
        readFileSync(join(root, 'package.json'), 'utf8')
    ) as { exports: Record<string, { types?: string; import?: string }> };
    const built = (target: string) =>
        join(outDir, target.replace(/^\.\/dist\//, ''));

    it.each(['./icons', './illustrations'])(
        'subpath %s resolves to built JS and d.ts files',
        (subpath) => {
            const entry = pkg.exports[subpath];
            expect(entry?.import).toBeDefined();
            expect(entry?.types).toBeDefined();
            expect(existsSync(built(entry?.import ?? ''))).toBe(true);
            expect(existsSync(built(entry?.types ?? ''))).toBe(true);
        }
    );

    it('root entry does not export icons or illustrations', () => {
        const source = readFileSync(join(outDir, 'index.js'), 'utf8');
        expect(source).not.toMatch(/icons|illustrations|phosphor/);
        const types = readFileSync(join(outDir, 'index.d.ts'), 'utf8');
        expect(types).not.toMatch(/icons|illustrations/);
    });

    it('keeps phosphor a bare import in the icons entry', () => {
        expect(imports('icons/index.js')).toContain('@phosphor-icons/react');
    });

    it('one icon from the icons subpath stays small in a consumer bundle', async () => {
        const dir = mkdtempSync(join(tmpdir(), 'hz-consumer-'));
        const entry = join(dir, 'entry.js');
        writeFileSync(
            entry,
            `import { CheckIcon } from ${JSON.stringify(join(outDir, 'icons/index.js'))}; console.log(CheckIcon);`
        );
        let result: Awaited<ReturnType<typeof build>>;
        try {
            result = await build({
                configFile: false,
                logLevel: 'silent',
                root,
                resolve: {
                    alias: {
                        '@phosphor-icons/react': join(
                            root,
                            'node_modules/@phosphor-icons/react/dist/index.es.js'
                        ),
                    },
                },
                build: {
                    write: false,
                    minify: true,
                    lib: { entry, formats: ['es'] },
                    rollupOptions: { external: ['react', 'react/jsx-runtime'] },
                },
            });
        } finally {
            rmSync(dir, { recursive: true, force: true });
        }
        const output = Array.isArray(result) ? result[0] : result;
        const code =
            output !== undefined && 'output' in output
                ? (output.output[0]?.code ?? '')
                : '';
        // Whole set is ~5.5 MB; one icon is ~3 KB.
        expect(code.length).toBeGreaterThan(0);
        expect(code.length).toBeLessThan(50_000);
    }, 60_000);
});
