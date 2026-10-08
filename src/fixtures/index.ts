import { mergeTests, expect } from '@playwright/test';
import { test as authTest } from './auth.fixture';
import { test as networkTest } from './network.fixture';

// FIXTURES are the things a test can ask for by name in its parameter list:
//
//     test('...', async ({ page, api, registeredUser }) => { ... })
//
// Playwright builds each one before the test and tears it down after.
// (Java equivalent: BaseTest with @BeforeMethod / @AfterMethod, except each test
// only gets what it asks for, and setup + teardown live together in one place.)
//
// Playwright already provides:   page   request   context
// This project adds, one file per concern in this folder:
//   network.fixture.ts   context override that blocks ad hosts
//   api.fixture.ts       api             typed client for the site's API
//   user.fixture.ts      user, cleanup, registeredUser
//   auth.fixture.ts      loggedInPage    (builds on user.fixture)
//
// Shape of every fixture:   setup  ->  await use(value)  ->  teardown
//                                      ^ the test runs here
//
// Every test imports { test, expect } from here. Lint rejects importing from '@playwright/test' directly.
export const test = mergeTests(networkTest, authTest);
export { expect };
