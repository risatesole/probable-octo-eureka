'use client';

import { memo } from 'react';
import { ProductCard } from '@/components/ProductCard';
import type { MappedProduct } from '@/types';

export interface ProductsSectionProps {
  onAddToCart: (productId: number, quantity: number) => void;
  products: MappedProduct[];
  title?: string;
}

export const ProductsSection = memo(function ProductsSection({ 
  onAddToCart, 
  products, 
  title = "Catálogo de Productos" 
}: ProductsSectionProps) {
  // Generación de ID para accesibilidad (a11y)
  const titleId = "products-section-title";

  // Patrón Early Return para estados vacíos, reduciendo la anidación del JSX principal
  if (!products?.length) {
    return (
      <section aria-labelledby={titleId} className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <header className="mb-12 border-b border-[#e2e8f0] pb-4">
          <h2 id={titleId} className="font-serif text-2xl font-bold tracking-tight text-[#002d62] md:text-3xl">
            {title}
          </h2>
        </header>
        <div 
          role="status" 
          aria-live="polite"
          className="flex h-40 w-full items-center justify-center border border-[#e2e8f0] bg-[#f7f9fb]"
        >
          <p className="text-sm font-medium text-[#747781]">
            No hay productos destacados disponibles en este momento.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section 
      id="products" 
      aria-labelledby={titleId}
      className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8"
    >
      <header className="mb-12 border-b border-[#e2e8f0] pb-4">
        <h2 id={titleId} className="font-serif text-2xl font-bold tracking-tight text-[#002d62] md:text-3xl">
          {title}
        </h2>
      </header>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {products.map((product) => (
          <ProductCard 
            key={product.id} 
            // NOTA: La coerción Number() debe ser resuelta en la capa de serialización de DRF o el DTO, no en el render.
            id={Number(product.id)}
            name={product.name}
            selling_price={product.selling_price}
            categoryName={product.category}
            image={product.thumbnail}
            // Nullish coalescing (??) previene falsos positivos con strings vacíos u otros valores falsy
            slug={product.slug ?? ''}
            onAdd={onAddToCart} 
          />
        ))}
      </div>
    </section>
  );
});