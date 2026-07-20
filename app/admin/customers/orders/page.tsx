'use client';

import { useState, useEffect, useCallback, useRef, memo, useMemo } from 'react';
import Link from 'next/link';
import { Clock, CheckCircle2, Undo2, Search, X, Eye, FileText, Plus, ChevronLeft, ChevronRight } from 'lucide-react';

// ============================================================================
// CAPA DE DOMINIO Y TIPOS ESTRICTOS
// ============================================================================

type OrderStatus = 'fullfilled' | 'pending' | 'returned';

type Order = {
  id: string;
  profilepicture: string;
  firstname: string;
  lastname: string;
  email: string;
  created_at: string;
  total: number;
  status: OrderStatus;
  pickup_time: string | null;
};

// ============================================================================
// CONSTANTES Y UTILIDADES GLOBALES O(1)
// ============================================================================

const ITEMS_PER_PAGE = 5;
const SEARCH_DEBOUNCE_DELAY = 400;

const dateFormatter = new Intl.DateTimeFormat('es-DO', {
  year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true
});

const currencyFormatter = new Intl.NumberFormat('es-DO', {
  style: 'currency', currency: 'DOP'
});

function formatDate(dateString: string): string {
  try { return dateFormatter.format(new Date(dateString)); } 
  catch { return dateString; }
}

function formatCurrency(amount: number): string {
  return currencyFormatter.format(amount);
}

const STATUS_UI: Record<OrderStatus, { badge: string; dot: string; label: string; icon: React.ElementType }> = {
  pending: { badge: 'bg-[#fef7e0] text-[#b06000] border-[#feefc3]', dot: 'bg-[#f9ab00]', label: 'Pendiente', icon: Clock },
  fullfilled: { badge: 'bg-[#e6f4ea] text-[#137333] border-[#ceead6]', dot: 'bg-[#1e8e3e]', label: 'Completada', icon: CheckCircle2 },
  returned: { badge: 'bg-[#f1f3f4] text-[#5f6368] border-[#e8eaed]', dot: 'bg-[#9aa0a6]', label: 'Devuelta', icon: Undo2 },
};

// ============================================================================
// MOCK DE BASE DE DATOS (Adaptado para Paginación Clásica)
// ============================================================================

const MOCK_DB: Order[] = Array.from({ length: 34 }).map((_, i) => ({
  id: `ORD-${1000 + i}`,
  profilepicture: `https://i.pravatar.cc/150?u=${i}`,
  firstname: ['Miguel', 'Ana', 'Carlos', 'Wanda', 'Iker', 'Luis', 'María', 'José'][i % 8],
  lastname: ['Méndez', 'Pérez', 'Gómez', 'Rodríguez', 'López', 'Díaz', 'Martínez', 'García'][i % 8],
  email: `usuario${i}@uasd.edu.do`,
  created_at: new Date(Date.now() - Math.random() * 10000000000).toISOString(),
  total: Math.floor(Math.random() * 15000) + 500,
  status: ['fullfilled', 'pending', 'returned'][i % 3] as OrderStatus,
  pickup_time: i % 4 === 0 ? null : new Date(Date.now() + Math.random() * 86400000).toISOString(),
}));

type PaginatedResponse = {
  data: Order[];
  total: number;
};

async function mockApiFetch(search: string, page: number, limit: number): Promise<PaginatedResponse> {
  await new Promise(resolve => setTimeout(resolve, 450)); // Simulación de latencia

  const lowerSearch = search.toLowerCase();
  const filtered = MOCK_DB.filter(o => 
    o.firstname.toLowerCase().includes(lowerSearch) || 
    o.lastname.toLowerCase().includes(lowerSearch) ||
    o.id.toLowerCase().includes(lowerSearch)
  );

  const startIndex = (page - 1) * limit;
  return {
    data: filtered.slice(startIndex, startIndex + limit),
    total: filtered.length
  };
}

