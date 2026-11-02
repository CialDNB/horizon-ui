import { expect, test, type Page } from '@playwright/test';

/*
 * Windows High Contrast (forced colors) drops box-shadows and replaces
 * backgrounds, which is how fields and choice controls draw boundaries,
 * focus rings and checked states. Each must also have a forced-colors-safe
 * cue: a border, an outline or a system-colour fill that opts out of
 * adjustment. Chromium's emulation matches the media query; these
 * assertions check the forced-colors rules are in effect, both builds.
 */

const byTestId = (id: string) => `[data-testid="${id}"]`;
const fieldOf = (id: string) => `[data-input-field]:has(> ${byTestId(id)})`;

const style = (page: Page, selector: string) =>
    page.locator(selector).evaluate((el) => {
        const cs = getComputedStyle(el);
        return {
            border: `${cs.borderTopStyle} ${cs.borderTopWidth}`,
            outline: `${cs.outlineStyle} ${cs.outlineWidth}`,
            background: cs.backgroundColor,
            adjust: cs.getPropertyValue('forced-color-adjust'),
        };
    });

const visibleBorder = (s: { border: string }) =>
    expect(s.border).toMatch(/^solid [1-9]/);
const visibleOutline = (s: { outline: string }) =>
    expect(s.outline).toMatch(/^(solid|auto) [2-9]/);

for (const build of ['layered', 'unlayered'] as const)
    test.describe(`forced colors (${build})`, () => {
        test.beforeEach(async ({ page }) => {
            await page.emulateMedia({ forcedColors: 'active' });
            await page.goto(build === 'unlayered' ? '/?build=unlayered' : '/');
            await page.keyboard.press('Shift');
        });

        test('fields keep a border and show a focus outline', async ({
            page,
        }) => {
            for (const sel of [
                fieldOf('hz-input'),
                byTestId('hz-textarea'),
                byTestId('hz-select'),
            ])
                visibleBorder(await style(page, sel));
            await page.locator(byTestId('hz-input')).focus();
            visibleOutline(await style(page, fieldOf('hz-input')));
            await page.locator(byTestId('hz-textarea')).focus();
            visibleOutline(await style(page, byTestId('hz-textarea')));
            await page.locator(byTestId('hz-select')).focus();
            visibleOutline(await style(page, byTestId('hz-select')));
        });

        test('choice controls keep a boundary, a focus outline and a visible checked state', async ({
            page,
        }) => {
            const box = `${byTestId('hz-checkbox')} > span`;
            const circle = `${byTestId('hz-radio')} > span`;
            const track = `${byTestId('hz-switch')} > span`;
            for (const sel of [box, circle, track])
                visibleBorder(await style(page, sel));
            await page.locator(byTestId('hz-checkbox')).focus();
            visibleOutline(await style(page, box));
            await page.locator(byTestId('hz-radio-checked')).focus();
            visibleOutline(
                await style(page, `${byTestId('hz-radio-checked')} > span`)
            );
            await page.locator(byTestId('hz-switch')).focus();
            visibleOutline(await style(page, track));
            // Checked marks: the check icon is currentColor (forced to
            // CanvasText); the radio dot and switch thumb opt out of
            // adjustment with a system colour fill.
            for (const sel of [
                `${byTestId('hz-radio-checked')} > span > span`,
                `${byTestId('hz-switch-on')} [data-switch-thumb]`,
                `${byTestId('hz-switch')} [data-switch-thumb]`,
            ]) {
                const s = await style(page, sel);
                expect(s.adjust, sel).toBe('none');
                expect(s.background, sel).not.toBe('rgba(0, 0, 0, 0)');
            }
            const check = await page
                .locator(
                    `${byTestId('hz-checkbox-checked')} svg[data-checkbox-icon="checked"]`
                )
                .evaluate((el) => [
                    getComputedStyle(el).display,
                    el.getAttribute('fill'),
                ]);
            expect(check).toEqual(['block', 'currentColor']);
        });
    });
