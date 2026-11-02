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

/**
 * A measured element: `key` names it in results, `selector` finds it, and
 * `focus` (a selector) is keyboard-focused first so `:focus` and
 * `:focus-visible` rules (Bootstrap `button:focus`) are in play.
 */
type Target = { key: string; selector: string; focus?: string };
/** A group of targets measured with one property list. */
type Probe = { targets: readonly Target[]; props: readonly string[] };

const byTestId = (id: string) => `[data-testid="${id}"]`;
const plain = (ids: readonly string[]): Target[] =>
    ids.map((id) => ({ key: id, selector: byTestId(id) }));

const CHIP_PROPS = [
    'height',
    'width',
    'paddingInlineStart',
    'paddingInlineEnd',
    'marginTop',
    'borderRadius',
    'fontFamily',
    'fontSize',
    'fontWeight',
    'lineHeight',
    'textTransform',
    'color',
    'backgroundColor',
    'boxShadow',
    'outlineStyle',
    'outlineWidth',
    'outlineColor',
    'outlineOffset',
    'cursor',
    'display',
    'verticalAlign',
] as const;

const CHIP: Target[] = [
    ...plain(
        [
            'neutral',
            'primary',
            'info',
            'success',
            'warning',
            'error',
            'outline',
            'disabled',
        ].map((v) => `hz-chip-${v}`)
    ),
    { key: 'action chip', selector: byTestId('hz-chip-action') },
    {
        key: 'action chip, action focused',
        selector: byTestId('hz-chip-action'),
        focus: `${byTestId('hz-chip-action')} [data-chip-action]`,
    },
    {
        key: 'action button, focused',
        selector: `${byTestId('hz-chip-action')} [data-chip-action]`,
        focus: `${byTestId('hz-chip-action')} [data-chip-action]`,
    },
    {
        key: 'remove button',
        selector: `${byTestId('hz-chip-action')} [aria-label^="Remove"]`,
    },
    {
        key: 'remove button, focused',
        selector: `${byTestId('hz-chip-action')} [aria-label^="Remove"]`,
        focus: `${byTestId('hz-chip-action')} [aria-label^="Remove"]`,
    },
    {
        key: 'disabled action button',
        selector: `${byTestId('hz-chip-disabled')} button`,
    },
];

const BADGE_PROPS = [
    ...CHIP_PROPS,
    'position',
    'top',
    'insetInlineEnd',
    'transform',
] as const;

const BADGE: Target[] = [
    ...plain(
        [
            'label',
            'count',
            'dot',
            'ai',
            'ai-verified',
            'anchor',
            'anchored',
        ].map((v) => `hz-badge-${v}`)
    ),
    {
        key: 'label text',
        selector: `${byTestId('hz-badge-label')} > span:last-child`,
    },
    {
        key: 'anchored slot',
        selector: `${byTestId('hz-badge-anchor')} [data-badge-slot]`,
    },
];

