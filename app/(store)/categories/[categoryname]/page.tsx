// app/(store)/categorias/[categoryname]/page.tsx
import { notFound } from 'next/navigation';
import ProductList from './productList'; // Asumiendo tu componente existente

// ─── Capa de Validación (Data Fetching) ─────────────────────────

async function getCategory(slug: string) {
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000';
  // Endpoint dedicado en DRF para buscar una categoría por slug (DetailView)
  const res = await fetch(`${backendUrl}/api/v1/products/categories/${slug}/`, {
    next: { revalidate: 3600, tags: [`category-${slug}`] },
  });

  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error(`HTTP Error: ${res.status}`);
  }
  return res.json();
}

async function getProductsByCategory(slug: string, offset: number) {
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000';
  const url = new URL(`${backendUrl}/api/v1/products/`);
  url.searchParams.set('category', slug);
  // ... resto de parámetros de paginación (limit, offset)

  const res = await fetch(url.toString(), {
    next: { revalidate: 3600, tags: ['products', slug] },
  });

  if (!res.ok) return { data: [], total: 0 };
  const json = await res.json();
  return { data: json.results || json.data || [], total: json.count || 0 };
}

// ─── Sincronización Estricta (Build-Time / ISR) ─────────────────

// Esto le dice a Next.js exactamente qué categorías existen en el backend.
// Pre-renderiza las rutas válidas y optimiza el SEO.
export async function generateStaticParams() {
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000';
  const res = await fetch(`${backendUrl}/api/v1/products/categories/`);
  
  if (!res.ok) return [];
  
  const json = await res.json();
  const categories = Array.isArray(json.data) ? json.data : Object.values(json.data ?? {});
  
  return categories.map((cat: any) => ({
    categoryname: cat.slug,
  }));
}

// ─── Server Component ──────────────────────────────────────────

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ categoryname: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const [{ categoryname }, { page }] = await Promise.all([params, searchParams]);
  const decodedSlug = decodeURIComponent(categoryname).toLowerCase(); // Normalización estricta

  // 1. Validar la existencia de la categoría independientemente de los productos
  const category = await getCategory(decodedSlug);
  if (!category) {
    notFound(); // Ahora el 404 SÓLO ocurre si el slug es inválido en la BD
  }

  // 2. Obtener productos
  const currentPage = Math.max(1, parseInt(page || '1', 10));
  const offset = (currentPage - 1) * 30;
  const { data: products, total } = await getProductsByCategory(decodedSlug, offset);

  return (
    <main className="mx-auto max-w-7xl px-4 py-12">
      <header className="mb-10 border-b pb-6">
        <h1 className="font-serif text-3xl font-bold capitalize text-[#002d62]">
          {category.label} {/* Usamos el nombre real de la BD, no el slug modificado */}
        </h1>
      </header>

      {/* Manejo de Empty State correcto */}
      {products.length === 0 ? (
        <div className="flex h-64 items-center justify-center rounded-md border border-dashed border-gray-300 bg-gray-50">
          <p className="text-gray-500">No hay productos disponibles en esta categoría actualmente.</p>
        </div>
      ) : (
        <ProductList products={products} />
      )}
    </main>
  );
}