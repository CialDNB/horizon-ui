import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        environment: 'jsdom',
        include: ['src/**/*.test.{ts,tsx}', 'scripts/**/*.test.ts'],
        globalSetup: ['./scripts/vitest-global-setup.ts'],
    },
});
