import { expect, test, type Locator, type Page } from '@playwright/test';

/*
 * Table with a real pointer and inside Horizon modals. Hover tints a row
 * (only measurable with a real pointer: Storybook's userEvent is synthetic).
 * A tall table in a Dialog scrolls inside its own area (`maxBlockSize`,
 * sticky header) and one in a Drawer scrolls the drawer body, both under the
 * modal scroll lock (react-remove-scroll), while the page stays put.
 */

const byTestId = (id: string) => `[data-testid="${id}"]`;
const CASES = [
    {
        name: 'unlayered + full Bootstrap + customer360 host CSS',
        query: '?build=unlayered&reboot=full&host=customer360',
    },
    { name: 'layered, no host CSS', query: '' },
] as const;

/** The color the cells should paint, resolved inside the table's scope. */
const mixed = (page: Page, css: string) =>
    page.locator(byTestId('hz-table')).evaluate((el, value) => {
        const probe = document.createElement('span');
        probe.style.backgroundColor = value;
        el.appendChild(probe);
        const out = getComputedStyle(probe).backgroundColor;
        probe.remove();
        return out;
    }, css);

const scrollTopOf = (locator: Locator) =>
    locator.evaluate((el) => el.scrollTop);

for (const c of CASES)
    test.describe(`Table (${c.name})`, () => {
        test('a real pointer hover tints the row and switches its text', async ({
            page,
        }) => {
            await page.goto(`/${c.query}`);
            const cell = page.locator(
                `${byTestId('hz-table')} tr[data-testid="row-2"] td[data-testid="city"]`
            );
            await cell.scrollIntoViewIfNeeded();
            const rest = await mixed(page, 'var(--background)');
            await expect(cell).toHaveCSS('background-color', rest);
            await cell.hover();
            await expect(cell).toHaveCSS(
                'background-color',
                await mixed(
                    page,
                    'color-mix(in srgb, var(--accent) 50%, var(--background))'
                )
            );
            const accentForeground = await page
                .locator(byTestId('hz-table'))
                .evaluate((el) => {
                    const probe = document.createElement('span');
                    probe.style.color = 'var(--accent-foreground)';
                    el.appendChild(probe);
                    const out = getComputedStyle(probe).color;
                    probe.remove();
                    return out;
                });
            await expect(cell).toHaveCSS('color', accentForeground);
        });

        test('in a Horizon Dialog the table scrolls in its own area under the scroll lock', async ({
            page,
        }) => {
            await page.goto(`/${c.query}`);
            await page.getByTestId('hz-table-dialog-trigger').click();
            const dialog = page.getByTestId('hz-table-modal-dialog');
            await expect(dialog).toBeVisible();
            const scroller = dialog.locator('[data-table-scroll]');
            await expect(scroller).toHaveAttribute('role', 'region');
            const scrollYBefore = await page.evaluate(() => window.scrollY);
            const box = await scroller.boundingBox();
            if (!box) throw new Error('no scroller box');
            await page.mouse.move(
                box.x + box.width / 2,
                box.y + box.height / 2
            );
            await page.mouse.wheel(0, 300);
            await expect.poll(() => scrollTopOf(scroller)).toBeGreaterThan(0);
            expect(await page.evaluate(() => window.scrollY)).toBe(
                scrollYBefore
            );
            // The sticky header stays at the top of the scroll area.
            const header = dialog.locator('thead th').nth(1);
            await expect
                .poll(async () =>
                    Math.round(
                        ((await header.boundingBox())?.y ?? 0) -
                            ((await scroller.boundingBox())?.y ?? 0)
                    )
                )
                .toBe(0);
            // Escape closes an open tooltip first (the info button may hold
            // the initial focus); from the Close button it closes the dialog.
            await dialog.getByRole('button', { name: 'Close' }).focus();
            await page.keyboard.press('Escape');
            await expect(dialog).toBeHidden();
        });

        test('in a Drawer a tall table scrolls the drawer body under the scroll lock', async ({
            page,
        }) => {
            await page.goto(`/${c.query}`);
            await page.getByTestId('hz-table-drawer-trigger').click();
            const drawer = page.getByTestId('hz-table-modal-drawer');
            await expect(drawer).toBeVisible();
            const table = drawer.getByTestId('hz-table-drawer');
            const scrollYBefore = await page.evaluate(() => window.scrollY);
            const box = await table.boundingBox();
            if (!box) throw new Error('no table box');
            await page.mouse.move(box.x + box.width / 2, box.y + 120);
            await page.mouse.wheel(0, 400);
            // Some scroll container between the table and the drawer moved.
            const scrolled = () =>
                table.evaluate((el) => {
                    for (
                        let node: Element | null = el.parentElement;
                        node;
                        node = node.parentElement
                    )
                        if (node.scrollTop > 0) return node.scrollTop;
                    return 0;
                });
            await expect.poll(scrolled).toBeGreaterThan(0);
            expect(await page.evaluate(() => window.scrollY)).toBe(
                scrollYBefore
            );
            await page.keyboard.press('Escape');
            await expect(drawer).toBeHidden();
        });
    });

