import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

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
