import { build } from 'vite';

/**
 * Builds the package once before the suite so tests that read `dist/`
 * (e.g. `dist/styles.css`) never depend on a stale or missing build.
 */
export default async function setup(): Promise<void> {
    await build({ configFile: 'vite.config.ts', logLevel: 'warn' });
}
