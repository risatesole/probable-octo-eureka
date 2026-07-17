// components/ProductList.tsx
'use client';

import { useCallback } from 'react';
import { ProductCard } from '@/components/ProductCard';

export interface MappedProduct {
  // Ajuste a string | number: PostgreSQL en Django suele usar UUIDv4 (string) 
  // para arquitecturas escalables, o BigAutoField (number).
  id: string | number; 
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
  // useCallback estabiliza la referencia de la función para evitar re-renders 
  // innecesarios en los componentes hijos (ProductCard)
  const handleAddToCart = useCallback(async (productId: string | number, quantity: number) => {
    try {
      // Optimizacion: Si Next.js maneja la sesión vía cookies HttpOnly en el mismo dominio, 
      // credentials: 'include' no es estrictamente necesario bajo rutas relativas.
      const response = await fetch('/api/v1/cart/', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json' 
        },
        body: JSON.stringify({
          productvariantid: productId,
          quantity,
        }),
      });

      if (!response.ok) {
        // Extracción del payload de DRF para trazabilidad exacta en logs del cliente
        const errorDetail = await response.json().catch(() => ({}));
        throw new Error(`HTTP ${response.status} | DRF: ${JSON.stringify(errorDetail)}`);
      }
      
      // TODO: Integrar mutación exitosa con un estado global (Zustand/Context) 
      // o invalidación de caché (SWR/React Query)
    } catch (error) {
      console.error('[Cart Mutation Error] Fallo en la comunicación con el endpoint:', error);
      // TODO: Conectar con sistema de Toasts (ej. react-hot-toast) para UX
    }
  }, []);

  if (!products?.length) return null;

  return (
    // Refactorización de Tailwind: Se consolida el layout system usando `mx-auto` y `px-*`
    // para evitar el uso redundante e imperativo de ml-*, mr-*, reduciendo la especificidad CSS.
    <section className="mx-auto max-w-7xl px-4 py-8 md:px-16 md:py-12">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {products.map((product) => (
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
    </section>
  );
}