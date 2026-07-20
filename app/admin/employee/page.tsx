'use client';

import { useState, useEffect, useCallback, useRef, memo, useMemo } from 'react';
import Link from 'next/link';
import { Search, X, Edit2, FileText, UserPlus, ShieldAlert, ChevronLeft, ChevronRight } from 'lucide-react';

// ============================================================================
// CAPA DE DOMINIO Y TIPOS ESTRICTOS
// ============================================================================

type EmployeeStatus = 'active' | 'inactive' | 'pending';

type Employee = {
  id: string;
  profilepicture: string;
  firstname: string;
  lastname: string;
  email: string;
  role: string;
  status: EmployeeStatus;
};

// ============================================================================
// CONSTANTES Y UTILIDADES GLOBALES (O(1) Memory Allocation)
// ============================================================================

const ITEMS_PER_PAGE = 5;
const SEARCH_DEBOUNCE_DELAY = 400;

const STATUS_UI: Record<EmployeeStatus, { badge: string; dot: string; label: string }> = {
  active: { badge: 'bg-[#e6f4ea] text-[#137333] border-[#ceead6]', dot: 'bg-[#1e8e3e]', label: 'Activo' },
  inactive: { badge: 'bg-[#f1f3f4] text-[#5f6368] border-[#e8eaed]', dot: 'bg-[#9aa0a6]', label: 'Inactivo' },
  pending: { badge: 'bg-[#fef7e0] text-[#b06000] border-[#feefc3]', dot: 'bg-[#f9ab00]', label: 'Pendiente' },
};

// ============================================================================
// MOCK DE BASE DE DATOS (Simulación de Entorno sin Conexión)
// ============================================================================

const MOCK_DB: Employee[] = Array.from({ length: 38 }).map((_, i) => ({
  id: `EMP-${1000 + i}`,
  profilepicture: `https://i.pravatar.cc/150?u=${i + 50}`, // Offset para avatares distintos
  firstname: ['Miguel', 'Ana', 'Carlos', 'Wanda', 'Iker', 'Luis', 'María', 'José'][i % 8],
  lastname: ['Méndez', 'Pérez', 'Gómez', 'Rodríguez', 'López', 'Díaz', 'Martínez', 'García'][i % 8],
  email: `empleado${i}@uasd.edu.do`,
  role: ['Administrador', 'Consultor TI', 'Soporte Técnico', 'Desarrollador'][i % 4],
  status: ['active', 'active', 'inactive', 'pending'][i % 4] as EmployeeStatus, // Mayoría activos
}));

type PaginatedResponse = {
  data: Employee[];
  total: number;
};

