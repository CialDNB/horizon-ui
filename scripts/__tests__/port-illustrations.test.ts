import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { convertSvg, generate } from '../port-illustrations';

const root = join(__dirname, '..', '..');

describe('port-illustrations', () => {
    it('generated components match the committed files (idempotent, no drift)', async () => {
        const files = await generate(root);
        const dir = join(root, 'src/illustrations/generated');
        expect([...files.keys()].sort()).toEqual(readdirSync(dir).sort());
        for (const [name, code] of files)
            expect(readFileSync(join(dir, name), 'utf8'), name).toBe(code);
    });

    it('keeps every path, colour and number of the source artwork', async () => {
        const files = await generate(root);
        const sources = ['cial', 'il'].flatMap((b) =>
            readdirSync(join(root, 'src/illustrations/assets', b)).map((f) =>
                readFileSync(
                    join(root, 'src/illustrations/assets', b, f),
                    'utf8'
                )
            )
        );
        const values = (s: string) =>
            [...s.matchAll(/\s(?:d|fill|stroke|transform)="([^"]*)"/g)]
                .map((m) => m[1])
                .filter((v) => v !== 'none')
                .sort();
        const out = [...files.entries()]
            .filter(([n]) => n.endsWith('.tsx'))
            .map(([, c]) => c)
            .join('\n');
        expect(values(out)).toEqual(values(sources.join('\n')));
    });

    it('rejects unsupported content instead of dropping it', () => {
        const svg = (inner: string) =>
            `<svg width="1" height="1" viewBox="0 0 1 1" fill="none" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;
        expect(() => convertSvg(svg('<text>x</text>'), 't')).toThrow(
            /unsupported element/
        );
        expect(() =>
            convertSvg(svg('<path d="M0 0" onclick="x"/>'), 't')
        ).toThrow(/unsupported <path onclick>/);
        expect(() => convertSvg(svg('<path d="M0 0"/>x'), 't')).toThrow();
    });
});
