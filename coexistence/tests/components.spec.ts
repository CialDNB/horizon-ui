import { expect, test, type Page } from '@playwright/test';

/*
 * Batch 1 components (Typography, Chip, Badge) against customer360's
 * unlayered Bootstrap 4.4.1: `?reboot=1` is bootstrap-reboot.css, `?reboot=full`
 * the full bootstrap.css customer360 imports (adds `h1..h6 { font-weight: 500;
 * line-height: 1.2; font-size }`). Each probe is measured without Bootstrap
 * and with it, in both load orders, for both CSS builds.
 */

const TYPE_PROPS = [
    'marginTop',
    'marginBottom',
    'marginInlineStart',
    'paddingTop',
    'fontFamily',
    'fontSize',
    'fontWeight',
    'lineHeight',
    'letterSpacing',
    'textTransform',
    'color',
    'display',
] as const;

const TYPOGRAPHY = [
    'display/xl',
    'display/lg',
    'heading/xl',
    'heading/lg',
    'heading/md',
    'heading/sm',
    'body/lg',
    'body/default',
    'body/secondary',
    'caption',
    'micro',
    'label/sm',
    'label/md',
    'label/lg',
    'h5',
    'h6',
].map((v) => `hz-typo-${v}`);

/** A group of probes measured with one property list. */
type Probe = { ids: readonly string[]; props: readonly string[] };

const PROBES: Record<string, Probe> = {
    Typography: { ids: TYPOGRAPHY, props: TYPE_PROPS },
};

type Styles = Record<string, Record<string, string>>;

type Opts = { reboot?: '1' | 'full'; horizonFirst?: boolean };
const url = (build: 'layered' | 'unlayered', opts: Opts = {}) => {
    const q = new URLSearchParams();
    if (build === 'unlayered') q.set('build', 'unlayered');
    if (opts.reboot) q.set('reboot', opts.reboot);
    if (opts.horizonFirst) q.set('order', 'horizon-first');
    return `/?${q.toString()}`;
};

const measure = async (page: Page, path: string, probe: Probe) => {
    await page.goto(path);
    await expect(page.getByTestId(probe.ids[0] ?? '')).toBeVisible();
    return page.evaluate(
        ({ ids, props }) => {
            const out: Record<string, Record<string, string>> = {};
            for (const id of ids) {
                const el = document.querySelector(`[data-testid="${id}"]`);
                if (!el) throw new Error(`missing ${id}`);
                const cs = getComputedStyle(el);
                out[id] = Object.fromEntries(
                    props.map((p) => [
                        p,
                        cs[p as keyof CSSStyleDeclaration] as string,
                    ])
                );
            }
            return out;
        },
        { ids: [...probe.ids], props: [...probe.props] }
    ) as Promise<Styles>;
};

/** `{ id: ['prop: before -> after'] }` for every probe whose styles changed. */
const diff = (a: Styles, b: Styles) =>
    Object.fromEntries(
        Object.keys(a)
            .map((id) => [
                id,
                Object.keys(a[id] ?? {})
                    .filter((p) => a[id]?.[p] !== b[id]?.[p])
                    .map((p) => `${p}: ${a[id]?.[p]} -> ${b[id]?.[p]}`),
            ])
            .filter(([, changed]) => (changed?.length ?? 0) > 0)
    );

for (const [name, probe] of Object.entries(PROBES)) {
    test.describe(`${name} against Bootstrap 4.4.1`, () => {
        test('unlayered build renders identically to the layered build', async ({
            page,
        }) => {
            const layered = await measure(page, url('layered'), probe);
            const unlayered = await measure(page, url('unlayered'), probe);
            expect(diff(layered, unlayered)).toEqual({});
        });

        for (const reboot of ['1', 'full'] as const)
            for (const horizonFirst of [false, true])
                test(`unlayered build is unchanged by ${reboot === 'full' ? 'full bootstrap.css' : 'bootstrap-reboot.css'} (${horizonFirst ? 'horizon CSS first' : 'Bootstrap first'})`, async ({
                    page,
                }) => {
                    const without = await measure(
                        page,
                        url('unlayered'),
                        probe
                    );
                    const withBootstrap = await measure(
                        page,
                        url('unlayered', { reboot, horizonFirst }),
                        probe
                    );
                    expect(
                        await page.locator('#bootstrap-reboot').count()
                    ).toBe(1);
                    expect(diff(without, withBootstrap)).toEqual({});
                });
    });
}

// KNOWN LIMIT of the LAYERED build (ADR 0001): unlayered Bootstrap element
// rules beat every layered utility. Asserts the measured truth for
// styles.css; legacy hosts use styles.unlayered.css (groups above).
test.describe('layered build (known limit): full Bootstrap restyles Typography headings and paragraphs', () => {
    test('exactly the properties Bootstrap sets on h1..h6 and p change', async ({
        page,
    }) => {
        const probe = PROBES['Typography'];
        if (!probe) throw new Error('no probe');
        const without = await measure(page, url('layered'), probe);
        const withBootstrap = await measure(
            page,
            url('layered', { reboot: 'full' }),
            probe
        );
        expect(diff(without, withBootstrap)).toEqual(LAYERED_TYPOGRAPHY_DIFF);
    });
});

// Measured: margins from `h1..h6 { margin-bottom: .5rem }` / `p { margin: 0 0
// 1rem }`, and on headings `font-weight: 500; line-height: 1.2` plus Bootstrap's
// per-level font-size (display/lg keeps 40px only because h1 is 2.5rem).
// Labels (span) are untouched. Colour and family survive (Bootstrap sets
// neither on headings).
const heading = (size: string | null, weight: string, line: string) => [
    'marginBottom: 0px -> 8px',
    ...(size ? [`fontSize: ${size}`] : []),
    `fontWeight: ${weight} -> 500`,
    `lineHeight: ${line}`,
];
const paragraph = ['marginBottom: 0px -> 16px'];
const LAYERED_TYPOGRAPHY_DIFF = {
    'hz-typo-display/xl': heading('44px -> 40px', '700', '44px -> 48px'),
    'hz-typo-display/lg': heading(null, '700', '40px -> 48px'),
    'hz-typo-heading/xl': heading('36px -> 40px', '700', '36px -> 48px'),
    'hz-typo-heading/lg': heading(null, '700', '32px -> 38.4px'),
    'hz-typo-heading/md': heading(null, '600', '28px -> 33.6px'),
    'hz-typo-heading/sm': heading(null, '700', '24px -> 28.8px'),
    'hz-typo-h5': heading('16px -> 20px', '600', '20px -> 24px'),
    'hz-typo-h6': heading('14px -> 16px', '400', '14px -> 19.2px'),
    'hz-typo-body/lg': paragraph,
    'hz-typo-body/default': paragraph,
    'hz-typo-body/secondary': paragraph,
    'hz-typo-caption': paragraph,
    'hz-typo-micro': paragraph,
};
