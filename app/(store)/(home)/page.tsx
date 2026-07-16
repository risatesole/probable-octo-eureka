import Carousel from './ProductCarousel';
import ProductList from './productList';
import type { Product } from '@/entities/product';

// Importación estática obligatoria en Next.js para assets locales fuera de /public
import calculadorasImg from './img/calculadoras.png';
import manualesLab from './img/manualeslab.png';
import econoDigital from './img/econodigital.jpeg';

async function getProducts(): Promise<Product[]> {
  const response = await fetch(`${process.env.BACKEND_URL}/api/v1/products/`);

  if (!response.ok) {
    throw new Error('Failed to fetch products');
  }

  const json = await response.json();
  return json.data;
}

export default async function Page() {
  const products = await getProducts();

  return (
    <main>
      <Carousel
        slides={[
          {
            id: '1',
            image:calculadorasImg.src,
            title: 'La calculadora que necesitas para tus calculos',
            description: 'Descubre la que va con tu estilo',
            buttonText: 'Comprar Ahora',
            buttonLink: '#',
          },
          {
            id: '2',
            image:manualesLab.src,
            title: 'Ya Disponibles',
            description: 'No pierdas tiempo ahora es más rápido',
            buttonText: 'Ver Todos',
            buttonLink: '#',
          },
          {
            id: '3',
            image:econoDigital.src,
            title: 'BuyFast',
            description: 'El mismo ecónomato, pero digital',
            buttonText: 'Ver todas las categorias',
            buttonLink: '#',
          },
        ]}
      />

      <ProductList
        products={products.map(product => ({
          id: product.variants?.[0]?.id, // warning duck code, this is sending the product variant id not the variant id so the component things is using the prduct id when is using in reality is the product variant id TODO: fix the component
          name: product.name,
          slug: product.variants?.[0]?.slug,
          type: product.variants?.[0]?.thumbnail,
          category: product.category,
          selling_price: product.variants?.[0]?.selling_price ?? 0,
          thumbnail: product.variants?.[0]?.thumbnail,
        }))}
      />
    </main>
  );
}
