import { expect, test, type Page } from '@playwright/test';

const PROPS = [
    'fontSize',
    'padding',
    'borderRadius',
    'backgroundColor',
    'fontFamily',
    'lineHeight',
] as const;

type Snapshot = Record<(typeof PROPS)[number], string>;
type Snapshots = { button: Snapshot; typography: Snapshot; body: Snapshot };

async function muiSnapshots(page: Page): Promise<Snapshots> {
    return page.evaluate((props) => {
        const read = (el: Element): Record<string, string> => {
            const cs = getComputedStyle(el);
            return Object.fromEntries(
                props.map((p) => [p, cs[p as keyof CSSStyleDeclaration]])
            ) as Record<string, string>;
        };
        const q = (id: string) => {
            const el = document.querySelector(`[data-testid="${id}"]`);
            if (!el) throw new Error(`missing ${id}`);
            return el;
        };
        return {
            button: read(q('mui-button')),
            typography: read(q('mui-typography')),
            body: read(document.body),
        };
    }, PROPS) as Promise<Snapshots>;
}

const ROOTS = [
    // customer360: no html font-size, browser default; MUI htmlFontSize 14 on top.
    { px: 16, label: 'customer360 root 16px' },
    // Stress case: a host that sets html { font-size: 14px }.
    { px: 14, label: 'stress root 14px' },
] as const;

const setRoot = (page: Page, px: number) =>
    page.evaluate((v) => {
        document.documentElement.style.fontSize = `${v}px`;
    }, px);

const PLAIN_PROPS = [
    'margin',
    'padding',
    'fontFamily',
    'fontSize',
    'fontWeight',
    'lineHeight',
    'color',
    'borderTopWidth',
    'borderTopStyle',
    'borderTopColor',
    'borderRadius',
    'boxSizing',
    'display',
    'listStyleType',
    'textDecorationLine',
    'backgroundColor',
] as const;

type PlainStyles = Record<string, Record<string, string>>;

/** Plain, unstyled elements rendered outside `.hz-root`, plus the body. */
const plainSnapshot = (page: Page): Promise<PlainStyles> =>
    page.evaluate((props) => {
        const out: PlainStyles = {};
        const targets: [string, Element | null][] = [
            ['body', document.body],
            ...[
                'h1',
                'p',
                'a',
                'ul',
                'li',
                'button',
                'input',
                'table',
                'td',
            ].map((tag): [string, Element | null] => [
                tag,
                document.querySelector(`[data-testid="plain"] ${tag}`),
            ]),
        ];
        for (const [name, el] of targets) {
            if (!el) throw new Error(`missing plain ${name}`);
            const cs = getComputedStyle(el);
            out[name] = Object.fromEntries(
                props.map((p) => [
                    p,
                    cs[p as keyof CSSStyleDeclaration] as string,
                ])
            );
        }
        return out;
    }, PLAIN_PROPS);

const BUILDS = ['layered', 'unlayered'] as const;
type Build = (typeof BUILDS)[number];

/** Harness URL: which horizon build, whether the reboot loads, in what order. */
const url = (
    build: Build,
    opts: { styles?: boolean; reboot?: boolean; horizonFirst?: boolean } = {}
) => {
    const q = new URLSearchParams();
    if (build === 'unlayered') q.set('build', 'unlayered');
    if (opts.styles === false) q.set('styles', '0');
    if (opts.reboot) q.set('reboot', '1');
    if (opts.horizonFirst) q.set('order', 'horizon-first');
    const qs = q.toString();
    return qs ? `/?${qs}` : '/';
};

