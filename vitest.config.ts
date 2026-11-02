import { fileURLToPath } from 'node:url';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';
import { phosphorDeepImports } from './.storybook/optimize-deps';

const configDir = fileURLToPath(new URL('./.storybook', import.meta.url));

export default defineConfig({
    test: {
        projects: [
            {
                extends: true,
                test: {
                    name: 'unit',
                    environment: 'jsdom',
                    include: ['src/**/*.test.{ts,tsx}', 'scripts/**/*.test.ts'],
                    setupFiles: ['./src/test-setup.ts'],
                    globalSetup: ['./scripts/vitest-global-setup.ts'],
                },
            },
            {
                extends: true,
                plugins: [storybookTest({ configDir })],
                // See .storybook/optimize-deps.ts (cold/stale cache reloads).
                optimizeDeps: {
                    include: phosphorDeepImports(
                        fileURLToPath(new URL('./src', import.meta.url))
                    ),
                },
                test: {
                    name: 'storybook',
                    browser: {
                        enabled: true,
                        headless: true,
                        provider: playwright(),
                        instances: [{ browser: 'chromium' }],
                    },
                    setupFiles: ['./.storybook/vitest.setup.ts'],
                },
            },
        ],
    },
});
