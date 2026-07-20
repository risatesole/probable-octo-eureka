'use client';

import { useState, useEffect, useCallback, useRef, memo, useMemo } from 'react';
import Link from 'next/link';
import { Search, X, Edit2, Package, Plus, ChevronLeft, ChevronRight } from 'lucide-react';

// ============================================================================
// CAPA DE DOMINIO Y TIPOS ESTRICTOS
// ============================================================================

export type ImageContent = {
  type: string;
  url: string;
};

export type NormalProductVariant = {
  id: number;
  name: string;
  description: string;
  thumbnail: string;
  variantnumber: number;
  sku: string;
  slug: string;
  images: ImageContent[];
  selling_price: number;
  tax_rate: number;
  created_at: string;
  updated_at: string;
};

export type ProductCategory = 'electronics' | 'clothing' | 'books' | 'home' | 'toys' | 'food' | 'other';

export type Product = {
  id: number;
  name: string;
  category: ProductCategory;
  thumbnail: string;
  slug: string;
  tags: string[];
  variants: NormalProductVariant[];
  product_type: 'normal';
  status?: boolean;
  brand?: string;
};

// ============================================================================
// CONSTANTES Y UTILIDADES GLOBALES (O(1) Memory Allocation)
// ============================================================================

const ITEMS_PER_PAGE = 5;
const SEARCH_DEBOUNCE_DELAY = 400;

const currencyFormatter = new Intl.NumberFormat('es-DO', {
  style: 'currency', currency: 'DOP'
});

function formatCurrency(amount: number): string {
  return currencyFormatter.format(amount);
}

const CATEGORY_LABELS: Record<ProductCategory, string> = {
  electronics: 'Electrónica',
  clothing: 'Ropa y Calzado',
  books: 'Libros y Textos',
  home: 'Hogar y Oficina',
  toys: 'Juguetería',
  food: 'Alimentos',
  other: 'Otros'
};

// ============================================================================
// MOCK DE BASE DE DATOS (Simulación de Entorno sin Conexión)
// ============================================================================

const MOCK_DB: Product[] = Array.from({ length: 32 }).map((_, i) => ({
  id: 100 + i,
  name: `Producto Institucional UASD ${i + 1}`,
  category: (['electronics', 'clothing', 'books', 'home', 'toys', 'food', 'other'][i % 7]) as ProductCategory,
  thumbnail: `https://picsum.photos/seed/${i + 10}/150/150`,
  slug: `producto-institucional-uasd-${i + 1}`,
  tags: ['UASD', 'Académico', 'Oficial', 'Suministro'].slice(0, (i % 3) + 1),
  product_type: 'normal',
  status: i % 5 !== 0,
  brand: ['UASD Store', 'Editorial Universitaria', 'Proveedor Externo'][i % 3],
  variants: [
    {
      id: 1000 + i,
      name: `Variante Estándar ${i + 1}`,
      description: `Descripción detallada para el producto institucional ${i + 1}`,
      thumbnail: `https://picsum.photos/seed/${i + 10}/150/150`,
      variantnumber: 1,
      sku: `SKU-UASD-${2000 + i}`,
      slug: `variante-estandar-${i + 1}`,
      images: [
        { type: 'HERO', url: `https://picsum.photos/seed/${i + 10}/150/150` }
      ],
      selling_price: Math.floor(Math.random() * 4500) + 150,
      tax_rate: 0.18,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
  ]
}));

type PaginatedResponse = {
  data: Product[];
  total: number;
};

async function mockApiFetch(search: string, page: number, limit: number): Promise<PaginatedResponse> {
  await new Promise(resolve => setTimeout(resolve, 350)); // Simulación de latencia

  const lowerSearch = search.toLowerCase();
  const filtered = MOCK_DB.filter(p => 
    p.name.toLowerCase().includes(lowerSearch) || 
    p.slug.toLowerCase().includes(lowerSearch) ||
    p.tags.some(t => t.toLowerCase().includes(lowerSearch)) ||
    p.id.toString().includes(lowerSearch)
  );

  const startIndex = (page - 1) * limit;
  return {
    data: filtered.slice(startIndex, startIndex + limit),
    total: filtered.length
  };
}

// ============================================================================
// CUSTOM HOOK: Lógica de Estado y Paginación Numérica
// ============================================================================

function useProductsPagination() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const latestRequestRef = useRef<number>(0);

  const fetchProducts = useCallback(async (search: string, page: number) => {
    const requestId = Date.now();
    latestRequestRef.current = requestId;

    setIsLoading(true);

    try {
      const { data, total } = await mockApiFetch(search.trim(), page, ITEMS_PER_PAGE);
      
      if (latestRequestRef.current !== requestId) return;

      setProducts(data);
      setTotalItems(total);
    } finally {
      if (latestRequestRef.current === requestId) {
        setIsLoading(false);
      }
    }
  }, []);

  const handleSearch = useCallback((value: string) => {
    setSearchTerm(value);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    
    searchTimeoutRef.current = setTimeout(() => {
      setCurrentPage(1);
      fetchProducts(value, 1);
    }, SEARCH_DEBOUNCE_DELAY);
  }, [fetchProducts]);

  const clearSearch = useCallback(() => {
    setSearchTerm('');
    setCurrentPage(1);
    fetchProducts('', 1);
  }, [fetchProducts]);

  const handlePageChange = useCallback((newPage: number) => {
    setCurrentPage(newPage);
    fetchProducts(searchTerm, newPage);
  }, [searchTerm, fetchProducts]);

  useEffect(() => {
    fetchProducts('', 1);
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [fetchProducts]);

  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));

  return { 
    products, isLoading, searchTerm, handleSearch, clearSearch, 
    currentPage, totalPages, totalItems, handlePageChange 
  };
}

