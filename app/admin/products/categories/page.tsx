'use client';

import { useState, useEffect, useCallback, useRef, memo, useMemo } from 'react';
import Link from 'next/link';
import { Search, X, Edit2, FolderOpen, Plus, ChevronLeft, ChevronRight } from 'lucide-react';

// ============================================================================
// CAPA DE DOMINIO Y TIPOS ESTRICTOS
// ============================================================================

export type Category = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  status: boolean;
  created_at: string;
};

// ============================================================================
// CONSTANTES Y UTILIDADES GLOBALES O(1)
// ============================================================================

const ITEMS_PER_PAGE = 5;
const SEARCH_DEBOUNCE_DELAY = 400;

// Instancia global para evitar overhead de Garbage Collection en el ciclo de render
const dateFormatter = new Intl.DateTimeFormat('es-DO', {
  year: 'numeric', month: 'short', day: 'numeric'
});

function formatDate(dateString: string): string {
  try { return dateFormatter.format(new Date(dateString)); } 
  catch { return dateString; }
}

// ============================================================================
// MOCK DE BASE DE DATOS (Simulación Paginada Server-Side)
// ============================================================================

const MOCK_DB: Category[] = [
  { id: 1, name: 'Libros de Texto', slug: 'libros-texto', description: 'Material bibliográfico oficial y recursos académicos.', image: 'https://picsum.photos/seed/cat1/150/150', status: true, created_at: '2025-01-15T10:00:00Z' },
  { id: 2, name: 'Uniformes', slug: 'uniformes', description: 'Indumentaria institucional para estudiantes y docentes.', image: 'https://picsum.photos/seed/cat2/150/150', status: true, created_at: '2025-01-16T11:30:00Z' },
  { id: 3, name: 'Material Gastable', slug: 'material-gastable', description: 'Suministros de oficina y papelería general.', image: 'https://picsum.photos/seed/cat3/150/150', status: true, created_at: '2025-02-01T09:15:00Z' },
  { id: 4, name: 'Equipos de Laboratorio', slug: 'equipos-laboratorio', description: 'Instrumental científico y de investigación.', image: null, status: true, created_at: '2025-02-10T14:20:00Z' },
  { id: 5, name: 'Electrónica', slug: 'electronica', description: 'Dispositivos, calculadoras y componentes informáticos.', image: 'https://picsum.photos/seed/cat5/150/150', status: true, created_at: '2025-03-05T08:45:00Z' },
  { id: 6, name: 'Souvenirs Institucionales', slug: 'souvenirs', description: 'Artículos promocionales y regalos oficiales.', image: 'https://picsum.photos/seed/cat6/150/150', status: true, created_at: '2025-04-12T16:10:00Z' },
  { id: 7, name: 'Alimentos y Bebidas', slug: 'alimentos-bebidas', description: 'Snacks y bebidas no perecederas.', image: 'https://picsum.photos/seed/cat7/150/150', status: false, created_at: '2025-05-20T10:05:00Z' },
  { id: 8, name: 'Mobiliario Estudiantil', slug: 'mobiliario', description: 'Sillas, pupitres y tableros de dibujo.', image: null, status: true, created_at: '2025-06-11T13:40:00Z' },
];

type PaginatedResponse = {
  data: Category[];
  total: number;
};

async function mockApiFetch(search: string, page: number, limit: number): Promise<PaginatedResponse> {
  await new Promise(resolve => setTimeout(resolve, 300)); // Latencia inyectada

  const lowerSearch = search.toLowerCase();
  const filtered = MOCK_DB.filter(c => 
    c.name.toLowerCase().includes(lowerSearch) || 
    c.slug.toLowerCase().includes(lowerSearch) ||
    (c.description && c.description.toLowerCase().includes(lowerSearch))
  );

  const startIndex = (page - 1) * limit;
  return {
    data: filtered.slice(startIndex, startIndex + limit),
    total: filtered.length
  };
}

// ============================================================================
// CUSTOM HOOK: Gestión de Estado y Paginación
// ============================================================================

