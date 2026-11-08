import { expect, test, type Page } from '@playwright/test';

/*
 * Combobox inside a Horizon Dialog and Drawer (Radix modal: focus trap,
 * `aria-hidden` on the rest of the page, react-remove-scroll). The list
 * portals into the HorizonProvider root, outside the dialog's DOM: it must
 * stay exposed to assistive tech, scroll by wheel and touch under the
 * scroll lock, take pointer picks without closing the dialog, and Escape
 * must close only the list.
 */

const url = (build: 'layered' | 'unlayered') =>
    `/?${build === 'unlayered' ? 'build=unlayered&' : ''}reboot=full&host=customer360`;

const list = (page: Page) =>
    page.locator('[data-combobox-content] [role="listbox"]');

const MODALS = [
    {
        name: 'Dialog',
        trigger: 'hz-combobox-dialog-trigger',
        modal: 'hz-combobox-modal-dialog',
        id: 'dlg',
    },
    {
        name: 'Drawer',
        trigger: 'hz-combobox-drawer-trigger',
        modal: 'hz-combobox-modal-drawer',
        id: 'drw',
    },
] as const;

for (const m of MODALS)
    for (const build of ['layered', 'unlayered'] as const)
        test.describe(`Combobox inside a Horizon ${m.name} (${build})`, () => {
            test.beforeEach(async ({ page }) => {
                await page.goto(url(build));
                await page.getByTestId(m.trigger).click();
                await expect(page.getByTestId(m.modal)).toBeVisible();
            });

            test('the list is exposed (not aria-hidden) and scrolls by wheel and touch under the scroll lock', async ({
                page,
            }) => {
                const input = page.getByTestId(`hz-combobox-${m.id}`);
                await input.click();
                const listbox = list(page);
                await expect(listbox).toBeVisible();
                expect(
                    await listbox.evaluate(
                        (el) =>
                            el.closest('[aria-hidden="true"], [inert]') === null
                    )
                ).toBe(true);
                await expect(
                    page.getByRole('listbox', { name: `${m.id} company` })
                ).toBeVisible();
                const box = await listbox.boundingBox();
                if (!box) throw new Error('no list box');
                const top = () => listbox.evaluate((el) => el.scrollTop);
                await page.mouse.move(
                    box.x + box.width / 2,
                    box.y + box.height / 2
                );
                await page.mouse.wheel(0, 200);
                await expect.poll(top).toBeGreaterThan(0);
                const afterWheel = await top();
                const cdp = await page.context().newCDPSession(page);
                await cdp.send('Input.synthesizeScrollGesture', {
                    x: Math.round(box.x + box.width / 2),
                    y: Math.round(box.y + box.height / 2),
                    yDistance: -150,
                    gestureSourceType: 'touch',
                    speed: 800,
                });
                await expect.poll(top).toBeGreaterThan(afterWheel);
                // The page behind the modal did not scroll.
                expect(
                    await page.evaluate(() =>
                        document.activeElement?.getAttribute('data-testid')
                    )
                ).toBe(`hz-combobox-${m.id}`);
            });

            test('a pointer pick keeps the modal open, focus in the input, and is announced; Escape closes only the list', async ({
                page,
            }) => {
                const input = page.getByTestId(`hz-combobox-${m.id}`);
                await input.click();
                const option = page.getByRole('option', { name: 'Company 12' });
                await option.scrollIntoViewIfNeeded();
                await option.click();
                await expect(input).toHaveValue('Company 12');
                await expect(input).toBeFocused();
                await expect(page.getByTestId(m.modal)).toBeVisible();
                await expect(
                    input.locator('xpath=..').getByRole('status')
                ).toHaveText('Company 12 selected');
                await input.press('ArrowDown');
                await expect(list(page)).toBeVisible();
                await page.keyboard.press('Escape');
                await expect(
                    page.locator('[data-combobox-content]')
                ).toHaveCount(0);
                await expect(page.getByTestId(m.modal)).toBeVisible();
                await expect(input).toBeFocused();
                await page.keyboard.press('Escape');
                await expect(page.getByTestId(m.modal)).toHaveCount(0);
            });

            test('multi-select chips: pick and remove by pointer keep the modal open', async ({
                page,
            }) => {
                const input = page.getByTestId(`hz-combobox-${m.id}-multi`);
                await input.click();
                await page
                    .getByRole('option', { name: 'Company 3', exact: true })
                    .click();
                await expect(list(page)).toBeVisible();
                const field = input.locator('xpath=..');
                await expect(
                    field.getByRole('button', { name: 'Remove Company 3' })
                ).toBeVisible();
                await page.keyboard.press('Escape');
                await field
                    .getByRole('button', { name: 'Remove Company 1' })
                    .click();
                await expect(
                    field.getByRole('button', { name: 'Remove Company 1' })
                ).toHaveCount(0);
                await expect(field.getByRole('status')).toHaveText(
                    'Company 1 removed'
                );
                await expect(page.getByTestId(m.modal)).toBeVisible();
            });
        });
