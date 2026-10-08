import type { Locator, Page } from '@playwright/test';
import type { TestUser } from '@/types';
import { BasePage } from '../base.page';

// /signup: the account + address form, then the "Account Created!" / "Account Deleted!" screens.
export class SignupPage extends BasePage {
  readonly accountInfoHeading: Locator;
  readonly createAccountButton: Locator;
  readonly accountCreated: Locator;
  readonly accountDeleted: Locator;
  readonly continueButton: Locator;

  constructor(page: Page) {
    super(page, '/signup');
    this.accountInfoHeading = page.getByText('Enter Account Information');
    this.createAccountButton = this.qa('create-account');
    this.accountCreated = this.qa('account-created');
    this.accountDeleted = this.qa('account-deleted');
    this.continueButton = this.qa('continue-button');
  }

  // Signup step 2: the full form. The strings in qa('...') are the site's data-qa values.
  async fillAccountDetails(u: TestUser) {
    // The radio's label is "Mr." / "Mrs." (with a dot) but its value is "Mr" / "Mrs", so select by value.
    await this.page.locator(`input[type="radio"][value="${u.title}"]`).check();
    await this.qa('password').fill(u.password);
    await this.qa('days').selectOption(u.birthDay);
    await this.qa('months').selectOption(u.birthMonth);
    await this.qa('years').selectOption(u.birthYear);
    await this.page.locator('#newsletter').check();
    await this.page.locator('#optin').check();
    await this.qa('first_name').fill(u.firstName);
    await this.qa('last_name').fill(u.lastName);
    await this.qa('company').fill(u.company);
    await this.qa('address').fill(u.address1);
    await this.qa('address2').fill(u.address2);
    await this.qa('country').selectOption(u.country);
    await this.qa('state').fill(u.state);
    await this.qa('city').fill(u.city);
    await this.qa('zipcode').fill(u.zipcode);
    await this.qa('mobile_number').fill(u.mobile);
  }

  async submit() {
    await this.createAccountButton.click();
  }

  async continue() {
    await this.continueButton.click();
  }
}
