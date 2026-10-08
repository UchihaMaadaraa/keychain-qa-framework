// Runtime settings, read once here and nowhere else.
// (Java equivalent: config.properties + System.getProperty fallback, in one typed place.)
//
// Precedence: Playwright CLI flag  >  environment variable  >  default below.
//     WORKERS=4 HEADLESS=false npm test
//     npx playwright test --workers=1 --retries=1 --headed      (CLI wins)
// See .env.example for the full list.

export const env = {
  baseUrl: process.env.BASE_URL || 'https://automationexercise.com',
  workers: Number(process.env.WORKERS || 2),
  retries: Math.min(Number(process.env.RETRIES || 0), 2), // capped: a retry hides flakiness, it does not fix it
  headless: process.env.HEADLESS !== 'false',
  ci: !!process.env.CI,
} as const;