for (const build of BUILDS)
    for (const root of ROOTS) {
        test.describe(`${build} build, ${root.label}`, () => {
            test('importing horizon styles does not change MUI Button computed styles', async ({
                page,
            }) => {
                await page.goto(url(build, { styles: false }));
                await setRoot(page, root.px);
                await expect(page.getByTestId('mui-button')).toBeVisible();
                expect(await page.locator('#hz-styles').count()).toBe(0);
                const without = await muiSnapshots(page);

                await page.goto(url(build));
                await setRoot(page, root.px);
                await expect(page.getByTestId('mui-button')).toBeVisible();
                expect(await page.locator('#hz-styles').count()).toBe(1);
                const withStyles = await muiSnapshots(page);

                // Sanity: MUI htmlFontSize 14 means 1rem for the button, so the
                // baseline follows the root (16px in customer360), not a fixed 14px.
                expect(without.button.fontSize).toBe(`${root.px}px`);
                expect(without.button.backgroundColor).toBe('rgb(0, 80, 240)');
                expect(withStyles).toEqual(without);
            });

            for (const reboot of [
                { label: 'no reboot', reboot: false, horizonFirst: false },
                { label: 'reboot first', reboot: true, horizonFirst: false },
                { label: 'horizon first', reboot: true, horizonFirst: true },
            ])
                test(`plain elements outside .hz-root are unchanged by horizon styles (${reboot.label})`, async ({
                    page,
                }) => {
                    await page.goto(
                        url(build, { styles: false, reboot: reboot.reboot })
                    );
                    await setRoot(page, root.px);
                    expect(
                        await page.locator('#bootstrap-reboot').count()
                    ).toBe(reboot.reboot ? 1 : 0);
                    const without = await plainSnapshot(page);
                    await page.goto(url(build, reboot));
                    await setRoot(page, root.px);
                    expect(await page.locator('#hz-styles').count()).toBe(1);
                    const withStyles = await plainSnapshot(page);
                    // Sanity: the probes are real browser-default (or reboot) elements.
                    expect(without['button']?.['borderRadius']).toBe('0px');
                    expect(without['ul']?.['listStyleType']).toBe('disc');
                    expect(withStyles).toEqual(without);
                });
        });
    }

test('horizon Button renders identically at html font-size 14px and 16px', async ({
    page,
}) => {
    await page.goto('/');
    const button = page.getByTestId('hz-button');
    const sizeAt = async (px: number) => {
        await page.evaluate((v) => {
            document.documentElement.style.fontSize = `${v}px`;
        }, px);
        const box = await button.boundingBox();
        if (!box) throw new Error('horizon button not rendered');
        return box;
    };
    const at14 = await sizeAt(14);
    const at16 = await sizeAt(16);
    expect(at14.width).toBeGreaterThan(40);
    expect(Math.abs(at14.width - at16.width)).toBeLessThanOrEqual(1);
    expect(Math.abs(at14.height - at16.height)).toBeLessThanOrEqual(1);
});

/*
 * Documented stacking order (src/tokens/zIndex.ts, ADR 0001): every Horizon
 * overlay sits above the MUI modal layer (1300): dialog 1350 < dropdown 1400
 * < popover 1450 < tooltip 1500 < toast 1600. Supported: a Horizon Dialog
 * opened from inside an MUI Dialog (content wrapped in an inner
 * HorizonProvider). Not supported: an MUI Dialog opened from a Horizon
 * Dialog; it renders below (measured here so the docs stay true).
 */
const hitTestId = (page: Page, x: number, y: number) =>
    page.evaluate(
        ([px, py]) => {
            const hit = document.elementFromPoint(px ?? 0, py ?? 0);
            return {
                horizonDialog:
                    hit?.closest('[data-dialog-content]') !== null &&
                    hit?.closest('[data-dialog-content]') !== undefined,
                horizonScrim: hit?.hasAttribute('data-dialog-overlay') ?? false,
                muiDialog: hit?.closest('.MuiDialog-container') !== null,
            };
        },
        [x, y]
    );

