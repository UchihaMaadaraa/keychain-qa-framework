import type { APIRequestContext } from '@playwright/test';
import { AccountsApi } from './accounts.api';
import { ProductsApi } from './products.api';

// The single `api` object a test receives:   api.products.list()   api.accounts.create(user)
// Adding a new domain = one new *.api.ts file + one line here.
export class Api {
  readonly products: ProductsApi;
  readonly accounts: AccountsApi;

  constructor(request: APIRequestContext) {
    this.products = new ProductsApi(request);
    this.accounts = new AccountsApi(request);
  }
}
