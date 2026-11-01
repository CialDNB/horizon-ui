import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { compile, optimize } from '@tailwindcss/node';
import { Scanner } from '@tailwindcss/oxide';

const entry = join(
    dirname(fileURLToPath(import.meta.url)),
    '..',
    'src',
    'styles',
    'index.css'
);

// Tailwind's @property fallback for browsers without @property support targets
// every element. Re-scope it so horizon-ui never sets variables outside its tree.
const GLOBAL_PROPERTIES_FALLBACK = '*, ::before, ::after, ::backdrop {';
const SCOPED_PROPERTIES_FALLBACK =
    '.hz-root, .hz-root *, .hz-root ::before, .hz-root ::after, .hz-root ::backdrop {';

/**
 * Compiles src/styles/index.css into the stylesheet shipped as
 * `dist/styles.css`: candidates scanned from src, Tailwind output re-scoped and
 * wrapped in a single `@layer horizon`, then lowered with Lightning CSS.
 * `extraCandidates` lets tests force utilities no component uses yet.
 */
export async function buildStylesCss(
    extraCandidates: readonly string[] = []
): Promise<string> {
    const compiler = await compile(readFileSync(entry, 'utf8'), {
        base: dirname(entry),
        onDependency: () => undefined,
    });
    const candidates = [
        ...new Scanner({ sources: compiler.sources }).scan(),
        ...extraCandidates,
    ];
    const raw = compiler.build(candidates);
    // Lightning CSS drops comments; the MIT licence banner is re-added on top.
    const banner = /^\/\*![^*]*\*\/\n/.exec(raw)?.[0] ?? '';
    const scoped = raw
        .slice(banner.length)
        .split(GLOBAL_PROPERTIES_FALLBACK)
        .join(SCOPED_PROPERTIES_FALLBACK);
    const { code } = optimize(`@layer horizon {\n${scoped}\n}\n`, {
        minify: false,
    });
    return banner + code;
}
