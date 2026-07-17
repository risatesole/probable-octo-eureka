// app/(store)/(home)/page.tsx
import Carousel from './ProductCarousel';
import ProductList from './productList';
import type { Product } from '@/entities/product';

import calculadorasImg from './img/calculadoras.png';
import manualesLab from './img/manualeslab.png';
import econoDigital from './img/econodigital.jpeg';

// 1. Extracción de constantes estáticas fuera del componente para evitar recreaciones en memoria
const CAROUSEL_SLIDES = [
  {
    id: '1',
    image: calculadorasImg.src,
    title: 'La calculadora que necesitas para tus calculos',
    description: 'Descubre la que va con tu estilo',
    buttonText: 'Comprar Ahora',
    buttonLink: '#',
  },
  {
    id: '2',
    image: manualesLab.src,
    title: 'Ya Disponibles',
    description: 'No pierdas tiempo ahora es más rápido',
    buttonText: 'Ver Todos',
    buttonLink: '#',
  },
  {
    id: '3',
    image: econoDigital.src,
    title: 'BuyFast',
    description: 'El mismo ecónomato, pero digital',
    buttonText: 'Ver todas las categorias',
    buttonLink: '#',
  },
];

/**
 * Cliente HTTP robusto para Server Components.
 * Previene el "TypeError: fetch failed" validando variables de entorno y capturando caídas de red.
 */
async function getProducts(): Promise<Product[]> {
  const baseUrl = process.env.BACKEND_URL;

  if (!baseUrl) {
    console.error('[Config Error] process.env.BACKEND_URL no está definida.');
    return []; // Fail-safe UI: Retorna array vacío en lugar de crashear el Server Component
  }

  try {
    // Garantiza una URL absoluta bien formada. Crucial para evitar fallos silenciosos en Node.js
    const url = new URL('/api/v1/products/', baseUrl).toString();

    const response = await fetch(url, {
      next: { revalidate: 3600 }, // Optimización: ISR caché por 1 hora reduce carga en Django/PostgreSQL
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`[API Error] HTTP ${response.status} al obtener productos.`);
      return [];
    }

    const json = await response.json();
    return json.data || [];
  } catch (error) {
    // Captura explícita de errores de socket (ej. ECONNREFUSED) comunes en entornos Docker
    console.error('[Network Error] Fallo de conexión hacia el backend de Django:', error);
    return [];
  }
}

export default async function Page() {
  const products = await getProducts();

  // 2. Patrón DTO (Data Transfer Object) para sanitizar y mapear la data antes del renderizado
  // Esto resuelve el "duck code" y previene errores en tiempo de ejecución si variants está vacío
  const mappedProducts = products.map((product) => {
    const primaryVariant = product.variants?.[0];
    
    return {
      // Corrección del mapeo de IDs: Separamos la identidad del producto y la variante
      id: product.id, 
      variantId: primaryVariant?.id ?? null, 
      name: product.name,
      slug: primaryVariant?.slug ?? product.slug ?? '',
      type: primaryVariant?.thumbnail ?? '', // Nota: Considerar renombrar este prop en ProductList si espera un 'type' real
      category: product.category,
      selling_price: primaryVariant?.selling_price ?? 0,
      thumbnail: primaryVariant?.thumbnail ?? '',
    };
  });

  return (
    <main>
      <Carousel slides={CAROUSEL_SLIDES} />
      
      {/* 3. Renderizado Condicional: Manejo de estado vacío en caso de fallo del backend */}
      {mappedProducts.length > 0 ? (
        <ProductList products={mappedProducts} />
      ) : (
        <section className="flex h-48 items-center justify-center">
          <p className="text-gray-500 font-medium">El catálogo no está disponible temporalmente.</p>
        </section>
      )}
    </main>
  );
}