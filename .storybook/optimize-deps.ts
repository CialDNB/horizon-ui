import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const DEEP_IMPORT =
    /['"](@phosphor-icons\/react\/dist\/csr\/[A-Za-z0-9]+)['"]/g;

function sourceFiles(dir: string): string[] {
    return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        const full = join(dir, entry.name);
        if (entry.isDirectory()) return sourceFiles(full);
        return /\.(ts|tsx)$/.test(entry.name) ? [full] : [];
    });
}

/**
 * Every Phosphor per-icon deep import under `srcDir`, for Vite's
 * `optimizeDeps.include`. Vite discovers deep imports lazily; a new one found
 * mid-run (a branch adding an icon, or a restored CI cache) re-optimises and
 * reloads the page, which fails the Storybook browser tests of that run.
 * Declaring them up front changes the optimiser hash, so Vite rebuilds the
 * dependency bundle before any test starts.
 */
export function phosphorDeepImports(srcDir: string): string[] {
    const found = new Set<string>();
    for (const file of sourceFiles(srcDir))
        for (const match of readFileSync(file, 'utf8').matchAll(DEEP_IMPORT))
            if (match[1]) found.add(match[1]);
    return [...found].sort();
}
