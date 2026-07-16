'use client';

import { ProductCard } from '@/components/ProductCard';
import type { MappedProduct } from '@/types'; // Asume la interfaz plana refactorizada previamente

export type ProductsSectionProps = {
  // Desacoplamos el objeto complejo Product para enviar primitivos, evitando re-renders innecesarios
  onAddToCart: (productId: string | number, quantity: number) => void;
  products: MappedProduct[];
  title?: string;
};

export function ProductsSection({ 
  onAddToCart, 
  products, 
  title = "Catálogo de Productos" 
}: ProductsSectionProps) {
  return (
    <section 
      id="products" 
      className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8"
    >
      <header className="mb-12 border-b border-[#e2e8f0] pb-4">
        <h2 className="font-serif text-2xl font-bold tracking-tight text-[#002d62] md:text-3xl">
          {title}
        </h2>
      </header>

      {products.length === 0 ? (
        <div className="flex h-40 items-center justify-center border border-[#e2e8f0] bg-[#f7f9fb]">
          <p className="text-sm font-medium text-[#747781]">
            No hay productos destacados disponibles en este momento.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard 
              key={product.id} 
              id={Number(product.id)}
              name={product.name}
              selling_price={product.selling_price}
              categoryName={product.category}
              image={product.thumbnail}
              slug={product.slug || ''}
              onAdd={onAddToCart} 
            />
          ))}
        </div>
      )}
    </section>
  );
}