import { expect, type Page } from '@playwright/test';

/*
 * Interaction-state measurement for anchor-rendered components (IconButton
 * asChild, Link) against the reboot's anchor rules: `a` (0,0,1), `a:hover`
 * (0,1,1), `a:not([href])` (0,1,1) and `a:not([href]):hover` (0,2,1).
 * Computed styles never expose `:visited` colours (browser privacy), so
 * "visited" reads the link after it has been followed.
 */

export const LINK_STATES = [
    'rest',
    'hover',
    'focus',
    'active',
    'visited',
] as const;

export const LINK_PROPS = [
    'color',
    'backgroundColor',
    'textDecorationLine',
    'textDecorationThickness',
    'borderRadius',
    'fontSize',
    'fontWeight',
    'outlineStyle',
    'outlineColor',
    'cursor',
] as const;

export type StateStyles = Record<string, Record<string, string>>;

/**
 * Measures every test id at rest, hover, focus (keyboard), active and
 * visited, keyed `"<id> <state>"`. With `touch`, only rest and the sticky
 * hover a tap leaves (Playwright's tap does not, so a pointer move puts
 * `:hover` on the element).
 */
export async function linkStates(
    page: Page,
    path: string,
    ids: readonly string[],
    touch = false
): Promise<StateStyles> {
    await page.goto(path);
    await expect(page.getByTestId(ids[0] ?? 'missing')).toBeVisible();
    const out: StateStyles = {};
    const read = async (id: string, state: string) => {
        out[`${id} ${state}`] = await page
            .getByTestId(id)
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
    for (const id of ids) {
        const link = page.getByTestId(id);
        await link.scrollIntoViewIfNeeded();
        await reset();
        await read(id, 'rest');
        await link.hover();
        expect(
            await link.evaluate((el) => el.matches(':hover')),
            `${id} :hover`
        ).toBe(true);
        await read(id, 'hover');
        if (touch) continue;
        await reset();
        await page.keyboard.press('Shift');
        await link.focus();
        await read(id, 'focus');
        await reset();
        await link.hover();
        await page.mouse.down();
        await read(id, 'active');
        await page.mouse.up();
        await reset();
        await read(id, 'visited');
    }
    return out;
}

/** `{ key: ['prop: a -> b'] }` for every measured state that changed. */
export const diffStates = (a: StateStyles, b: StateStyles) =>
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
