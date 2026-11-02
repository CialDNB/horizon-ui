import { expect, test, type Page } from '@playwright/test';
import { diffStates, LINK_STATES, linkStates } from './linkStates';

/*
 * Batch 1 components (Typography, Chip, Badge, Spinner, ...) against customer360's
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

const SPINNER_PROPS = [
    'width',
    'height',
    'borderTopWidth',
    'borderTopColor',
    'borderInlineEndColor',
    'borderRadius',
    'boxSizing',
    'color',
    'display',
    'verticalAlign',
    'overflow',
    'stroke',
    'strokeWidth',
    'animationName',
    'animationDuration',
    'animationIterationCount',
] as const;

const SPINNER: Target[] = [
    ...plain(['sm', 'xl', 'ring'].map((v) => `hz-spinner-${v}`)),
    // Bootstrap reboot styles `svg { overflow: hidden; vertical-align: middle }`.
    { key: 'ring svg', selector: `${byTestId('hz-spinner-ring')} svg` },
    {
        key: 'ring arc',
        selector: `${byTestId('hz-spinner-ring')} [data-spinner-arc]`,
    },
];

const SEPARATOR_PROPS = [
    'width',
    'height',
    'marginTop',
    'marginBottom',
    'borderTopWidth',
    'borderTopStyle',
    'backgroundColor',
    'boxSizing',
    'overflow',
    'opacity',
    'display',
    'alignSelf',
] as const;

const PROGRESS_PROPS = [
    'width',
    'height',
    'marginTop',
    'marginBottom',
    'borderRadius',
    'overflow',
    'backgroundColor',
    'color',
    'fontFamily',
    'fontSize',
    'fontWeight',
    'lineHeight',
    'translate',
    'transitionDuration',
    'animationName',
    'display',
] as const;

const progressPart = (id: string, part: string) => `${byTestId(id)} ${part}`;
const PROGRESS: Target[] = [
    ...plain(['hz-progress', 'hz-progress-indeterminate']),
    {
        key: 'track',
        selector: progressPart('hz-progress', '[role="progressbar"]'),
    },
    {
        key: 'indicator',
        selector: progressPart('hz-progress', '[data-progress-indicator]'),
    },
    {
        key: 'label',
        selector: progressPart('hz-progress', 'span[id]'),
    },
    {
        key: 'value',
        selector: progressPart('hz-progress', '[data-progress-value]'),
    },
    {
        key: 'segment',
        selector: progressPart(
            'hz-progress-indeterminate',
            '[data-progress-indicator]'
        ),
    },
];

const ALERT_PROPS = [
    'width',
    'height',
    'paddingTop',
    'paddingInlineStart',
    'marginTop',
    'marginInlineEnd',
    'borderRadius',
    'borderTopWidth',
    'fontFamily',
    'fontSize',
    'fontWeight',
    'lineHeight',
    'color',
    'backgroundColor',
    'outlineStyle',
    'outlineWidth',
    'outlineColor',
    'outlineOffset',
    'cursor',
    'display',
] as const;

const alertPart = (part: string) => `${byTestId('hz-alert')} ${part}`;
const ALERT: Target[] = [
    ...plain(['hz-alert', 'hz-alert-plain']),
    { key: 'icon', selector: alertPart('[data-alert-icon] svg') },
    { key: 'title', selector: alertPart('[data-alert-title]') },
    { key: 'description', selector: alertPart('[data-alert-description]') },
    { key: 'action', selector: alertPart('[data-alert-action] button') },
    { key: 'dismiss', selector: alertPart('button[aria-label="Dismiss"]') },
    {
        key: 'dismiss, focused',
        selector: alertPart('button[aria-label="Dismiss"]'),
        focus: alertPart('button[aria-label="Dismiss"]'),
    },
];

const AVATAR_PROPS = [
    'width',
    'height',
    'marginInlineStart',
    'borderRadius',
    'borderTopStyle',
    'borderTopWidth',
    'fontFamily',
    'fontSize',
    'fontWeight',
    'lineHeight',
    'color',
    'backgroundColor',
    'boxShadow',
    'objectFit',
    'opacity',
    'position',
    'overflow',
    'display',
    'verticalAlign',
] as const;

const AVATAR: Target[] = [
    ...plain(['sm', 'xl', 'photo', 'group'].map((v) => `hz-avatar-${v}`)),
    // Bootstrap reboot styles `img { vertical-align: middle; border-style: none }`.
    { key: 'photo img', selector: `${byTestId('hz-avatar-photo')} img` },
    {
        key: 'group second',
        selector: `${byTestId('hz-avatar-group')} > :nth-child(2)`,
    },
    {
        key: 'group overflow',
        selector: `${byTestId('hz-avatar-group')} > :last-child`,
    },
];

const ICON_BUTTON_PROPS = [
    'width',
    'height',
    'paddingTop',
    'paddingInlineStart',
    'marginTop',
    'borderRadius',
    'borderTopWidth',
    'borderTopColor',
    'color',
    'backgroundColor',
    'fontSize',
    'lineHeight',
    'textDecorationLine',
    'outlineStyle',
    'outlineWidth',
    'outlineColor',
    'outlineOffset',
    'cursor',
    'display',
    'verticalAlign',
] as const;

const ICON_BUTTON_VARIANTS = [
    'primary',
    'secondary',
    'tertiary',
    'destructive',
    'ghost',
] as const;

const ICON_BUTTON: Target[] = [
    ...plain(
        [...ICON_BUTTON_VARIANTS, 'disabled', 'loading'].map(
            (v) => `hz-iconbutton-${v}`
        )
    ),
    ...plain(ICON_BUTTON_VARIANTS.map((v) => `hz-iconlink-${v}`)),
    {
        key: 'primary, focused',
        selector: byTestId('hz-iconbutton-primary'),
        focus: byTestId('hz-iconbutton-primary'),
    },
    {
        key: 'link, focused',
        selector: byTestId('hz-iconlink-ghost'),
        focus: byTestId('hz-iconlink-ghost'),
    },
    {
        key: 'icon svg',
        selector: `${byTestId('hz-iconbutton-primary')} svg`,
    },
];

const LINK_IDS = ['inline', 'standalone', 'subtle', 'external', 'disabled'].map(
    (v) => `hz-anchor-${v}`
);

const LINK_PROBE_PROPS = [
    'width',
    'height',
    'minHeight',
    'color',
    'backgroundColor',
    'textDecorationLine',
    'textDecorationThickness',
    'textUnderlineOffset',
    'fontFamily',
    'fontSize',
    'fontWeight',
    'lineHeight',
    'borderRadius',
    'outlineStyle',
    'outlineWidth',
    'outlineColor',
    'outlineOffset',
    'cursor',
    'display',
] as const;

const LINK: Target[] = [
    ...plain(LINK_IDS),
    {
        key: 'standalone, focused',
        selector: byTestId('hz-anchor-standalone'),
        focus: byTestId('hz-anchor-standalone'),
    },
    {
        key: 'external icon',
        selector: `${byTestId('hz-anchor-external')} svg`,
    },
];

/* ---- Forms (Task 11a) ---- */