test.describe('horizon Dialog and MUI Dialog stack in intended order', () => {
    for (const build of ['layered', 'unlayered'] as const)
        test(`a Horizon Dialog opened inside an MUI Dialog is on top; clicks, focus and Escape stay with it (${build})`, async ({
            page,
        }) => {
            await page.goto(
                `/?reboot=full&host=customer360${build === 'unlayered' ? '&build=unlayered' : ''}`
            );
            await page.getByTestId('open-mui-overlays').click();
            const muiContent = page.getByTestId('mui-overlays-content');
            await expect(muiContent).toBeVisible();
            const trigger = page.getByTestId('mui-dialog-trigger');
            await trigger.focus();
            await page.keyboard.press('Enter');
            const dialog = page.getByRole('dialog', { name: 'Overlay dialog' });
            await expect(dialog).toBeVisible();
            await dialog.evaluate((el) =>
                Promise.all(el.getAnimations().map((a) => a.finished))
            );
            expect(
                await dialog.evaluate((el) => getComputedStyle(el).zIndex)
            ).toBe('1350');
            const muiZ = await page
                .locator('.MuiDialog-root')
                .first()
                .evaluate((el) => getComputedStyle(el).zIndex);
            expect(muiZ).toBe('1300');
            // The Horizon panel is the topmost element at its centre.
            const box = await dialog.boundingBox();
            if (!box) throw new Error('no dialog box');
            expect(
                await hitTestId(
                    page,
                    box.x + box.width / 2,
                    box.y + box.height / 2
                )
            ).toMatchObject({ horizonDialog: true });
            // Outside the panel the Horizon scrim covers the MUI dialog and
            // its backdrop, so nothing behind can be clicked through.
            expect(await hitTestId(page, 4, 4)).toMatchObject({
                horizonScrim: true,
            });
            // Focus is in the Horizon dialog and Tab stays there (MUI's
            // focus trap accepts it: the inner provider is inside its DOM).
            await expect(page.getByTestId('mui-dialog-input')).toBeFocused();
            for (let i = 0; i < 6; i++) {
                await page.keyboard.press('Tab');
                expect(
                    await dialog.evaluate((el) =>
                        el.contains(document.activeElement)
                    )
                ).toBe(true);
            }
            // Escape closes only the Horizon dialog; focus returns to its
            // trigger inside the still-open MUI dialog.
            await page.keyboard.press('Escape');
            await expect(dialog).toHaveCount(0);
            await expect(muiContent).toBeVisible();
            await expect(trigger).toBeFocused();
            // Pointer: a scrim click closes only the Horizon dialog.
            await trigger.click();
            await expect(dialog).toBeVisible();
            // Radix starts listening for outside presses a tick after open.
            await dialog.evaluate((el) =>
                Promise.all(el.getAnimations().map((a) => a.finished))
            );
            await page.mouse.click(4, 4);
            await expect(dialog).toHaveCount(0);
            await expect(muiContent).toBeVisible();
            // A second Escape now closes the MUI dialog itself.
            await trigger.focus();
            await page.keyboard.press('Escape');
            await expect(muiContent).toHaveCount(0);
        });

    test('NOT supported (measured): an MUI Dialog opened from a Horizon Dialog renders below it', async ({
        page,
    }) => {
        await page.goto('/?build=unlayered&reboot=full&host=customer360');
        await page.getByTestId('hz-dialog-trigger').click();
        const dialog = page.getByRole('dialog', { name: 'Overlay dialog' });
        await expect(dialog).toBeVisible();
        await page.getByTestId('open-mui-from-hz').click();
        const mui = page.getByTestId('mui-from-hz-content');
        await expect(mui).toBeAttached();
        const order = await page.evaluate(() => {
            const muiRoot = document
                .querySelector('[data-testid="mui-from-hz-content"]')
                ?.closest('.MuiDialog-root');
            const hz = document.querySelector('[data-dialog-content]');
            const z = (el: Element | null | undefined) =>
                el ? Number(getComputedStyle(el).zIndex) : NaN;
            return {
                mui: z(muiRoot),
                horizon: z(hz),
                // Both are root-level stacking contexts (no transformed or
                // z-indexed ancestor), so the numbers decide the order.
                muiParentIsBody: muiRoot?.parentElement === document.body,
                muiPointerEvents: muiRoot
                    ? getComputedStyle(muiRoot).pointerEvents
                    : '',
            };
        });
        // Horizon (1350) paints above the MUI dialog (1300) ...
        expect(order.mui).toBe(1300);
        expect(order.horizon).toBe(1350);
        expect(order.muiParentIsBody).toBe(true);
        // ... and the modal Horizon dialog blocks pointer input outside
        // itself (Radix sets pointer-events: none on body), so the MUI
        // dialog can be neither seen on top nor clicked.
        expect(order.muiPointerEvents).toBe('none');
        const muiBox = await mui.boundingBox();
        if (!muiBox) throw new Error('no mui box');
        const hit = await hitTestId(
            page,
            muiBox.x + muiBox.width / 2,
            muiBox.y + muiBox.height / 2
        );
        expect(hit.muiDialog).toBe(false);
    });
});

