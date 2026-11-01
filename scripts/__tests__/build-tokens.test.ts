import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildTokensCss } from '../build-tokens';
import * as colors from '../../src/tokens/colors';
import { borderRadius } from '../../src/tokens/borderRadius';
import { duration, easing } from '../../src/tokens/motion';
import { typeScale } from '../../src/tokens/typography';
import { brandTypography, brands, semanticKeys } from '../../src/tokens/brands';

const css = buildTokensCss();
const kebab = (s: string) => s.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);

/** Returns the body of the first rule whose selector equals `selector`. */
function rule(selector: string): string {
    const start = css.indexOf(`${selector} {`);
    if (start === -1) return '';
    return css.slice(start, css.indexOf('}', start));
}

describe('buildTokensCss', () => {
    it('emits every primitive color key', () => {
        const scales = [
            'grey',
            'blue',
            'indigo',
            'cyan',
            'lightBlue',
            'red',
            'amber',
            'teal',
            'green',
            'orange',
            'pink',
            'purple',
            'blueGrey',
        ] as const;
        for (const name of scales) {
            for (const [n, value] of Object.entries(colors[name])) {
                expect(css).toContain(`--hz-${kebab(name)}-${n}: ${value};`);
            }
        }
        expect(css).toContain('--hz-blue-500: #0050F0;');
        expect(css).toContain(`--hz-white: ${colors.common.white};`);
    });

    it('emits radius scale', () => {
        expect(css).toContain('--radius-lg: 20px');
        expect(css).toContain('--radius-full: 100px');
        for (const [k, v] of Object.entries(borderRadius)) {
            expect(css).toContain(`--radius-${k}: ${v}px;`);
        }
    });

    it('emits motion tokens', () => {
        expect(css).toContain('--duration-slow: 300ms');
        expect(css).toContain(
            '--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1)'
        );
        for (const [k, v] of Object.entries(duration)) {
            expect(css).toContain(`--duration-${k}: ${v}ms;`);
        }
        for (const [k, v] of Object.entries(easing)) {
            expect(css).toContain(`--ease-${k}: ${v};`);
        }
    });

    it('emits spacing base and the 11 type-scale roles', () => {
        expect(css).toContain('--spacing: 4px;');
        const roles = Object.keys(typeScale);
        expect(roles).toHaveLength(11);
        for (const role of roles) {
            expect(css).toContain(`--text-${role.replace('/', '-')}-size:`);
        }
    });

    it('scopes brand variables under .hz-root, never :root', () => {
        expect(css).toContain(".hz-root[data-brand='dnb'] {");
        expect(css).toContain(".hz-root[data-brand='il'] {");
        expect(css).not.toMatch(/(^|[\s,}])(:root|html|body)\s*[{,]/m);
        expect(css).not.toMatch(/:root/);
    });

    it('declares every variable inside a .hz-root rule', () => {
        const selectors = [...css.matchAll(/^([^\s/][^{\n]*) \{$/gm)].map(
            (m) => m[1]
        );
        expect(selectors.length).toBeGreaterThan(0);
        for (const s of selectors) expect(s).toMatch(/^\.hz-root/);
    });

    it('cial is the default brand', () => {
        const base = rule('.hz-root');
        expect(base).toContain(`--primary: ${brands.cial.primary};`);
        for (const key of semanticKeys) {
            expect(base).toContain(`--${key}: ${brands.cial[key]};`);
        }
    });

    it('brand override blocks carry that brand semantic values', () => {
        for (const brand of ['dnb', 'il'] as const) {
            const body = rule(`.hz-root[data-brand='${brand}']`);
            for (const key of semanticKeys) {
                expect(body).toContain(`--${key}: ${brands[brand][key]};`);
            }
        }
        expect(brands.dnb.primary).not.toBe(brands.cial.primary);
        expect(brands.il.primary).not.toBe(brands.cial.primary);
    });

    it('il typography equals cial typography', () => {
        expect(brandTypography.il).toEqual(brandTypography.cial);
        expect(brandTypography.dnb).toEqual(brandTypography.cial);
    });

    it('committed tokens.css matches generator output', () => {
        const committed = readFileSync(
            join(__dirname, '..', '..', 'src', 'styles', 'tokens.css'),
            'utf8'
        );
        expect(committed).toBe(css);
    });
});