const FORM_TYPE_PROPS = [
    'width',
    'height',
    'marginTop',
    'marginBottom',
    'marginInlineStart',
    'paddingTop',
    'paddingInlineStart',
    'fontFamily',
    'fontSize',
    'fontWeight',
    'lineHeight',
    'color',
    'cursor',
    'display',
] as const;

const LABEL: Target[] = [
    ...plain(['hz-label', 'hz-label-disabled']),
    { key: 'required mark', selector: `${byTestId('hz-label')} span` },
];

const FIELD_PROPS = [
    'width',
    'height',
    'marginTop',
    'marginBottom',
    'marginInlineStart',
    'marginInlineEnd',
    'paddingTop',
    'paddingInlineStart',
    'paddingInlineEnd',
    'borderTopWidth',
    'borderTopStyle',
    'borderRadius',
    'boxShadow',
    'boxSizing',
    'backgroundColor',
    'color',
    'fontFamily',
    'fontSize',
    'fontWeight',
    'lineHeight',
    'letterSpacing',
    'appearance',
    'outlineStyle',
    'outlineWidth',
    'outlineColor',
    'outlineOffset',
    'overflow',
    'resize',
    'cursor',
    'display',
    'verticalAlign',
] as const;

const fieldOf = (id: string) => `[data-input-field]:has(> ${byTestId(id)})`;
const INPUT_IDS = ['', '-sm', '-lg', '-invalid', '-disabled', '-number'].map(
    (v) => `hz-input${v}`
);
const INPUT: Target[] = [
    ...plain(INPUT_IDS),
    ...INPUT_IDS.map((id) => ({ key: `${id} field`, selector: fieldOf(id) })),
    {
        key: 'field, input focused',
        selector: fieldOf('hz-input'),
        focus: byTestId('hz-input'),
    },
    { key: 'search input', selector: byTestId('hz-input-search') },
    { key: 'search field', selector: fieldOf('hz-input-search') },
    {
        key: 'clear button',
        selector: `${fieldOf('hz-input-search')} button[aria-label="Clear"]`,
    },
    {
        key: 'clear button, focused',
        selector: `${fieldOf('hz-input-search')} button[aria-label="Clear"]`,
        focus: `${fieldOf('hz-input-search')} button[aria-label="Clear"]`,
    },
    {
        key: 'adornment IconButton (button + button)',
        selector: `${fieldOf('hz-input-search')} button[aria-label="Go"]`,
    },
];

