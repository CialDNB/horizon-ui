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
    // Radix closes a tooltip when the page scrolls: scroll first, let the
    // scroll settle, then focus without scrolling.
    const trigger = page.getByTestId('hz-tooltip-trigger');
    await trigger.evaluate((el) => el.scrollIntoView({ block: 'center' }));
    await page.evaluate(
        () => new Promise((r) => requestAnimationFrame(() => setTimeout(r, 50)))
    );
    await trigger.evaluate((el) =>
        (el as HTMLElement).focus({ preventScroll: true })
    );
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

/* ---------------------------------- Popover --------------------------------- */

const openPopover = async (page: Page, path: string) => {
    await page.goto(path);
    await page.getByTestId('hz-popover-trigger').click();
    const content = page.getByTestId('hz-popover');
    await expect(content).toBeVisible();
    await content.evaluate((el) =>
        Promise.all(el.getAnimations().map((a) => a.finished))
    );
    return {
        content: await read(content, SURFACE_PROPS),
        title: await read(content.getByText('Overlay popover'), SURFACE_PROPS),
        close: await read(
            content.getByRole('button', { name: 'Close' }),
            SURFACE_PROPS
        ),
    };
};

test.describe('Popover against Bootstrap 4.4.1 and customer360 host CSS', () => {
    for (const legacy of LEGACY_CSS)
        for (const horizonFirst of [false, true])
            test(`unlayered build: unchanged by ${legacy.label} (${horizonFirst ? 'horizon CSS first' : 'Bootstrap first'})`, async ({
                page,
            }) => {
                const without = await openPopover(page, url('unlayered'));
                const withHost = await openPopover(
                    page,
                    url('unlayered', { ...legacy.opts, horizonFirst })
                );
                expect(withHost).toEqual(without);
                expect(without.content['zIndex']).toBe('1450');
            });
});

/* ---------------------------------- Dialog ---------------------------------- */

const openDialog = async (page: Page, path: string) => {
    await page.goto(path);
    await page.getByTestId('hz-dialog-trigger').click();
    const content = page.getByTestId('hz-dialog');
    await expect(content).toBeVisible();
    await content.evaluate((el) =>
        Promise.all(el.getAnimations().map((a) => a.finished))
    );
    return {
        content: await read(content, SURFACE_PROPS),
        title: await read(
            content.getByRole('heading', { name: 'Overlay dialog' }),
            SURFACE_PROPS
        ),
        description: await read(
            content.getByText('Dialog description'),
            SURFACE_PROPS
        ),
        close: await read(
            content.getByRole('button', { name: 'Close' }),
            SURFACE_PROPS
        ),
        save: await read(content.getByTestId('hz-dialog-save'), SURFACE_PROPS),
    };
};

test.describe('Dialog against Bootstrap 4.4.1 and customer360 host CSS', () => {
    for (const legacy of LEGACY_CSS)
        for (const horizonFirst of [false, true])
            test(`unlayered build: unchanged by ${legacy.label} (${horizonFirst ? 'horizon CSS first' : 'Bootstrap first'})`, async ({
                page,
            }) => {
                const without = await openDialog(page, url('unlayered'));
                const withHost = await openDialog(
                    page,
                    url('unlayered', { ...legacy.opts, horizonFirst })
                );
                expect(withHost).toEqual(without);
                expect(without.content['zIndex']).toBe('1350');
            });

    test('layered build (known limit): full Bootstrap + host CSS restyles the title h2 and description p', async ({
        page,
    }) => {
        const without = await openDialog(page, url('layered'));
        const withHost = await openDialog(
            page,
            url('layered', { reboot: 'full', host: true })
        );
        const changed = (
            a: Record<string, string>,
            b: Record<string, string>
        ) => Object.keys(a).filter((k) => a[k] !== b[k]);
        expect({
            content: changed(without.content, withHost.content),
            title: changed(without.title, withHost.title),
            description: changed(without.description, withHost.description),
            close: changed(without.close, withHost.close),
            save: changed(without.save, withHost.save),
        }).toEqual({
            // Measured: the layered build loses these to unlayered host CSS
            // (customer360 must use styles.unlayered.css, as for Button).
            content: ['marginTop'],
            title: ['fontSize', 'fontWeight', 'color'],
            description: [],
            close: ['borderRadius'],
            save: ['width', 'borderRadius', 'fontSize'],
        });
    });
});

