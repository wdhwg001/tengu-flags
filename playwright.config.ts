import { defineConfig, devices } from '@playwright/test';

// The checks open the built dist/ on the real data, served the way a static host serves it.
// Run `npm run build` first; `npm run e2e` does not build.
export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  forbidOnly: true,
  // Each check opens the whole table (about 3,000 rows, 5,000 with events) and indexes it; four browsers at once
  // keep a loaded laptop and a CI runner inside the timeouts below.
  workers: 4,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: 'list',
  use: { baseURL: 'http://localhost:4173/' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npx vite preview --port 4173 --strictPort',
    url: 'http://localhost:4173/',
    reuseExistingServer: false,
  },
});
