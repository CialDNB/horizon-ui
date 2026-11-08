/*
 * Runtime guards for enum props. TypeScript rejects old x-core values, but
 * plain-JS callers (customer360 .jsx) are not type-checked: an unknown value
 * must fall back to the default instead of crashing on a record lookup.
 */

const warned = new Set<string>();

export function isProduction(): boolean {
    // Bundlers replace `process.env.NODE_ENV` textually (Vite library mode
    // keeps it for the consumer); a bare browser has no `process`.
    try {
        return process.env.NODE_ENV === 'production';
    } catch {
        return false;
    }
}

/** Logs `message` once per page outside production builds. */
export function warnOnce(message: string): void {
    if (isProduction() || warned.has(message)) return;
    warned.add(message);
    console.warn(`[horizon-ui] ${message}`);
}

/** Test helper (not public API): forgets which warnings were logged. */
export function resetWarnings(): void {
    warned.clear();
}

/**
 * Returns `value` when it is one of `allowed`, otherwise `fallback`, with a
 * one-shot dev warning naming the component, prop, bad value and the
 * accepted values. `undefined` means "use the default" and never warns.
 */
export function resolveOption<T extends string>(
    component: string,
    prop: string,
    value: unknown,
    allowed: readonly T[],
    fallback: T
): T {
    if (value === undefined) return fallback;
    if ((allowed as readonly unknown[]).includes(value)) return value as T;
    warnOnce(
        `${component}: unknown ${prop} ${JSON.stringify(value)}; using "${fallback}". Accepted: ${allowed.map((a) => `"${a}"`).join(', ')}.`
    );
    return fallback;
}

/**
 * Removes props that x-core/MUI accepted but this component does not
 * (`sx`, `startIcon`, palette `color` ...), so plain-JS callers do not leak
 * them to the DOM as attributes. Warns once per component and prop with the
 * replacement in `legacy[name]`. Returns `props` itself when nothing matched.
 */
export function omitLegacyProps<T extends object>(
    component: string,
    props: T,
    legacy: Readonly<Record<string, string>>
): T {
    const found = Object.keys(props).filter((key) =>
        Object.hasOwn(legacy, key)
    );
    if (found.length === 0) return props;
    for (const name of found)
        warnOnce(
            `${component}: x-core prop "${name}" is not supported and was ignored (${legacy[name] ?? ''}).`
        );
    return Object.fromEntries(
        Object.entries(props).filter(([key]) => !Object.hasOwn(legacy, key))
    ) as T;
}
