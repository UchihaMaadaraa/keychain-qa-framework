import { defineConfig, devices } from '@playwright/test';
import { env } from './src/config/env';

// This is the runner configuration (think testng.xml + config.properties in one place).
// Values come from src/config/env.ts; Playwright's own command-line flags win over them.

export default defineConfig({
  testDir: './tests',
  fullyParallel: true, // every test is independent, so they can run side by side
  forbidOnly: env.ci, // a forgotten test.only() must never pass in CI
  workers: env.workers,
  retries: env.retries, // a test that passes only on retry is reported as "flaky", not as passed
  timeout: 60_000, // max time for one test
  expect: { timeout: 10_000 }, // max time one expect(...) keeps retrying before it fails

  reporter: [['list'], ['html', { open: 'never' }]], // console + HTML report (npm run report)

  use: {
    baseURL: env.baseUrl, // page.goto('/login') and request.get('/api/...') are relative to this
    headless: env.headless,
    trace: 'retain-on-failure', // on failure: a step-by-step recording you can open in the report
    screenshot: 'only-on-failure',
  },

  // Two groups of tests. "api" never launches a browser.
  projects: [
    { name: 'ui', testDir: './tests/ui', use: { ...devices['Desktop Chrome'] } },
    { name: 'api', testDir: './tests/api' },
  ],
});
