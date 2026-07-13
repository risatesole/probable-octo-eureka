import Carousel from './ProductCarousel';
import ProductList from './productList';
import type { Product } from '@/entities/product';

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
            image:
              'https://buenoshoes.com.au/cdn/shop/files/34_87c195e7-7d7b-4960-a305-9f40957514cc_1600x.jpg?v=1766539471',
            title: 'Summer Collection',
            description: 'Discover our latest summer styles',
            buttonText: 'Shop Now',
            buttonLink: '/shop/summer',
          },
          {
            id: '2',
            image:
              'https://eu.barkershoes.com/cdn/shop/collections/COLLECTIONPAGE_NEWARRIVALS_600x375_crop_center.jpg?v=1773395804',
            title: 'New Arrivals',
            description: 'Check out what just came in',
            buttonText: 'View All',
            buttonLink: '/shop/new',
          },
          {
            id: '3',
            image:
              'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRtZhExNQLgMRROIMQ7TlfuFu_qcdrzfyvkC3s6FMVJiudyON2lbBjM-E9b&s=10',
            title: 'Special Offer',
            description: 'Get 20% off on selected items',
            buttonText: 'Claim Offer',
            buttonLink: '/shop/sale',
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
