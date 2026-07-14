import type { RemoveProductFromCartResponse } from '@/features/cart/types/RemoveProductFromCartResponse';

export async function RemoveProductFromCart(productId: number | string) {
  const response = await fetch('/api/v1/cart', {
    method: 'DELETE',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      productvariantid: productId,
      quantity: 1,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    console.error(`Failed to remove product (${response.status}): ${body}`);
    throw new Error(`Request failed: ${response.status} - ${body}`);
  }

  return response.json() as Promise<RemoveProductFromCartResponse>;
}
