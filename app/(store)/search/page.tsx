'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ProductCard } from '@/components/ProductCard';
import { addProductToCart } from '@/features/cart/service';

type ApiVariant = {
  id?: number;
  name: string;
  description: string;
  variantnumber: number;
  thumbnail: string | null;
  selling_price: number;
  tax_rate: number;
  sku: string;
  slug: string;
  image_hero: string | null;
  image_thumbnail: string | null;
  image_gallery: string | null;
  image_lifestyle: string | null;
};

type ApiProduct = {
  id: number;
  name: string;
  category: string;
  product_type: string;
  thumbnail: string | null;
  slug: string;
  type: string;
  variants: ApiVariant[];
};

type SearchProduct = {
  id: number;
  variantId: number | null;
  name: string;
  selling_price: number;
  categoryName: string;
  image: string;
  slug: string;
};

function normalizeProduct(product: ApiProduct): SearchProduct {
  const firstVariant = product.variants?.[0];

  return {
    id: product.id,
    variantId: firstVariant?.id ?? firstVariant?.variantnumber ?? null,
    name: product.name,
    selling_price: firstVariant?.selling_price ?? 0,
    categoryName: product.category,
    image:
      firstVariant?.thumbnail ||
      firstVariant?.image_thumbnail ||
      product.thumbnail ||
      '',
    slug: firstVariant?.slug || product.slug || '',
  };
}

async function searchProducts(query: string): Promise<ApiProduct[]> {
  const response = await fetch(
    `/api/v1/products/?search=${encodeURIComponent(query)}`,
    {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Search failed: HTTP ${response.status}`);
  }

  const json = await response.json();

  return json.data || [];
}

function EmptyState({ query }: { query: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 py-24 text-center">
      <p className="font-serif text-2xl font-semibold text-[#002d62]">
        No encontramos resultados para “{query}”
      </p>

      <p className="max-w-md text-sm leading-6 text-[#43474f]">
        Intenta con otro término de búsqueda o explora el catálogo del Economato.
      </p>
    </div>
  );
}

function SearchContent() {
  const searchParams = useSearchParams();
  const q = searchParams.get('q') ?? '';

  const [rawProducts, setRawProducts] = useState<ApiProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!q) {
      setRawProducts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(false);

    searchProducts(q)
      .then((data) => {
        setRawProducts(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('[Search] Error buscando productos:', err);
        setError(true);
        setLoading(false);
      });
  }, [q]);

  async function handleAddToCart(variantId: string | number, quantity: number) {
    try {
      await addProductToCart(variantId, quantity);
    } catch (err) {
      console.error('Failed to add product to cart:', err);
    }
  }

  const products = rawProducts.map(normalizeProduct);

  return (
    <div className="min-h-screen bg-[#f7f9fb]">
      <main className="mx-auto max-w-7xl px-4 py-12 md:px-16 md:py-16">
        <header className="mb-12 border-b border-[#e2e8f0] pb-8">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#747781]">
            Resultados de búsqueda
          </p>

          <h1 className="font-serif text-3xl font-bold tracking-[-0.02em] text-[#002d62] md:text-4xl">
            “{q}”
          </h1>
        </header>

        {loading ? (
          <div className="border border-[#e2e8f0] bg-white px-6 py-5">
            <p className="text-sm text-[#43474f]">Buscando productos…</p>
          </div>
        ) : error ? (
          <div className="border border-[#ffb4ab] bg-[#ffdad6] px-5 py-4 text-sm text-[#93000a]">
            No pudimos realizar la búsqueda. Intenta nuevamente.
          </div>
        ) : products.length === 0 ? (
          <EmptyState query={q} />
        ) : (
          <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => {
              if (!product.variantId) {
                console.warn('Producto sin variante válida:', product);
                return null;
              }

              return (
                <ProductCard
                  key={`${product.id}-${product.variantId}`}
                  id={product.variantId}
                  name={product.name}
                  selling_price={product.selling_price}
                  categoryName={product.categoryName}
                  image={product.image}
                  slug={product.slug}
                  onAdd={handleAddToCart}
                />
              );
            })}
          </section>
        )}
      </main>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#f7f9fb] px-4 py-12 md:px-16">
          <div className="mx-auto max-w-7xl border border-[#e2e8f0] bg-white px-6 py-5">
            <p className="text-sm text-[#43474f]">Cargando búsqueda…</p>
          </div>
        </main>
      }
    >
      <SearchContent />
    </Suspense>
  );
}