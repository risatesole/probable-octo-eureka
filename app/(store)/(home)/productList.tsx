'use client';

import { ProductCard } from '@/components/ProductCard';
import type { Product } from '@/entities/product';

interface ProductListProps {
  products: {
    id: number;
    name: string;
    thumbnail: string;
    slug: string;
    selling_price: number;
    category: string;
  }[];
}

export default function ProductList({ products }: ProductListProps) {
  async function handleAddToCart(productId: number, quantity: number) {
    const response = await fetch('/api/v1/cart/', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        productvariantid: productId,
        quantity: 1,
      }),
    });
  }
  return (
    <div
      style={{
        flex: 1,
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
        gap: '2.5rem 2rem',
      }}
    >
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
