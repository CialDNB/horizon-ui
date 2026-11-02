import type { ReactElement } from 'react';
import { expect } from 'storybook/test';

/** Test viewport widths (Responsive Standard). Story-only, not public API. */
export const VIEWPORT_WIDTH = {
    mobile: 375,
    tablet: 768,
    laptop: 1280,
    desktop: 1920,
} as const;

/** A test viewport name. */
export type Viewport = keyof typeof VIEWPORT_WIDTH;

/** Every test viewport, ascending. */
export const VIEWPORTS = Object.keys(VIEWPORT_WIDTH) as Viewport[];

/**
 * A hidden test story (`!autodocs`, `!dev`) rendered at `viewport`: the play
 * function first checks the real window width, then runs `assert`.
 */
export function viewportStory(
    viewport: Viewport,
    render: () => ReactElement,
    assert: (canvas: HTMLElement, viewport: Viewport) => Promise<void>
) {
    return {
        tags: ['!autodocs', '!dev'],
        globals: { viewport: { value: viewport, isRotated: false } },
        render,
        play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
            await expect(window.innerWidth).toBe(VIEWPORT_WIDTH[viewport]);
            await assert(canvasElement, viewport);
        },
    };
}

/** Inline styles for story layout (stories are not Tailwind-scanned). */
export const storyLayout = {
    row: {
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 16,
    },
    stack: { display: 'grid', gap: 24 },
    caption: {
        fontSize: 12,
        fontWeight: 600,
        color: 'var(--muted-foreground)',
        margin: '0 0 8px',
    },
} as const;

/** Resolves once `el`'s running transitions have finished (settled styles). */
export async function settled(el: Element): Promise<CSSStyleDeclaration> {
    await Promise.all(
        el.getAnimations().map((a) => a.finished.catch(() => undefined))
    );
    return getComputedStyle(el);
}
