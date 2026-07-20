import Link from 'next/link';
import { notFound } from 'next/navigation';
import ProductList from './productList';
import type { Product } from '@/entities/product';

// ─── Configuración ─────────────────────────────────────────────

// Se unifica el límite de paginación para evitar desincronizaciones entre API y cálculo de offsets.
const PAGE_SIZE = 30; 

interface MappedProduct {
  id: string | number;
  name: string;
  slug: string;
  category: string;
  selling_price: number;
  thumbnail?: string;
}

interface PaginatedResponse {
  data: Product[];
  total: number;
}

// ─── Lógica de Datos (Capa de Servicio) ────────────────────────

async function getProducts(categorySlug: string, offset: number): Promise<PaginatedResponse> {
  // ISR (Incremental Static Regeneration) configurado para balancear frescura y carga en el backend DRF.
  const response = await fetch(
    `${process.env.BACKEND_URL}/api/v1/products/?category=${categorySlug}&limit=${PAGE_SIZE}&offset=${offset}`,
    { next: { revalidate: 3600, tags: ['products', categorySlug] } }
  );

  if (!response.ok) {
    if (response.status === 404) return { data: [], total: 0 };
    throw new Error(`Error obteniendo productos: ${response.statusText}`);
  }

  const json = await response.json();
  return {
    data: json.results || json.data || [],
    // Se elimina el hardcode (2000) priorizando el metadata 'count' estándar de la paginación de DRF.
    total: json.count || 0, 
  };
}

function mapProductsToView(products: Product[]): MappedProduct[] {
  return products.map((product) => {
    const primaryVariant = product.variants?.[0];
    return {
      id: primaryVariant?.id ?? product.id,
      name: product.name,
      slug: primaryVariant?.slug,
      category: product.category,
      selling_price: primaryVariant?.selling_price ?? 0,
      thumbnail: primaryVariant?.thumbnail,
    };
  });
}

// ─── Componentes UI Secundarios ────────────────────────────────

function Pagination({ currentPage, totalPages }: { currentPage: number; totalPages: number }) {
  if (totalPages <= 1) return null;

  const start = Math.max(1, currentPage - 2);
  const end = Math.min(totalPages, currentPage + 2);
  const pageButtons = Array.from({ length: end - start + 1 }, (_, i) => start + i);

  // Clases basadas en el Design System institucional (sharp edges, colores UASD)
  const baseClasses = "rounded-none border px-4 py-2 text-sm font-medium transition-colors duration-200";
  const activeClasses = "bg-[#002d62] text-white border-[#002d62]";
  const inactiveClasses = "bg-white text-[#43474f] border-[#e2e8f0] hover:border-[#115cb9] hover:text-[#115cb9]";

  return (
    <nav className="mt-16 flex items-center justify-center gap-2" aria-label="Paginación de catálogo">
      {currentPage > 1 && (
        <Link href={`?page=${currentPage - 1}`} className={`${baseClasses} ${inactiveClasses}`}>
          Anterior
        </Link>
      )}

      {pageButtons.map((p) => (
        <Link
          key={p}
          href={`?page=${p}`}
          className={`${baseClasses} ${p === currentPage ? activeClasses : inactiveClasses}`}
          aria-current={p === currentPage ? 'page' : undefined}
        >
          {p}
        </Link>
      ))}

      {currentPage < totalPages && (
        <Link href={`?page=${currentPage + 1}`} className={`${baseClasses} ${inactiveClasses}`}>
          Siguiente
        </Link>
      )}
    </nav>
  );
}

// ─── Componente Principal (Server Component) ───────────────────

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ categoryname: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  // Resolución limpia de promesas en Next.js App Router
  const { categoryname } = await params;
  const { page: pageParam } = await searchParams;

  const currentPage = Math.max(1, parseInt(pageParam || '1', 10));
  const offset = (currentPage - 1) * PAGE_SIZE;

  const { data: products, total } = await getProducts(categoryname, offset);

  // Fallback 404 si la categoría no existe o está vacía en la página inicial
  /*
  if (!products.length && currentPage === 1) {
    notFound();
  }
  */

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const mappedProducts = mapProductsToView(products);

  return (
    <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <header className="mb-8 border-b border-[#e2e8f0] pb-4">
        <h1 className="font-serif text-3xl font-bold tracking-tight text-[#002d62] capitalize">
          {categoryname.replace(/-/g, ' ')}
        </h1>
      </header>

      <ProductList products={mappedProducts} />

      <Pagination currentPage={currentPage} totalPages={totalPages} />
    </main>
  );
}