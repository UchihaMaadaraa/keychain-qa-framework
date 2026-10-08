import type { Locator, Page } from '@playwright/test';
import { BasePage } from '../base.page';

// /payment: card form and the "Order Placed!" confirmation.
// This practice site accepts any card number; nothing is charged.
export class PaymentPage extends BasePage {
  readonly orderPlaced: Locator;

  constructor(page: Page) {
    super(page, '/payment');
    this.orderPlaced = this.qa('order-placed');
  }

  async payWithTestCard() {
    await this.qa('name-on-card').fill('QA Tester');
    await this.qa('card-number').fill('4111111111111111');
    await this.qa('cvc').fill('123');
    await this.qa('expiry-month').fill('12');
    await this.qa('expiry-year').fill('2030');
    await this.qa('pay-button').click();
  }
}
