// app/(store)/(home)/productList.tsx
'use client';

import { useCallback } from 'react';
import { ProductCard } from '@/components/ProductCard';

export interface MappedProduct {
  id: string | number;
  variantId: string | number | null;
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
  const handleAddToCart = useCallback(
    async (variantId: string | number, quantity: number) => {
      try {
        console.log('Enviando al carrito:', {
          variantId,
          productvariantid: Number(variantId),
          quantity,
        });

        const response = await fetch('/api/v1/cart/', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            productvariantid: Number(variantId),
            quantity,
          }),
        });

        if (!response.ok) {
          const errorDetail = await response.json().catch(() => ({}));

          console.error('Respuesta de error del carrito:', errorDetail);

          throw new Error(
            `HTTP ${response.status} | DRF: ${JSON.stringify(errorDetail)}`
          );
        }

        console.log('Producto agregado al carrito correctamente.');
      } catch (error) {
        console.error(
          '[Cart Mutation Error] Fallo en la comunicación con el endpoint:',
          error
        );
      }
    },
    []
  );

  if (!products?.length) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 md:px-16 md:py-12">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {products.map((product) => {
          if (!product.variantId) {
            console.warn('Producto sin variante válida:', product);
            return null;
          }

          return (
            <ProductCard
              key={product.id}
              id={product.variantId}
              slug={product.slug}
              name={product.name}
              selling_price={product.selling_price}
              categoryName={product.category}
              image={product.thumbnail}
              onAdd={handleAddToCart}
            />
          );
        })}
      </div>
    </section>
  );
}