'use client';

import { useCallback } from 'react';
import { ProductCard } from '@/components/ProductCard';

// Abstracción de interfaz para mantener el código DRY y escalable.
// Se recomienda mover MappedProduct a un archivo de tipos global (ej. '@/types').
export interface MappedProduct {
  id: number;
  name: string;
  thumbnail: string;
  slug: string;
  selling_price: number;
  category: string;
}

interface ProductListProps {
  products: MappedProduct[];
}

export default function ProductList({ products }: ProductListProps) {
  // useCallback asegura la estabilidad de la referencia, previniendo que
  // los componentes hijos (ProductCard) se re-rendericen en cada ciclo de vida.
  const handleAddToCart = useCallback(async (productId: number, quantity: number) => {
    try {
      const response = await fetch('/api/v1/cart/', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productvariantid: productId,
          quantity: quantity, // Corregido: previamente estaba hardcodeado a 1
        }),
      });

      if (!response.ok) {
        throw new Error(`Fallo en la petición: ${response.statusText}`);
      }

      // TODO: Invalidar caché del carrito (Server Action revalidateTag) o actualizar Context/Zustand
    } catch (error) {
      console.error('Error durante la adición al carrito:', error);
      // TODO: Implementar dispatch de Toast/Notificación para feedback visual
    }
  }, []);

  if (!products || products.length === 0) {
    return null; // Early return para evitar renderizar el contenedor vacío
  }

  return (
    <div className="flex-1 grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {products.map(product => (
        <ProductCard
          key={product.id}
          id={product.id}
          slug={product.slug}
          name={product.name}
          selling_price={product.selling_price}
          categoryName={product.category}
          image={product.thumbnail}
          onAdd={handleAddToCart}
        />
      ))}
    </div>
  );
}