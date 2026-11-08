import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: './coexistence/tests',
    fullyParallel: true,
    reporter: 'list',
    // The suite grew past 400 tests (Task 11c: mouse-focus and modal
    // Combobox suites); under full parallel load the harness page can take
    // longer than the 5s default to render its first probe.
    expect: { timeout: 15_000 },
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