/* ---------------------------------- Drawer ---------------------------------- */

const openDrawer = async (page: Page, path: string) => {
    await page.goto(path);
    await page.getByTestId('hz-drawer-trigger').click();
    const content = page.getByTestId('hz-drawer');
    await expect(content).toBeVisible();
    await content.evaluate((el) =>
        Promise.all(el.getAnimations().map((a) => a.finished))
    );
    return {
        content: await read(content, [...SURFACE_PROPS, 'height', 'right']),
        title: await read(
            content.getByRole('heading', { name: 'Overlay drawer' }),
            SURFACE_PROPS
        ),
        close: await read(
            content.getByRole('button', { name: 'Close' }),
            SURFACE_PROPS
        ),
        save: await read(content.getByTestId('hz-drawer-save'), SURFACE_PROPS),
    };
};

test.describe('Drawer against Bootstrap 4.4.1 and customer360 host CSS', () => {
    for (const legacy of LEGACY_CSS)
        for (const horizonFirst of [false, true])
            test(`unlayered build: unchanged by ${legacy.label} (${horizonFirst ? 'horizon CSS first' : 'Bootstrap first'})`, async ({
                page,
            }) => {
                const without = await openDrawer(page, url('unlayered'));
                const withHost = await openDrawer(
                    page,
                    url('unlayered', { ...legacy.opts, horizonFirst })
                );
                expect(withHost).toEqual(without);
                expect(without.content['zIndex']).toBe('1350');
                expect(without.content['width']).toBe('480px');
            });
});

/* ------------------------------- DropdownMenu ------------------------------- */

const ITEM_PROPS = [
    ...SURFACE_PROPS,
    'height',
    'textDecorationLine',
    'cursor',
    'display',
] as const;

const openMenu = async (page: Page, path: string) => {
    await page.goto(path);
    await page.getByTestId('hz-menu-trigger').click();
    const content = page.getByTestId('hz-menu');
    await expect(content).toBeVisible();
    await content.evaluate((el) =>
        Promise.all(el.getAnimations().map((a) => a.finished))
    );
    const link = page.getByTestId('hz-menu-link');
    const rest = await read(link, ITEM_PROPS);
    // Highlighted (pointer hover): Bootstrap's a:hover must not win.
    await link.hover();
    await expect(link).toHaveAttribute('data-highlighted', '');
    const hover = await read(link, ITEM_PROPS);
    return {
        content: await read(content, SURFACE_PROPS),
        item: await read(page.getByTestId('hz-menu-item'), ITEM_PROPS),
        link: rest,
        linkHover: hover,
    };
};

test.describe('DropdownMenu against Bootstrap 4.4.1 and customer360 host CSS', () => {
    for (const legacy of LEGACY_CSS)
        for (const horizonFirst of [false, true])
            test(`unlayered build: menu, items and link items unchanged by ${legacy.label} (${horizonFirst ? 'horizon CSS first' : 'Bootstrap first'})`, async ({
                page,
            }) => {
                const without = await openMenu(page, url('unlayered'));
                const withHost = await openMenu(
                    page,
                    url('unlayered', { ...legacy.opts, horizonFirst })
                );
                expect(withHost).toEqual(without);
                expect(without.content['zIndex']).toBe('1400');
                expect(without.linkHover['textDecorationLine']).toBe('none');
            });
});

/* ----------------------------------- Toast ---------------------------------- */

const showToast = async (page: Page, path: string) => {
    await page.goto(path);
    await page.getByTestId('hz-toast-trigger').click();
    const item = page.locator('[data-did="hz-toast"]');
    await expect(item).toBeVisible();
    await item.evaluate((el) =>
        Promise.all(el.getAnimations().map((a) => a.finished))
    );
    return {
        item: await read(item, [...SURFACE_PROPS, 'listStyleType', 'height']),
        viewport: await read(page.locator('[data-toast-viewport]'), [
            ...SURFACE_PROPS,
            'paddingInlineStart',
            'marginBottom',
            'listStyleType',
            'position',
        ]),
        dismiss: await read(
            item.getByRole('button', { name: 'Dismiss' }),
            SURFACE_PROPS
        ),
    };
};

