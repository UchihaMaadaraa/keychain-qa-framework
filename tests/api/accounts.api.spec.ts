import { test, expect } from '@/fixtures';

test.describe('Account API', () => {
  test('account lifecycle: create, verify login, read details, delete', async ({ api, user, cleanup }) => {
    await test.step('create', async () => {
      const created = await api.accounts.create(user);
      cleanup.track(user); // safety net: if an assertion below fails, teardown still deletes the account
      expect(created.responseCode).toBe(201);
      expect(created.message).toBe('User created!');
    });

    await test.step('creating the same email again is rejected', async () => {
      const duplicate = await api.accounts.create(user);
      expect(duplicate.responseCode).toBe(400);
      expect(duplicate.message).toBe('Email already exists!');
    });

    await test.step('verify login with the right and the wrong password', async () => {
      const ok = await api.accounts.verifyLogin(user.email, user.password);
      expect(ok.responseCode).toBe(200);
      expect(ok.message).toBe('User exists!');

      const bad = await api.accounts.verifyLogin(user.email, 'wrong-password');
      expect(bad.responseCode).toBe(404);
      expect(bad.message).toBe('User not found!');
    });

    await test.step('stored details match what was sent', async () => {
      const detail = await api.accounts.getByEmail(user.email);
      expect(detail.responseCode).toBe(200);
      expect(detail.user).toMatchObject({
        name: user.name,
        email: user.email,
        first_name: user.firstName,
        last_name: user.lastName,
        country: user.country,
      });
    });

    await test.step('delete', async () => {
      const deleted = await api.accounts.delete(user.email, user.password);
      expect(deleted.responseCode).toBe(200);
      expect(deleted.message).toBe('Account deleted!');

      const gone = await api.accounts.verifyLogin(user.email, user.password);
      expect(gone.responseCode).toBe(404);
    });
  });

  test('verifyLogin without an email is a 400 in the body', async ({ request }) => {
    const res = await request.post('/api/verifyLogin', { form: { password: 'x' } });
    const body = (await res.json()) as { responseCode: number; message: string };

    expect(body.responseCode).toBe(400);
    expect(body.message).toContain('email or password parameter is missing');
  });
});
