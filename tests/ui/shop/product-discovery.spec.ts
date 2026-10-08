import { test, expect } from '@/fixtures';
import { ProductsPage } from '@/pages/shop/products.page';
import { pickProducts } from '@/data/products';
import searchTerms from '@/data/static/search-terms.json';

test.describe('Product discovery', () => {
  // Table-driven: one test per row of src/data/static/search-terms.json.
  // (Java equivalent: @Test(dataProvider = "searchTerms").) Each row shows up as its own test in the report.
  //
  // The site searches more than the name (e.g. "Little Girls Mr. Panda Shirt" matches "top" through its
  // description), so "every name contains the term" is not a property of this app. What *is* a
  // property: the UI and the API are two views of one search, so they must return the same products.
  for (const term of searchTerms) {
    test(`UI search for "${term}" returns the same products as the search API`, async ({ page, api }) => {
      const products = new ProductsPage(page);

      await test.step('search in the UI', async () => {
        await products.goto();
        await products.search(term);
        await expect(products.sectionTitle).toHaveText(/searched products/i);
        await expect(products.productCards.first()).toBeVisible();
      });

      await test.step('the API returns the same set of products', async () => {
        const uiNames = await products.productNames.allInnerTexts();
        const apiResult = await api.products.search(term);
        expect(apiResult.responseCode).toBe(200);
        expect(uiNames.length).toBeGreaterThan(0);
        expect(uiNames.sort()).toEqual(apiResult.products.map((p) => p.name).sort());
      });
    });
  }

  test('a product card shows the same price as the API', async ({ page, api }) => {
    const products = new ProductsPage(page);
    const [expected] = await pickProducts(api, 1); // first product from the live catalogue

    await products.goto();

    await expect(products.card(expected!.name)).toBeVisible();
    await expect(products.priceOf(expected!.name)).toHaveText(expected!.price);
  });
});
