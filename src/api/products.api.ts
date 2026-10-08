import type { APIRequestContext } from '@playwright/test';
import type { ApiBody, Brand, Product } from '@/types';
import { ApiClient } from './client';

// Catalogue endpoints. One method per endpoint, named after what it returns.
export class ProductsApi extends ApiClient {
  constructor(request: APIRequestContext) {
    super(request);
  }

  list() {
    return this.json<ApiBody<{ products: Product[] }>>(this.request.get('/api/productsList'));
  }

  brands() {
    return this.json<ApiBody<{ brands: Brand[] }>>(this.request.get('/api/brandsList'));
  }

  search(term: string) {
    return this.json<ApiBody<{ products: Product[] }>>(
      this.request.post('/api/searchProduct', { form: { search_product: term } }),
    );
  }
}
