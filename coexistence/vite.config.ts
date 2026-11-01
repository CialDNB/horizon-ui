import { mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build, defineConfig } from 'vite';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
// Inside node_modules so the built library resolves react/radix/cva from the
// repo's node_modules, and outside dist/ so it never races `npm run build`.
// A fresh directory per start: Vite caches modules under node_modules by path.
const cacheRoot = join(
    repoRoot,
    'node_modules',
    '.cache',
    'horizon-ui-coexistence'
);

/**
 * The harness consumes the real built library and stylesheet, not src.
 * The build runs while this config is evaluated, so the dev server (started
 * by Playwright's webServer) only exists once the build has finished.
 */
export default defineConfig(async () => {
    rmSync(cacheRoot, { recursive: true, force: true });
    mkdirSync(cacheRoot, { recursive: true });
    const libDir = mkdtempSync(join(cacheRoot, 'dist-'));
    await build({
        configFile: join(repoRoot, 'vite.config.ts'),
        root: repoRoot,
        logLevel: 'warn',
        build: { outDir: libDir, emptyOutDir: true },
    });
    return {
        root: dirname(fileURLToPath(import.meta.url)),
        cacheDir: mkdtempSync(join(tmpdir(), 'horizon-ui-coexistence-vite-')),
        resolve: {
            alias: [
                {
                    find: /^@cialdnb\/horizon-ui\/styles\.css/,
                    replacement: join(libDir, 'styles.css'),
                },
                {
                    find: /^@cialdnb\/horizon-ui$/,
                    replacement: join(libDir, 'index.js'),
                },
            ],
        },
        server: { port: 4173, strictPort: true, fs: { allow: [repoRoot] } },
    };
});