test('horizon inside dir=rtl subtree and MUI in ltr do not affect each other', async ({
    page,
}) => {
    await page.goto('/');
    await expect(page.getByTestId('mui-button')).toBeVisible();

    const probe = (testId: string) =>
        page.evaluate((id) => {
            const el = document.querySelector(`[data-testid="${id}"]`);
            if (!el) throw new Error(`missing ${id}`);
            const cs = getComputedStyle(el);
            const r = el.getBoundingClientRect();
            return {
                direction: cs.direction,
                textAlign: cs.textAlign,
                paddingLeft: cs.paddingLeft,
                paddingRight: cs.paddingRight,
                left: r.left,
                width: r.width,
            };
        }, testId);
    const spinner = (testId: string) =>
        page.evaluate((id) => {
            const el = document.querySelector(
                `[data-testid="${id}"] span[aria-hidden="true"]`
            );
            if (!el) throw new Error(`missing spinner in ${id}`);
            const cs = getComputedStyle(el);
            return {
                direction: cs.direction,
                left: cs.borderLeftColor,
                right: cs.borderRightColor,
            };
        }, testId);
    const transparent = 'rgba(0, 0, 0, 0)';

    // The provider itself carries the direction (no wrapper dir masks it).
    const roots = await page.evaluate(() => ({
        wrapperDir: document
            .querySelector('[data-testid="hz-rtl-section"]')
            ?.getAttribute('dir'),
        rtlRootDir: document
            .querySelector('[data-testid="hz-rtl-section"] .hz-root')
            ?.getAttribute('dir'),
        ltrRootDir: document
            .querySelector('[data-testid="horizon"] .hz-root')
            ?.getAttribute('dir'),
    }));
    expect(roots).toEqual({
        wrapperDir: null,
        rtlRootDir: 'rtl',
        ltrRootDir: 'ltr',
    });

    const muiBefore = await probe('mui-button');
    const muiRtlBefore = await probe('mui-in-rtl');
    expect(muiBefore.direction).toBe('ltr');
    expect(muiRtlBefore.direction).toBe('rtl');

    // Horizon rtl: border-e-transparent (logical) lands on the left edge.
    const rtl = await spinner('hz-rtl-loading');
    expect(rtl.direction).toBe('rtl');
    expect(rtl.left).toBe(transparent);
    expect(rtl.right).not.toBe(transparent);
    // Horizon ltr beside MUI, and Horizon ltr inside a rtl area.
    for (const id of ['hz-ltr-loading', 'hz-ltr-in-rtl']) {
        const ltr = await spinner(id);
        expect(ltr.direction).toBe('ltr');
        expect(ltr.right).toBe(transparent);
        expect(ltr.left).not.toBe(transparent);
    }

    // Removing every horizon subtree must not change MUI, in either direction.
    const ltrSpinner = await spinner('hz-ltr-loading');
    await page.evaluate(() => {
        document.querySelector('[data-testid="hz-rtl-section"]')?.remove();
        document
            .querySelector('[data-testid="hz-ltr-in-rtl"]')
            ?.closest('.hz-root')
            ?.remove();
    });
    expect(await probe('mui-button')).toEqual(muiBefore);
    expect(await probe('mui-in-rtl')).toEqual(muiRtlBefore);
    expect(await spinner('hz-ltr-loading')).toEqual(ltrSpinner);
});

test('no horizontal overflow at 320px for the harness page', async ({
    page,
}) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await page.goto('/');
    await expect(page.getByTestId('hz-button')).toBeVisible();
    const overflow = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
        bodyScrollWidth: document.body.scrollWidth,
    }));
    expect(overflow.clientWidth).toBe(320);
    expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth);
    expect(overflow.bodyScrollWidth).toBeLessThanOrEqual(overflow.clientWidth);
});

