import type { Locator, Page } from '@playwright/test';
import { Header } from './components/header.component';

// Parent of every page object. (Java equivalent: your BasePage with the driver field.)
//
// Playwright basics used in every page:
//   page                   the browser tab
//   Locator                a recipe for finding an element, e.g. page.getByRole('button', { name: 'Login' }).
//                          It looks the element up fresh every time you use it and WAITS for it automatically,
//                          so there is no WebDriverWait / ExpectedConditions anywhere in this project.
//   .fill() .click()       actions, they wait for the element to be visible and enabled first
//
// Rules for page objects: locators are readonly fields, one method per user action, no expect() in here.
// Locators and actions live in the SAME class: a Locator is lazy and auto-waits, so a separate
// "locators" file (the Selenium habit) would only split one idea across two places.
export abstract class BasePage {
  readonly header: Header;

  protected constructor(
    readonly page: Page,
    readonly path: string, // this page's URL path, used by goto()
  ) {
    this.header = new Header(page);
  }

  async goto() {
    await this.page.goto(this.path); // relative to baseURL from playwright.config.ts
  }

  // The site puts data-qa="..." on every form field and button. This is the most stable hook it offers.
  protected qa(name: string): Locator {
    return this.page.locator(`[data-qa="${name}"]`);
  }
}