// ============================================================================
// CUSTOM HOOK: Lógica de Estado y Paginación Discreta
// ============================================================================

function useOrdersPagination() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estado de Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const latestRequestRef = useRef<number>(0);

  const fetchOrders = useCallback(async (search: string, page: number) => {
    const requestId = Date.now();
    latestRequestRef.current = requestId;

    setIsLoading(true);

    try {
      const { data, total } = await mockApiFetch(search.trim(), page, ITEMS_PER_PAGE);
      
      // Control de concurrencia: Descartar respuestas obsoletas
      if (latestRequestRef.current !== requestId) return;

      setOrders(data);
      setTotalItems(total);
    } finally {
      if (latestRequestRef.current === requestId) {
        setIsLoading(false);
      }
    }
  }, []);

  // Handler de Búsqueda con Debounce
  const handleSearch = useCallback((value: string) => {
    setSearchTerm(value);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    
    searchTimeoutRef.current = setTimeout(() => {
      setCurrentPage(1); // Resetear a la primera página en cada nueva búsqueda
      fetchOrders(value, 1);
    }, SEARCH_DEBOUNCE_DELAY);
  }, [fetchOrders]);

  const clearSearch = useCallback(() => {
    setSearchTerm('');
    setCurrentPage(1);
    fetchOrders('', 1);
  }, [fetchOrders]);

  const handlePageChange = useCallback((newPage: number) => {
    setCurrentPage(newPage);
    fetchOrders(searchTerm, newPage);
  }, [searchTerm, fetchOrders]);

  // Montaje inicial
  useEffect(() => {
    fetchOrders('', 1);
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [fetchOrders]);

  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));

  return { 
    orders, isLoading, searchTerm, handleSearch, clearSearch, 
    currentPage, totalPages, totalItems, handlePageChange 
  };
}

// ============================================================================
// COMPONENTES DE PRESENTACIÓN (Memoizados)
// ============================================================================

const LoadingDots = memo(() => (
  <div className="flex space-x-1.5 justify-center py-10">
    <div className="size-3 bg-[#c4c6d1] rounded-full animate-bounce" />
    <div className="size-3 bg-[#002d62] rounded-full animate-bounce [animation-delay:0.2s]" />
    <div className="size-3 bg-[#c4c6d1] rounded-full animate-bounce [animation-delay:0.4s]" />
  </div>
));
LoadingDots.displayName = 'LoadingDots';

