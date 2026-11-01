import { readdirSync, readFileSync, statSync } from 'node:fs';
import { basename, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

/*
 * Counts how a consumer app imports @cialdnb/x-core. Uses the TypeScript
 * compiler API (no regex over source), so aliases, type-only imports,
 * re-exports and dynamic import() calls are all seen. Run:
 *   tsx scripts/usage-report.ts <client-dir> [--x-core <x-core-dir>] [--json]
 * With --x-core, names imported from the `components` barrel are mapped to
 * their owning component folder (types, hooks and enums included), and names
 * that x-core only exports as types (interfaces, type aliases) are recognised
 * as type-only even when imported without the `type` keyword.
 *
 * Runtime and type-only imports are reported separately because types vanish
 * at build time and inflate headline numbers (`ChipProps`, `ColumnDataType`).
 * An import is type-only when its declaration or specifier carries `type`
 * (`import type {..}`, `import { type X }`, `export type {..} from`) or the
 * imported name is a type in x-core. Row shape (`--json`, `{ components, other }`):
 *   name, count (runtime imports), files (distinct runtime files),
 *   typeCount (type-only imports), typeFiles (distinct type-only files),
 *   kinds / imports (runtime only), typeImports (type-only names);
 *   component rows also carry horizon, status, familyCount and familyFiles
 *   (runtime, summed over the family).
 * Rows are sorted by runtime files, then runtime imports, then name.
 */

const PACKAGE = '@cialdnb/x-core';
const SKIP_DIRS = new Set([
    'node_modules',
    'build',
    'dist',
    'coverage',
    'storybook-static',
    '.git',
    '.next',
]);
const EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx']);

export type Kind = 'named' | 'default' | 'namespace' | 'reexport' | 'dynamic';
export type Status =
    'todo' | 'in-progress' | 'done' | 'superseded' | 'no-equivalent' | 'skip';

export interface UsageRecord {
    specifier: string;
    imported: string;
    kind: Kind;
    file: string;
    /** True for `import type`, `import { type X }`, `export type` or a name x-core only exports as a type. */
    typeOnly: boolean;
    /** Owning x-core component folder, or null when not attributable. */
    owner: string | null;
}

export interface ReportRow {
    name: string;
    /** Runtime imports (type-only imports are in `typeCount`). */
    count: number;
    /** Distinct files with a runtime import. */
    files: number;
    typeCount: number;
    typeFiles: number;
    typeImports: Record<string, number>;
    kinds: Partial<Record<Kind, number>>;
    imports: Record<string, number>;
    horizon?: string;
    status?: Status;
    familyCount?: number;
    familyFiles?: number;
}

export interface Report {
    components: ReportRow[];
    other: ReportRow[];
}

export interface CollectOptions {
    /** Barrel export name -> owning component folder. */
    owners?: ReadonlyMap<string, string>;
    /** Names x-core exports only as types. */
    types?: ReadonlySet<string>;
}

function isXCoreSpecifier(spec: string): boolean {
    return spec === PACKAGE || spec.startsWith(`${PACKAGE}/`);
}

/** Folder that owns a deep `components/...` path, or null if none. */
function ownerOfPath(rest: string): string | null {
    const segments = rest.split('/').filter(Boolean);
    if (segments[0] !== 'components') return null;
    const first = segments[1];
    if (first === undefined || first === 'shared') return null;
    if (first === 'inputs') return segments[2] ?? null;
    return first;
}

function ownerFor(
    specifier: string,
    imported: string,
    kind: Kind,
    owners: ReadonlyMap<string, string> | undefined
): string | null {
    const rest = specifier.slice(PACKAGE.length);
    const deep = ownerOfPath(rest);
    if (deep) return deep;
    if (rest !== '/components') return null;
    if (kind !== 'named' && kind !== 'reexport') return null;
    if (imported === '*' || imported === 'default') return null;
    return owners?.get(imported) ?? imported;
}

function scriptKind(file: string): ts.ScriptKind {
    switch (extname(file)) {
        case '.tsx':
            return ts.ScriptKind.TSX;
        case '.jsx':
            return ts.ScriptKind.JSX;
        case '.js':
            return ts.ScriptKind.JS;
        default:
            return ts.ScriptKind.TS;
    }
}

function* walk(dir: string): Generator<string> {
    for (const entry of readdirSync(dir).sort()) {
        const full = join(dir, entry);
        if (statSync(full).isDirectory()) {
            if (!SKIP_DIRS.has(entry)) yield* walk(full);
        } else if (EXTENSIONS.has(extname(entry)) && !entry.endsWith('.d.ts')) {
            yield full;
        }
    }
}

function recordsOfFile(
    file: string,
    root: string,
    owners: ReadonlyMap<string, string> | undefined,
    types: ReadonlySet<string> | undefined
): UsageRecord[] {
    const source = ts.createSourceFile(
        file,
        readFileSync(file, 'utf8'),
        ts.ScriptTarget.Latest,
        true,
        scriptKind(file)
    );
    const rel = file.slice(root.length + 1);
    const out: UsageRecord[] = [];
    const add = (
        specifier: string,
        imported: string,
        kind: Kind,
        syntacticType = false
    ) =>
        out.push({
            specifier,
            imported,
            kind,
            file: rel,
            typeOnly:
                syntacticType ||
                ((kind === 'named' || kind === 'reexport') &&
                    types?.has(imported) === true),
            owner: ownerFor(specifier, imported, kind, owners),
        });

    const visit = (node: ts.Node): void => {
        if (
            ts.isImportDeclaration(node) &&
            ts.isStringLiteral(node.moduleSpecifier) &&
            isXCoreSpecifier(node.moduleSpecifier.text)
        ) {
            const spec = node.moduleSpecifier.text;
            const clause = node.importClause;
            const clauseType = clause?.isTypeOnly === true;
            if (clause?.name) add(spec, 'default', 'default', clauseType);
            const bindings = clause?.namedBindings;
            if (bindings && ts.isNamespaceImport(bindings)) {
                add(spec, '*', 'namespace', clauseType);
            } else if (bindings) {
                for (const el of bindings.elements)
                    add(
                        spec,
                        (el.propertyName ?? el.name).text,
                        'named',
                        clauseType || el.isTypeOnly
                    );
            }
        } else if (
            ts.isExportDeclaration(node) &&
            node.moduleSpecifier &&
            ts.isStringLiteral(node.moduleSpecifier) &&
            isXCoreSpecifier(node.moduleSpecifier.text)
        ) {
            const spec = node.moduleSpecifier.text;
            const clause = node.exportClause;
            if (clause && ts.isNamedExports(clause)) {
                for (const el of clause.elements)
                    add(
                        spec,
                        (el.propertyName ?? el.name).text,
                        'reexport',
                        node.isTypeOnly || el.isTypeOnly
                    );
            } else {
                add(spec, '*', 'reexport', node.isTypeOnly);
            }
        } else if (
            ts.isCallExpression(node) &&
            node.expression.kind === ts.SyntaxKind.ImportKeyword
        ) {
            const arg = node.arguments[0];
            if (
                arg &&
                ts.isStringLiteralLike(arg) &&
                isXCoreSpecifier(arg.text)
            )
                add(arg.text, '*', 'dynamic');
        }
        ts.forEachChild(node, visit);
    };
    visit(source);
    return out;
}

export function collectUsage(
    dir: string,
    options: CollectOptions = {}
): UsageRecord[] {
    const root = resolve(dir);
    return [...walk(root)].flatMap((f) =>
        recordsOfFile(f, root, options.owners, options.types)
    );
}

/** Barrel export name -> owning folder, plus the names x-core only exports as types. */
export interface OwnerInfo {
    owners: Map<string, string>;
    types: Set<string>;
}

/**
 * Names are exported by x-core's `components` barrel; map each exported name
 * (component, type, hook, enum) to the folder that declares it. `types` holds
 * every name that no x-core module exports as a value (interfaces, type
 * aliases), so `import { ChipProps }` is known to be type-only.
 */
export function loadOwners(xCoreDir: string): OwnerInfo {
    const root = join(resolve(xCoreDir), 'src/components');
    const barrel = join(root, 'index.ts');
    const program = ts.createProgram([barrel], {
        noEmit: true,
        skipLibCheck: true,
        jsx: ts.JsxEmit.ReactJSX,
        moduleResolution: ts.ModuleResolutionKind.Bundler,
        module: ts.ModuleKind.ESNext,
        target: ts.ScriptTarget.ES2022,
    });
    const checker = program.getTypeChecker();
    const owners = new Map<string, string>();
    const sf = program.getSourceFile(barrel);
    if (!sf) return { owners, types: new Set() };
    for (const stmt of sf.statements) {
        if (
            !ts.isExportDeclaration(stmt) ||
            !stmt.moduleSpecifier ||
            !ts.isStringLiteral(stmt.moduleSpecifier)
        )
            continue;
        const parts = stmt.moduleSpecifier.text.replace(/^\.\//, '').split('/');
        const folder = (parts[0] === 'inputs' ? parts[1] : parts[0]) ?? '';
        const clause = stmt.exportClause;
        if (clause && ts.isNamedExports(clause)) {
            for (const el of clause.elements) owners.set(el.name.text, folder);
            continue;
        }
        const symbol = checker.getSymbolAtLocation(stmt.moduleSpecifier);
        if (!symbol) continue;
        for (const exp of checker.getExportsOfModule(symbol))
            if (exp.name !== 'default' && !owners.has(exp.name))
                owners.set(exp.name, folder);
    }
    const valueNames = new Set<string>();
    const typeNames = new Set<string>();
    for (const file of program.getSourceFiles()) {
        if (!file.fileName.startsWith(root)) continue;
        const moduleSymbol = checker.getSymbolAtLocation(file);
        if (!moduleSymbol) continue;
        for (const exp of checker.getExportsOfModule(moduleSymbol)) {
            const target =
                exp.flags & ts.SymbolFlags.Alias
                    ? checker.getAliasedSymbol(exp)
                    : exp;
            (target.flags & ts.SymbolFlags.Value ? valueNames : typeNames).add(
                exp.name
            );
        }
    }
    for (const name of valueNames) typeNames.delete(name);
    return { owners, types: typeNames };
}

interface FamilyEntry {
    horizon: string;
    status: Status;
}

/** Drawer is two components, not versions of one (Global Constraints). */
const DRAWER_EXCEPTION: Record<string, FamilyEntry> = {
    Drawer: { horizon: 'NavigationDrawer', status: 'superseded' },
    DrawerV2: { horizon: 'NavigationDrawer', status: 'todo' },
    DrawerV3: { horizon: 'Drawer', status: 'todo' },
};

export function parseVersion(name: string): { base: string; version: number } {
    const m = /^(.*?)(?:[Vv](\d+))?$/.exec(name);
    return { base: m?.[1] ?? name, version: m?.[2] ? Number(m[2]) : 1 };
}

/**
 * Maps every name to its horizon-ui name and status: within a family
 * (`Foo`, `FooV2`, `FooV3`) only the highest version is `todo`.
 */
export function groupFamilies(
    names: Iterable<string>
): Map<string, FamilyEntry> {
    const families = new Map<string, { name: string; version: number }[]>();
    for (const name of new Set(names)) {
        const { base, version } = parseVersion(name);
        const list = families.get(base) ?? [];
        list.push({ name, version });
        families.set(base, list);
    }
    const result = new Map<string, FamilyEntry>();
    for (const [base, members] of families) {
        const highest = Math.max(...members.map((m) => m.version));
        for (const { name, version } of members) {
            const exception =
                base === 'Drawer' ? DRAWER_EXCEPTION[name] : undefined;
            result.set(
                name,
                exception ?? {
                    horizon: base,
                    status: version === highest ? 'todo' : 'superseded',
                }
            );
        }
    }
    return result;
}

interface Acc {
    runtime: number;
    runtimeFiles: Set<string>;
    typeOnly: number;
    typeFiles: Set<string>;
    kinds: Partial<Record<Kind, number>>;
    imports: Record<string, number>;
    typeImports: Record<string, number>;
}

function aggregate(
    records: UsageRecord[],
    key: (r: UsageRecord) => string | null
): Map<string, Acc> {
    const map = new Map<string, Acc>();
    for (const r of records) {
        const k = key(r);
        if (k === null) continue;
        const acc = map.get(k) ?? {
            runtime: 0,
            runtimeFiles: new Set<string>(),
            typeOnly: 0,
            typeFiles: new Set<string>(),
            kinds: {},
            imports: {},
            typeImports: {},
        };
        if (r.typeOnly) {
            acc.typeOnly += 1;
            acc.typeFiles.add(r.file);
            acc.typeImports[r.imported] =
                (acc.typeImports[r.imported] ?? 0) + 1;
        } else {
            acc.runtime += 1;
            acc.runtimeFiles.add(r.file);
            acc.kinds[r.kind] = (acc.kinds[r.kind] ?? 0) + 1;
            acc.imports[r.imported] = (acc.imports[r.imported] ?? 0) + 1;
        }
        map.set(k, acc);
    }
    return map;
}

const byRuntimeDesc = (a: ReportRow, b: ReportRow) =>
    b.files - a.files || b.count - a.count || a.name.localeCompare(b.name);

const toRow = (name: string, acc: Acc | undefined): ReportRow => ({
    name,
    count: acc?.runtime ?? 0,
    files: acc?.runtimeFiles.size ?? 0,
    typeCount: acc?.typeOnly ?? 0,
    typeFiles: acc?.typeFiles.size ?? 0,
    kinds: acc?.kinds ?? {},
    imports: acc?.imports ?? {},
    typeImports: acc?.typeImports ?? {},
});

export function buildReport(
    records: UsageRecord[],
    allComponents: readonly string[] = []
): Report {
    const comp = aggregate(records, (r) => r.owner);
    const other = aggregate(records, (r) =>
        r.owner === null ? r.specifier : null
    );
    const names = new Set([...comp.keys(), ...allComponents]);
    const families = groupFamilies(names);
    const familyCount = new Map<string, number>();
    const familyFiles = new Map<string, Set<string>>();
    for (const [name, acc] of comp) {
        const familyKey = familyOf(name);
        familyCount.set(
            familyKey,
            (familyCount.get(familyKey) ?? 0) + acc.runtime
        );
        const files = familyFiles.get(familyKey) ?? new Set<string>();
        for (const f of acc.runtimeFiles) files.add(f);
        familyFiles.set(familyKey, files);
    }
    const components: ReportRow[] = [...names].map((name) => {
        const fam = families.get(name);
        const key = familyOf(name);
        return {
            ...toRow(name, comp.get(name)),
            horizon: fam?.horizon ?? name,
            status: fam?.status ?? 'todo',
            familyCount: familyCount.get(key) ?? 0,
            familyFiles: familyFiles.get(key)?.size ?? 0,
        };
    });
    return {
        components: components.sort(byRuntimeDesc),
        other: [...other]
            .map(([name, acc]) => toRow(name, acc))
            .sort(byRuntimeDesc),
    };
}

/** Drawer variants are separate components, so each is its own family. */
export function familyOf(name: string): string {
    return name === 'Drawer' || /^DrawerV\d+$/.test(name)
        ? name
        : parseVersion(name).base;
}

export function toMarkdown(report: Report): string {
    const kinds = (r: ReportRow) =>
        Object.entries(r.kinds)
            .map(([k, v]) => `${k}:${v}`)
            .join(' ');
    return [
        '| x-core component | horizon-ui | status | runtime imports | runtime files | type-only imports | family runtime files | kinds |',
        '|---|---|---|---|---|---|---|---|',
        ...report.components.map(
            (r) =>
                `| \`${r.name}\` | \`${r.horizon}\` | ${r.status} | ${r.count} | ${r.files} | ${r.typeCount} | ${r.familyFiles} | ${kinds(r)} |`
        ),
        '',
        '| import path (not a component) | runtime imports | runtime files | type-only imports | kinds | names |',
        '|---|---|---|---|---|---|',
        ...report.other.map((r) => {
            const names = Object.entries(r.imports)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 8)
                .map(([n, c]) => `${n}:${c}`)
                .join(' ');
            return `| \`${r.name}\` | ${r.count} | ${r.files} | ${r.typeCount} | ${kinds(r)} | ${names} |`;
        }),
    ].join('\n');
}

/** Full report for a client directory; `xCoreDir` enables barrel owner and type resolution. */
export function analyze(dir: string, xCoreDir?: string): Report {
    const info = xCoreDir ? loadOwners(xCoreDir) : undefined;
    const all = xCoreDir ? listComponents(xCoreDir) : [];
    return buildReport(collectUsage(dir, info ?? {}), all);
}

/** Component folder names of an x-core checkout (`inputs/*` are flattened, `shared` is internal). */
export function listComponents(xCoreDir: string): string[] {
    const root = join(resolve(xCoreDir), 'src/components');
    return readdirSync(root, { withFileTypes: true })
        .filter((d) => d.isDirectory() && d.name !== 'shared')
        .flatMap((d) =>
            d.name === 'inputs' ? readdirSync(join(root, 'inputs')) : [d.name]
        );
}

function main(argv: string[]): void {
    const json = argv.includes('--json');
    const xIdx = argv.indexOf('--x-core');
    const xCore = xIdx >= 0 ? argv[xIdx + 1] : undefined;
    const dir = argv.find(
        (a, i) => !a.startsWith('--') && (xIdx < 0 || i !== xIdx + 1)
    );
    if (!dir) {
        console.error(
            'usage: tsx scripts/usage-report.ts <client-dir> [--x-core <dir>] [--json]'
        );
        process.exit(1);
    }
    const report = analyze(dir, xCore);
    console.log(json ? JSON.stringify(report, null, 2) : toMarkdown(report));
}

if (
    process.argv[1] &&
    basename(process.argv[1]) === basename(fileURLToPath(import.meta.url))
) {
    main(process.argv.slice(2));
}
