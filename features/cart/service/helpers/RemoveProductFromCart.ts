// features/cart/service/helpers/RemoveProductFromCart.ts

export interface RemoveCartResponse {
  status: string;
  message?: string;
  data?: {
    productvariantid?: number;
    product_id?: number;
    quantity?: number;
  };
}

export async function removeProductFromCart(
  variantId: number | string,
  quantity: number = 1
): Promise<RemoveCartResponse> {
  console.log('[Cart Delete] Enviando:', {
    variantId,
    productvariantid: Number(variantId),
    quantity,
  });

  const response = await fetch('/api/v1/cart/', {
    method: 'DELETE',
    credentials: 'include',
    headers: {
      Accept: 'application/json',
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

    console.error('[Cart Delete] Error eliminando producto:', {
      status: response.status,
      variantId,
      quantity,
      errorData,
    });

    throw new Error(
      errorData.message ||
        JSON.stringify(errorData.errors) ||
        `Fallo en eliminación: HTTP ${response.status}`
    );
  }

  return response.json() as Promise<RemoveCartResponse>;
}