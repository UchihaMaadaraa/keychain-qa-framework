import type { Locator, Page } from '@playwright/test';

// The site header appears on every page. A component is a page object for a part of a page:
// same rules (locators + actions, no expect), but it is composed into pages instead of extended.
export class Header {
  readonly loggedInAs: Locator;
  readonly deleteAccountLink: Locator;
  readonly logoutLink: Locator;

  constructor(page: Page) {
    const nav = page.locator('header .nav');
    this.loggedInAs = nav.getByText('Logged in as');
    this.deleteAccountLink = nav.getByRole('link', { name: 'Delete Account' });
    this.logoutLink = nav.getByRole('link', { name: 'Logout' });
  }
}
