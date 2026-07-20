// app/(store)/(products)/[slug]/product-page-client.tsx
'use client';

import { useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { ImageGallery } from '@/components/ImageGallery';
import type { Product, NormalProductVariant } from '@/entities/product';

interface ProductPageProps {
  initialProduct: Product;
  initialVariant: NormalProductVariant;
}

export default function ProductPage({ initialProduct, initialVariant }: ProductPageProps) {
  const [selectedVariant, setSelectedVariant] = useState<NormalProductVariant>(initialVariant);
  const [isPending, setIsPending] = useState(false);

  // FIX: Resolución de herencia y mapeo defensivo de URLs
  const imageUrls = useMemo(() => {
    // 1. Fallback jerárquico: Si la variante no tiene imágenes, hereda las del producto padre
    const sourceImages = selectedVariant.images?.length 
      ? selectedVariant.images 
      : initialProduct.images || [];

    // 2. Extracción polimórfica: DRF puede mutar la key dependiendo del serializer
    return sourceImages
      .map((img: any) => img.url || img.image || img.original || img.src)
      .filter(Boolean) as string[]; // Elimina undefined/nulls que quiebren el ImageGallery
  }, [selectedVariant.images, initialProduct.images]);

  const handleAddToCart = useCallback(async () => {
    setIsPending(true);
    try {
      const response = await fetch('/api/v1/cart/', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productvariantid: selectedVariant.id,
          quantity: 1,
        }),
      });

      if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
      
    } catch (error) {
      console.error('[Cart Mutation Error]:', error);
    } finally {
      setIsPending(false);
    }
  }, [selectedVariant.id]);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-16 lg:px-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-start">
        
        {/* Image Gallery */}
        <section className="w-full">
          <ImageGallery images={imageUrls} />
        </section>

        {/* Product Info */}
        <section className="flex flex-col">
          <p className="mb-4 text-xs font-semibold tracking-widest text-gray-500 uppercase">
            {initialProduct.category}
          </p>

          <h1 className="mb-2 font-serif text-3xl font-medium text-gray-900 md:text-4xl">
            {initialProduct.name}
          </h1>

          <p className="mb-6 text-sm text-gray-500">
            {selectedVariant.name}
          </p>

          <div className="mb-8 flex flex-col gap-1">
            <p className="text-2xl font-bold text-gray-900">
              ${selectedVariant.selling_price.toFixed(2)}
            </p>
            <p className="text-xs text-gray-500">
              Tasa de impuesto: {(selectedVariant.tax_rate * 100).toFixed(0)}%
            </p>
          </div>

          <p className="mb-8 text-base leading-relaxed text-gray-600">
            {selectedVariant.description}
          </p>

          {/* Variant Selector */}
          {initialProduct.variants && initialProduct.variants.length > 1 && (
            <div className="mb-8">
              <h3 className="mb-3 text-sm font-medium text-gray-900">Opciones disponibles:</h3>
              <div className="flex flex-wrap gap-2">
                {initialProduct.variants.map((v) => {
                  const isActive = selectedVariant.slug === v.slug;
                  return (
                    <button
                      key={v.slug}
                      onClick={() => setSelectedVariant(v)}
                      className={`
                        inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-2 text-xs font-medium transition-colors duration-200
                        ${isActive 
                          ? 'border-2 border-gray-900 bg-gray-50 text-gray-900' 
                          : 'border border-gray-200 text-gray-600 hover:border-gray-400 hover:bg-gray-50'}
                      `}
                    >
                      {v.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Add to Cart Action */}
          <button
            onClick={handleAddToCart}
            disabled={isPending}
            aria-disabled={isPending}
            className={`
              w-full rounded-md px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition-all duration-200
              ${isPending 
                ? 'cursor-not-allowed bg-gray-400 opacity-70' 
                : 'bg-[#002d62] hover:bg-[#115cb9] active:scale-[0.98]'}
            `}
          >
            {isPending ? 'Añadiendo...' : 'Añadir al carrito'}
          </button>

          {/* Technical Details */}
          <dl className="mt-8 grid grid-cols-2 gap-6 border-t border-gray-200 pt-8">
            <div>
              <dt className="mb-1 text-xs font-semibold tracking-wider text-gray-500 uppercase">SKU</dt>
              <dd className="text-sm font-medium text-gray-900">{selectedVariant.sku}</dd>
            </div>
            <div>
              <dt className="mb-1 text-xs font-semibold tracking-wider text-gray-500 uppercase">Variante #</dt>
              <dd className="text-sm font-medium text-gray-900">{selectedVariant.variantnumber}</dd>
            </div>
          </dl>
        </section>
      </div>
    </main>
  );
}