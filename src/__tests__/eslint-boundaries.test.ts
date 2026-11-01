import {
    copyFileSync,
    mkdirSync,
    mkdtempSync,
    rmSync,
    writeFileSync,
} from 'node:fs';
import { dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { ESLint, type Linter } from 'eslint';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const repo = join(__dirname, '..', '..');
let dir: string;
let config: Linter.Config[];

function write(rel: string, content: string) {
    const full = join(dir, rel);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, content);
}

async function lint(rel: string) {
    const eslint = new ESLint({
        cwd: dir,
        overrideConfigFile: true,
        overrideConfig: config,
    });
    const [result] = await eslint.lintFiles([rel]);
    return (result?.messages ?? []).map((m) => m.ruleId);
}

describe('eslint layering rules (fixtures in a gitignored dir)', () => {
    beforeAll(async () => {
        const loaded = (await import(
            pathToFileURL(join(repo, 'eslint.config.js')).href
        )) as {
            default: Linter.Config[];
        };
        // The repo config ignores fixture dirs so a crashed run cannot pollute `eslint .`; drop that entry here.
        config = loaded.default.filter(
            (c) =>
                !(
                    c.ignores?.length === 1 &&
                    c.ignores[0]?.startsWith('.tmp-hz-lint-')
                )
        );
        dir = mkdtempSync(join(repo, '.tmp-hz-lint-'));
        copyFileSync(join(repo, 'tsconfig.json'), join(dir, 'tsconfig.json'));
        write(
            'src/types/DnbBase.ts',
            'export interface DnbBase { x?: string }\n'
        );
        write('src/lib/cn.ts', 'export const cn = 1;\n');
        write('src/tokens/color.ts', 'export const color = 1;\n');
        write('src/components/B/B.ts', 'export const b = 1;\n');
        write('src/components/B/index.ts', "export { b } from './B';\n");
        write(
            'src/components/A/index.ts',
            "import { b } from '../B/B';\nexport const v = b;\n"
        );
        write(
            'src/components/C/index.ts',
            "import { b } from '../B';\nexport const v = b;\n"
        );
        write(
            'src/components/D/index.ts',
            [
                "import type { DnbBase } from '../../types/DnbBase';",
                "import { cn } from '../../lib/cn';",
                "import { color } from '../../tokens/color';",
                'export const v: DnbBase = { x: String(cn + color) };',
                '',
            ].join('\n')
        );
        write(
            'src/lib/x.ts',
            "import { b } from '../components/B';\nexport const v = b;\n"
        );
        write('src/lib/y.ts', 'export const y = 1;\n');
    });

    afterAll(() => rmSync(dir, { recursive: true, force: true }));

    it('flags a deep import into another component folder', async () => {
        expect(await lint('src/components/A/index.ts')).toContain(
            'boundaries/entry-point'
        );
    });

    it('allows importing another component through its index', async () => {
        expect(await lint('src/components/C/index.ts')).toEqual([]);
    });

    it('allows a component to import types, lib and tokens files directly', async () => {
        expect(await lint('src/components/D/index.ts')).toEqual([]);
    });

    it('flags lib importing a component', async () => {
        expect(await lint('src/lib/x.ts')).toContain(
            'boundaries/element-types'
        );
    });

    it('accepts a clean lib file', async () => {
        expect(await lint('src/lib/y.ts')).toEqual([]);
    });
});