const OrderRow = memo(({ order }: { order: Order }) => {
  const statusConfig = STATUS_UI[order.status];
  const StatusIcon = statusConfig.icon;

  return (
    <tr className="border-b border-[#e0e3e5] bg-white hover:bg-[#f8fafd] transition-colors duration-150">
      <td className="px-6 py-4 font-mono text-[13px] text-[#43474f] font-semibold">{order.id}</td>
      <td className="px-6 py-4">
        <img 
          src={order.profilepicture} 
          alt={`${order.firstname} ${order.lastname}`} 
          className="size-10 rounded-full object-cover border border-[#e0e3e5] bg-[#f2f4f6]" 
          loading="lazy" 
        />
      </td>
      <td className="px-6 py-4">
        <div className="flex flex-col">
          <span className="text-[14px] font-semibold text-[#191c1e] tracking-tight">{order.firstname} {order.lastname}</span>
          <span className="text-[12px] text-[#747781] mt-0.5">{order.email}</span>
        </div>
      </td>
      <td className="px-6 py-4 text-[13px] text-[#43474f] whitespace-nowrap">{formatDate(order.created_at)}</td>
      <td className="px-6 py-4 text-[14px] font-bold text-[#191c1e]">{formatCurrency(order.total)}</td>
      <td className="px-6 py-4">
        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${statusConfig.badge}`}>
          <StatusIcon className="size-3.5" />
          <span className="text-[11px] font-bold uppercase tracking-wider">{statusConfig.label}</span>
        </div>
      </td>
      <td className="px-6 py-4 text-[13px] text-[#43474f] whitespace-nowrap">{order.pickup_time ? formatDate(order.pickup_time) : 'Sin asignar'}</td>
      <td className="px-6 py-4 text-right">
        <Link 
          href={`/admin/orders/${order.id}`}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-[#c4c6d1] rounded-md text-[12px] font-semibold text-[#43474f] hover:bg-[#f2f4f6] transition-colors focus:outline-none focus:ring-2 focus:ring-[#002d62]"
        >
          <Eye className="size-3.5" /> Detalle
        </Link>
      </td>
    </tr>
  );
});
OrderRow.displayName = 'OrderRow';

// ============================================================================
// COMPONENTE PRINCIPAL (PAGE)
// ============================================================================

export default function OrdersPage() {
  const { 
    orders, isLoading, searchTerm, handleSearch, clearSearch, 
    currentPage, totalPages, totalItems, handlePageChange 
  } = useOrdersPagination();

  // Memoización del rango de paginación para evitar recálculos en renders no relacionados
  const paginationRange = useMemo(() => {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }, [totalPages]);

  return (
    <div className="flex flex-col h-full bg-[#f7f9fb]">
      
      <header className="flex items-center justify-between px-8 py-6 bg-white border-b border-[#e0e3e5]">
        <div>
          <h1 className="text-2xl font-serif font-bold text-[#00193c] tracking-tight">Directorio de Órdenes</h1>
          <p className="text-[13px] font-sans text-[#747781] mt-1">Supervisión y trazabilidad del histórico de transacciones operativas.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="inline-flex items-center gap-2 px-4 py-2 bg-[#002d62] rounded-md text-[13px] font-semibold text-white hover:bg-[#00193c] transition-colors focus:outline-none focus:ring-2 focus:ring-[#002d62] focus:ring-offset-2">
            <Plus className="size-4" /> Nueva Orden
          </button>
        </div>
      </header>

      <section className="px-8 py-4 bg-white border-b border-[#e0e3e5]">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[#747781] pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar por ID, nombre o apellido..."
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

      <main className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar bg-white">
        {isLoading ? (
          <LoadingDots />
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-[#747781]">
            <FileText className="size-12 mb-4 text-[#c4c6d1]" />
            <p className="text-[14px] font-semibold text-[#191c1e]">
              {searchTerm ? 'No se encontraron registros coincidentes' : 'El registro de órdenes está vacío'}
            </p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead className="bg-[#f8fafd] sticky top-0 z-10 shadow-[0_1px_0_#e0e3e5]">
              <tr>
                <th className="px-6 py-3.5 text-[11px] font-bold text-[#747781] uppercase tracking-wider">ID</th>
                <th className="px-6 py-3.5 text-[11px] font-bold text-[#747781] uppercase tracking-wider">Perfil</th>
                <th className="px-6 py-3.5 text-[11px] font-bold text-[#747781] uppercase tracking-wider">Identidad Sujeto</th>
                <th className="px-6 py-3.5 text-[11px] font-bold text-[#747781] uppercase tracking-wider">Emisión</th>
                <th className="px-6 py-3.5 text-[11px] font-bold text-[#747781] uppercase tracking-wider">Facturación</th>
                <th className="px-6 py-3.5 text-[11px] font-bold text-[#747781] uppercase tracking-wider">Estado</th>
                <th className="px-6 py-3.5 text-[11px] font-bold text-[#747781] uppercase tracking-wider">Logística</th>
                <th className="px-6 py-3.5 text-[11px] font-bold text-[#747781] uppercase tracking-wider text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e0e3e5]">
              {orders.map(order => <OrderRow key={order.id} order={order} />)}
            </tbody>
          </table>
        )}
      </main>

      {/* Footer / Paginación Numérica Clásica */}
      {!isLoading && orders.length > 0 && (
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