test.describe('Toast against Bootstrap 4.4.1 and customer360 host CSS', () => {
    for (const legacy of LEGACY_CSS)
        for (const horizonFirst of [false, true])
            test(`unlayered build: toast and list unchanged by ${legacy.label} (${horizonFirst ? 'horizon CSS first' : 'Bootstrap first'})`, async ({
                page,
            }) => {
                const without = await showToast(page, url('unlayered'));
                const withHost = await showToast(
                    page,
                    url('unlayered', { ...legacy.opts, horizonFirst })
                );
                expect(withHost).toEqual(without);
                expect(without.viewport['zIndex']).toBe('1600');
                expect(without.viewport['marginBottom']).toBe('0px');
            });
});

/* ------------------------- Inside a real MUI Dialog -------------------------- */

/** `portal`: plain MUI Dialog (x-core Dialog v1); `v2`: x-core DialogV2 (disablePortal + Slide). */
type MuiVariant = 'portal' | 'v2';

const openMuiOverlays = async (
    page: Page,
    build: 'layered' | 'unlayered',
    mui: MuiVariant = 'portal'
) => {
    const path = url(build, { reboot: 'full', host: true });
    await page.goto(mui === 'v2' ? `${path}&mui=v2` : path);
    await page.getByTestId('open-mui-overlays').click();
    const content = page.getByTestId('mui-overlays-content');
    await expect(content).toBeVisible();
    // Let the MUI transition (Fade, or DialogV2's Slide) finish.
    await page.waitForFunction(() => {
        const paper = document
            .querySelector('[data-testid="mui-overlays-content"]')
            ?.closest('.MuiDialog-paper');
        return (
            paper !== null &&
            paper !== undefined &&
            paper.getAnimations({ subtree: true }).length === 0 &&
            ['none', ''].includes(getComputedStyle(paper).transform)
        );
    });
    await page.mouse.move(1, 1);
};

