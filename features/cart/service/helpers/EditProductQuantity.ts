// features/cart/service/helpers/EditProductQuantity.ts

export interface EditQuantityResponse {
  status: string;
  message?: string;
  data?: {
    productvariantid?: number;
    quantity?: number;
  };
}

/**
 * Actualiza la cantidad de una variante en el carrito.
 * El backend actual usa PATCH /api/v1/cart/ con productvariantid en el body.
 */
export async function editProductQuantity(
  variantId: number | string,
  quantity: number
): Promise<EditQuantityResponse> {
  const response = await fetch('/api/v1/cart/', {
    method: 'PATCH',
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

    console.error('[Cart] Fallo actualizando cantidad:', {
      status: response.status,
      variantId,
      quantity,
      errorData,
    });

    throw new Error(
      errorData.message ||
        JSON.stringify(errorData.errors) ||
        `Fallo de actualización: HTTP ${response.status}`
    );
  }

  return response.json() as Promise<EditQuantityResponse>;
}