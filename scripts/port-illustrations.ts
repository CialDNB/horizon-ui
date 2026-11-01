import {
    mkdirSync,
    readdirSync,
    readFileSync,
    rmSync,
    writeFileSync,
} from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { format, resolveConfig } from 'prettier';

/*
 * Generates one typed React component per brand SVG in
 * src/illustrations/assets/{cial,il}/. The artwork (elements, attributes, path
 * data, colours) is copied token for token: only attribute names are converted
 * to their JSX spelling, and `id`/`url(#id)` references are made per-instance
 * with a `useSvgId` prefix. Anything the transform does not know is an error,
 * never silently dropped. Deterministic, so re-running is a no-op.
 */

const brands = ['cial', 'il'] as const;
type Brand = (typeof brands)[number];

const ELEMENTS = new Set([
    'svg',
    'g',
    'path',
    'rect',
    'circle',
    'defs',
    'clipPath',
    'mask',
]);
const ATTRS = new Set([
    'd',
    'fill',
    'fill-rule',
    'clip-rule',
    'fill-opacity',
    'stroke',
    'stroke-miterlimit',
    'stroke-linejoin',
    'stroke-linecap',
    'stroke-width',
    'opacity',
    'id',
    'transform',
    'clip-path',
    'mask',
    'maskUnits',
    'style',
    'x',
    'y',
    'rx',
    'r',
    'cx',
    'cy',
    'width',
    'height',
]);
const ROOT_ATTRS = new Set(['width', 'height', 'viewBox', 'fill', 'xmlns']);
const camel = (s: string) =>
    s.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());

/** `empty-state` -> `EmptyState`; an all-caps part (`DAA`) is kept; `il` brand adds `IL`. */
export function componentName(file: string, brand: Brand): string {
    const base = file.replace(/\.svg$/, '');
    const stem = brand === 'il' ? base.replace(/-il$/, '') : base;
    const pascal = stem
        .split('-')
        .map((p) =>
            p === p.toUpperCase() ? p : p[0]?.toUpperCase() + p.slice(1)
        )
        .join('');
    return brand === 'il' ? `${pascal}IL` : pascal;
}

