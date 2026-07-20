'use client';

import { useCallback } from 'react';
import { ProductCard } from '@/components/ProductCard';

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
          quantity: quantity,
        }),
      });

      if (!response.ok) {
        throw new Error(`Fallo en la petición: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error durante la adición al carrito:', error);
    }
  }, []);

  if (!products || products.length === 0) {
    return null; 
  }

  return (
    // Se introduce un contenedor semántico con márgenes y padding para separar secciones
    <section className="mx-auto mb-16 max-w-7xl px-2 py-5 sm:px-6 lg:px-8">
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
    </section>
  );
}