import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: './coexistence/tests',
    fullyParallel: true,
    reporter: 'list',
    use: {
        baseURL: 'http://localhost:4173',
        ...devices['Desktop Chrome'],
    },
    webServer: {
        command: 'npx vite --config coexistence/vite.config.ts',
        url: 'http://localhost:4173',
        reuseExistingServer: false,
        timeout: 180_000,
    },
});
