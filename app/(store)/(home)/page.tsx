// app/(store)/(home)/page.tsx

import Link from 'next/link';
import Carousel from './ProductCarousel';
import ProductList from './productList';
import type { Product } from '@/entities/product';

import calculadorasImg from './img/calculadoras.png';
import manualesLab from './img/manualeslab.png';
import econoDigital from './img/econodigital.jpeg';

const CAROUSEL_SLIDES = [
  { id: '1', image: calculadorasImg.src, title: 'Calculadoras', description: 'Descubre la que va con tu estilo', buttonText: 'Comprar Ahora', buttonLink: '#' },
  { id: '2', image: manualesLab.src, title: 'Ya Disponibles', description: 'No pierdas tiempo ahora es más rápido', buttonText: 'Ver Todos', buttonLink: '#' },
  { id: '3', image: econoDigital.src, title: 'BuyFast', description: 'El mismo ecónomato, pero digital', buttonText: 'Ver todas las categorias', buttonLink: '#' },
];

/**
 * Diccionario centralizado de pesos para el ordenamiento de imágenes.
 * Almacenado fuera de la función para evitar re-asignaciones en memoria por cada iteración.
 */
const IMAGE_TYPE_PRIORITIES: Record<string, number> = {
  THUMBNAIL: 100,
  HERO: 90,
  DETAIL: 80,
  GALLERY: 70,
  LIFESTYLE: 60,
  PACKAGING: 50,
  COLOR: 40,
  SIZE: 30,
  OTHER: 20,
};

async function getProducts(): Promise<Product[]> {
  const baseUrl = process.env.BACKEND_URL;

  if (!baseUrl) {
    console.error('[Config Error] process.env.BACKEND_URL no está definida.');
    return [];
  }

  try {
    const url = new URL('/api/v1/products/?ordering=-created_at&limit=6', baseUrl).toString();
    const response = await fetch(url, {
      next: { revalidate: 0 },
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    });

    if (!response.ok) return [];

    const json = await response.json();
    return json.data || json.results || [];
  } catch (error) {
    console.error('[Network Error] Fallo en la conexión DRF:', error);
    return [];
  }
}

/**
 * Resolutor Jerárquico de Imágenes (Deep Inspection).
 * Intercepta colecciones serializadas, evaluando dinámicamente cualquier tipo de imagen
 * gestionada por el backend en Django mediante normalización estricta.
 */
function extractBestImageUrl(entity: any, baseUrl: string): string {
  if (!entity) return '';

  let rawUrl = '';

  // 1. Manejo de relaciones One-to-Many (Array de ProductImage de Django)
  if (Array.isArray(entity.images) && entity.images.length > 0) {
    const sortedImages = [...entity.images].sort((a, b) => {
      // Normalización a mayúsculas para garantizar el match con el diccionario independientemente del case del payload JSON
      const typeA = String(a?.image_type || a?.type || '').toUpperCase();
      const typeB = String(b?.image_type || b?.type || '').toUpperCase();
      
      const weightA = IMAGE_TYPE_PRIORITIES[typeA] || 0;
      const weightB = IMAGE_TYPE_PRIORITIES[typeB] || 0;
      
      return weightB - weightA;
    });

    const target = sortedImages[0];
    rawUrl = typeof target === 'string' 
      ? target 
      : target?.image || target?.original || target?.url || target?.src || '';
  } 
  // 2. Manejo de objetos planos o serializadores simplificados
  else if (typeof entity === 'object' && entity !== null) {
    rawUrl = entity.image || entity.thumbnail || entity.image_thumbnail || entity.url || '';
  } 
  // 3. String directo
  else if (typeof entity === 'string') {
    rawUrl = entity;
  }

  if (!rawUrl || typeof rawUrl !== 'string') return '';

  // 4. Normalización FQDN segura
  if (rawUrl.startsWith('/')) {
    return `${baseUrl.replace(/\/$/, '')}${rawUrl}`;
  }

  return rawUrl;
}

export default async function Page() {
  const products = await getProducts();
  const baseUrl = process.env.BACKEND_URL || '';

  const mappedProducts = products.flatMap((product) => {
    const variants = product.variants ?? [];

    return variants.map((variant) => {
      const variantImage = 
        extractBestImageUrl(variant, baseUrl) || 
        extractBestImageUrl(product, baseUrl);

      return {
        id: product.id,
        variantId: variant.id ?? variant.variantnumber,
        name: variant.name || product.name,
        slug: variant.slug || product.slug || '',
        categoryName: typeof product.category === 'string' 
          ? product.category 
          : product.category?.name || 'Sin categoría',
        selling_price: variant.selling_price ?? 0,
        image: variantImage,
        thumbnail: variantImage, 
      };
    });
  });

  const latestProducts = mappedProducts.slice(0, 6);

  return (
    <main className="min-h-screen bg-white">
      <Carousel slides={CAROUSEL_SLIDES} />

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-12 flex items-center justify-center">
          <div className="h-px w-full bg-[#e2e8f0]" aria-hidden="true" />
          <h2 className="shrink-0 px-6 font-serif text-2xl font-bold uppercase tracking-widest text-[#002d62]">
            NUEVOS PRODUCTOS
          </h2>
          <div className="h-px w-full bg-[#e2e8f0]" aria-hidden="true" />
        </div>

        {latestProducts.length > 0 ? (
          <>
            <ProductList products={latestProducts} />
            <div className="mt-14 flex justify-center">
              <Link href="/categories" prefetch={false} className="inline-flex items-center justify-center rounded-xl bg-[#002d62] px-8 py-3.5 text-sm font-bold tracking-wide text-white shadow-sm transition-all duration-200 hover:bg-[#115cb9] hover:shadow-md active:scale-95">
                VER TODAS LAS CATEGORÍAS
                <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </>
        ) : (
          <div className="flex h-48 w-full items-center justify-center rounded-xl border border-dashed border-[#e2e8f0] bg-[#f7f9fb]">
            <p className="font-medium text-[#747781]">El catálogo no está disponible temporalmente.</p>
          </div>
        )}
      </section>
    </main>
  );
}