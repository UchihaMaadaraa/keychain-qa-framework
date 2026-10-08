// @ts-check
import tseslint from 'typescript-eslint';
import playwright from 'eslint-plugin-playwright';

// These rules turn the project's conventions into something `npm run lint` can refuse.
// A human or an AI agent who breaks one gets a red build right away, not a review comment later.
export default tseslint.config(
  { ignores: ['node_modules', 'test-results', 'playwright-report'] },
  ...tseslint.configs.recommended,

  // ---- rules for tests ----
  {
    files: ['tests/**/*.ts'],
    ...playwright.configs['flat/recommended'],
    rules: {
      ...playwright.configs['flat/recommended'].rules,
      'playwright/no-raw-locators': 'error', // locators belong in src/pages, not in tests
      'playwright/no-wait-for-timeout': 'error', // no sleeps: expect(locator) already waits
      'playwright/no-force-option': 'error', // force: true clicks through overlays and hides real bugs
      'playwright/no-focused-test': 'error', // test.only must never be committed
      'playwright/no-skipped-test': 'error', // fix or delete a test, do not park it
      'playwright/prefer-web-first-assertions': 'error', // expect(locator).toBeVisible(), not expect(await isVisible())
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@playwright/test',
              message: "Import { test, expect } from '@/fixtures' so the test gets api, cleanup and ad-blocking.",
            },
          ],
        },
      ],
    },
  },

  // ---- rules for page objects ----
  {
    files: ['src/pages/**/*.ts'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: "CallExpression[callee.name='expect']",
          message: 'Page objects hold locators and actions. Assertions go in tests.',
        },
      ],
    },
  },
);
