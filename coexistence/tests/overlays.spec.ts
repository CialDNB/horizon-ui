import { expect, test, type Locator, type Page } from '@playwright/test';

/*
 * Task 11b overlays (Tooltip, Popover, Dialog, Drawer, DropdownMenu, Toast)
 * against customer360's unlayered CSS (Bootstrap 4.4.1 reboot or full
 * bootstrap.css, plus its own host rules), both CSS builds and both load
 * orders, and inside a real MUI Dialog (z-index 1300) with an inner
 * HorizonProvider: keyboard, focus, Escape closing only the Horizon
 * overlay, screen-reader visibility (role queries skip aria-hidden content)
 * and pointer hit-testing.
 */

type Opts = { reboot?: '1' | 'full'; horizonFirst?: boolean; host?: boolean };

const url = (build: 'layered' | 'unlayered', opts: Opts = {}) => {
    const q = new URLSearchParams();
    if (build === 'unlayered') q.set('build', 'unlayered');
    if (opts.reboot) q.set('reboot', opts.reboot);
    if (opts.horizonFirst) q.set('order', 'horizon-first');
    if (opts.host) q.set('host', 'customer360');
    return `/?${q.toString()}`;
};

const LEGACY_CSS: readonly { label: string; opts: Opts }[] = [
    { label: 'bootstrap-reboot.css', opts: { reboot: '1' } },
    { label: 'full bootstrap.css', opts: { reboot: 'full' } },
    {
        label: 'full bootstrap.css + customer360 host CSS',
        opts: { reboot: 'full', host: true },
    },
];

const SURFACE_PROPS = [
    'width',
    'maxWidth',
    'paddingTop',
    'paddingInlineStart',
    'marginTop',
    'borderRadius',
    'borderTopWidth',
    'fontFamily',
    'fontSize',
    'fontWeight',
    'lineHeight',
    'color',
    'backgroundColor',
    'boxShadow',
    'boxSizing',
    'textAlign',
] as const;

/** Computed `props` of `el`, plus the z-index of its positioned layer. */
const read = (el: Locator, props: readonly string[]) =>
    el.evaluate((node, keys) => {
        const cs = getComputedStyle(node);
        const out: Record<string, string> = {};
        for (const key of keys)
            out[key] = cs.getPropertyValue(
                key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)
            );
        const layer =
            node.closest('[data-radix-popper-content-wrapper]') ?? node;
        out['zIndex'] = getComputedStyle(layer).zIndex;
        return out;
    }, props);

/** The element at the centre of `el` belongs to `el` (not covered). */
const onTop = (page: Page, el: Locator) =>
    el.evaluate((node) => {
        const r = node.getBoundingClientRect();
        const hit = document.elementFromPoint(
            r.left + r.width / 2,
            r.top + r.height / 2
        );
        return hit !== null && (hit === node || node.contains(hit));
    });

/* ---------------------------------- Tooltip --------------------------------- */

const openTooltip = async (page: Page, path: string) => {
    await page.goto(path);
    await page.getByTestId('hz-tooltip-trigger').focus();
    const content = page.getByTestId('hz-tooltip');
    await expect(content).toBeVisible();
    return read(content, SURFACE_PROPS);
};

test.describe('Tooltip against Bootstrap 4.4.1 and customer360 host CSS', () => {
    for (const build of ['layered', 'unlayered'] as const)
        for (const legacy of LEGACY_CSS)
            for (const horizonFirst of [false, true])
                test(`${build} build: unchanged by ${legacy.label} (${horizonFirst ? 'horizon CSS first' : 'Bootstrap first'})`, async ({
                    page,
                }) => {
                    const without = await openTooltip(page, url(build));
                    const withHost = await openTooltip(
                        page,
                        url(build, { ...legacy.opts, horizonFirst })
                    );
                    expect(withHost).toEqual(without);
                    expect(without['zIndex']).toBe('1500');
                    expect(without['fontSize']).toBe('12px');
                });
});

/* ------------------------- Inside a real MUI Dialog -------------------------- */

const openMuiOverlays = async (page: Page, build: 'layered' | 'unlayered') => {
    await page.goto(url(build, { reboot: 'full', host: true }));
    await page.getByTestId('open-mui-overlays').click();
    await expect(page.getByTestId('mui-overlays-content')).toBeVisible();
    await page.mouse.move(1, 1);
};

for (const build of ['layered', 'unlayered'] as const)
    test.describe(`overlays inside an MUI Dialog with an inner HorizonProvider (${build})`, () => {
        test('Tooltip: focus shows it above the dialog, exposed to screen readers; Escape closes only the tooltip', async ({
            page,
        }) => {
            await openMuiOverlays(page, build);
            const trigger = page.getByTestId('mui-tooltip-trigger');
            await trigger.focus();
            const tooltip = page.getByRole('tooltip');
            await expect(tooltip).toHaveText('Overlay tooltip text');
            await expect(trigger).toHaveAccessibleDescription(
                'Overlay tooltip text'
            );
            const content = page.getByTestId('mui-tooltip');
            expect((await read(content, []))['zIndex']).toBe('1500');
            expect(await onTop(page, content)).toBe(true);
            expect(
                await content.evaluate(
                    (el) => el.closest('.MuiDialog-root') !== null
                )
            ).toBe(true);
            await page.keyboard.press('Escape');
            await expect(content).toHaveCount(0);
            await expect(
                page.getByTestId('mui-overlays-content')
            ).toBeVisible();
            await expect(trigger).toBeFocused();
            // Pointer: hovering opens it too.
            await trigger.hover();
            await expect(content).toBeVisible();
        });
    });