test('breakpoint variants switch exactly at 768, 1280 and 1919/1920px', async ({
    page,
}) => {
    await page.goto('/');
    const probe = page.getByTestId('hz-bp-probe');
    const fontSizeAt = async (width: number) => {
        await page.setViewportSize({ width, height: 800 });
        return probe.evaluate((el) => getComputedStyle(el).fontSize);
    };
    // Probe classes: micro, tablet:caption, laptop:body-default, desktop:heading-xl.
    const [w767, w768, w1279, w1280, w1919, w1920] = [
        await fontSizeAt(767),
        await fontSizeAt(768),
        await fontSizeAt(1279),
        await fontSizeAt(1280),
        await fontSizeAt(1919),
        await fontSizeAt(1920),
    ];
    expect(await fontSizeAt(320)).toBe(w767);
    expect(w768).not.toBe(w767);
    expect(w1279).toBe(w768);
    expect(w1280).not.toBe(w1279);
    expect(w1919).toBe(w1280);
    expect(w1920).not.toBe(w1919);
    expect(new Set([w767, w768, w1280, w1920]).size).toBe(4);
});

const VARIANTS = [
    'primary',
    'secondary',
    'tertiary',
    'destructive',
    'ghost',
    'link',
] as const;
const BUTTON_PROPS = [
    'borderRadius',
    'fontFamily',
    'fontSize',
    'fontWeight',
    'lineHeight',
    'textTransform',
    'outlineStyle',
    'outlineWidth',
    'outlineColor',
    'outlineOffset',
    'boxShadow',
    'backgroundColor',
    'cursor',
    'padding',
    'margin',
    'boxSizing',
    'color',
    'display',
] as const;
type Styles = Record<string, Record<string, string>>;

/**
 * Computed styles of the six Button variants, each focused with the keyboard
 * (so `:focus-visible` and Bootstrap's `button:focus` both match), plus the
 * loading button (aria-busy; the reboot's `[type="button"]:not(:disabled) {
 * cursor: pointer }` competes with its progress cursor).
 */
const measureButtons = async (page: Page, path: string): Promise<Styles> => {
    await page.goto(path);
    await expect(page.getByTestId('hz-variant-primary')).toBeVisible();
    const out: Styles = {};
    for (const id of [
        ...VARIANTS.map((v) => `hz-variant-${v}`),
        'hz-ltr-loading',
    ]) {
        const button = page.getByTestId(id);
        // Keyboard modality first, so the focused button matches :focus-visible.
        await page.keyboard.press('Shift');
        await button.focus();
        out[id] = await button.evaluate(async (el, props) => {
            // `hz:transition` animates colours (outline-color included) for
            // 100ms after focus; read the settled values, not a midpoint.
            // A cancelled transition rejects `finished` with AbortError.
            await Promise.all(
                el.getAnimations().map((a) => a.finished.catch(() => undefined))
            );
            const cs = getComputedStyle(el);
            return Object.fromEntries(
                props.map((p) => [
                    p,
                    cs[p as keyof CSSStyleDeclaration] as string,
                ])
            );
        }, BUTTON_PROPS);
    }
    return out;
};

/**
 * Outline of each variant after a mouse click: focused but not
 * `:focus-visible`, so Horizon shows no ring while Bootstrap's `button:focus`
 * would draw its 5px auto ring.
 */
const pointerFocusOutline = async (page: Page, path: string) => {
    await page.goto(path);
    const out: Record<string, string> = {};
    for (const variant of VARIANTS) {
        const button = page.getByTestId(`hz-variant-${variant}`);
        await button.click();
        out[variant] = await button.evaluate((el) =>
            [
                el === document.activeElement,
                el.matches(':focus-visible'),
                getComputedStyle(el).outlineStyle,
            ].join(' ')
        );
    }
    return out;
};

const changedProps = (a: Styles, b: Styles, id: string) =>
    BUTTON_PROPS.filter((p) => a[id]?.[p] !== b[id]?.[p]);