/** The legacy-host stylesheets every probe is measured against. */
const LEGACY_CSS: readonly { label: string; opts: Opts }[] = [
    { label: 'bootstrap-reboot.css', opts: { reboot: '1' } },
    { label: 'full bootstrap.css', opts: { reboot: 'full' } },
    {
        label: 'full bootstrap.css + customer360 host CSS',
        opts: { reboot: 'full', host: true },
    },
];

const BUTTON_VARIANTS = [
    'primary',
    'secondary',
    'tertiary',
    'destructive',
    'ghost',
    'link',
] as const;

// Buttons are siblings in the harness: customer360's `button + button {
// margin-left: 8px }` applies to every Button after the first.
const BUTTON: Target[] = [
    ...plain(BUTTON_VARIANTS.map((v) => `hz-variant-${v}`)),
    ...plain(BUTTON_VARIANTS.map((v) => `hz-link-${v}`)),
    {
        key: 'secondary, focused',
        selector: byTestId('hz-variant-secondary'),
        focus: byTestId('hz-variant-secondary'),
    },
];

const PROBES: Record<string, Probe> = {
    Button: {
        targets: BUTTON,
        props: [
            ...ICON_BUTTON_PROPS,
            'marginInlineStart',
            'fontFamily',
            'fontWeight',
        ],
    },
    Typography: { targets: plain(TYPOGRAPHY), props: TYPE_PROPS },
    Chip: { targets: CHIP, props: CHIP_PROPS },
    Badge: { targets: BADGE, props: BADGE_PROPS },
    Spinner: { targets: SPINNER, props: SPINNER_PROPS },
    Separator: {
        targets: plain(['hz-separator-h', 'hz-separator-v']),
        props: SEPARATOR_PROPS,
    },
    Progress: { targets: PROGRESS, props: PROGRESS_PROPS },
    Alert: { targets: ALERT, props: ALERT_PROPS },
    Avatar: { targets: AVATAR, props: AVATAR_PROPS },
    IconButton: { targets: ICON_BUTTON, props: ICON_BUTTON_PROPS },
    Link: { targets: LINK, props: LINK_PROBE_PROPS },
    Label: { targets: LABEL, props: FORM_TYPE_PROPS },
    Input: { targets: INPUT, props: FIELD_PROPS },
};

type Styles = Record<string, Record<string, string>>;

