// features/cart/service/helpers/RemoveProductFromCart.ts

export interface RemoveCartResponse {
  success: boolean;
  message?: string;
}

export async function removeProductFromCart(
  variantId: number | string
): Promise<RemoveCartResponse> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
  
  // Ajuste de enrutamiento a convención REST para recursos anidados.
  // Evita colisiones con el endpoint singleton del carrito (/api/v1/cart/).
  const endpoint = `${baseUrl}/api/v1/cart/items/${variantId}/`; 

  try {
    const response = await fetch(endpoint, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json', // Requerido por algunos middlewares CORS/CSRF
      },
      // Crítico: Permite el envío de cookies de sesión (SessionAuthentication) 
      // desde el Client Component hacia DRF.
      credentials: 'include', 
    });

    if (!response.ok) {
      const contentType = response.headers.get('content-type') || '';
      const isJson = contentType.includes('application/json');
      
      const errorPayload = isJson 
        ? await response.json() 
        : `[Non-JSON] ${await response.text()}`.substring(0, 150);

      console.error(
        `[Cart Delete] HTTP ${response.status} - Variant: ${variantId} | Payload:`, 
        errorPayload
      );
      
      throw new Error(`Fallo en eliminación: HTTP ${response.status}`);
    }

    if (response.status === 204) {
      return { success: true };
    }

    return (await response.json()) as RemoveCartResponse;
    
  } catch (error) {
    console.error(`[Cart Delete] Network/CORS Exception - Variant: ${variantId}`, error);
    throw error;
  }
}