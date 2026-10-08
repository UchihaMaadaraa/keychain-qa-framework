import { test, expect } from '@/fixtures';

// API tests never open a browser. `api` is our typed client (src/api/);
// `request` is Playwright's raw HTTP client, used when we want to send a deliberately broken call.
// Remember: this site reports the real status in body.responseCode, not in the HTTP status.

test.describe('Products API', () => {
  test('GET /api/productsList returns a non-empty catalogue with well-formed products', async ({ api }) => {
    const result = await api.products.list();

    expect(result.responseCode).toBe(200);
    expect(result.products.length).toBeGreaterThan(0);
    for (const product of result.products) {
      expect(product.id).toEqual(expect.any(Number));
      expect(product.name).not.toEqual('');
      expect(product.price).toMatch(/^Rs\. \d+$/);
      expect(product.category.category).not.toEqual('');
    }
  });

  test('GET /api/brandsList is consistent with the brands used in the catalogue', async ({ api }) => {
    const brands = await api.products.brands();
    const catalogue = await api.products.list();

    expect(brands.responseCode).toBe(200);
    expect(brands.brands.length).toBeGreaterThan(0);
    for (const entry of brands.brands) {
      expect(entry.id).toEqual(expect.any(Number));
      expect(entry.brand).not.toEqual('');
    }

    // brandsList has one row per product, so compare the DISTINCT names across both endpoints
    const brandNames = new Set(brands.brands.map((b) => b.brand));
    const catalogueBrands = new Set(catalogue.products.map((p) => p.brand));
    expect([...brandNames].sort()).toEqual([...catalogueBrands].sort());
  });

  test('POST /api/searchProduct returns only matching products', async ({ api }) => {
    const result = await api.products.search('jeans');

    expect(result.responseCode).toBe(200);
    expect(result.products.length).toBeGreaterThan(0);
    for (const product of result.products) {
      expect(product.name.toLowerCase()).toContain('jeans');
    }
  });

  test('POST /api/searchProduct without the parameter is a 400 in the body', async ({ request }) => {
    const res = await request.post('/api/searchProduct'); // no form fields on purpose
    const body = (await res.json()) as { responseCode: number; message: string };

    expect(body.responseCode).toBe(400);
    expect(body.message).toContain('search_product parameter is missing');
  });
});