for (const build of ['layered', 'unlayered'] as const)
    for (const mui of ['portal'] as const)
        test.describe(`overlays inside an MUI Dialog with an inner HorizonProvider (${build})`, () => {
            test('Tooltip: focus shows it above the dialog, exposed to screen readers; Escape closes only the tooltip', async ({
                page,
            }) => {
                await openMuiOverlays(page, build, mui);
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

            test('Popover: keyboard opens it above the dialog, focus inside, Escape and outside clicks close only the popover', async ({
                page,
            }) => {
                await openMuiOverlays(page, build, mui);
                const trigger = page.getByTestId('mui-popover-trigger');
                await trigger.focus();
                await page.keyboard.press('Enter');
                const popover = page.getByRole('dialog', {
                    name: 'Overlay popover',
                });
                await expect(popover).toBeVisible();
                expect((await read(popover, []))['zIndex']).toBe('1450');
                expect(await onTop(page, popover)).toBe(true);
                await expect(
                    page.getByTestId('mui-popover-input')
                ).toBeVisible();
                expect(
                    await popover.evaluate((el) =>
                        el.contains(document.activeElement)
                    )
                ).toBe(true);
                // Typing works (MUI's focus trap accepts the inner provider).
                await page.getByTestId('mui-popover-input').fill('acme');
                await expect(page.getByTestId('mui-popover-input')).toHaveValue(
                    'acme'
                );
                await page.keyboard.press('Escape');
                await expect(popover).toHaveCount(0);
                await expect(
                    page.getByTestId('mui-overlays-content')
                ).toBeVisible();
                await expect(trigger).toBeFocused();
                // Pointer: open, then click elsewhere inside the MUI dialog.
                await trigger.click();
                await expect(popover).toBeVisible();
                await page.getByTestId('mui-overlays-content').click({
                    position: { x: 4, y: 4 },
                });
                await expect(popover).toHaveCount(0);
                await expect(
                    page.getByTestId('mui-overlays-content')
                ).toBeVisible();
            });

            test('ConfirmationDialog: alertdialog above the dialog, focus on Cancel, Escape cancels only it', async ({
                page,
            }) => {
                await openMuiOverlays(page, build, mui);
                const trigger = page.getByTestId('mui-confirm-trigger');
                await trigger.click();
                const dialog = page.getByRole('alertdialog', {
                    name: 'Delete this report?',
                });
                await expect(dialog).toBeVisible();
                await expect(
                    dialog.getByRole('button', { name: 'Cancel' })
                ).toBeFocused();
                expect(await onTop(page, dialog)).toBe(true);
                await page.keyboard.press('Escape');
                await expect(dialog).toHaveCount(0);
                await expect(
                    page.getByTestId('mui-overlays-content')
                ).toBeVisible();
                await expect(trigger).toBeFocused();
            });

            test('Drawer: opens above the dialog, focus trapped, Escape and the scrim close only the drawer', async ({
                page,
            }) => {
                await openMuiOverlays(page, build, mui);
                const trigger = page.getByTestId('mui-drawer-trigger');
                await trigger.click();
                const drawer = page.getByRole('dialog', {
                    name: 'Overlay drawer',
                });
                await expect(drawer).toBeVisible();
                await drawer.evaluate((el) =>
                    Promise.all(el.getAnimations().map((a) => a.finished))
                );
                expect(await onTop(page, drawer)).toBe(true);
                // First tabbable: the close button in the title row.
                await expect(
                    drawer.getByRole('button', { name: 'Close' })
                ).toBeFocused();
                for (let i = 0; i < 4; i++) {
                    await page.keyboard.press('Tab');
                    expect(
                        await drawer.evaluate((el) =>
                            el.contains(document.activeElement)
                        )
                    ).toBe(true);
                }
                await page.keyboard.press('Escape');
                await expect(drawer).toHaveCount(0);
                await expect(
                    page.getByTestId('mui-overlays-content')
                ).toBeVisible();
                await expect(trigger).toBeFocused();
                await trigger.click();
                await expect(drawer).toBeVisible();
                // Radix starts listening for outside presses a tick after open.
                await drawer.evaluate((el) =>
                    Promise.all(el.getAnimations().map((a) => a.finished))
                );
                await page.mouse.click(4, 4);
                await expect(drawer).toHaveCount(0);
                await expect(
                    page.getByTestId('mui-overlays-content')
                ).toBeVisible();
            });

            test('DropdownMenu: keyboard opens it above the dialog, exposed to screen readers; Escape closes only the menu; pointer selects', async ({
                page,
            }) => {
                await openMuiOverlays(page, build, mui);
                const trigger = page.getByTestId('mui-menu-trigger');
                await trigger.focus();
                await page.keyboard.press('Enter');
                const menu = page.getByRole('menu');
                await expect(menu).toBeVisible();
                await expect(
                    page.getByRole('menuitem', { name: /Export/ })
                ).toBeFocused();
                expect((await read(menu, []))['zIndex']).toBe('1400');
                await menu.evaluate((el) =>
                    Promise.all(el.getAnimations().map((a) => a.finished))
                );
                expect(await onTop(page, menu)).toBe(true);
                await page.keyboard.press('ArrowDown');
                await expect(
                    page.getByRole('menuitem', { name: 'Open history' })
                ).toBeFocused();
                await page.keyboard.press('Escape');
                await expect(menu).toHaveCount(0);
                await expect(
                    page.getByTestId('mui-overlays-content')
                ).toBeVisible();
                await expect(trigger).toBeFocused();
                await trigger.click();
                await page.getByRole('menuitem', { name: /Export/ }).click();
                await expect(menu).toHaveCount(0);
                await expect(
                    page.getByTestId('mui-overlays-content')
                ).toBeVisible();
            });

            test('Toast: shown from inside the dialog above it, announced to screen readers, dismissable by pointer; the dialog stays', async ({
                page,
            }) => {
                await openMuiOverlays(page, build, mui);
                await page.getByTestId('mui-toast-trigger').click();
                const item = page.locator('[data-did="mui-toast"]');
                await expect(item).toBeVisible();
                await item.evaluate((el) =>
                    Promise.all(el.getAnimations().map((a) => a.finished))
                );
                expect(await onTop(page, item)).toBe(true);
                // The one announcement lives in body, outside what MUI hides.
                const announcement = page
                    .locator('[aria-live="polite"]')
                    .filter({ hasText: 'Saved from the harness' });
                await expect(announcement).toHaveCount(1);
                expect(
                    await announcement.evaluate(
                        (el) => el.closest('[aria-hidden="true"]') === null
                    )
                ).toBe(true);
                // Fixed (Task 11b review I3): while the MUI dialog is open the
                // list portals into its inner HorizonProvider, so it is inside
                // MUI's focus trap and not aria-hidden: role queries find the
                // button, and the keyboard reaches it.
                expect(
                    await item.evaluate(
                        (el) =>
                            el.closest('[aria-hidden="true"]') === null &&
                            el.closest('.MuiDialog-root') !== null
                    )
                ).toBe(true);
                const dismiss = item.getByRole('button', { name: 'Dismiss' });
                await dismiss.focus();
                await expect(dismiss).toBeFocused();
                await page.keyboard.press('Enter');
                await expect(item).toHaveCount(0);
                await expect(
                    page.getByTestId('mui-overlays-content')
                ).toBeVisible();
            });

            for (const kind of ['dialog', 'drawer'] as const)
                test(`Toast while a Horizon ${kind} is open (inside the MUI dialog): action reachable by keyboard and pointer, pressing it keeps the ${kind} open`, async ({
                    page,
                }) => {
                    await openMuiOverlays(page, build, mui);
                    await page.getByTestId(`mui-${kind}-trigger`).click();
                    const panel = page.getByRole('dialog', {
                        name:
                            kind === 'dialog'
                                ? 'Overlay dialog'
                                : 'Overlay drawer',
                    });
                    await expect(panel).toBeVisible();
                    await panel.evaluate((el) =>
                        Promise.all(el.getAnimations().map((a) => a.finished))
                    );
                    await page.getByTestId(`mui-${kind}-toast`).click();
                    const action = page.getByRole('button', {
                        name: 'Undo send',
                    });
                    await expect(action).toBeVisible();
                    await action.evaluate((el) =>
                        Promise.all(
                            (el.closest('[data-toast]') ?? el)
                                .getAnimations()
                                .map((a) => a.finished)
                        )
                    );
                    expect(await onTop(page, action)).toBe(true);
                    await action.focus();
                    await expect(action).toBeFocused();
                    await action.click();
                    await expect(action).toHaveCount(0);
                    await expect(panel).toBeVisible();
                    await expect(
                        page.getByTestId('mui-overlays-content')
                    ).toBeVisible();
                });
        });

test.describe('toasts while an app-level Horizon modal is open', () => {
    for (const kind of ['dialog', 'drawer'] as const)
        test(`Horizon ${kind}: the toast is inside the modal layer, not aria-hidden, keyboard and pointer reachable`, async ({
            page,
        }) => {
            await page.goto(url('unlayered', { reboot: 'full', host: true }));
            await page.getByTestId(`hz-${kind}-trigger`).click();
            const panel = page.getByRole('dialog', {
                name: kind === 'dialog' ? 'Overlay dialog' : 'Overlay drawer',
            });
            await expect(panel).toBeVisible();
            await panel.evaluate((el) =>
                Promise.all(el.getAnimations().map((a) => a.finished))
            );
            await page.getByTestId(`hz-${kind}-toast`).click();
            const action = page.getByRole('button', { name: 'Undo send' });
            await expect(action).toBeVisible();
            await action.evaluate((el) =>
                Promise.all(
                    (el.closest('[data-toast]') ?? el)
                        .getAnimations()
                        .map((a) => a.finished)
                )
            );
            expect(await onTop(page, action)).toBe(true);
            // Still at the page's bottom end, not confined to the panel (a
            // filling transform would make the panel its containing block).
            const box = await page.locator('[data-toast]').boundingBox();
            if (!box) throw new Error('no toast box');
            const vp = page.viewportSize();
            expect(Math.round(box.y + box.height)).toBe((vp?.height ?? 0) - 24);
            expect(Math.round(box.x + box.width)).toBe((vp?.width ?? 0) - 24);
            await action.focus();
            await expect(action).toBeFocused();
            await page.keyboard.press('Enter');
            await expect(action).toHaveCount(0);
            await expect(panel).toBeVisible();
        });
});

/*
 * x-core DialogV2 renders its MUI Dialog with `disablePortal` and a `Slide`
 * transition (?mui=v2). Measured: MUI's ModalManager then marks `#root`
 * aria-hidden, and #root CONTAINS the DialogV2 itself, so the x-core dialog
 * and everything inside it (Horizon or not) is hidden from screen readers:
 * a pre-existing x-core defect, not fixable from horizon-ui. These tests
 * therefore use test ids instead of role queries and check what horizon-ui
 * controls: stacking, position (the Slide transform must not offset fixed
 * overlays), keyboard, Escape, focus return and pointer use.
 */
const centre = (b: {
    x: number;
    y: number;
    width: number;
    height: number;
}) => ({
    x: b.x + b.width / 2,
    y: b.y + b.height / 2,
});

for (const build of ['layered', 'unlayered'] as const)
    test.describe(`overlays inside x-core DialogV2 (disablePortal + Slide, ${build})`, () => {
        test('measured x-core defect: the DialogV2 itself is aria-hidden (inside #root)', async ({
            page,
        }) => {
            await openMuiOverlays(page, build, 'v2');
            expect(
                await page
                    .getByTestId('mui-overlays-content')
                    .evaluate(
                        (el) => el.closest('[aria-hidden="true"]')?.id ?? null
                    )
            ).toBe('root');
            await expect(page.getByRole('dialog')).toHaveCount(0);
            // After the Slide the paper has no transform: no containing
            // block for fixed-position Horizon overlays.
            expect(
                await page
                    .getByTestId('mui-overlays-content')
                    .evaluate(
                        (el) =>
                            getComputedStyle(
                                el.closest('.MuiDialog-paper') ?? el
                            ).transform
                    )
            ).toBe('none');
        });

        test('Horizon Dialog: centred on the viewport (not offset by the Slide), on top, Escape closes only it, focus returns', async ({
            page,
        }) => {
            await openMuiOverlays(page, build, 'v2');
            const trigger = page.getByTestId('mui-dialog-trigger');
            await trigger.focus();
            await page.keyboard.press('Enter');
            const panel = page.getByTestId('mui-dialog');
            await expect(panel).toBeVisible();
            await panel.evaluate((el) =>
                Promise.all(el.getAnimations().map((a) => a.finished))
            );
            const box = await panel.boundingBox();
            const vp = page.viewportSize();
            if (!box || !vp) throw new Error('no box');
            expect(Math.abs(centre(box).x - vp.width / 2)).toBeLessThanOrEqual(
                1
            );
            expect(Math.abs(centre(box).y - vp.height / 2)).toBeLessThanOrEqual(
                1
            );
            expect(await onTop(page, panel)).toBe(true);
            await expect(page.getByTestId('mui-dialog-input')).toBeFocused();
            await page.keyboard.press('Escape');
            await expect(panel).toHaveCount(0);
            await expect(
                page.getByTestId('mui-overlays-content')
            ).toBeVisible();
            await expect(trigger).toBeFocused();
        });

        test('Horizon Drawer: full height at the end edge, on top, scrim click closes only it', async ({
            page,
        }) => {
            await openMuiOverlays(page, build, 'v2');
            await page.getByTestId('mui-drawer-trigger').click();
            const panel = page.getByTestId('mui-drawer');
            await expect(panel).toBeVisible();
            await panel.evaluate((el) =>
                Promise.all(el.getAnimations().map((a) => a.finished))
            );
            const box = await panel.boundingBox();
            const vp = page.viewportSize();
            if (!box || !vp) throw new Error('no box');
            expect(Math.round(box.x + box.width)).toBe(vp.width);
            expect(Math.round(box.height)).toBe(vp.height);
            expect(await onTop(page, panel)).toBe(true);
            await page.mouse.click(4, 4);
            await expect(panel).toHaveCount(0);
            await expect(
                page.getByTestId('mui-overlays-content')
            ).toBeVisible();
        });

        for (const [name, trigger, content] of [
            ['Popover', 'mui-popover-trigger', 'mui-popover'],
            ['DropdownMenu', 'mui-menu-trigger', 'mui-menu'],
        ] as const)
            test(`${name}: anchored under its trigger (not offset), on top, Escape closes only it`, async ({
                page,
            }) => {
                await openMuiOverlays(page, build, 'v2');
                const t = page.getByTestId(trigger);
                await t.focus();
                await page.keyboard.press('Enter');
                const panel = page.getByTestId(content);
                await expect(panel).toBeVisible();
                await panel.evaluate((el) =>
                    Promise.all(el.getAnimations().map((a) => a.finished))
                );
                const tb = await t.boundingBox();
                const pb = await panel.boundingBox();
                if (!tb || !pb) throw new Error('no box');
                // Below the trigger with the side offset (4 or 8px), or flipped above.
                const below = pb.y - (tb.y + tb.height);
                const above = tb.y - (pb.y + pb.height);
                expect(
                    (below >= 0 && below <= 12) || (above >= 0 && above <= 12)
                ).toBe(true);
                expect(await onTop(page, panel)).toBe(true);
                await page.keyboard.press('Escape');
                await expect(panel).toHaveCount(0);
                await expect(
                    page.getByTestId('mui-overlays-content')
                ).toBeVisible();
                await expect(t).toBeFocused();
            });

        test('Tooltip: next to its trigger, on top', async ({ page }) => {
            await openMuiOverlays(page, build, 'v2');
            const t = page.getByTestId('mui-tooltip-trigger');
            await t.focus();
            const tip = page.getByTestId('mui-tooltip');
            await expect(tip).toBeVisible();
            await tip.evaluate((el) =>
                Promise.all(el.getAnimations().map((a) => a.finished))
            );
            const tb = await t.boundingBox();
            const pb = await tip.boundingBox();
            if (!tb || !pb) throw new Error('no box');
            expect(pb.y - (tb.y + tb.height)).toBeGreaterThanOrEqual(0);
            expect(pb.y - (tb.y + tb.height)).toBeLessThanOrEqual(10);
            expect(await onTop(page, tip)).toBe(true);
            await page.keyboard.press('Escape');
            await expect(tip).toHaveCount(0);
            await expect(
                page.getByTestId('mui-overlays-content')
            ).toBeVisible();
        });

        test('Toast: at the viewport bottom end, on top, dismissable; the dialog stays', async ({
            page,
        }) => {
            await openMuiOverlays(page, build, 'v2');
            await page.getByTestId('mui-toast-trigger').click();
            const item = page.locator('[data-did="mui-toast"]');
            await expect(item).toBeVisible();
            await item.evaluate((el) =>
                Promise.all(el.getAnimations().map((a) => a.finished))
            );
            const box = await item.boundingBox();
            const vp = page.viewportSize();
            if (!box || !vp) throw new Error('no box');
            // Layered build (known limit, measured): the reboot's
            // `ol { margin-bottom: 1rem }` beats the layered `m-0`, so the
            // list sits 16px higher; customer360 uses the unlayered build.
            expect(Math.round(box.y + box.height)).toBe(
                vp.height - 24 - (build === 'layered' ? 16 : 0)
            );
            expect(Math.round(box.x + box.width)).toBe(vp.width - 24);
            expect(await onTop(page, item)).toBe(true);
            await item.locator('button[aria-label="Dismiss"]').click();
            await expect(item).toHaveCount(0);
            await expect(
                page.getByTestId('mui-overlays-content')
            ).toBeVisible();
        });
    });

test.describe('toasts and a keepMounted MUI Dialog with an inner HorizonProvider', () => {
    for (const build of ['layered', 'unlayered'] as const)
        test(`closed: toasts stay in the app root; opening moves them in; closing moves them back (${build})`, async ({
            page,
        }) => {
            await page.goto(url(build, { reboot: 'full', host: true }));
            // The kept dialog is in the DOM (hidden) before it ever opens.
            await expect(page.getByTestId('mui-kept-provider')).toBeAttached();
            await page.getByTestId('hz-toast-trigger').click();
            const item = page.locator('[data-did="hz-toast"]');
            await expect(item).toBeVisible();
            const host = () =>
                item.evaluate((el) => ({
                    inKept:
                        el.closest('[data-testid="mui-kept-provider"]') !==
                        null,
                    ariaHidden: el.closest('[aria-hidden="true"]') !== null,
                }));
            expect(await host()).toEqual({ inKept: false, ariaHidden: false });
            await expect(
                item.getByRole('button', { name: 'Dismiss' })
            ).toBeVisible();
            // Open: the showing toast moves into the dialog, still reachable.
            await page.getByTestId('open-mui-kept').click();
            await expect(page.getByTestId('mui-kept-content')).toBeVisible();
            await expect
                .poll(host)
                .toEqual({ inKept: true, ariaHidden: false });
            await expect(
                item.getByRole('button', { name: 'Dismiss' })
            ).toBeVisible();
            // Close: back to the app root, not hidden with the dialog.
            await page.getByTestId('mui-kept-close').click();
            await expect(page.getByTestId('mui-kept-content')).toBeHidden();
            await expect
                .poll(host)
                .toEqual({ inKept: false, ariaHidden: false });
            await expect(item).toBeVisible();
            await expect(
                item.getByRole('button', { name: 'Dismiss' })
            ).toBeVisible();
        });
});
