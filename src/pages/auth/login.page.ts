import type { Locator, Page } from '@playwright/test';
import type { Credentials, TestUser } from '@/types';
import { BasePage } from '../base.page';

// /login has two forms side by side: "Login to your account" and "New User Signup!".
export class LoginPage extends BasePage {
  readonly loginEmail: Locator;
  readonly loginPassword: Locator;
  readonly loginButton: Locator;
  readonly loginError: Locator;
  readonly signupName: Locator;
  readonly signupEmail: Locator;
  readonly signupButton: Locator;
  readonly signupError: Locator;

  constructor(page: Page) {
    super(page, '/login');
    this.loginEmail = this.qa('login-email');
    this.loginPassword = this.qa('login-password');
    this.loginButton = this.qa('login-button');
    this.loginError = page.locator('.login-form p');
    this.signupName = this.qa('signup-name');
    this.signupEmail = this.qa('signup-email');
    this.signupButton = this.qa('signup-button');
    this.signupError = page.locator('.signup-form p');
  }

  async loginAs(user: Credentials) {
    await this.loginEmail.fill(user.email);
    await this.loginPassword.fill(user.password);
    await this.loginButton.click();
  }

  // Signup step 1. On success the site navigates to /signup.
  async startSignup(user: Pick<TestUser, 'name' | 'email'>) {
    await this.signupName.fill(user.name);
    await this.signupEmail.fill(user.email);
    await this.signupButton.click();
  }
}
