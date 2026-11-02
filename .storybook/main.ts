import type { StorybookConfig } from '@storybook/react-vite';
import type { Plugin } from 'vite';
import { fileURLToPath } from 'node:url';
import { buildStylesCss } from '../scripts/build-styles';
import { phosphorDeepImports } from './optimize-deps';

const HORIZON_STYLES_ID = 'virtual:horizon-styles.css';

/**
 * Serves the real precompiled horizon stylesheet (`hz:` prefix, `@layer horizon`,
 * scoped reset), the same output `vite build` ships as `dist/styles.css`.
 * No HMR: it is compiled once at server start, so restart Storybook after
 * editing src/styles or adding new utility classes to components.
 */
const horizonStyles = (): Plugin => ({
    name: 'horizon-styles-virtual',
    resolveId(id) {
        return id === HORIZON_STYLES_ID ? id : null;
    },
    async load(id) {
        return id === HORIZON_STYLES_ID ? await buildStylesCss() : null;
    },
});

const config: StorybookConfig = {
    stories: ['../src/**/*.stories.@(ts|tsx)'],
    addons: [
        '@storybook/addon-a11y',
        '@storybook/addon-docs',
        '@storybook/addon-vitest',
    ],
    framework: '@storybook/react-vite',
    viteFinal: (viteConfig) => ({
        ...viteConfig,
        plugins: [...(viteConfig.plugins ?? []), horizonStyles()],
        optimizeDeps: {
            ...viteConfig.optimizeDeps,
            include: [
                ...(viteConfig.optimizeDeps?.include ?? []),
                ...phosphorDeepImports(
                    fileURLToPath(new URL('../src', import.meta.url))
                ),
            ],
        },
    }),
};

export default config;
