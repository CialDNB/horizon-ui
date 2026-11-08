import { defineConfig, devices } from '@playwright/test';

// COEX_PORT moves the harness off 4173 (an orphaned dev server from an
// interrupted run keeps the port; strictPort then refuses to start).
const port = Number(process.env['COEX_PORT'] ?? 4173);

export default defineConfig({
    testDir: './coexistence/tests',
    fullyParallel: true,
    reporter: 'list',
    // The suite grew past 400 tests (Task 11c: mouse-focus and modal
    // Combobox suites); under full parallel load the harness page can take
    // longer than the 5s default to render its first probe.
    expect: { timeout: 15_000 },
    // Hard limits so a hang fails fast instead of stalling the run: 30s
    // per test (suites that measure many controls opt into 120s), 15
    // minutes for the whole run (a full run takes about 3-4 minutes).
    timeout: 30_000,
    globalTimeout: 15 * 60_000,
    use: {
        baseURL: `http://localhost:${port}`,
        ...devices['Desktop Chrome'],
    },
    webServer: {
        command: 'npx vite --config coexistence/vite.config.ts',
        url: `http://localhost:${port}`,
        reuseExistingServer: false,
        timeout: 180_000,
    },
});
