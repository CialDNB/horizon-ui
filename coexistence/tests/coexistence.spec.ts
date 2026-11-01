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

test('importing horizon styles does not change MUI Button computed styles', async ({
    page,
}) => {
    await page.goto('/?styles=0');
    await expect(page.getByTestId('mui-button')).toBeVisible();
    expect(await page.locator('#hz-styles').count()).toBe(0);
    const without = await muiSnapshots(page);

    await page.goto('/');
    await expect(page.getByTestId('mui-button')).toBeVisible();
    expect(await page.locator('#hz-styles').count()).toBe(1);
    const withStyles = await muiSnapshots(page);

    // Sanity: the baseline really is MUI on a 14px root, so equality is meaningful.
    expect(without.button.fontSize).toBe('14px');
    expect(without.button.backgroundColor).toBe('rgb(0, 80, 240)');
    expect(withStyles).toEqual(without);
});

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

// TODO(Task 11): implement once horizon Dialog exists. Needs the z-index scale
// token (horizon overlay above MUI modal 1300) and both dialogs clickable.
// Skipped, not silently passing: no Radix-free probe is meaningful here.
test.fixme('horizon Dialog and MUI Dialog stack in intended order', () => {
    // intentionally empty until Task 11
});

test('horizon inside dir=rtl subtree and MUI in ltr do not affect each other', async ({
    page,
}) => {
    await page.goto('/');
    const mui = page.getByTestId('mui-button');
    await expect(mui).toBeVisible();

    const muiState = () =>
        page.evaluate(() => {
            const el = document.querySelector('[data-testid="mui-button"]');
            if (!el) throw new Error('missing mui button');
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
        });
    const spinnerColors = (id: string) =>
        page.evaluate((testId) => {
            const spinner = document.querySelector(
                `[data-testid="${testId}"] span[aria-hidden="true"]`
            );
            if (!spinner) throw new Error(`missing spinner in ${testId}`);
            const cs = getComputedStyle(spinner);
            return {
                left: cs.borderLeftColor,
                right: cs.borderRightColor,
                direction: getComputedStyle(spinner).direction,
            };
        }, id);

    const before = await muiState();
    expect(before.direction).toBe('ltr');

    // Horizon rtl: border-e-transparent (logical) lands on the left edge.
    const rtl = await spinnerColors('hz-rtl-loading');
    expect(rtl.direction).toBe('rtl');
    expect(rtl.left).toBe('rgba(0, 0, 0, 0)');
    expect(rtl.right).not.toBe('rgba(0, 0, 0, 0)');
    // Horizon ltr sibling, same page: the logical edge is the right one.
    const ltr = await spinnerColors('hz-ltr-loading');
    expect(ltr.direction).toBe('ltr');
    expect(ltr.right).toBe('rgba(0, 0, 0, 0)');
    expect(ltr.left).not.toBe('rgba(0, 0, 0, 0)');

    // Removing the horizon rtl subtree must not change MUI (and vice versa).
    await page.evaluate(() => {
        document.querySelector('[data-testid="hz-rtl-section"]')?.remove();
    });
    expect(await muiState()).toEqual(before);
    expect(await spinnerColors('hz-ltr-loading')).toEqual(ltr);
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
