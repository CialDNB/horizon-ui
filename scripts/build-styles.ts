import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
// tailwindcss, @tailwindcss/node and @tailwindcss/oxide are pinned to the same
// exact version in package.json (JSON cannot carry this comment). Upgrade all
// three together, then run scripts/__tests__/build-styles.test.ts: it guards the
// @property fallback rewrite and the --tw- rename against Tailwind output changes.
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
// Tailwind's internal variables (`--tw-shadow`, `--tw-ring-color`, ...) are not
// prefixed by prefix(hz). A consumer Tailwind v3 sets the same names on `*`
// (unlayered, so it beats us) and a consumer Tailwind v4 registers them with
// @property. Renaming them gives horizon-ui a private namespace (ADR 0001).
const TAILWIND_VAR = /--tw-/g;
const HORIZON_TAILWIND_VAR = '--hz-tw-';

const GLOBAL_PROPERTIES_FALLBACK = '*, ::before, ::after, ::backdrop {';
const SCOPED_PROPERTIES_FALLBACK =
    '.hz-root, .hz-root *, .hz-root ::before, .hz-root ::after, .hz-root ::backdrop {';

/** Options for {@link buildStylesCss}. */
export interface BuildStylesOptions {
    /**
     * `true` (default): everything inside `@layer horizon` (`dist/styles.css`).
     * `false`: the same rules with every `@layer` flattened away
     * (`dist/styles.unlayered.css`), for hosts with unlayered global element
     * CSS such as Bootstrap reboot, which beats any layer (ADR 0001).
     */
    layered?: boolean;
}

/**
 * Compiles src/styles/index.css into the stylesheet shipped as
 * `dist/styles.css`: candidates scanned from src, Tailwind output re-scoped,
 * its `--tw-*` variables renamed to `--hz-tw-*`, wrapped in a single
 * `@layer horizon`, then lowered with Lightning CSS. With `layered: false` the
 * lowered output is passed through {@link flattenLayers}.
 * `extraCandidates` lets tests force utilities no component uses yet.
 */
export async function buildStylesCss(
    extraCandidates: readonly string[] = [],
    { layered = true }: BuildStylesOptions = {}
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
        .join(SCOPED_PROPERTIES_FALLBACK)
        .replace(TAILWIND_VAR, HORIZON_TAILWIND_VAR);
    const { code } = optimize(`@layer horizon {\n${scoped}\n}\n`, {
        minify: false,
    });
    return banner + (layered ? code : flattenLayers(code));
}

interface Item {
    /** `@layer` name for a layer block, `null` for any other statement/block. */
    layer: string | null;
    text: string;
}

/**
 * Splits CSS into its top-level statements and blocks. Strings and comments
 * are copied verbatim, so braces or semicolons inside them do not count.
 * `@layer a, b;` statements yield one empty layer item per name.
 */
function topLevelItems(css: string): Item[] {
    const items: Item[] = [];
    let depth = 0;
    let start = 0;
    let bodyStart = -1;
    for (let i = 0; i < css.length; i++) {
        const ch = css[i];
        if (ch === '"' || ch === "'") {
            const end = css.indexOf(ch, i + 1);
            i = end < 0 ? css.length : end;
        } else if (ch === '/' && css[i + 1] === '*') {
            const end = css.indexOf('*/', i + 2);
            i = end < 0 ? css.length : end + 1;
        } else if (ch === '{') {
            if (depth === 0) bodyStart = i;
            depth++;
        } else if (ch === '}') {
            depth--;
            if (depth === 0) {
                const prelude = css.slice(start, bodyStart).trim();
                const layer = /^@layer\s+([\w.-]+)$/.exec(prelude)?.[1];
                items.push(
                    layer
                        ? { layer, text: css.slice(bodyStart + 1, i) }
                        : { layer: null, text: css.slice(start, i + 1) }
                );
                start = i + 1;
            }
        } else if (ch === ';' && depth === 0) {
            const statement = css.slice(start, i).trim();
            const names = /^@layer\s+(.+)$/.exec(statement)?.[1];
            if (names)
                for (const layer of names.split(','))
                    items.push({ layer: layer.trim(), text: '' });
            else items.push({ layer: null, text: css.slice(start, i + 1) });
            start = i + 1;
        }
    }
    const rest = css.slice(start);
    if (rest.trim()) items.push({ layer: null, text: rest });
    return items;
}

/** Removes the common leading indentation of non-blank lines. */
function dedent(text: string): string {
    const lines = text.split('\n').filter((l) => l.trim());
    const indent = Math.min(
        ...lines.map((l) => /^ */.exec(l)?.[0].length ?? 0)
    );
    return text
        .split('\n')
        .map((l) => l.slice(Math.min(indent, /^ */.exec(l)?.[0].length ?? 0)))
        .join('\n')
        .trim();
}

/**
 * Removes every `@layer` (blocks, statements, nested layers) while keeping the
 * cascade the layers expressed: layer contents are emitted in layer order
 * (first declaration, as the cascade ranks them; Tailwind's raw output lists
 * `utilities` text before `theme`), repeated blocks of one layer join at its
 * first position, and unlayered statements of a scope come after its layers,
 * where the cascade ranks them. The flattened rules then compete by
 * specificity and order; the build keeps the `.hz-root` reset at (0,1,0) so
 * utilities, which follow it, still win (asserted in styles.test.ts).
 */
export function flattenLayers(css: string): string {
    const order: string[] = [];
    const layers = new Map<string, string[]>();
    const unlayered: string[] = [];
    for (const item of topLevelItems(css)) {
        if (item.layer === null) {
            if (item.text.trim()) unlayered.push(dedent(item.text));
            continue;
        }
        if (!layers.has(item.layer)) {
            order.push(item.layer);
            layers.set(item.layer, []);
        }
        const body = flattenLayers(item.text).trim();
        if (body) layers.get(item.layer)?.push(body);
    }
    const parts = [
        ...order.flatMap((name) => layers.get(name) ?? []),
        ...unlayered,
    ];
    return parts.length ? `${parts.join('\n\n')}\n` : '';
}
