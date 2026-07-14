'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ImageGallery } from '@/components/ImageGallery';
import type { Product, NormalProductVariant } from '@/entities/product';

interface ProductPageProps {
  initialProduct: Product;
  initialVariant: NormalProductVariant;
}

export default function ProductPage({ initialProduct, initialVariant }: ProductPageProps) {
  const [selectedVariant, setSelectedVariant] = useState<NormalProductVariant>(initialVariant);
  const [cartAdding, setCartAdding] = useState(false);

  const product = initialProduct;

  // Extract image URLs from variant.images array
  const imageUrls = selectedVariant.images.map(img => img.url);

  const handleAddToCart = async () => {
    setCartAdding(true);
    try {
      console.log('Adding variant:', selectedVariant.id);
    } finally {
      setCartAdding(false);
    }
  };

  return (
    <div style={{ fontFamily: 'var(--font-geist-sans), sans-serif' }}>
      <main
        style={{
          maxWidth: 1280,
          margin: '0 auto',
          padding: '4rem 2rem',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '4rem',
            alignItems: 'start',
          }}
        >
          {/* Image Gallery */}
          <div>
            <ImageGallery images={imageUrls} />
          </div>

          {/* Product Info */}
          <div>
            <p
              style={{
                fontSize: '0.68rem',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'oklch(0.708 0 0)',
                marginBottom: '1rem',
              }}
            >
              {product.category}
            </p>

            <h1
              style={{
                fontFamily: "'Georgia', serif",
                fontWeight: 400,
                fontSize: '2rem',
                marginBottom: '0.5rem',
              }}
            >
              {product.name}
            </h1>

            <p
              style={{
                fontSize: '0.875rem',
                color: 'oklch(0.708 0 0)',
                marginBottom: '1.5rem',
              }}
            >
              {selectedVariant.name}
            </p>

            <p
              style={{
                fontSize: '1.5rem',
                fontWeight: 600,
                marginBottom: '0.5rem',
              }}
            >
              ${selectedVariant.selling_price.toFixed(2)}
            </p>

            <p
              style={{
                fontSize: '0.75rem',
                color: 'oklch(0.708 0 0)',
                marginBottom: '2rem',
              }}
            >
              Tax rate: {(selectedVariant.tax_rate * 100).toFixed(0)}%
            </p>

            <p
              style={{
                lineHeight: '1.6',
                color: 'oklch(0.556 0 0)',
                marginBottom: '2rem',
              }}
            >
              {selectedVariant.description}
            </p>

            {/* Variant Selector - Small Buttons */}
            {product.variants.length > 1 && (
              <div style={{ marginBottom: '2rem' }}>
                <p
                  style={{
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    marginBottom: '0.75rem',
                    color: 'oklch(0.145 0 0)',
                  }}
                >
                  Available options:
                </p>
                <div
                  style={{
                    display: 'flex',
                    gap: '0.5rem',
                    flexWrap: 'wrap',
                  }}
                >
                  {product.variants.map(v => (
                    <Link
                      key={v.slug}
                      href={`/${v.slug}`}
                      style={{
                        textDecoration: 'none',
                      }}
                    >
                      <div
                        style={{
                          padding: '0.5rem 1rem',
                          fontSize: '0.75rem',
                          fontWeight: 500,
                          border:
                            selectedVariant.slug === v.slug
                              ? '2px solid oklch(0.145 0 0)'
                              : '1px solid oklch(0.922 0 0)',
                          borderRadius: '4px',
                          backgroundColor:
                            selectedVariant.slug === v.slug ? 'oklch(0.98 0 0)' : 'transparent',
                          color: 'oklch(0.145 0 0)',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          whiteSpace: 'nowrap',
                          display: 'inline-block',
                        }}
                        onMouseEnter={e => {
                          if (selectedVariant.slug !== v.slug) {
                            const div = e.currentTarget as HTMLElement;
                            div.style.borderColor = 'oklch(0.708 0 0)';
                            div.style.backgroundColor = 'oklch(0.985 0 0)';
                          }
                        }}
                        onMouseLeave={e => {
                          if (selectedVariant.slug !== v.slug) {
                            const div = e.currentTarget as HTMLElement;
                            div.style.borderColor = 'oklch(0.922 0 0)';
                            div.style.backgroundColor = 'transparent';
                          }
                        }}
                      >
                        {v.name}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Add to Cart */}
            <button
              onClick={handleAddToCart}
              disabled={cartAdding}
              style={{
                width: '100%',
                padding: '0.875rem 1.5rem',
                background: cartAdding ? 'oklch(0.3 0 0)' : 'oklch(0.145 0 0)',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '0.95rem',
                fontWeight: 500,
                cursor: cartAdding ? 'not-allowed' : 'pointer',
                transition: 'background 0.2s ease',
                marginBottom: '1rem',
                opacity: cartAdding ? 0.7 : 1,
              }}
              onMouseEnter={e => {
                if (!cartAdding) {
                  (e.currentTarget as HTMLElement).style.background = 'oklch(0.1 0 0)';
                }
              }}
              onMouseLeave={e => {
                if (!cartAdding) {
                  (e.currentTarget as HTMLElement).style.background = 'oklch(0.145 0 0)';
                }
              }}
            >
              {cartAdding ? 'Adding...' : 'Add to cart'}
            </button>

            {/* Product Details */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '1.5rem',
                borderTop: '1px solid oklch(0.922 0 0)',
                paddingTop: '2rem',
              }}
            >
              <div>
                <p
                  style={{
                    fontSize: '0.75rem',
                    color: 'oklch(0.708 0 0)',
                    marginBottom: '0.5rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  SKU
                </p>
                <p style={{ fontWeight: 500, margin: 0 }}>{selectedVariant.sku}</p>
              </div>
              <div>
                <p
                  style={{
                    fontSize: '0.75rem',
                    color: 'oklch(0.708 0 0)',
                    marginBottom: '0.5rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Variant #
                </p>
                <p style={{ fontWeight: 500, margin: 0 }}>{selectedVariant.variantnumber}</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
