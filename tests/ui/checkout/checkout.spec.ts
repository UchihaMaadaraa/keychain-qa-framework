import { test, expect } from '@/fixtures';
import { ProductsPage } from '@/pages/shop/products.page';
import { CartPage } from '@/pages/shop/cart.page';
import { CheckoutPage } from '@/pages/checkout/checkout.page';
import { PaymentPage } from '@/pages/checkout/payment.page';
import { pickProducts } from '@/data/products';
import { rupees } from '@/utils/money';
import type { Product } from '@/types';

test.describe('Checkout', () => {
  // `loggedInPage` means: before this test starts, a user was created through the API
  // and the browser was logged in as that user. After the test, the user is deleted.
  test('logged-in user can add products, review the cart and place an order', async ({ loggedInPage, registeredUser, api }) => {
    const page = loggedInPage.page;
    const products = new ProductsPage(page);
    const cart = new CartPage(page);
    const checkout = new CheckoutPage(page);
    const payment = new PaymentPage(page);

    const [first, second] = (await pickProducts(api, 2)) as [Product, Product];

    await test.step('add two products to the cart', async () => {
      await products.goto();
      await products.addToCart(first.name);
      await products.addToCart(second.name);
    });

    await test.step('cart shows both products with the right price, quantity and line total', async () => {
      await cart.goto();
      const lines = await cart.lines();
      expect(lines).toHaveLength(2);
      expect(lines).toEqual(
        expect.arrayContaining([
          { name: first.name, price: first.price, quantity: '1', total: first.price },
          { name: second.name, price: second.price, quantity: '1', total: second.price },
        ]),
      );
    });

    await test.step('checkout shows the delivery address of the logged-in user', async () => {
      await cart.proceedToCheckout();
      await expect(page).toHaveURL(/\/checkout$/);
      await expect(checkout.deliveryAddress).toContainText(registeredUser.address1);
      await expect(checkout.deliveryAddress).toContainText(registeredUser.city);
      await expect(checkout.orderRows).toHaveCount(2);
    });

    await test.step('order total equals the sum of the two prices', async () => {
      await expect(checkout.totalAmount).toHaveText(`Rs. ${rupees(first.price) + rupees(second.price)}`);
    });

    await test.step('place the order and pay with a test card', async () => {
      await checkout.placeOrder();
      await expect(page).toHaveURL(/\/payment$/);
      await payment.payWithTestCard();
      await expect(payment.orderPlaced).toBeVisible();
    });
  });
});
