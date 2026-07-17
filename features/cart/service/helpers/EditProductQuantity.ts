// features/cart/service/helpers/EditProductQuantity.ts

export interface EditQuantityResponse {
  success: boolean;
  message?: string;
}

/**
 * Ejecuta una mutación parcial (PATCH) hacia DRF para actualizar la cantidad.
 */
export async function editProductQuantity(
  variantId: number | string,
  quantity: number
): Promise<EditQuantityResponse> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
  // El trailing slash (/) es imperativo para evitar un redirect 301 del Router de DRF
  const endpoint = `${baseUrl}/api/v1/cart/update/${variantId}/`;

  const response = await fetch(endpoint, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ quantity }),
  });

  if (!response.ok) {
    const errorDetails = await response.text();
    console.error(`[Cart] Fallo en PATCH ${endpoint}: HTTP ${response.status}`, errorDetails);
    throw new Error(`Fallo de actualización: HTTP ${response.status}`);
  }

  // Soporte para respuestas vacías (204 No Content), estándar en mutaciones REST
  if (response.status === 204) {
    return { success: true };
  }

  return (await response.json()) as EditQuantityResponse;
}