/*
 * A Table in an MUI dialog shaped like x-core DialogV2 (`?mui=v2`:
 * disablePortal + Slide) under an inner HorizonProvider (the documented
 * pattern): the scroll region takes keyboard focus and scrolls by keys
 * inside MUI's FocusTrap, and the rows-per-page Select opens above the
 * dialog, picks, and leaves the dialog open.
 */
for (const build of ['layered', 'unlayered'] as const)
    test.describe(`Table in an MUI dialog (?mui=v2, inner provider, ${build})`, () => {
        test('the scroll region scrolls by keyboard; rows per page works', async ({
            page,
        }) => {
            await page.goto(
                `/?mui=v2${build === 'unlayered' ? '&build=unlayered' : ''}`
            );
            await page.getByTestId('open-mui-table-dialog').click();
            const content = page.getByTestId('mui-table-dialog-content');
            const table = content.getByTestId('hz-table-mui-dialog');
            await expect(table).toBeVisible();
            const scroller = table.locator('[data-table-scroll]');
            await expect(scroller).toHaveAttribute('role', 'region');
            // Names are not computed here: x-core DialogV2 (disablePortal)
            // makes MUI aria-hide #root, which contains the dialog (existing
            // customer360 defect, docs/05). Check the wiring instead.
            const labelledBy = await scroller.getAttribute('aria-labelledby');
            expect(
                await page.locator(`[id="${labelledBy ?? ''}"]`).textContent()
            ).toBe('MUI dialog companies');
            // Keyboard focus on the region stays inside MUI's FocusTrap.
            await page.keyboard.press('Shift');
            await scroller.focus();
            await expect(scroller).toBeFocused();
            await page.keyboard.press('PageDown');
            await expect
                .poll(() => scroller.evaluate((el) => el.scrollTop))
                .toBeGreaterThan(0);
            await expect(scroller).toBeFocused();
            // Rows per page (CSS locators: roles are aria-hidden here, above).
            const select = table.locator('[data-pagination] [role="combobox"]');
            await select.click();
            const option = page.locator('[role="option"]', { hasText: '25' });
            await expect(option).toBeVisible();
            await option.click();
            await expect(select).toHaveText(/25/);
            await expect(content).toBeVisible();
            await expect(table.locator('th[scope="row"]')).toHaveCount(25);
            await expect(table.locator('[data-pagination]')).toHaveAttribute(
                'aria-label',
                'Pagination: MUI dialog companies'
            );
        });
    });

/*
 * The row details list (dl/dt/dd) at mobile width against Bootstrap's
 * `dl { margin-bottom }`, `dt { font-weight: 700 }`,
 * `dd { margin-bottom; margin-left: 0 }` and customer360 host CSS:
 * unchanged in the unlayered build, both load orders.
 */
const DETAILS_PROPS = [
    'display',
    'marginTop',
    'marginBottom',
    'marginInlineStart',
    'paddingInlineStart',
    'fontSize',
    'fontWeight',
    'lineHeight',
    'color',
] as const;

const detailsStyles = async (page: Page, query: string) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(`/${query}`);
    const details = page.locator(
        `${byTestId('hz-table')} tr[data-details]:not([hidden])`
    );
    await expect(details.locator('dt')).toBeVisible();
    const read = (selector: string) =>
        details.locator(selector).evaluate(
            (el, props) => {
                const cs = getComputedStyle(el);
                return Object.fromEntries(
                    props.map((p) => [
                        p,
                        cs[p as keyof CSSStyleDeclaration] as string,
                    ])
                );
            },
            [...DETAILS_PROPS]
        );
    return { dl: await read('dl'), dt: await read('dt'), dd: await read('dd') };
};

test.describe('Table row details (dl/dt/dd) at mobile against Bootstrap', () => {
    for (const order of ['', '&order=horizon-first'])
        test(`unlayered build unchanged by full Bootstrap + customer360 host CSS${order ? ' (horizon CSS first)' : ' (Bootstrap first)'}`, async ({
            page,
        }) => {
            const without = await detailsStyles(page, '?build=unlayered');
            const withHost = await detailsStyles(
                page,
                `?build=unlayered&reboot=full&host=customer360${order}`
            );
            expect(withHost).toEqual(without);
            expect(without.dt['fontWeight']).toBe('600');
            expect(without.dd['marginBottom']).toBe('0px');
        });
});
