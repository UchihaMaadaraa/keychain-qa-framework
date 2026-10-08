import type { Locator, Page } from '@playwright/test';
import { BasePage } from '../base.page';

// /checkout: delivery address, order summary, comment box, "Place Order".
export class CheckoutPage extends BasePage {
  readonly deliveryAddress: Locator;
  readonly orderRows: Locator;
  readonly totalAmount: Locator;
  readonly comment: Locator;
  readonly placeOrderLink: Locator;

  constructor(page: Page) {
    super(page, '/checkout');
    this.deliveryAddress = page.locator('#address_delivery');
    this.orderRows = page.locator('#cart_info tbody tr').filter({ has: page.locator('.cart_description') });
    this.totalAmount = page.locator('#cart_info tbody tr').last().locator('.cart_total_price');
    this.comment = page.locator('#ordermsg textarea');
    this.placeOrderLink = page.getByRole('link', { name: 'Place Order' });
  }

  async placeOrder(comment = 'Automated order from keychain-qa-framework') {
    await this.comment.fill(comment);
    await this.placeOrderLink.click();
  }
}
