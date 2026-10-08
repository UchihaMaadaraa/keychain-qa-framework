import type { APIRequestContext } from '@playwright/test';
import type { ApiBody, TestUser, UserDetail } from '@/types';
import { ApiClient } from './client';

// Account endpoints: create, verify login, read, delete.
export class AccountsApi extends ApiClient {
  constructor(request: APIRequestContext) {
    super(request);
  }

  create(u: TestUser) {
    // Keys on the left are what the API expects; values come from our TestUser.
    return this.json<ApiBody>(
      this.request.post('/api/createAccount', {
        form: {
          name: u.name,
          email: u.email,
          password: u.password,
          title: u.title,
          birth_date: u.birthDay,
          birth_month: u.birthMonth,
          birth_year: u.birthYear,
          firstname: u.firstName,
          lastname: u.lastName,
          company: u.company,
          address1: u.address1,
          address2: u.address2,
          country: u.country,
          zipcode: u.zipcode,
          state: u.state,
          city: u.city,
          mobile_number: u.mobile,
        },
      }),
    );
  }

  verifyLogin(email: string, password: string) {
    return this.json<ApiBody>(this.request.post('/api/verifyLogin', { form: { email, password } }));
  }

  getByEmail(email: string) {
    return this.json<ApiBody<{ user: UserDetail }>>(
      this.request.get('/api/getUserDetailByEmail', { params: { email } }),
    );
  }

  delete(email: string, password: string) {
    return this.json<ApiBody>(this.request.delete('/api/deleteAccount', { form: { email, password } }));
  }
}