// KNOWN LIMIT of the LAYERED build (ADR 0001): customer360 ships Bootstrap
// 4.4.1 UNLAYERED. Layered horizon utilities always lose to unlayered element
// rules, so the reboot's `button { border-radius: 0; font-size: inherit;
// line-height: inherit }` and `button:focus { outline: 5px auto }` beat
// `hz:rounded-lg`, the type-scale utilities and the focus ring. These tests
// assert the measured behaviour of `styles.css`; legacy hosts use
// `styles.unlayered.css` instead (next group).
test.describe('layered build (known limit): unlayered Bootstrap reboot overrides horizon Button', () => {
    test('reboot overrides exactly border-radius, font-size, line-height and the focus outline', async ({
        page,
    }) => {
        const without = await measureButtons(page, url('layered'));
        const withReboot = await measureButtons(
            page,
            url('layered', { reboot: true })
        );
        for (const variant of VARIANTS) {
            const id = `hz-variant-${variant}`;
            const a = without[id] ?? {};
            const b = withReboot[id] ?? {};
            expect(changedProps(without, withReboot, id), variant).toEqual([
                'borderRadius',
                'fontSize',
                'lineHeight',
                'outlineStyle',
                'outlineWidth',
                'outlineColor',
            ]);
            // Focus ring: hz 2px solid -> Bootstrap `button:focus` 5px auto.
            expect(a['outlineStyle']).toBe('solid');
            expect(b['outlineStyle']).toBe('auto');
            expect(a['borderRadius']).toBe('20px');
            expect(b['borderRadius']).toBe('0px');
            // label-md: 14px / 20px; the reboot makes it inherit 16px / 24px.
            expect(a['fontSize']).toBe('14px');
            expect(b['fontSize']).toBe('16px');
            expect(a['lineHeight']).toBe('20px');
            expect(b['lineHeight']).toBe('24px');
        }
        // A mouse click (focus without :focus-visible) gets Bootstrap's ring.
        const pointer = await pointerFocusOutline(
            page,
            url('layered', { reboot: true })
        );
        for (const variant of VARIANTS)
            expect(pointer[variant], variant).toBe('true false auto');
        // The loading button's progress cursor loses to the reboot's
        // `[type="button"]:not(:disabled) { cursor: pointer }` as well.
        expect(without['hz-ltr-loading']?.['cursor']).toBe('progress');
        expect(withReboot['hz-ltr-loading']?.['cursor']).toBe('pointer');
    });

    test('reboot leaves background, cursor, padding, margin, box-sizing, family, weight, transform, shadow and colour intact', async ({
        page,
    }) => {
        const without = await measureButtons(page, url('layered'));
        const withReboot = await measureButtons(
            page,
            url('layered', { reboot: true })
        );
        const intact = [
            'backgroundColor',
            'cursor',
            'padding',
            'margin',
            'boxSizing',
            'fontFamily',
            'fontWeight',
            'textTransform',
            'boxShadow',
            'color',
            'display',
        ] as const;
        for (const variant of VARIANTS)
            for (const p of intact)
                expect(
                    withReboot[`hz-variant-${variant}`]?.[p],
                    `${variant}.${p}`
                ).toBe(without[`hz-variant-${variant}`]?.[p]);
    });
});

test.describe('unlayered build: Bootstrap reboot does not override horizon Button', () => {
    test('unlayered build renders horizon Button identically to the layered build', async ({
        page,
    }) => {
        const layered = await measureButtons(page, url('layered'));
        const unlayered = await measureButtons(page, url('unlayered'));
        expect(unlayered).toEqual(layered);
        expect(layered['hz-ltr-loading']?.['cursor']).toBe('progress');
    });

    for (const order of [
        { label: 'reboot before horizon CSS', horizonFirst: false },
        { label: 'horizon CSS before reboot', horizonFirst: true },
    ])
        test(`radius, type, focus outline and every other measured property are preserved (${order.label})`, async ({
            page,
        }) => {
            const without = await measureButtons(page, url('unlayered'));
            const withReboot = await measureButtons(
                page,
                url('unlayered', { reboot: true, ...order })
            );
            expect(await page.locator('#bootstrap-reboot').count()).toBe(1);
            const overridden = Object.fromEntries(
                Object.keys(without)
                    .map((id) => [id, changedProps(without, withReboot, id)])
                    .filter(([, changed]) => (changed?.length ?? 0) > 0)
            );
            expect(overridden).toEqual({});
            for (const variant of VARIANTS) {
                const b = withReboot[`hz-variant-${variant}`] ?? {};
                expect(b['borderRadius'], variant).toBe('20px');
                expect(b['fontSize'], variant).toBe('14px');
                expect(b['lineHeight'], variant).toBe('20px');
                expect(b['outlineStyle'], variant).toBe('solid');
                expect(b['outlineWidth'], variant).toBe('2px');
            }
            expect(withReboot['hz-ltr-loading']?.['cursor']).toBe('progress');
            expect(withReboot['hz-variant-primary']?.['outlineColor']).toBe(
                without['hz-variant-primary']?.['outlineColor']
            );
            // Mouse focus: no ring, as without the reboot.
            const pointer = await pointerFocusOutline(
                page,
                url('unlayered', { reboot: true, ...order })
            );
            for (const variant of VARIANTS)
                expect(pointer[variant], variant).toBe('true false none');
        });
});

