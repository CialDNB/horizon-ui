import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
    buildThemeCss,
    buildTokensCss,
    buildTypographyCss,
} from '../build-tokens';
import { breakpoints } from '../../src/tokens/breakpoints';
import * as colors from '../../src/tokens/colors';
import { borderRadius } from '../../src/tokens/borderRadius';
import { duration, easing } from '../../src/tokens/motion';
import { fontSize, lineHeight, typeScale } from '../../src/tokens/typography';
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

    it('emits spacing base and the 14 type-scale roles', () => {
        expect(css).toContain('--spacing: 4px;');
        const roles = Object.keys(typeScale);
        expect(roles).toHaveLength(14);
        for (const role of roles) {
            expect(css).toContain(`--text-${role.replace('/', '-')}-size:`);
        }
        // Interactive label roles (Button and later controls): semibold, wrap-friendly leading.
        expect(css).toContain('--text-label-sm-size: 12px;');
        expect(css).toContain('--text-label-sm-line-height: 16px;');
        expect(css).toContain('--text-label-md-size: 14px;');
        expect(css).toContain('--text-label-md-line-height: 20px;');
        expect(css).toContain('--text-label-lg-size: 16px;');
        expect(css).toContain('--text-label-lg-line-height: 24px;');
        expect(css).toContain('--text-label-md-weight: 600;');
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

    it('emits typography sizes in px so a 14px html root cannot shrink them', () => {
        for (const [role, t] of Object.entries(typeScale)) {
            const name = role.replace('/', '-');
            expect(css).toContain(
                `--text-${name}-size: ${parseFloat(t.fontSize) * 16}px;`
            );
            expect(css).toContain(
                `--text-${name}-line-height: ${parseFloat(t.lineHeight) * 16}px;`
            );
        }
        for (const [k, v] of Object.entries(fontSize)) {
            expect(css).toContain(`--font-size-${k}: ${parseFloat(v) * 16}px;`);
        }
        for (const [k, v] of Object.entries(lineHeight)) {
            expect(css).toContain(
                `--line-height-${k}: ${parseFloat(v) * 16}px;`
            );
        }
        expect(css).not.toMatch(/\drem;/);
    });
});

describe('buildThemeCss', () => {
    const theme = buildThemeCss();

    it('is a single inline @theme block (no variables emitted to :root)', () => {
        expect(theme).toContain('@theme inline {');
        expect(theme).not.toMatch(/:root/);
    });

    it('maps every semantic colour and resets the default palette', () => {
        expect(theme).toContain('--color-*: initial;');
        for (const key of semanticKeys) {
            expect(theme).toContain(`--color-${key}: var(--${key});`);
        }
    });

    it('replaces default breakpoints with the x-core breakpoints', () => {
        expect(theme).toContain('--breakpoint-*: initial;');
        for (const name of ['tablet', 'laptop', 'desktop'] as const) {
            expect(theme).toContain(
                `--breakpoint-${name}: ${breakpoints[name]}px;`
            );
        }
        expect(theme).not.toContain('--breakpoint-mobile');
    });

    it('maps spacing, radius, shadow, easing and font tokens', () => {
        expect(theme).toContain('--spacing: 4px;');
        for (const [k, v] of Object.entries(borderRadius)) {
            expect(theme).toContain(`--radius-${k}: ${v}px;`);
        }
        for (const [k, v] of Object.entries(easing)) {
            expect(theme).toContain(`--ease-${k}: ${v};`);
        }
        expect(theme).toContain(
            `--default-transition-duration: ${duration.normal}ms;`
        );
        // Tailwind's `duration-*` utilities read `--transition-duration-*`.
        expect(theme).toContain('--transition-duration-*: initial;');
        for (const [k, v] of Object.entries(duration)) {
            expect(theme).toContain(`--transition-duration-${k}: ${v}ms;`);
        }
        expect(theme).toContain('--shadow-1:');
        expect(theme).toContain('--font-sans: var(--font-family);');
        expect(theme).toContain('--text-*: initial;');
    });

    it('committed theme.css matches generator output', () => {
        const committed = readFileSync(
            join(__dirname, '..', '..', 'src', 'styles', 'theme.css'),
            'utf8'
        );
        expect(committed).toBe(theme);
    });
});

describe('buildTypographyCss', () => {
    const typography = buildTypographyCss();

    it('emits one @utility per type-scale role bundling family, size, line-height, weight', () => {
        for (const role of Object.keys(typeScale)) {
            const name = role.replace('/', '-');
            expect(typography).toContain(`@utility text-${name} {`);
            expect(typography).toContain(
                `font-size: var(--text-${name}-size);`
            );
        }
        expect(typography.match(/@utility /g)).toHaveLength(14);
        expect(typography).toContain('font-family: var(--font-family);');
    });

    it('safelists every role at every breakpoint so consumers get them precompiled', () => {
        expect(typography).toMatch(/@source inline\(/);
    });

    it('committed typography.css matches generator output', () => {
        const committed = readFileSync(
            join(__dirname, '..', '..', 'src', 'styles', 'typography.css'),
            'utf8'
        );
        expect(committed).toBe(typography);
    });
});
