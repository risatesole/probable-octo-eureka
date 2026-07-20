'use client';

import { ProductCard } from '@/components/ProductCard';

export interface MappedProduct {
  id: number | string;
  variantId: number | string;
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
  if (!products || products.length === 0) {
    return null;
  }

  return (
    <section className="mx-auto mb-16 max-w-7xl px-2 py-5 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {products.map((product) => {
          if (!product.slug) {
            console.warn('Variante sin slug válido:', product);
            return null;
          }

          return (
            <ProductCard
              key={`${product.id}-${product.variantId}`}
              id={product.variantId}
              slug={product.slug}
              name={product.name}
              selling_price={product.selling_price}
              categoryName={product.category}
              image={product.thumbnail}
              actionLabel="VER PRODUCTO"
              actionHref={`/${product.slug}`}
            />
          );
        })}
      </div>
    </section>
  );
}