const withIds = (value: string): { text: string; dynamic: boolean } => {
    const dynamic = /url\(#/.test(value);
    return {
        text: value.replace(/url\(#([^)]+)\)/g, 'url(#${uid}$1)'),
        dynamic,
    };
};

function attrToJsx(el: string, name: string, value: string): string {
    if (name === 'id') return `id={\`\${uid}${value}\`}`;
    if (name === 'style') {
        const decls = value
            .split(';')
            .filter((d) => d.trim())
            .map((d) => {
                const [k, v] = d.split(':').map((s) => s.trim());
                if (!k || v === undefined)
                    throw new Error(`bad style: ${value}`);
                return `${camel(k)}: ${JSON.stringify(v)}`;
            });
        return `style={{ ${decls.join(', ')} }}`;
    }
    const jsxName = camel(name);
    const { text, dynamic } = withIds(value);
    if (dynamic) return `${jsxName}={\`${text}\`}`;
    if (/["{}`\\]/.test(value))
        throw new Error(`<${el} ${name}> value needs escaping`);
    return `${jsxName}="${value}"`;
}

interface Converted {
    jsx: string;
    usesId: boolean;
    root: { viewBox: string; width: number; height: number };
}

export function convertSvg(source: string, label: string): Converted {
    const tag = /<(\/?)([A-Za-z]+)((?:\s+[A-Za-z:-]+="[^"]*")*)\s*(\/?)>/g;
    const out: string[] = [];
    const stack: string[] = [];
    let usesId = false;
    let pos = 0;
    let root: Converted['root'] | undefined;
    let match: RegExpExecArray | null;
    while ((match = tag.exec(source))) {
        const between = source.slice(pos, match.index);
        if (between.trim())
            throw new Error(`${label}: unexpected text "${between.trim()}"`);
        pos = tag.lastIndex;
        const [, closing, el = '', rawAttrs = '', selfClosing] = match;
        if (!ELEMENTS.has(el))
            throw new Error(`${label}: unsupported element <${el}>`);
        if (closing) {
            if (stack.pop() !== el)
                throw new Error(`${label}: mismatched </${el}>`);
            out.push(el === 'svg' ? '</IllustrationFrame>' : `</${el}>`);
            continue;
        }
        const attrs = [...rawAttrs.matchAll(/([A-Za-z:-]+)="([^"]*)"/g)].map(
            (m) => [m[1] ?? '', m[2] ?? ''] as const
        );
        if (el === 'svg') {
            if (stack.length || root)
                throw new Error(`${label}: nested/multiple <svg>`);
            const map = new Map(attrs);
            for (const [name] of attrs)
                if (!ROOT_ATTRS.has(name))
                    throw new Error(`${label}: unsupported <svg ${name}>`);
            if (map.get('fill') !== 'none')
                throw new Error(`${label}: root fill is not none`);
            root = {
                viewBox: map.get('viewBox') ?? '',
                width: Number(map.get('width')),
                height: Number(map.get('height')),
            };
            if (!root.viewBox || !root.width || !root.height)
                throw new Error(`${label}: root needs width, height, viewBox`);
            out.push(
                `<IllustrationFrame ref={ref} intrinsic={{ viewBox: ${JSON.stringify(root.viewBox)}, width: ${root.width}, height: ${root.height} }} {...props}>`
            );
            stack.push('svg');
            continue;
        }
        if (!root) throw new Error(`${label}: content before <svg>`);
        const jsxAttrs = attrs.map(([n, v]) => {
            if (!ATTRS.has(n))
                throw new Error(`${label}: unsupported <${el} ${n}>`);
            if (n === 'id' || /url\(#/.test(v)) usesId = true;
            return attrToJsx(el, n, v);
        });
        const open = `<${el}${jsxAttrs.length ? ` ${jsxAttrs.join(' ')}` : ''}`;
        if (selfClosing) out.push(`${open} />`);
        else {
            out.push(`${open}>`);
            stack.push(el);
        }
    }
    if (source.slice(pos).trim()) throw new Error(`${label}: trailing content`);
    if (stack.length || !root) throw new Error(`${label}: unbalanced`);
    return { jsx: out.join(''), usesId, root };
}

async function render(
    root: string,
    brand: Brand,
    file: string
): Promise<[string, string]> {
    const name = componentName(file, brand);
    const rel = `src/illustrations/assets/${brand}/${file}`;
    const { jsx, usesId } = convertSvg(
        readFileSync(join(root, rel), 'utf8'),
        rel
    );
    const label = brand === 'cial' ? 'CIAL' : 'IL';
    const code = `/* Generated by scripts/port-illustrations.ts from ${rel}. Do not edit. */
import { forwardRef } from 'react';
import type { IllustrationProps } from '../Illustration.types';
import { IllustrationFrame } from '../IllustrationFrame';
${usesId ? "import { useSvgId } from '../useSvgId';\n" : ''}
/**
 * ${label} illustration \`${file.replace(/\.svg$/, '')}\`. Decorative (\`aria-hidden\`)
 * unless \`title\` or \`aria-label\` is set.
 */
export const ${name} = forwardRef<SVGSVGElement, IllustrationProps>(
    function ${name}(props, ref) {
        ${usesId ? 'const uid = useSvgId();\n' : ''}return (${jsx});
    }
);
${name}.displayName = '${name}';
`;
    return [`${name}.tsx`, code];
}

/** Generates `src/illustrations/generated/*` under `root`; returns file name -> content. */
export async function generate(root: string): Promise<Map<string, string>> {
    const files = new Map<string, string>();
    const names = new Set<string>();
    for (const brand of brands) {
        const dir = join(root, 'src/illustrations/assets', brand);
        for (const file of readdirSync(dir)
            .filter((f) => f.endsWith('.svg'))
            .sort()) {
            const [name, code] = await render(root, brand, file);
            if (names.has(name)) throw new Error(`duplicate component ${name}`);
            names.add(name);
            files.set(name, code);
        }
    }
    const exports = [...names]
        .sort()
        .map(
            (n) =>
                `export { ${n.replace(/\.tsx$/, '')} } from './${n.replace(/\.tsx$/, '')}';`
        );
    files.set(
        'index.ts',
        `/* Generated by scripts/port-illustrations.ts. Do not edit. */\n${exports.join('\n')}\n`
    );
    const sample = join(root, 'src/illustrations/generated/x.tsx');
    const config = (await resolveConfig(sample)) ?? {};
    for (const [name, code] of files)
        files.set(
            name,
            await format(code, {
                ...config,
                filepath: join(dirname(sample), name),
            })
        );
    return files;
}

async function main() {
    const root = join(dirname(fileURLToPath(import.meta.url)), '..');
    const files = await generate(root);
    const outDir = join(root, 'src/illustrations/generated');
    rmSync(outDir, { recursive: true, force: true });
    mkdirSync(outDir, { recursive: true });
    for (const [name, code] of files) writeFileSync(join(outDir, name), code);
    console.warn(`port-illustrations: wrote ${files.size} files`);
}

if (
    process.argv[1] !== undefined &&
    import.meta.url === pathToFileURL(process.argv[1]).href
) {
    await main();
}