// `Button asChild` + `<a href>` against the reboot's anchor rules:
// `a { color: #007bff; text-decoration: none; background-color: transparent }`
// (0,0,1) and `a:hover { color: #0056b3; text-decoration: underline }` (0,1,1).
// The reboot has no `a:focus`, `a:active` or `a:visited` rule; those states are
// measured anyway (an `a:hover` also matches while pressed). Computed styles
// never expose `:visited` colours (browser privacy), so "visited" checks the
// link after it has been followed.
const LINK_STATES = ['rest', 'hover', 'focus', 'active', 'visited'] as const;
const LINK_PROPS = [
    'color',
    'backgroundColor',
    'textDecorationLine',
    'textDecorationThickness',
    'borderRadius',
    'fontSize',
] as const;

const linkStates = async (page: Page, path: string, touch = false) => {
    await page.goto(path);
    await expect(page.getByTestId('hz-link-primary')).toBeVisible();
    const out: Record<string, Record<string, string>> = {};
    const read = async (variant: string, state: string) => {
        out[`${variant} ${state}`] = await page
            .getByTestId(`hz-link-${variant}`)
            .evaluate(async (el, props) => {
                // A cancelled transition rejects `finished` with AbortError.
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
            }, LINK_PROPS);
    };
    const reset = async () => {
        await page.mouse.move(0, 0);
        await page.evaluate(() =>
            (document.activeElement as HTMLElement | null)?.blur()
        );
    };
    for (const variant of VARIANTS) {
        const link = page.getByTestId(`hz-link-${variant}`);
        await reset();
        await read(variant, 'rest');
        if (touch) {
            // Real touch browsers leave :hover on a tapped element (sticky
            // hover) while `(hover: hover)` is false. Playwright's tap does
            // not, so a pointer move puts :hover on the link instead.
            await link.hover();
            expect(
                await link.evaluate((el) => el.matches(':hover')),
                `${variant} :hover`
            ).toBe(true);
            await read(variant, 'hover');
            continue;
        }
        await link.hover();
        await read(variant, 'hover');
        await reset();
        await page.keyboard.press('Shift');
        await link.focus();
        await read(variant, 'focus');
        await reset();
        await link.hover();
        await page.mouse.down();
        await read(variant, 'active');
        await page.mouse.up();
        await reset();
        await read(variant, 'visited');
    }
    return out;
};

const diffStates = (
    a: Record<string, Record<string, string>>,
    b: Record<string, Record<string, string>>
) =>
    Object.fromEntries(
        Object.keys(a)
            .map((key) => [
                key,
                LINK_PROPS.filter((p) => a[key]?.[p] !== b[key]?.[p]).map(
                    (p) => `${p}: ${a[key]?.[p]} -> ${b[key]?.[p]}`
                ),
            ])
            .filter(([, changed]) => (changed?.length ?? 0) > 0)
    );

