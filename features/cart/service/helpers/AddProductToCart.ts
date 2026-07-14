import type { AddProductToCartResponse } from '@/features/cart/types/AddProductToCartResponse';

export async function addProductToCart(productId: number, quantity: number = 1) {
  const response = await fetch('/api/v1/cart', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      productvariantid: productId,
      quantity,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(errorData.message || `Request failed: ${response.status}`);
  }

  return response.json() as Promise<AddProductToCartResponse>;
}
