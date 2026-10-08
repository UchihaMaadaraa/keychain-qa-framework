import { test as base } from '@playwright/test';
import { Api } from '@/api';

// `api`: the typed client for the site's API, built on Playwright's `request` fixture.
// Used by UI tests too, for setup (create a user) and cross-checks (compare UI with API).
export const test = base.extend<{ api: Api }>({
  api: async ({ request }, use) => {
    await use(new Api(request));
  },
});
