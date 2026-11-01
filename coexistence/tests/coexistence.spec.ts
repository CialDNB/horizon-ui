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

for (const root of ROOTS) {
    test.describe(root.label, () => {
        test('importing horizon styles does not change MUI Button computed styles', async ({
            page,
        }) => {
            await page.goto('/?styles=0');
            await setRoot(page, root.px);
            await expect(page.getByTestId('mui-button')).toBeVisible();
            expect(await page.locator('#hz-styles').count()).toBe(0);
            const without = await muiSnapshots(page);

            await page.goto('/');
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

        test('plain elements outside .hz-root are unchanged by horizon styles', async ({
            page,
        }) => {
            await page.goto('/?styles=0');
            await setRoot(page, root.px);
            const without = await plainSnapshot(page);
            await page.goto('/');
            await setRoot(page, root.px);
            expect(await page.locator('#hz-styles').count()).toBe(1);
            const withStyles = await plainSnapshot(page);
            // Sanity: the probes are real browser-default elements.
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

// TODO(Task 11): implement once horizon Dialog exists. It needs the z-index
// scale token (horizon overlay above the MUI modal, 1300) and both dialogs
// clickable. Skipped on purpose so it cannot pass silently.
test.fixme('horizon Dialog and MUI Dialog stack in intended order', () => {
    // intentionally empty until Task 11
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

// KNOWN LIMIT (documented in ADR 0001, mitigation decision pending): customer360
// ships Bootstrap 4.4.1 UNLAYERED. Layered horizon utilities always lose to
// unlayered element rules, so the reboot's `button { border-radius: 0;
// font-size: inherit; line-height: inherit }` beats `hz:rounded-lg` and the
// type-scale utilities. These tests assert today's measured behaviour (they are
// not a statement of desired behaviour); when the mitigation lands they must be
// inverted to assert zero differences.
test.describe('known limit: unlayered Bootstrap reboot overrides horizon Button', () => {
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

    const measure = async (page: Page, reboot: boolean): Promise<Styles> => {
        await page.goto(reboot ? '/?reboot=1' : '/');
        await expect(page.getByTestId('hz-variant-primary')).toBeVisible();
        const out: Styles = {};
        for (const variant of VARIANTS) {
            const button = page.getByTestId(`hz-variant-${variant}`);
            // Keyboard modality first, so the focused button matches :focus-visible.
            await page.keyboard.press('Shift');
            await button.focus();
            out[variant] = await button.evaluate((el, props) => {
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

    test('reboot overrides exactly border-radius, font-size, line-height and the focus outline', async ({
        page,
    }) => {
        const without = await measure(page, false);
        const withReboot = await measure(page, true);
        for (const variant of VARIANTS) {
            const a = without[variant] ?? {};
            const b = withReboot[variant] ?? {};
            const changed = BUTTON_PROPS.filter((p) => a[p] !== b[p]);
            expect(changed, variant).toEqual([
                'borderRadius',
                'fontSize',
                'lineHeight',
                'outlineStyle',
                'outlineWidth',
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
    });

    test('reboot leaves background, cursor, padding, margin, box-sizing, family, weight, transform, shadow and colour intact', async ({
        page,
    }) => {
        const without = await measure(page, false);
        const withReboot = await measure(page, true);
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
                expect(withReboot[variant]?.[p], `${variant}.${p}`).toBe(
                    without[variant]?.[p]
                );
    });
});
