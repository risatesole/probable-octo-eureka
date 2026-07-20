// app/(store)/(home)/productList.tsx

import { ProductCard } from '@/components/ProductCard';

export interface MappedProduct {
  id: string | number;
  variantId: string | number | null; // Tipado ajustado a la realidad del DTO en page.tsx
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
  if (!products?.length) return null;

  // Filtrado defensivo previo a la renderización
  const validProducts = products.filter((product) => {
    if (!product.slug) {
      console.warn(`[Data Integrity] Variante omitida por falta de slug válido. Producto ID: ${product.id}`);
      return false;
    }
    return true;
  });

  if (!validProducts.length) return null;

  return (
    // Se elimina el wrapper restrictivo (max-w-7xl, paddings) para delegar la 
    // responsabilidad del layout al contenedor <section> padre en page.tsx
    <div className="grid w-full grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
      {validProducts.map((product) => (
        <ProductCard
          key={`p-${product.id}-v-${product.variantId ?? 'base'}`}
          id={product.variantId ?? product.id}
          slug={product.slug}
          name={product.name}
          selling_price={product.selling_price}
          categoryName={product.category}
          image={product.thumbnail}
          actionLabel="VER PRODUCTO"
          actionHref={`/${product.slug}`}
        />
      ))}
    </div>
  );
}