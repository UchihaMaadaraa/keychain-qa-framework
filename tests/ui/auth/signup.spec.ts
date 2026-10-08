import { test, expect } from '@/fixtures';
import { LoginPage } from '@/pages/auth/login.page';
import { SignupPage } from '@/pages/auth/signup.page';

// How to read a test:
//   test('name', async ({ fixtures you need }) => { ... })
//   test.step('...')            groups actions; shows up as a named block in the report
//   await expect(locator)...    keeps re-checking until it passes or the expect timeout runs out

test.describe('Signup', () => {
  test('new user can register through the UI and the account exists in the API', async ({ page, user, api, cleanup }) => {
    const login = new LoginPage(page);
    const signup = new SignupPage(page);

    await test.step('start signup with name and email', async () => {
      await login.goto();
      await login.startSignup(user);
      await expect(signup.accountInfoHeading).toBeVisible();
    });

    await test.step('fill account and address details', async () => {
      await signup.fillAccountDetails(user);
      await signup.submit();
      cleanup.track(user); // the account now exists on the server; make sure teardown deletes it even if we fail below
    });

    await test.step('account is created and the user is logged in', async () => {
      await expect(signup.accountCreated).toBeVisible();
      await signup.continue();
      await expect(signup.header.loggedInAs).toContainText(user.name);
    });

    await test.step('API returns the same details that were typed in the UI', async () => {
      const detail = await api.accounts.getByEmail(user.email);
      expect(detail.responseCode).toBe(200);
      expect(detail.user).toMatchObject({
        name: user.name,
        email: user.email,
        first_name: user.firstName,
        last_name: user.lastName,
        city: user.city,
        zipcode: user.zipcode,
      });
    });

    await test.step('user can delete their own account from the header', async () => {
      await signup.header.deleteAccountLink.click();
      await expect(signup.accountDeleted).toBeVisible();
    });
  });

  test('signup with an email that already exists is rejected', async ({ page, registeredUser }) => {
    const login = new LoginPage(page);

    await login.goto();
    await login.startSignup(registeredUser); // same email: the fixture already created it through the API

    // The site re-renders the login page under the /signup URL, so we check the outcome, not the URL:
    // the error is shown, nobody is logged in, and the signup form is still there to try again.
    await expect(login.signupError).toHaveText('Email Address already exist!');
    await expect(login.header.loggedInAs).toBeHidden();
    await expect(login.signupEmail).toBeVisible();
  });

  test('login with a wrong password shows an error', async ({ page, registeredUser }) => {
    const login = new LoginPage(page);

    await login.goto();
    await login.loginAs({ email: registeredUser.email, password: 'definitely-wrong' });

    await expect(login.loginError).toHaveText('Your email or password is incorrect!');
    await expect(login.header.loggedInAs).toBeHidden();
  });
});
