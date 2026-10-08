import type { Api } from '@/api';
import type { Product } from '@/types';

// Live test data: products come from the site's own API, never from hardcoded names and prices.
// The first catalogue change would otherwise break every test for a reason unrelated to the product.
export async function pickProducts(api: Api, count: number): Promise<Product[]> {
  const { responseCode, products } = await api.products.list();
  if (responseCode !== 200) throw new Error(`productsList returned responseCode ${responseCode}`);
  if (products.length < count) throw new Error(`Need ${count} products, catalogue has ${products.length}`);
  return products.slice(0, count);
}
