import type { Api } from '@/api';
import { buildUser } from '@/data/factories/user.factory';
import type { Credentials, TestUser } from '@/types';
import { test as apiTest } from './api.fixture';

// Remembers accounts a test created and deletes them at teardown, pass or fail.
export class Cleanup {
  private readonly accounts: Credentials[] = [];
  constructor(private readonly api: Api) {}

  // Call this as soon as a test has created an account through the UI.
  track(account: Credentials) {
    this.accounts.push(account);
  }

  async run() {
    for (const { email, password } of this.accounts) {
      const r = await this.api.accounts.delete(email, password);
      // 404 means the test already deleted it itself. Anything else is worth seeing in the log.
      if (r.responseCode !== 200 && r.responseCode !== 404) {
        console.warn(`[cleanup] could not delete ${email}: ${r.responseCode} ${r.message ?? ''}`);
      }
    }
  }
}

type UserFixtures = {
  user: TestUser; // fresh unique user object; nothing created on the server yet
  cleanup: Cleanup; // list of accounts to delete when the test ends
  registeredUser: TestUser; // CREATED through the API before the test, DELETED after it
};

// Builds on api.fixture so `registeredUser` and `cleanup` can call the API.
export const test = apiTest.extend<UserFixtures>({
  user: async ({}, use) => {
    await use(buildUser());
  },

  cleanup: async ({ api }, use) => {
    const cleanup = new Cleanup(api);
    await use(cleanup); // the test runs here
    await cleanup.run(); // teardown: runs even if the test failed
  },

  registeredUser: async ({ api, user, cleanup }, use) => {
    const created = await api.accounts.create(user);
    if (created.responseCode !== 201) {
      throw new Error(`Could not create ${user.email}: ${created.responseCode} ${created.message ?? ''}`);
    }
    cleanup.track(user); // guarantees deletion after the test
    await use(user);
  },
});
