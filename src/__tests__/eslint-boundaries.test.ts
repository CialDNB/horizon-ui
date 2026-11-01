import {
    mkdirSync,
    mkdtempSync,
    rmSync,
    writeFileSync,
    copyFileSync,
} from 'node:fs';
import { dirname, join } from 'node:path';
import { ESLint } from 'eslint';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const repo = join(__dirname, '..', '..');
let dir: string;

function write(rel: string, content: string) {
    const full = join(dir, rel);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, content);
}

async function lint(rel: string) {
    const eslint = new ESLint({
        cwd: dir,
        overrideConfigFile: join(repo, 'eslint.config.js'),
    });
    const [result] = await eslint.lintFiles([rel]);
    return (result?.messages ?? []).map((m) => m.ruleId);
}

describe('eslint layering rules (fixtures in a temp dir)', () => {
    beforeAll(() => {
        dir = mkdtempSync(join(repo, '.tmp-hz-lint-'));
        copyFileSync(join(repo, 'tsconfig.json'), join(dir, 'tsconfig.json'));
        write('src/components/B/B.ts', 'export const b = 1;\n');
        write(
            'src/components/B/index.ts',
            "import { b } from './B';\nexport const v = b;\n"
        );
        write(
            'src/components/A/index.ts',
            "import { b } from '../B/B';\nexport const v = b;\n"
        );
        write(
            'src/components/C/index.ts',
            "import { b } from '../B';\nexport const v = b;\n"
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

    it('flags lib importing a component', async () => {
        expect(await lint('src/lib/x.ts')).toContain(
            'boundaries/element-types'
        );
    });

    it('accepts a clean lib file', async () => {
        expect(await lint('src/lib/y.ts')).toEqual([]);
    });
});