type Opts = { reboot?: '1' | 'full'; horizonFirst?: boolean; host?: boolean };
const url = (build: 'layered' | 'unlayered', opts: Opts = {}) => {
    const q = new URLSearchParams();
    if (build === 'unlayered') q.set('build', 'unlayered');
    if (opts.reboot) q.set('reboot', opts.reboot);
    if (opts.horizonFirst) q.set('order', 'horizon-first');
    if (opts.host) q.set('host', 'customer360');
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
                // Read settled values, not a transition midpoint (infinite
                // animations, such as the Spinner's, never settle).
                await Promise.all(
                    el
                        .getAnimations()
                        .filter(
                            (a) => a.effect?.getTiming().iterations !== Infinity
                        )
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

        for (const legacy of LEGACY_CSS)
            for (const horizonFirst of [false, true])
                test(`unlayered build is unchanged by ${legacy.label} (${horizonFirst ? 'horizon CSS first' : 'Bootstrap first'})`, async ({
                    page,
                }) => {
                    const without = await measure(
                        page,
                        url('unlayered'),
                        probe
                    );
                    const withBootstrap = await measure(
                        page,
                        url('unlayered', { ...legacy.opts, horizonFirst }),
                        probe
                    );
                    expect(
                        await page.locator('#bootstrap-reboot').count()
                    ).toBe(1);
                    expect(await page.locator('#c360-host').count()).toBe(
                        legacy.opts.host ? 1 : 0
                    );
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

test.describe('layered build (known limit): Spinner against full Bootstrap', () => {
    test('spinner spans and the ring svg are untouched', async ({ page }) => {
        const probe = PROBES['Spinner'];
        if (!probe) throw new Error('no probe');
        const without = await measure(page, url('layered'), probe);
        const withBootstrap = await measure(
            page,
            url('layered', { reboot: 'full' }),
            probe
        );
        // Bootstrap's `svg { vertical-align: middle }` (unlayered) beats the
        // layered `hz:align-top`; the svg is display:block, so nothing moves.
        expect(diff(without, withBootstrap)).toEqual({
            'ring svg': ['verticalAlign: top -> middle'],
        });
    });
});

test.describe('reduced motion', () => {
    test.use({ reducedMotion: 'reduce' });

    for (const build of ['layered', 'unlayered'] as const)
        test(`loading indicators slow down instead of stopping; other motion still collapses (${build})`, async ({
            page,
        }) => {
            await page.goto(url(build, { reboot: 'full' }));
            const timing = (selector: string) =>
                page.locator(selector).evaluate((el) => {
                    const cs = getComputedStyle(el);
                    return {
                        name: cs.animationName,
                        duration: cs.animationDuration,
                        iterations: cs.animationIterationCount,
                        transition: cs.transitionDuration,
                        running: el
                            .getAnimations()
                            .map((a) => a.playState)
                            .join(),
                    };
                });
            const slow = {
                name: 'hz-spin',
                duration: '3s',
                iterations: 'infinite',
                transition: '0s',
                running: 'running',
            };
            expect(await timing(byTestId('hz-spinner-sm'))).toEqual(slow);
            expect(
                await timing(
                    `${byTestId('hz-ltr-loading')} [data-hz-motion="essential"]`
                )
            ).toEqual(slow);
            // Indeterminate Progress: the full bar pulses, it does not travel.
            const segment = `${byTestId('hz-progress-indeterminate')} [data-progress-indicator]`;
            expect(await timing(segment)).toEqual({
                name: 'hz-progress-pulse',
                duration: '2s',
                iterations: 'infinite',
                transition: '0s',
                running: 'running',
            });
            const widths = await page
                .locator(segment)
                .evaluate((el) => [
                    el.getBoundingClientRect().width,
                    el.parentElement?.getBoundingClientRect().width,
                ]);
            expect(widths[0]).toBe(widths[1]);
            // The Button itself (not essential) keeps the kill switch.
            expect((await timing(byTestId('hz-ltr-loading'))).transition).toBe(
                '1e-05s'
            );
        });
});

test.describe('layered build: Separator against full Bootstrap', () => {
    test('a div separator is untouched (Bootstrap only styles hr)', async ({
        page,
    }) => {
        const probe = PROBES['Separator'];
        if (!probe) throw new Error('no probe');
        const without = await measure(page, url('layered'), probe);
        const withBootstrap = await measure(
            page,
            url('layered', { reboot: 'full' }),
            probe
        );
        expect(diff(without, withBootstrap)).toEqual({});
        expect(without['hz-separator-h']?.['height']).toBe('1px');
        expect(without['hz-separator-v']?.['width']).toBe('1px');
    });
});

test.describe('layered build: Progress against full Bootstrap', () => {
    test('progress divs and spans are untouched', async ({ page }) => {
        const probe = PROBES['Progress'];
        if (!probe) throw new Error('no probe');
        const without = await measure(page, url('layered'), probe);
        const withBootstrap = await measure(
            page,
            url('layered', { reboot: 'full' }),
            probe
        );
        expect(diff(without, withBootstrap)).toEqual({});
    });
});

test.describe('layered build (known limit): Alert against full Bootstrap', () => {
    test('the surface and text are untouched; only the buttons change', async ({
        page,
    }) => {
        const probe = PROBES['Alert'];
        if (!probe) throw new Error('no probe');
        const without = await measure(page, url('layered'), probe);
        const withBootstrap = await measure(
            page,
            url('layered', { reboot: 'full' }),
            probe
        );
        const { widened, ...rest } = splitWidths(diff(without, withBootstrap));
        expect(rest).toEqual(LAYERED_ALERT_DIFF);
        // The action Button grows with Bootstrap's `button { font: inherit }`
        // (known Button limit), so the text column narrows by as much.
        expect(Object.keys(widened).sort()).toEqual([
            'action',
            'description',
            'title',
        ]);
    });
});

// Measured: the surface, icon and text keep every property. The reboot's
// `button { margin: 0; border-radius: 0 }` cancels the dismiss button's
// negative margins and squares its hover circle, and `button:focus` adds
// Bootstrap's ring; the action is a horizon Button (ADR 0001 known limit).
const dismissLimit = [
    'marginTop: -6px -> 0px',
    'marginInlineEnd: -6px -> 0px',
    'borderRadius: 100px -> 0px',
];
const LAYERED_ALERT_DIFF = {
    action: [
        'borderRadius: 20px -> 0px',
        'fontSize: 12px -> 16px',
        'lineHeight: 16px -> 20px',
    ],
    dismiss: dismissLimit,
    'dismiss, focused': [
        ...dismissLimit,
        ...bootstrapRing('solid', '2px', 'rgb(0, 80, 240)'),
    ],
};

test.describe('layered build: Avatar against full Bootstrap', () => {
    test('avatar spans are untouched; only invisible img properties follow Bootstrap', async ({
        page,
    }) => {
        const probe = PROBES['Avatar'];
        if (!probe) throw new Error('no probe');
        const without = await measure(page, url('layered'), probe);
        const withBootstrap = await measure(
            page,
            url('layered', { reboot: 'full' }),
            probe
        );
        // `img { vertical-align: middle; border-style: none }` (unlayered)
        // beats the layered `hz:align-top hz:border-0`; the img is absolutely
        // positioned and its border width stays 0, so nothing moves.
        expect(diff(without, withBootstrap)).toEqual({
            'photo img': [
                'borderTopStyle: solid -> none',
                'verticalAlign: top -> middle',
            ],
        });
    });
});

/**
 * Anchor-rendered components against the reboot's `a` rules, every
 * interaction state, unlayered build: identical with bootstrap-reboot.css and
 * full bootstrap.css, in both load orders, and on a touch device (sticky
 * hover without hover media).
 */
const anchorSuite = (name: string, ids: readonly string[]) => {
    test.describe(`${name} anchors: unlayered build vs Bootstrap a, a:hover, a:not([href])`, () => {
        for (const legacy of LEGACY_CSS)
            for (const horizonFirst of [false, true])
                test(`every state unchanged by ${legacy.label} (${horizonFirst ? 'horizon CSS first' : 'Bootstrap first'})`, async ({
                    page,
                }) => {
                    const without = await linkStates(
                        page,
                        url('unlayered'),
                        ids
                    );
                    expect(Object.keys(without)).toHaveLength(
                        ids.length * LINK_STATES.length
                    );
                    const withBootstrap = await linkStates(
                        page,
                        url('unlayered', { ...legacy.opts, horizonFirst }),
                        ids
                    );
                    expect(diffStates(without, withBootstrap)).toEqual({});
                });
    });

    test.describe(`${name} anchors on a touch device (no hover media), unlayered build`, () => {
        test.use({ hasTouch: true, isMobile: true });
        for (const horizonFirst of [false, true])
            test(`sticky :hover shows no Bootstrap a:hover look (${horizonFirst ? 'horizon first' : 'Bootstrap first'})`, async ({
                page,
            }) => {
                const without = await linkStates(
                    page,
                    url('unlayered'),
                    ids,
                    true
                );
                expect(
                    await page.evaluate(
                        () => matchMedia('(hover: hover)').matches
                    )
                ).toBe(false);
                const withBootstrap = await linkStates(
                    page,
                    url('unlayered', {
                        reboot: 'full',
                        host: true,
                        horizonFirst,
                    }),
                    ids,
                    true
                );
                expect(diffStates(without, withBootstrap)).toEqual({});
            });
    });
};

anchorSuite(
    'Button asChild',
    BUTTON_VARIANTS.map((v) => `hz-link-${v}`)
);

anchorSuite(
    'IconButton asChild',
    ICON_BUTTON_VARIANTS.map((v) => `hz-iconlink-${v}`)
);

test.describe('layered build (known limit): IconButton against full Bootstrap', () => {
    test('buttons lose the radius and focus ring; asChild links take the reboot link colour', async ({
        page,
    }) => {
        const probe = PROBES['IconButton'];
        if (!probe) throw new Error('no probe');
        const without = await measure(page, url('layered'), probe);
        const withBootstrap = await measure(
            page,
            url('layered', { reboot: 'full' }),
            probe
        );
        expect(diff(without, withBootstrap)).toEqual(LAYERED_ICON_BUTTON_DIFF);
    });
});

// Measured: Bootstrap's `button { border-radius: 0; line-height: inherit }`
// squares the buttons (line height has no visual effect on the fixed box) and
// `button:focus` adds its ring; the reboot's `a` colour and the missing fill
// win on asChild links. Legacy hosts use styles.unlayered.css (ADR 0001).
const squared = ['borderRadius: 100px -> 0px', 'lineHeight: 16px -> 24px'];
const rebootLinkColour = (from: string) => `color: ${from} -> rgb(0, 123, 255)`;
const LAYERED_ICON_BUTTON_DIFF = {
    'hz-iconbutton-primary': squared,
    'hz-iconbutton-secondary': squared,
    'hz-iconbutton-tertiary': squared,
    'hz-iconbutton-destructive': squared,
    'hz-iconbutton-ghost': squared,
    'hz-iconbutton-disabled': squared,
    'hz-iconbutton-loading': [...squared, 'cursor: progress -> pointer'],
    'hz-iconlink-primary': [
        rebootLinkColour('rgb(255, 255, 255)'),
        'backgroundColor: rgb(0, 80, 240) -> rgba(0, 0, 0, 0)',
    ],
    'hz-iconlink-secondary': [rebootLinkColour('rgb(0, 80, 240)')],
    'hz-iconlink-tertiary': [rebootLinkColour('rgb(0, 80, 240)')],
    'hz-iconlink-destructive': [
        rebootLinkColour('rgb(255, 255, 255)'),
        'backgroundColor: rgb(231, 13, 50) -> rgba(0, 0, 0, 0)',
    ],
    'hz-iconlink-ghost': [rebootLinkColour('rgb(15, 23, 42)')],
    'link, focused': [rebootLinkColour('rgb(15, 23, 42)')],
    'icon svg': ['lineHeight: 16px -> 24px'],
    'primary, focused': [
        ...squared,
        ...bootstrapRing('solid', '2px', 'rgb(0, 80, 240)'),
    ],
};

test.describe('IconButton mouse focus against Bootstrap button:focus', () => {
    for (const horizonFirst of [false, true])
        test(`a clicked icon button shows no ring, unlayered build (${horizonFirst ? 'horizon CSS first' : 'Bootstrap first'})`, async ({
            page,
        }) => {
            await page.goto(url('unlayered', { reboot: 'full', horizonFirst }));
            const button = page.getByTestId('hz-iconbutton-ghost');
            await button.click();
            expect(
                await button.evaluate((el) => [
                    el === document.activeElement,
                    el.matches(':focus-visible'),
                    getComputedStyle(el).outlineStyle,
                ])
            ).toEqual([true, false, 'none']);
        });
});

anchorSuite('Link', LINK_IDS);

test.describe('layered build (known limit): Link against full Bootstrap', () => {
    test('links take the reboot colour; the inline link loses its underline', async ({
        page,
    }) => {
        const probe = PROBES['Link'];
        if (!probe) throw new Error('no probe');
        const without = await measure(page, url('layered'), probe);
        const withBootstrap = await measure(
            page,
            url('layered', { reboot: 'full' }),
            probe
        );
        expect(diff(without, withBootstrap)).toEqual(LAYERED_LINK_DIFF);
    });
});

// Measured: the reboot's `a { color: #007bff; text-decoration: none }` and
// `a:not([href]) { color: inherit }` beat every layered utility: links turn
// Bootstrap blue, the inline link loses its underline (its non-colour cue)
// and the disabled link inherits the text colour. Type, size and focus ring
// survive. Legacy hosts must use styles.unlayered.css (ADR 0001).
const bootstrapBlue = (from: string) => `color: ${from} -> rgb(0, 123, 255)`;
const LAYERED_LINK_DIFF = {
    'hz-anchor-inline': [
        bootstrapBlue('rgb(0, 80, 240)'),
        'textDecorationLine: underline -> none',
    ],
    'hz-anchor-standalone': [bootstrapBlue('rgb(0, 80, 240)')],
    'standalone, focused': [bootstrapBlue('rgb(0, 80, 240)')],
    'hz-anchor-subtle': [bootstrapBlue('rgb(20, 120, 60)')],
    'hz-anchor-external': [bootstrapBlue('rgb(0, 80, 240)')],
    'external icon': [
        bootstrapBlue('rgb(0, 80, 240)'),
        'outlineColor: rgb(0, 80, 240) -> rgb(0, 123, 255)',
    ],
    'hz-anchor-disabled': ['color: rgb(71, 85, 105) -> rgb(15, 23, 42)'],
};

// KNOWN LIMIT, measured: in the layered build the host's unlayered
// `a { color }`, `a:hover`, `a:not([href])` and customer360's `a:hover,
// a:focus { text-decoration: none; outline: none }` win in every state: links
// are Bootstrap blue, the inline link has no underline and keyboard focus
// shows NO ring. customer360 must use styles.unlayered.css (ADR 0001).
test.describe('layered build (known limit): Link states against full Bootstrap + customer360 host CSS', () => {
    test('measured: Bootstrap colours, no inline underline, no focus ring', async ({
        page,
    }) => {
        const without = await linkStates(page, url('layered'), LINK_IDS);
        const withHost = await linkStates(
            page,
            url('layered', { reboot: 'full', host: true }),
            LINK_IDS
        );
        const changed = diffStates(without, withHost);
        // Every measured state of every link changed.
        expect(Object.keys(changed)).toHaveLength(
            LINK_IDS.length * LINK_STATES.length
        );
        const at = (id: string, state: string, prop: string) =>
            withHost[`hz-anchor-${id} ${state}`]?.[prop];
        for (const id of ['inline', 'standalone', 'subtle', 'external']) {
            expect(at(id, 'rest', 'color'), id).toBe('rgb(0, 123, 255)');
            expect(at(id, 'hover', 'color'), id).toBe('rgb(0, 86, 179)');
            expect(at(id, 'focus', 'outlineStyle'), id).toBe('none');
            expect(without[`hz-anchor-${id} focus`]?.['outlineStyle']).toBe(
                'solid'
            );
        }
        for (const state of LINK_STATES)
            expect(at('inline', state, 'textDecorationLine'), state).toBe(
                'none'
            );
        expect(at('disabled', 'rest', 'color')).toBe('rgb(15, 23, 42)');
    });
});

// KNOWN LIMIT of the LAYERED build for form controls (ADR 0001), measured
// against full bootstrap.css + customer360's host CSS (its `label`, `input`,
// `button + button` and `input::placeholder` rules). customer360 must use
// styles.unlayered.css, which the PROBES groups above prove unchanged.
// Width/height of text boxes depend on font metrics: only "changed" is kept.
const labelLimit = (color: string) => [
    'width: changed',
    'marginBottom: 0px -> 8px',
    'fontWeight: 600 -> 700',
    `color: ${color} -> rgb(67, 81, 119)`,
    'display: inline-flex -> block',
];
const LAYERED_FORMS_DIFF: Record<string, Record<string, string[]>> = {
    // customer360 `label { display: block; color; font-weight: bold }` and
    // the reboot's `margin-bottom: .5rem` win over the layered utilities.
    Label: {
        'hz-label': labelLimit('rgb(15, 23, 42)'),
        'hz-label-disabled': labelLimit('rgb(71, 85, 105)'),
        'required mark': [
            'width: changed',
            'height: changed',
            'fontWeight: 600 -> 700',
            'display: block -> inline',
        ],
    },
    // Inputs: Bootstrap's `input { line-height: inherit }` and customer360's
    // `input { font-size: 14px }` win; buttons lose radius and negative
    // margins, and customer360's `button:focus { outline: none }` removes the
    // clear button's focus ring.
    Input: {
        'adornment IconButton (button + button)': [
            'borderRadius: 100px -> 0px',
            'lineHeight: 16px -> 24px',
        ],
        'clear button': [
            'marginInlineEnd: -8px -> 0px',
            'borderRadius: 100px -> 0px',
        ],
        'clear button, focused': [
            'marginInlineEnd: -8px -> 0px',
            'borderRadius: 100px -> 0px',
            'outlineStyle: solid -> none',
            'outlineWidth: 2px -> 3px',
            'outlineColor: rgb(0, 80, 240) -> rgb(71, 85, 105)',
        ],
        'hz-input': ['lineHeight: 14px -> 21px'],
        'hz-input-disabled': ['lineHeight: 14px -> 21px'],
        'hz-input-invalid': ['lineHeight: 14px -> 21px'],
        'hz-input-lg': ['fontSize: 16px -> 14px', 'lineHeight: 20px -> 21px'],
        'hz-input-number': ['lineHeight: 14px -> 21px'],
        'hz-input-sm': ['lineHeight: 14px -> 21px'],
        'search input': [
            'width: changed',
            'lineHeight: 14px -> 21px',
            'outlineOffset: 0px -> -2px',
        ],
    },
};

const sizeAgnostic = (changed: Record<string, string[]>) =>
    Object.fromEntries(
        Object.entries(changed).map(([key, props]) => [
            key,
            props.map((p) => p.replace(/^(width|height): .*$/, '$1: changed')),
        ])
    );

test.describe('layered build (known limit): form controls against full Bootstrap + customer360 host CSS', () => {
    for (const [name, expected] of Object.entries(LAYERED_FORMS_DIFF))
        test(`${name}: exactly the measured properties change`, async ({
            page,
        }) => {
            const probe = PROBES[name];
            if (!probe) throw new Error(`no probe ${name}`);
            const without = await measure(page, url('layered'), probe);
            const withHost = await measure(
                page,
                url('layered', { reboot: 'full', host: true }),
                probe
            );
            expect(sizeAgnostic(diff(without, withHost))).toEqual(expected);
        });
});

// `::placeholder` is a pseudo-element: measured separately. customer360 sets
// `input::placeholder { color: var(--default-light) }` (unlayered).
test.describe('form placeholders against customer360 host CSS', () => {
    for (const horizonFirst of [false, true])
        test(`placeholder colour unchanged, unlayered build (${horizonFirst ? 'horizon CSS first' : 'Bootstrap first'})`, async ({
            page,
        }) => {
            const read = async (path: string) => {
                await page.goto(path);
                return page
                    .getByTestId('hz-input')
                    .evaluate(
                        (el) => getComputedStyle(el, '::placeholder').color
                    );
            };
            const without = await read(url('unlayered'));
            const withHost = await read(
                url('unlayered', { reboot: 'full', host: true, horizonFirst })
            );
            expect(withHost).toBe(without);
            expect(without).toBe('rgb(71, 85, 105)');
        });
});
