import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PackageSearch, ArrowLeft } from 'lucide-react';
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

  // Clases basadas en el Design System institucional (sharp edges, colores de autoridad)
  const baseClasses = "rounded-none border px-4 py-2 text-[13px] font-semibold transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#002d62]";
  const activeClasses = "bg-[#002d62] text-white border-[#002d62]";
  const inactiveClasses = "bg-white text-[#43474f] border-[#c4c6d1] hover:bg-[#f2f4f6]";

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
  // Resolución asíncrona de parámetros para Next.js 15+ (App Router)
  const { categoryname } = await params;
  const { page: pageParam } = await searchParams;

  const currentPage = Math.max(1, parseInt(pageParam || '1', 10));
  const offset = (currentPage - 1) * PAGE_SIZE;

  const { data: products, total } = await getProducts(categoryname, offset);

  // Renderizado optimizado del estado vacío (Empty State)
  if (!products.length && currentPage === 1) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-center py-24 px-4 text-center bg-white border border-[#e0e3e5] rounded-none shadow-sm min-h-[400px]">
          <PackageSearch className="size-12 mb-4 text-[#c4c6d1]" strokeWidth={1.5} />
          <h2 className="text-[15px] font-sans font-bold text-[#191c1e] tracking-tight">
            Categoría sin inventario
          </h2>
          <p className="text-[13px] text-[#747781] mt-1.5 max-w-sm">
            No se encontraron artículos disponibles bajo la clasificación solicitada o el identificador no existe en el catálogo.
          </p>
          <Link
            href="/categories/"
            className="mt-6 inline-flex items-center gap-2 px-4 py-2 border border-[#c4c6d1] rounded-none text-[13px] font-semibold text-[#43474f] hover:bg-[#f2f4f6] transition-colors focus:outline-none focus:ring-2 focus:ring-[#002d62]"
          >
            <ArrowLeft className="size-4" />
            Retornar al catálogo central
          </Link>
        </div>
      </main>
    );
  }

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