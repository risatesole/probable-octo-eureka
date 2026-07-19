import type { AddProductToCartResponse } from '@/features/cart/types/AddProductToCartResponse';

export async function addProductToCart(
  variantId: string | number,
  quantity: number = 1
) {
  const response = await fetch('/api/v1/cart/', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      productvariantid: Number(variantId),
      quantity,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({
      message: 'Unknown error',
    }));

    console.error('Error agregando al carrito:', errorData);

    throw new Error(
      errorData.message ||
      JSON.stringify(errorData.errors) ||
      `Request failed: ${response.status}`
    );
  }

  return response.json() as Promise<AddProductToCartResponse>;
}