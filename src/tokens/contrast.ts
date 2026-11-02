/** WCAG 2.x relative luminance of a #RRGGBB colour. */
function luminance(hex: string): number {
    const channels = [1, 3, 5].map((i) => {
        const c = parseInt(hex.slice(i, i + 2), 16) / 255;
        return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });
    const [r = 0, g = 0, b = 0] = channels;
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * WCAG contrast ratio between two #RRGGBB colours. Internal (tests and
 * tooling); not exported from the tokens entry.
 */
export function contrastRatio(a: string, b: string): number {
    const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
    return ((hi ?? 0) + 0.05) / ((lo ?? 0) + 0.05);
}
