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
