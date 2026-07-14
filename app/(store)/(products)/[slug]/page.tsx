import ProductPage from './product-page-client';
import type { Product, NormalProductVariant } from '@/entities/product';

interface ApiImage {
  type: string;
  url: string;
}

interface ApiVariant {
  id: number;
  name: string;
  description: string;
  variantnumber: number;
  thumbnail: string;
  selling_price: number;
  tax_rate: number;
  sku: string;
  slug: string;
  images: ApiImage[];
}

interface ApiProduct {
  id: number;
  name: string;
  category: string;
  product_type: string;
  thumbnail: string;
  slug: string;
  type: string;
  variants: ApiVariant[];
}

interface ApiResponse {
  data: ApiProduct[];
  meta: {
    timestamp: string;
  };
}

// Transform API variant to entity variant
function transformVariant(apiVariant: ApiVariant): NormalProductVariant {
  return {
    id: apiVariant.id,
    name: apiVariant.name,
    description: apiVariant.description,
    thumbnail: apiVariant.thumbnail || '',
    variantnumber: apiVariant.variantnumber,
    sku: apiVariant.sku,
    slug: apiVariant.slug,
    images: apiVariant.images,
    selling_price: apiVariant.selling_price,
    tax_rate: apiVariant.tax_rate,
    created_at: new Date(),
    updated_at: new Date(),
  };
}

function transformProduct(apiProduct: ApiProduct): Product {
  return {
    id: apiProduct.id,
    name: apiProduct.name,
    category: (apiProduct.category.toLowerCase() as any) || 'other',
    thumbnail: apiProduct.thumbnail,
    slug: apiProduct.slug,
    tags: [],
    variants: apiProduct.variants.map(transformVariant),
    product_type: 'normal',
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  try {
    const response = await fetch(
      `${process.env.BACKEND_URL}/api/v1/products/?variantslug=${slug}`
    ).then(res => res.json() as Promise<ApiResponse>);

    const apiProduct = response.data[0];
    if (!apiProduct) {
      return <div style={{ padding: '2rem' }}>Product not found</div>;
    }

    const product = transformProduct(apiProduct);
    const variant = product.variants.find(v => v.slug === slug);

    if (!variant) {
      return <div style={{ padding: '2rem' }}>Variant not found</div>;
    }

    return <ProductPage initialProduct={product} initialVariant={variant} />;
  } catch (error) {
    return <div style={{ padding: '2rem' }}>Failed to load product</div>;
  }
}
