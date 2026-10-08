import { expect } from '@playwright/test';
import { LoginPage } from '@/pages/auth/login.page';
import { test as userTest } from './user.fixture';

// `loggedInPage`: a browser tab already logged in as `registeredUser`.
// This is the shared-auth pattern: tests that need a session ask for this and start on the home page.
export const test = userTest.extend<{ loggedInPage: LoginPage }>({
  loggedInPage: async ({ page, registeredUser }, use) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.loginAs(registeredUser);
    await expect(login.header.loggedInAs).toContainText(registeredUser.name);
    await use(login);
  },
});