test.describe('unlayered build: Bootstrap reboot does not restyle Button asChild links', () => {
    for (const order of [
        { label: 'reboot before horizon CSS', horizonFirst: false },
        { label: 'horizon CSS before reboot', horizonFirst: true },
    ])
        test(`colour, fill and decoration kept at rest, hover, focus, active and visited (${order.label})`, async ({
            page,
        }) => {
            const without = await linkStates(page, url('unlayered'));
            const withReboot = await linkStates(
                page,
                url('unlayered', { reboot: true, ...order })
            );
            expect(Object.keys(without)).toHaveLength(
                VARIANTS.length * LINK_STATES.length
            );
            expect(diffStates(without, withReboot)).toEqual({});
            // Sanity: the states are real (tertiary underlines on hover only).
            expect(without['tertiary rest']?.['textDecorationLine']).toBe(
                'none'
            );
            expect(without['tertiary hover']?.['textDecorationLine']).toBe(
                'underline'
            );
            expect(without['primary hover']?.['color']).toBe(
                without['primary rest']?.['color']
            );
        });
});

test.describe('unlayered build on a touch device (no hover media)', () => {
    test.use({ hasTouch: true, isMobile: true });

    for (const order of [false, true])
        test(`sticky :hover shows no Bootstrap a:hover colour or underline (${order ? 'horizon first' : 'reboot first'})`, async ({
            page,
        }) => {
            const without = await linkStates(page, url('unlayered'), true);
            expect(
                await page.evaluate(() => matchMedia('(hover: hover)').matches)
            ).toBe(false);
            const withReboot = await linkStates(
                page,
                url('unlayered', { reboot: true, horizonFirst: order }),
                true
            );
            expect(diffStates(without, withReboot)).toEqual({});
        });
});

// KNOWN LIMIT of the LAYERED build: the reboot's unlayered anchor rules beat
// every layered utility, so asChild links lose their colour and fill at rest
// and take Bootstrap's hover colour and underline. Not fixable inside the
// layer without !important; legacy hosts use styles.unlayered.css.
test.describe('layered build (known limit): reboot anchor rules restyle Button asChild links', () => {
    test('rest: Bootstrap link colour, no fill; hover: Bootstrap hover colour and underline', async ({
        page,
    }) => {
        const states = await linkStates(page, url('layered', { reboot: true }));
        for (const variant of VARIANTS) {
            const rest = states[`${variant} rest`] ?? {};
            const hover = states[`${variant} hover`] ?? {};
            expect(
                [
                    rest['color'],
                    rest['backgroundColor'],
                    rest['textDecorationLine'],
                ],
                variant
            ).toEqual(['rgb(0, 123, 255)', 'rgba(0, 0, 0, 0)', 'none']);
            expect(
                [hover['color'], hover['textDecorationLine']],
                variant
            ).toEqual(['rgb(0, 86, 179)', 'underline']);
            // Radius and type come from utilities the reboot does not set on `a`.
            expect(rest['borderRadius'], variant).toBe('20px');
            expect(rest['fontSize'], variant).toBe('14px');
        }
    });
});

for (const build of BUILDS)
    test(`${build} build: Button spinner runs hz-spin even when the host defines @keyframes spin`, async ({
        page,
    }) => {
        await page.goto(url(build));
        // A host keyframes named like Tailwind's, loaded after horizon CSS.
        await page.addStyleTag({
            content: '@keyframes spin { from, to { opacity: 0.5 } }',
        });
        const spinner = page.locator(
            '[data-testid="hz-ltr-loading"] span[aria-hidden="true"]'
        );
        const animation = await spinner.evaluate((el) => {
            const running = el
                .getAnimations()
                .filter((a): a is CSSAnimation => a instanceof CSSAnimation);
            const first = running[0];
            const keyframes =
                first?.effect instanceof KeyframeEffect
                    ? first.effect.getKeyframes()
                    : [];
            return {
                name: getComputedStyle(el).animationName,
                running: running.map((a) => [a.animationName, a.playState]),
                transforms: keyframes.map((k) => String(k['transform'] ?? '')),
                opacity: keyframes.map((k) => String(k['opacity'] ?? '')),
            };
        });
        expect(animation.name).toBe('hz-spin');
        expect(animation.running).toEqual([['hz-spin', 'running']]);
        expect(animation.transforms).toContain('rotate(360deg)');
        expect(animation.opacity.filter(Boolean)).toEqual([]);
    });
