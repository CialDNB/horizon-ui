import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';
import type { TestProject } from 'vitest/node';

declare module 'vitest' {
    export interface ProvidedContext {
        /** `styles.css` emitted by a real `vite build` for this test run. */
        stylesCssPath: string;
        /** Output directory of that build (the would-be `dist/`). */
        buildOutDir: string;
    }
}

/**
 * Runs a real `vite build` once per test run so tests can check what the build
 * emits. It builds into a fresh temp dir, never `dist/`, so it cannot race a
 * concurrent `npm run build` or another vitest process.
 */
export default async function setup(project: TestProject) {
    const outDir = mkdtempSync(join(tmpdir(), 'horizon-ui-build-'));
    await build({
        configFile: fileURLToPath(
            new URL('../vite.config.ts', import.meta.url)
        ),
        logLevel: 'warn',
        build: { outDir, emptyOutDir: true },
    });
    project.provide('stylesCssPath', join(outDir, 'styles.css'));
    project.provide('buildOutDir', outDir);
    return () => rmSync(outDir, { recursive: true, force: true });
}