// ============================================================================
// COMPONENTES DE PRESENTACIÓN (Memoizados)
// ============================================================================

const LoadingDots = memo(() => (
  <div className="flex space-x-1.5 justify-center py-12">
    <div className="size-3 bg-[#c4c6d1] rounded-full animate-bounce" />
    <div className="size-3 bg-[#002d62] rounded-full animate-bounce [animation-delay:0.2s]" />
    <div className="size-3 bg-[#c4c6d1] rounded-full animate-bounce [animation-delay:0.4s]" />
  </div>
));
LoadingDots.displayName = 'LoadingDots';

const ProductRow = memo(({ product }: { product: Product }) => {
  const mainVariant = product.variants[0];
  const price = mainVariant ? mainVariant.selling_price : 0;
  const isAvailable = product.status ?? true;

  return (
    <tr className="border-b border-[#e0e3e5] bg-white hover:bg-[#f8fafd] transition-colors duration-150">
      <td className="px-6 py-4 font-mono text-[13px] text-[#43474f] font-semibold">#{product.id}</td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <img 
            src={product.thumbnail} 
            alt={product.name} 
            className="size-10 rounded-md object-cover border border-[#e0e3e5] bg-[#f2f4f6]" 
            loading="lazy" 
          />
          <div className="flex flex-col max-w-xs">
            <span className="text-[14px] font-semibold text-[#191c1e] tracking-tight truncate">{product.name}</span>
            <span className="text-[12px] text-[#747781] mt-0.5 font-mono truncate">{mainVariant?.sku || product.slug}</span>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="text-[13px] font-medium text-[#43474f] bg-[#f2f4f6] px-2.5 py-1 rounded-md border border-[#e0e3e5]">
          {CATEGORY_LABELS[product.category] || product.category}
        </span>
      </td>
      <td className="px-6 py-4 text-[13px] text-[#43474f] whitespace-nowrap">{product.brand || '—'}</td>
      <td className="px-6 py-4 text-[14px] font-bold text-[#191c1e] whitespace-nowrap">{formatCurrency(price)}</td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${
          isAvailable ? 'bg-[#e6f4ea] text-[#137333] border-[#ceead6]' : 'bg-[#ffdad6] text-[#93000a] border-[#ffb4ab]'
        }`}>
          <span className={`size-1.5 rounded-full ${isAvailable ? 'bg-[#1e8e3e]' : 'bg-[#ba1a1a]'}`} aria-hidden="true" />
          <span className="text-[11px] font-bold uppercase tracking-wider">{isAvailable ? 'Disponible' : 'Agotado'}</span>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex flex-wrap gap-1 max-w-[150px]">
          {product.tags.slice(0, 2).map((tag, idx) => (
            <span key={idx} className="text-[11px] font-medium text-[#43474f] bg-[#f2f4f6] px-2 py-0.5 rounded border border-[#e0e3e5]">
              {tag}
            </span>
          ))}
          {product.tags.length > 2 && (
            <span className="text-[11px] font-medium text-[#747781]">+{product.tags.length - 2}</span>
          )}
        </div>
      </td>
      <td className="px-6 py-4 text-right">
        <Link 
          href={`/admin/products/edit/${product.id}`}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-[#c4c6d1] rounded-md text-[12px] font-semibold text-[#43474f] hover:bg-[#f2f4f6] transition-colors focus:outline-none focus:ring-2 focus:ring-[#002d62]"
        >
          <Edit2 className="size-3.5" /> Editar
        </Link>
      </td>
    </tr>
  );
});
ProductRow.displayName = 'ProductRow';

// ============================================================================
// COMPONENTE PRINCIPAL (PAGE)
// ============================================================================

export default function ProductsPage() {
  const { 
    products, isLoading, searchTerm, handleSearch, clearSearch, 
    currentPage, totalPages, totalItems, handlePageChange 
  } = useProductsPagination();

  const paginationRange = useMemo(() => {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }, [totalPages]);

  return (
    <div className="flex flex-col h-full bg-[#f7f9fb]">
      
      {/* Header Institucional */}
      <header className="flex items-center justify-between px-8 py-6 bg-white border-b border-[#e0e3e5]">
        <div>
          <h1 className="text-2xl font-serif font-bold text-[#00193c] tracking-tight">Catálogo de Productos</h1>
          <p className="text-[13px] font-sans text-[#747781] mt-1">Administración de inventario, variantes y asignación de precios.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/products/create"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#002d62] rounded-md text-[13px] font-semibold text-white hover:bg-[#00193c] transition-colors focus:outline-none focus:ring-2 focus:ring-[#002d62] focus:ring-offset-2"
          >
            <Plus className="size-4" /> Nuevo Producto
          </Link>
        </div>
      </header>

      {/* Toolbar / Filtros */}
      <section className="px-8 py-4 bg-white border-b border-[#e0e3e5]">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[#747781] pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar por ID, nombre, SKU o etiquetas..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 bg-[#f7f9fb] border border-[#c4c6d1] rounded-md text-[13px] font-medium text-[#191c1e] placeholder:text-[#747781] transition-all focus:outline-none focus:border-[#002d62] focus:ring-1 focus:ring-[#002d62] focus:bg-white"
          />
          {searchTerm && (
            <button onClick={clearSearch} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#c4c6d1] hover:text-[#747781] transition-colors focus:outline-none">
              <X className="size-4" />
            </button>
          )}
        </div>
      </section>

      {/* Main Content */}
      <main className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar bg-white">
        {isLoading ? (
          <LoadingDots />
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-[#747781]">
            <Package className="size-12 mb-4 text-[#c4c6d1]" />
            <p className="text-[14px] font-semibold text-[#191c1e]">
              {searchTerm ? 'No se encontraron productos coincidentes' : 'El catálogo de productos está vacío'}
            </p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead className="bg-[#f8fafd] sticky top-0 z-10 shadow-[0_1px_0_#e0e3e5]">
              <tr>
                <th className="px-6 py-3.5 text-[11px] font-bold text-[#747781] uppercase tracking-wider">ID</th>
                <th className="px-6 py-3.5 text-[11px] font-bold text-[#747781] uppercase tracking-wider">Producto / Variante</th>
                <th className="px-6 py-3.5 text-[11px] font-bold text-[#747781] uppercase tracking-wider">Categoría</th>
                <th className="px-6 py-3.5 text-[11px] font-bold text-[#747781] uppercase tracking-wider">Marca</th>
                <th className="px-6 py-3.5 text-[11px] font-bold text-[#747781] uppercase tracking-wider">Precio</th>
                <th className="px-6 py-3.5 text-[11px] font-bold text-[#747781] uppercase tracking-wider">Disponibilidad</th>
                <th className="px-6 py-3.5 text-[11px] font-bold text-[#747781] uppercase tracking-wider">Etiquetas</th>
                <th className="px-6 py-3.5 text-[11px] font-bold text-[#747781] uppercase tracking-wider text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e0e3e5]">
              {products.map(product => <ProductRow key={product.id} product={product} />)}
            </tbody>
          </table>
        )}
      </main>

      {/* Footer / Paginación Numérica Clásica */}
      {!isLoading && products.length > 0 && (
        <footer className="flex items-center justify-between px-8 py-4 bg-white border-t border-[#e0e3e5]">
          <div className="text-[13px] font-medium text-[#747781]">
            Mostrando <span className="font-bold text-[#191c1e]">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> a{' '}
            <span className="font-bold text-[#191c1e]">
              {Math.min(currentPage * ITEMS_PER_PAGE, totalItems)}
            </span>{' '}
            de <span className="font-bold text-[#191c1e]">{totalItems}</span> registros
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="inline-flex items-center justify-center size-8 rounded-md border border-[#c4c6d1] text-[#43474f] hover:bg-[#f2f4f6] disabled:opacity-40 disabled:pointer-events-none transition-colors"
              aria-label="Página anterior"
            >
              <ChevronLeft className="size-4" />
            </button>
            
            <div className="flex items-center gap-1 mx-2">
              {paginationRange.map(page => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`inline-flex items-center justify-center size-8 rounded-md text-[13px] font-semibold transition-all ${
                    currentPage === page 
                      ? 'bg-[#002d62] text-white border border-[#002d62] shadow-sm' 
                      : 'text-[#43474f] hover:bg-[#f2f4f6] border border-transparent hover:border-[#c4c6d1]'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>

            <button
              onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="inline-flex items-center justify-center size-8 rounded-md border border-[#c4c6d1] text-[#43474f] hover:bg-[#f2f4f6] disabled:opacity-40 disabled:pointer-events-none transition-colors"
              aria-label="Página siguiente"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </footer>
      )}
    </div>
  );
}