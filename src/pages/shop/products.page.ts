import type { Locator, Page } from '@playwright/test';
import { BasePage } from '../base.page';

// /products: search box, the product grid, and the "Added!" pop-up after Add to cart.
export class ProductsPage extends BasePage {
  readonly searchInput: Locator;
  readonly searchButton: Locator;
  readonly sectionTitle: Locator; // "ALL PRODUCTS" or "SEARCHED PRODUCTS"
  readonly productCards: Locator; // one per product in the grid
  readonly productNames: Locator; // the name inside each card
  readonly continueShoppingButton: Locator; // closes the "Added!" pop-up

  constructor(page: Page) {
    super(page, '/products');
    this.searchInput = page.locator('#search_product');
    this.searchButton = page.locator('#submit_search');
    this.sectionTitle = page.locator('.features_items .title');
    this.productCards = page.locator('.features_items .product-image-wrapper');
    this.productNames = this.productCards.locator('.productinfo p');
    this.continueShoppingButton = page.locator('#cartModal').getByRole('button', { name: 'Continue Shopping' });
  }

  async search(term: string) {
    await this.searchInput.fill(term);
    await this.searchButton.click();
  }

  // The card for one product, found by its visible name.
  card(productName: string): Locator {
    return this.productCards.filter({ has: this.page.locator('.productinfo p', { hasText: productName }) }).first();
  }

  priceOf(productName: string): Locator {
    return this.card(productName).locator('.productinfo h2');
  }

  // The clickable "Add to cart" is inside an overlay that appears on hover.
  async addToCart(productName: string) {
    const card = this.card(productName);
    await card.hover();
    await card.locator('.overlay-content .add-to-cart').click();
    await this.continueShoppingButton.click();
  }
}