async function mockApiFetch(search: string, page: number, limit: number): Promise<PaginatedResponse> {
  await new Promise(resolve => setTimeout(resolve, 350)); // Simulación de latencia de red

  const lowerSearch = search.toLowerCase();
  const filtered = MOCK_DB.filter(e => 
    e.firstname.toLowerCase().includes(lowerSearch) || 
    e.lastname.toLowerCase().includes(lowerSearch) ||
    e.email.toLowerCase().includes(lowerSearch) ||
    e.id.toLowerCase().includes(lowerSearch)
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

function useEmployeesPagination() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const latestRequestRef = useRef<number>(0);

  const fetchEmployees = useCallback(async (search: string, page: number) => {
    const requestId = Date.now();
    latestRequestRef.current = requestId;

    setIsLoading(true);

    try {
      const { data, total } = await mockApiFetch(search.trim(), page, ITEMS_PER_PAGE);
      
      // Control de concurrencia: Evita sobrescritura por peticiones lentas
      if (latestRequestRef.current !== requestId) return;

      setEmployees(data);
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
      setCurrentPage(1); // Reset de índice al buscar
      fetchEmployees(value, 1);
    }, SEARCH_DEBOUNCE_DELAY);
  }, [fetchEmployees]);

  const clearSearch = useCallback(() => {
    setSearchTerm('');
    setCurrentPage(1);
    fetchEmployees('', 1);
  }, [fetchEmployees]);

  const handlePageChange = useCallback((newPage: number) => {
    setCurrentPage(newPage);
    fetchEmployees(searchTerm, newPage);
  }, [searchTerm, fetchEmployees]);

  useEffect(() => {
    fetchEmployees('', 1);
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [fetchEmployees]);

  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));

  return { 
    employees, isLoading, searchTerm, handleSearch, clearSearch, 
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

const EmployeeRow = memo(({ employee }: { employee: Employee }) => {
  const statusConfig = STATUS_UI[employee.status];

  return (
    <tr className="border-b border-[#e0e3e5] bg-white hover:bg-[#f8fafd] transition-colors duration-150">
      <td className="px-6 py-4 font-mono text-[13px] text-[#43474f] font-semibold">{employee.id}</td>
      <td className="px-6 py-4">
        <img 
          src={employee.profilepicture} 
          alt={`${employee.firstname} ${employee.lastname}`} 
          className="size-10 rounded-full object-cover border border-[#e0e3e5] bg-[#f2f4f6]" 
          loading="lazy" 
        />
      </td>
      <td className="px-6 py-4">
        <div className="flex flex-col">
          <span className="text-[14px] font-semibold text-[#191c1e] tracking-tight">{employee.firstname} {employee.lastname}</span>
          <span className="text-[12px] text-[#747781] mt-0.5">{employee.email}</span>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="text-[13px] font-medium text-[#43474f] bg-[#f2f4f6] px-2.5 py-1 rounded-md border border-[#e0e3e5]">
          {employee.role}
        </span>
      </td>
      <td className="px-6 py-4">
        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${statusConfig.badge}`}>
          <span className={`size-1.5 rounded-full ${statusConfig.dot}`} aria-hidden="true" />
          <span className="text-[11px] font-bold uppercase tracking-wider">{statusConfig.label}</span>
        </div>
      </td>
      <td className="px-6 py-4 text-right">
        <Link 
          href={`/admin/employees/edit/${employee.id}`}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-[#c4c6d1] rounded-md text-[12px] font-semibold text-[#43474f] hover:bg-[#f2f4f6] transition-colors focus:outline-none focus:ring-2 focus:ring-[#002d62]"
        >
          <Edit2 className="size-3.5" /> Editar
        </Link>
      </td>
    </tr>
  );
});
EmployeeRow.displayName = 'EmployeeRow';

// ============================================================================
// COMPONENTE PRINCIPAL (PAGE)
// ============================================================================

export default function EmployeesPage() {
  const { 
    employees, isLoading, searchTerm, handleSearch, clearSearch, 
    currentPage, totalPages, totalItems, handlePageChange 
  } = useEmployeesPagination();

  // Memoización para evitar recalcular el arreglo de botones en re-renders irrelevantes
  const paginationRange = useMemo(() => {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }, [totalPages]);

  return (
    <div className="flex flex-col h-full bg-[#f7f9fb]">
      
      <header className="flex items-center justify-between px-8 py-6 bg-white border-b border-[#e0e3e5]">
        <div>
          <h1 className="text-2xl font-serif font-bold text-[#00193c] tracking-tight">Directorio de Empleados</h1>
          <p className="text-[13px] font-sans text-[#747781] mt-1">Gestión administrativa de personal y asignación de roles.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="inline-flex items-center gap-2 px-4 py-2 bg-[#002d62] rounded-md text-[13px] font-semibold text-white hover:bg-[#00193c] transition-colors focus:outline-none focus:ring-2 focus:ring-[#002d62] focus:ring-offset-2">
            <UserPlus className="size-4" /> Nuevo Empleado
          </button>
        </div>
      </header>

      <section className="px-8 py-4 bg-white border-b border-[#e0e3e5]">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[#747781] pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar por ID, nombre o correo..."
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
        ) : employees.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-[#747781]">
            <ShieldAlert className="size-12 mb-4 text-[#c4c6d1]" />
            <p className="text-[14px] font-semibold text-[#191c1e]">
              {searchTerm ? 'No se encontraron empleados coincidentes' : 'El directorio está vacío'}
            </p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead className="bg-[#f8fafd] sticky top-0 z-10 shadow-[0_1px_0_#e0e3e5]">
              <tr>
                <th className="px-6 py-3.5 text-[11px] font-bold text-[#747781] uppercase tracking-wider">ID</th>
                <th className="px-6 py-3.5 text-[11px] font-bold text-[#747781] uppercase tracking-wider">Perfil</th>
                <th className="px-6 py-3.5 text-[11px] font-bold text-[#747781] uppercase tracking-wider">Identidad</th>
                <th className="px-6 py-3.5 text-[11px] font-bold text-[#747781] uppercase tracking-wider">Rol Organizacional</th>
                <th className="px-6 py-3.5 text-[11px] font-bold text-[#747781] uppercase tracking-wider">Estado</th>
                <th className="px-6 py-3.5 text-[11px] font-bold text-[#747781] uppercase tracking-wider text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e0e3e5]">
              {employees.map(employee => <EmployeeRow key={employee.id} employee={employee} />)}
            </tbody>
          </table>
        )}
      </main>

      {/* Paginación Numérica Discreta */}
      {!isLoading && employees.length > 0 && (
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