const PROBES: Record<string, Probe> = {
    Typography: { targets: plain(TYPOGRAPHY), props: TYPE_PROPS },
    Chip: { targets: CHIP, props: CHIP_PROPS },
    Badge: { targets: BADGE, props: BADGE_PROPS },
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
    await expect(
        page.locator(probe.targets[0]?.selector ?? 'missing')
    ).toBeVisible();
    const out: Styles = {};
    for (const target of probe.targets) {
        await page.evaluate(() =>
            (document.activeElement as HTMLElement | null)?.blur()
        );
        if (target.focus) {
            // Keyboard modality first, so the element matches :focus-visible.
            await page.keyboard.press('Shift');
            await page.locator(target.focus).focus();
        }
        out[target.key] = await page.locator(target.selector).evaluate(
            async (el, props) => {
                // Read settled values, not a transition midpoint.
                await Promise.all(
                    el
                        .getAnimations()
                        .map((a) => a.finished.catch(() => undefined))
                );
                const cs = getComputedStyle(el);
                return Object.fromEntries(
                    props.map((p) => [
                        p,
                        cs[p as keyof CSSStyleDeclaration] as string,
                    ])
                );
            },
            [...probe.props]
        );
    }
    return out;
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
// 1rem }` (display and body roles render <p>), and on headings `font-weight:
// 500; line-height: 1.2` plus Bootstrap's per-level font-size. Caption, micro
// and labels (span) are untouched. Colour and family survive (Bootstrap sets
// neither on headings).
const heading = (size: string | null, weight: string, line: string) => [
    'marginBottom: 0px -> 8px',
    ...(size ? [`fontSize: ${size}`] : []),
    `fontWeight: ${weight} -> 500`,
    `lineHeight: ${line}`,
];
const paragraph = ['marginBottom: 0px -> 16px'];
const LAYERED_TYPOGRAPHY_DIFF = {
    'hz-typo-display/xl': paragraph,
    'hz-typo-display/lg': paragraph,
    'hz-typo-heading/xl': heading('36px -> 40px', '700', '36px -> 48px'),
    'hz-typo-heading/lg': heading(null, '700', '32px -> 38.4px'),
    'hz-typo-heading/md': heading(null, '600', '28px -> 33.6px'),
    'hz-typo-heading/sm': heading(null, '700', '24px -> 28.8px'),
    'hz-typo-h5': heading('16px -> 20px', '600', '20px -> 24px'),
    'hz-typo-h6': heading('14px -> 16px', '400', '14px -> 19.2px'),
    'hz-typo-body/lg': paragraph,
    'hz-typo-body/default': paragraph,
    'hz-typo-body/secondary': paragraph,
};

test.describe('layered build (known limit): Bootstrap restyles the Chip buttons', () => {
    test('exactly the button properties Bootstrap sets change', async ({
        page,
    }) => {
        const probe = PROBES['Chip'];
        if (!probe) throw new Error('no probe');
        const without = await measure(page, url('layered'), probe);
        const withBootstrap = await measure(
            page,
            url('layered', { reboot: 'full' }),
            probe
        );
        const { widened, ...rest } = splitWidths(diff(without, withBootstrap));
        expect(rest).toEqual(LAYERED_CHIP_DIFF);
        // The reboot's `button { margin: 0 }` cancels the layered negative
        // margins that stretch the action button over the chip padding, so
        // chips with an action grow by that padding (8px per stretched side).
        expect(widened).toEqual({
            'action chip': 8,
            'action chip, action focused': 8,
            'hz-chip-disabled': 16,
        });
    });
});

// Measured: the chip surfaces (spans) are untouched; the reboot's
// `button { border-radius: 0 }` squares the remove button's hover circle and
// `button:focus { outline: 5px auto }` adds Bootstrap's ring on the focused
// buttons (the action button then shows it inside the chip's own ring).
const bootstrapRing = (style: string, width: string, color: string) => [
    `outlineStyle: ${style} -> auto`,
    `outlineWidth: ${width} -> 5px`,
    `outlineColor: ${color} -> rgb(0, 95, 204)`,
];
/** Pulls `width: a -> b` entries out of a diff as `{ key: b - a }`. */
const splitWidths = (changed: Record<string, string[]>) => {
    const widened: Record<string, number> = {};
    const rest: Record<string, string[]> = {};
    for (const [key, props] of Object.entries(changed)) {
        const others = props.filter((p) => {
            const m = /^width: ([\d.]+)px -> ([\d.]+)px$/.exec(p);
            if (m) widened[key] = Math.round(Number(m[2]) - Number(m[1]));
            return !m;
        });
        if (others.length > 0) rest[key] = others;
    }
    return { widened, ...rest };
};

const LAYERED_CHIP_DIFF = {
    'action button, focused': bootstrapRing('none', '0px', 'rgba(0, 0, 0, 0)'),
    'remove button': ['borderRadius: 100px -> 0px'],
    'remove button, focused': [
        'borderRadius: 100px -> 0px',
        ...bootstrapRing('solid', '2px', 'rgb(0, 80, 240)'),
    ],
};

test.describe('layered build (known limit): Badge against full Bootstrap', () => {
    test('badge spans are untouched; only the anchor follows its Button host', async ({
        page,
    }) => {
        const probe = PROBES['Badge'];
        if (!probe) throw new Error('no probe');
        const without = await measure(page, url('layered'), probe);
        const withBootstrap = await measure(
            page,
            url('layered', { reboot: 'full' }),
            probe
        );
        // The anchored host is a horizon Button, whose type Bootstrap's
        // `button { font: inherit }` enlarges in the layered build (known
        // Button limit, ADR 0001): only the anchor's width follows it.
        const changed = diff(without, withBootstrap);
        expect(Object.keys(changed)).toEqual(['hz-badge-anchor']);
        expect(changed['hz-badge-anchor']).toHaveLength(1);
        expect(changed['hz-badge-anchor']?.[0]).toMatch(/^width: /);
    });
});

test.describe('Chip hit layer with a real pointer', () => {
    test.use({ viewport: { width: 375, height: 812 } });

    for (const build of ['layered', 'unlayered'] as const)
        test(`extended-area and visible clicks reach chip and row once each, and focus the button (${build})`, async ({
            page,
        }) => {
            await page.goto(url(build));
            const row = page.getByTestId('hz-chip-row');
            const chip = page.getByTestId('hz-chip-in-row');
            await chip.scrollIntoViewIfNeeded();
            const box = await chip.boundingBox();
            if (!box) throw new Error('chip not rendered');
            const counts = async () => ({
                chip: await row.getAttribute('data-chip-clicks'),
                row: await row.getAttribute('data-row-clicks'),
                native: await row.getAttribute('data-native-clicks'),
            });
            // 8px above the 24px chip: inside the 44px hit area only.
            await page.mouse.click(box.x + box.width / 2, box.y - 8);
            expect(await counts()).toEqual({
                chip: '1',
                row: '1',
                native: '1',
            });
            const focus = await page.evaluate(() => {
                const el = document.activeElement;
                return {
                    action: el?.hasAttribute('data-chip-action') ?? false,
                    visible: el?.matches(':focus-visible') ?? false,
                };
            });
            expect(focus).toEqual({ action: true, visible: false });
            expect(
                await chip.evaluate((el) => getComputedStyle(el).outlineStyle)
            ).toBe('none');
            // The visible chip.
            await page.mouse.click(
                box.x + box.width / 2,
                box.y + box.height / 2
            );
            expect(await counts()).toEqual({
                chip: '2',
                row: '2',
                native: '2',
            });
        });
});
