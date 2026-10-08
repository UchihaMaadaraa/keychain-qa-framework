import type { Locator, Page } from '@playwright/test';
import type { CartLine } from '@/types';
import { BasePage } from '../base.page';

// /view_cart: the cart table and the "Proceed To Checkout" button.
export class CartPage extends BasePage {
  readonly rows: Locator;
  readonly proceedToCheckoutButton: Locator;

  constructor(page: Page) {
    super(page, '/view_cart');
    this.rows = page.locator('#cart_info_table tbody tr');
    this.proceedToCheckoutButton = page.locator('.check_out');
  }

  // Read every row as plain data, so tests compare values instead of poking at the DOM.
  async lines(): Promise<CartLine[]> {
    const lines: CartLine[] = [];
    for (const row of await this.rows.all()) {
      lines.push({
        name: (await row.locator('.cart_description a').innerText()).trim(),
        price: (await row.locator('.cart_price p').innerText()).trim(),
        quantity: (await row.locator('.cart_quantity button').innerText()).trim(),
        total: (await row.locator('.cart_total_price').innerText()).trim(),
      });
    }
    return lines;
  }

  async proceedToCheckout() {
    await this.proceedToCheckoutButton.click();
  }
}