function useCategoriesPagination() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const latestRequestRef = useRef<number>(0);

  const fetchCategories = useCallback(async (search: string, page: number) => {
    const requestId = Date.now();
    latestRequestRef.current = requestId;

    setIsLoading(true);

    try {
      const { data, total } = await mockApiFetch(search.trim(), page, ITEMS_PER_PAGE);
      
      // Thread-safety simulado: Descarta promesas resueltas a destiempo
      if (latestRequestRef.current !== requestId) return;

      setCategories(data);
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
      fetchCategories(value, 1);
    }, SEARCH_DEBOUNCE_DELAY);
  }, [fetchCategories]);

  const clearSearch = useCallback(() => {
    setSearchTerm('');
    setCurrentPage(1);
    fetchCategories('', 1);
  }, [fetchCategories]);

  const handlePageChange = useCallback((newPage: number) => {
    setCurrentPage(newPage);
    fetchCategories(searchTerm, newPage);
  }, [searchTerm, fetchCategories]);

  useEffect(() => {
    fetchCategories('', 1);
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [fetchCategories]);

  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));

  return { 
    categories, isLoading, searchTerm, handleSearch, clearSearch, 
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

const CategoryRow = memo(({ category }: { category: Category }) => {
  return (
    <tr className="border-b border-[#e0e3e5] bg-white hover:bg-[#f8fafd] transition-colors duration-150">
      <td className="px-6 py-4 font-mono text-[13px] text-[#43474f] font-semibold">{category.id}</td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-md border border-[#e0e3e5] bg-[#f2f4f6] flex items-center justify-center overflow-hidden shrink-0">
            {category.image ? (
              <img src={category.image} alt={category.name} className="size-full object-cover" loading="lazy" />
            ) : (
              <FolderOpen className="size-4 text-[#c4c6d1]" />
            )}
          </div>
          <div className="flex flex-col">
            <span className="text-[14px] font-semibold text-[#191c1e] tracking-tight">{category.name}</span>
            <span className="text-[12px] text-[#747781] mt-0.5 font-mono">/{category.slug}</span>
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <p className="text-[13px] text-[#43474f] truncate max-w-xs">
          {category.description || '—'}
        </p>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${
          category.status ? 'bg-[#e6f4ea] text-[#137333] border-[#ceead6]' : 'bg-[#f1f3f4] text-[#5f6368] border-[#e8eaed]'
        }`}>
          <span className={`size-1.5 rounded-full ${category.status ? 'bg-[#1e8e3e]' : 'bg-[#9aa0a6]'}`} aria-hidden="true" />
          <span className="text-[11px] font-bold uppercase tracking-wider">{category.status ? 'Activa' : 'Inactiva'}</span>
        </div>
      </td>
      <td className="px-6 py-4 text-[13px] text-[#43474f] whitespace-nowrap">
        {formatDate(category.created_at)}
      </td>
      <td className="px-6 py-4 text-right">
        <Link 
          href={`/admin/products/categories/edit/${category.id}`}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-[#c4c6d1] rounded-md text-[12px] font-semibold text-[#43474f] hover:bg-[#f2f4f6] transition-colors focus:outline-none focus:ring-2 focus:ring-[#002d62]"
        >
          <Edit2 className="size-3.5" /> Editar
        </Link>
      </td>
    </tr>
  );
});
CategoryRow.displayName = 'CategoryRow';

// ============================================================================
// COMPONENTE PRINCIPAL (PAGE)
// ============================================================================

export default function CategoriesPage() {
  const { 
    categories, isLoading, searchTerm, handleSearch, clearSearch, 
    currentPage, totalPages, totalItems, handlePageChange 
  } = useCategoriesPagination();

  const paginationRange = useMemo(() => {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }, [totalPages]);

  return (
    <div className="flex flex-col h-full bg-[#f7f9fb]">
      
      {/* Header Institucional */}
      <header className="flex items-center justify-between px-8 py-6 bg-white border-b border-[#e0e3e5]">
        <div>
          <h1 className="text-2xl font-serif font-bold text-[#00193c] tracking-tight">Jerarquía de Categorías</h1>
          <p className="text-[13px] font-sans text-[#747781] mt-1">Estructuración y segmentación del inventario general.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/products/categories/create"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#002d62] rounded-md text-[13px] font-semibold text-white hover:bg-[#00193c] transition-colors focus:outline-none focus:ring-2 focus:ring-[#002d62] focus:ring-offset-2"
          >
            <Plus className="size-4" /> Nueva Categoría
          </Link>
        </div>
      </header>

      {/* Toolbar / Filtros */}
      <section className="px-8 py-4 bg-white border-b border-[#e0e3e5]">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[#747781] pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar por nombre, slug o descripción..."
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
        ) : categories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-[#747781]">
            <FolderOpen className="size-12 mb-4 text-[#c4c6d1]" />
            <p className="text-[14px] font-semibold text-[#191c1e]">
              {searchTerm ? 'No se encontraron categorías coincidentes' : 'La estructura de categorías está vacía'}
            </p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead className="bg-[#f8fafd] sticky top-0 z-10 shadow-[0_1px_0_#e0e3e5]">
              <tr>
                <th className="px-6 py-3.5 text-[11px] font-bold text-[#747781] uppercase tracking-wider w-20">ID</th>
                <th className="px-6 py-3.5 text-[11px] font-bold text-[#747781] uppercase tracking-wider">Categoría / Slug</th>
                <th className="px-6 py-3.5 text-[11px] font-bold text-[#747781] uppercase tracking-wider">Descripción</th>
                <th className="px-6 py-3.5 text-[11px] font-bold text-[#747781] uppercase tracking-wider">Estado</th>
                <th className="px-6 py-3.5 text-[11px] font-bold text-[#747781] uppercase tracking-wider">Creación</th>
                <th className="px-6 py-3.5 text-[11px] font-bold text-[#747781] uppercase tracking-wider text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e0e3e5]">
              {categories.map(category => <CategoryRow key={category.id} category={category} />)}
            </tbody>
          </table>
        )}
      </main>

      {/* Footer / Paginación Numérica Clásica */}
      {!isLoading && categories.length > 0 && (
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