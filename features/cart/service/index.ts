import type { AddProductToCartResponse } from '@/features/cart/types/AddProductToCartResponse';
import type { GetCartResponse } from '@/features/cart/types/GetCartResponse';
import { addProductToCart } from './helpers/AddProductToCart';
import { getCart } from './helpers/GetProductsInCart';
import { RemoveProductFromCart } from './helpers/RemoveProductFromCart';

export default class CartService {
  async getCart(cookieHeader?: string): Promise<GetCartResponse> {
    return getCart(cookieHeader);
  }

  async addProduct(productId: number, quantity: number = 1): Promise<AddProductToCartResponse> {
    return addProductToCart(productId, quantity);
  }

  async removeProduct(productId: number | string) {
    return RemoveProductFromCart(productId);
  }

  async editProductQuantity(productId: number | string, quantity: number) {
    const response = await fetch('/api/v1/cart', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        productvariantid: productId,
        quantity: quantity,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      console.error(`Failed to update product quantity (${response.status}): ${body}`);
      throw new Error(`Request failed: ${response.status} - ${body}`);
    }

    return response.json();
  }
}
