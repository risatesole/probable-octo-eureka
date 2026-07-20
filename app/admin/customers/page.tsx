'use client';

import { useState, useMemo, useCallback, useDeferredValue, memo } from 'react';
import { Search, MoreHorizontal, ChevronLeft, ChevronRight, SlidersHorizontal } from 'lucide-react';

// ============================================================================
// CAPA DE DOMINIO Y TIPOS
// ============================================================================

interface User {
  id: string;
  name: string;
  email: string;
  status: 'active' | 'inactive' | 'pending';
  lastActive: string;
  role: 'admin' | 'user' | 'moderator';
}

const USERS_PER_PAGE = 5;

// Diccionario de estilos con acceso O(1) para evitar recálculos en el render cycle
const STATUS_UI: Record<User['status'], { badge: string; dot: string; label: string }> = {
  active: { badge: 'bg-[#e6f4ea] text-[#137333] border-[#ceead6]', dot: 'bg-[#1e8e3e]', label: 'Activo' },
  inactive: { badge: 'bg-[#f1f3f4] text-[#5f6368] border-[#e8eaed]', dot: 'bg-[#9aa0a6]', label: 'Inactivo' },
  pending: { badge: 'bg-[#fef7e0] text-[#b06000] border-[#feefc3]', dot: 'bg-[#f9ab00]', label: 'Pendiente' },
};

const mockUsers: User[] = [
  { id: '1', name: 'Alice Johnson', email: 'alice.johnson@example.com', status: 'active', lastActive: 'Just now', role: 'admin' },
  { id: '2', name: 'Bob Smith', email: 'bob.smith@example.com', status: 'active', lastActive: '5 minutes ago', role: 'user' },
  { id: '3', name: 'Carol Davis', email: 'carol.davis@example.com', status: 'inactive', lastActive: '2 hours ago', role: 'moderator' },
  { id: '4', name: 'David Wilson', email: 'david.wilson@example.com', status: 'active', lastActive: '1 hour ago', role: 'user' },
  { id: '5', name: 'Emma Brown', email: 'emma.brown@example.com', status: 'pending', lastActive: 'Never', role: 'user' },
  { id: '6', name: 'Frank Miller', email: 'frank.miller@example.com', status: 'active', lastActive: '30 minutes ago', role: 'user' },
  { id: '7', name: 'Grace Lee', email: 'grace.lee@example.com', status: 'active', lastActive: '15 minutes ago', role: 'user' },
  { id: '8', name: 'Henry Zhang', email: 'henry.zhang@example.com', status: 'active', lastActive: '45 minutes ago', role: 'user' },
];

// ============================================================================
// COMPONENTES Puros (Memoizados)
// ============================================================================

interface UserTableRowProps {
  user: User;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  onAction: (user: User) => void;
}

const UserTableRow = memo(({ user, isSelected, onToggleSelect, onAction }: UserTableRowProps) => {
  const statusConfig = STATUS_UI[user.status];

  return (
    <tr className="group border-b border-[#e0e3e5] bg-white hover:bg-[#f8fafd] transition-colors duration-150 ease-in-out">
      <td className="px-6 py-4 w-12">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggleSelect(user.id)}
          className="size-4 cursor-pointer text-[#002d62] rounded-sm border-[#c4c6d1] focus:ring-[#002d62] transition-all"
        />
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex flex-col">
          <span className="text-[14px] font-semibold text-[#191c1e] tracking-tight">{user.name}</span>
          <span className="text-[12px] text-[#747781] mt-0.5">{user.email}</span>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${statusConfig.badge}`}>
          <span className={`size-1.5 rounded-full ${statusConfig.dot}`} aria-hidden="true" />
          <span className="text-[11px] font-bold uppercase tracking-wider">{statusConfig.label}</span>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="text-[13px] font-medium text-[#43474f] bg-[#f2f4f6] px-2.5 py-1 rounded-md border border-[#e0e3e5] capitalize">
          {user.role}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-[13px] text-[#747781] font-medium">
        {user.lastActive}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right">
        <button
          onClick={() => onAction(user)}
          className="inline-flex items-center justify-center size-8 rounded-md text-[#747781] hover:text-[#002d62] hover:bg-[#e8f0fe] border border-transparent hover:border-[#d2e3fc] transition-all focus:outline-none focus:ring-2 focus:ring-[#002d62] focus:ring-offset-1"
          aria-label={`Opciones para ${user.name}`}
        >
          <MoreHorizontal className="size-4" />
        </button>
      </td>
    </tr>
  );
});
UserTableRow.displayName = 'UserTableRow';

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export default function UserListPage() {
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [searchQueryString, setSearchQueryString] = useState('');
  const [currentPageNumber, setCurrentPageNumber] = useState(1);

  // Optimización de concurrencia: Evita bloqueos en el main thread al teclear
  const deferredSearchQuery = useDeferredValue(searchQueryString);

  const searchMatchingUsers = useMemo(() => {
    if (!deferredSearchQuery.trim()) return mockUsers;
    const lowerQuery = deferredSearchQuery.toLowerCase();
    
    return mockUsers.filter(
      user => user.name.toLowerCase().includes(lowerQuery) || user.email.toLowerCase().includes(lowerQuery)
    );
  }, [deferredSearchQuery]);

  const totalPages = Math.max(1, Math.ceil(searchMatchingUsers.length / USERS_PER_PAGE));
  
  const usersDisplayedOnCurrentPage = useMemo(() => {
    const startIndex = (currentPageNumber - 1) * USERS_PER_PAGE;
    return searchMatchingUsers.slice(startIndex, startIndex + USERS_PER_PAGE);
  }, [searchMatchingUsers, currentPageNumber]);

  // Manejo de dependencias estrictas para evitar recreación de funciones
  const toggleSelectSpecificUser = useCallback((userId: string) => {
    setSelectedUserIds(prev => {
      const updated = new Set(prev);
      updated.has(userId) ? updated.delete(userId) : updated.add(userId);
      return updated;
    });
  }, []);

  const isCurrentPageAllSelected = useMemo(() => {
    return usersDisplayedOnCurrentPage.length > 0 && 
           usersDisplayedOnCurrentPage.every(user => selectedUserIds.has(user.id));
  }, [usersDisplayedOnCurrentPage, selectedUserIds]);

  const toggleSelectAllDisplayedUsers = useCallback(() => {
    setSelectedUserIds(prev => {
      const next = new Set(prev);
      if (isCurrentPageAllSelected) {
        usersDisplayedOnCurrentPage.forEach(user => next.delete(user.id));
      } else {
        usersDisplayedOnCurrentPage.forEach(user => next.add(user.id));
      }
      return next;
    });
  }, [isCurrentPageAllSelected, usersDisplayedOnCurrentPage]);

  // Handlers para las acciones persistidas
  const handleUserActionButtonClick = useCallback((clickedUser: User) => {
    console.log(`Ejecutando acción contextual para: ${clickedUser.id}`);
  }, []);

  const handleCreateNewUser = useCallback(() => {
    // Espacio reservado para invocar un modal o empujar ruta (ej. router.push('/admin/users/new'))
    console.log('Iniciando flujo de creación de usuario');
  }, []);

  const handleAdvancedFilters = useCallback(() => {
    console.log('Desplegando panel de filtros avanzados');
  }, []);

  const paginationRange = useMemo(() => {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }, [totalPages]);

  return (
    <div className="flex flex-col h-full bg-[#f7f9fb]">
      <header className="flex items-center justify-between px-8 py-6 bg-white border-b border-[#e0e3e5]">
        <div>
          <h1 className="text-2xl font-serif font-bold text-[#00193c] tracking-tight">Directorio de Usuarios</h1>
          <p className="text-[13px] font-sans text-[#747781] mt-1">Gestione los accesos y roles administrativos del sistema.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleCreateNewUser}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#002d62] rounded-md text-[13px] font-semibold text-white hover:bg-[#00193c] transition-colors focus:outline-none focus:ring-2 focus:ring-[#002d62] focus:ring-offset-2"
          >
            Nuevo Usuario
          </button>
        </div>
      </header>

      <section className="px-8 py-4 bg-white border-b border-[#e0e3e5] flex items-center justify-between gap-4">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[#747781] pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar por nombre o credencial..."
            value={searchQueryString}
            onChange={e => {
              setSearchQueryString(e.target.value);
              setCurrentPageNumber(1);
            }}
            className="w-full pl-10 pr-4 py-2.5 bg-[#f7f9fb] border border-[#c4c6d1] rounded-md text-[13px] font-medium text-[#191c1e] placeholder:text-[#747781] transition-all focus:outline-none focus:border-[#002d62] focus:ring-1 focus:ring-[#002d62] focus:bg-white"
          />
        </div>
        
        <button 
          onClick={handleAdvancedFilters}
          className="inline-flex items-center gap-2 px-3 py-2.5 border border-[#c4c6d1] rounded-md text-[13px] font-semibold text-[#43474f] hover:bg-[#f2f4f6] transition-colors focus:outline-none focus:ring-2 focus:ring-[#002d62]"
        >
          <SlidersHorizontal className="size-4" />
          Filtros Avanzados
        </button>
      </section>

      <main className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar bg-white">
        {usersDisplayedOnCurrentPage.length > 0 ? (
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead className="bg-[#f8fafd] sticky top-0 z-10 shadow-[0_1px_0_#e0e3e5]">
              <tr>
                <th className="px-6 py-3.5 w-12">
                  <input
                    type="checkbox"
                    checked={isCurrentPageAllSelected}
                    onChange={toggleSelectAllDisplayedUsers}
                    className="size-4 cursor-pointer text-[#002d62] rounded-sm border-[#c4c6d1] focus:ring-[#002d62]"
                  />
                </th>
                <th className="px-6 py-3.5 text-[11px] font-bold text-[#747781] uppercase tracking-wider">Identidad</th>
                <th className="px-6 py-3.5 text-[11px] font-bold text-[#747781] uppercase tracking-wider">Estado Operativo</th>
                <th className="px-6 py-3.5 text-[11px] font-bold text-[#747781] uppercase tracking-wider">Nivel de Acceso</th>
                <th className="px-6 py-3.5 text-[11px] font-bold text-[#747781] uppercase tracking-wider">Última Sesión</th>
                <th className="px-6 py-3.5 text-[11px] font-bold text-[#747781] uppercase tracking-wider text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e0e3e5]">
              {usersDisplayedOnCurrentPage.map(user => (
                <UserTableRow
                  key={user.id}
                  user={user}
                  isSelected={selectedUserIds.has(user.id)}
                  onToggleSelect={toggleSelectSpecificUser}
                  onAction={handleUserActionButtonClick}
                />
              ))}
            </tbody>
          </table>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-[#747781]">
            <Search className="size-10 mb-4 text-[#c4c6d1]" />
            <p className="text-[14px] font-semibold text-[#191c1e]">No se encontraron registros</p>
            <p className="text-[13px] mt-1">Ajuste los parámetros de búsqueda e intente nuevamente.</p>
          </div>
        )}
      </main>

      <footer className="flex items-center justify-between px-8 py-4 bg-white border-t border-[#e0e3e5]">
        <div className="text-[13px] font-medium text-[#747781]">
          Mostrando <span className="font-bold text-[#191c1e]">{usersDisplayedOnCurrentPage.length}</span> de <span className="font-bold text-[#191c1e]">{searchMatchingUsers.length}</span> resultados
          {selectedUserIds.size > 0 && (
            <span className="ml-2 text-[#002d62] font-semibold">({selectedUserIds.size} seleccionados)</span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setCurrentPageNumber(prev => Math.max(1, prev - 1))}
            disabled={currentPageNumber === 1}
            className="inline-flex items-center justify-center size-8 rounded-md border border-[#c4c6d1] text-[#43474f] hover:bg-[#f2f4f6] disabled:opacity-40 disabled:pointer-events-none transition-colors"
            aria-label="Página anterior"
          >
            <ChevronLeft className="size-4" />
          </button>
          
          <div className="flex items-center gap-1 mx-2">
            {paginationRange.map(page => (
              <button
                key={page}
                onClick={() => setCurrentPageNumber(page)}
                className={`inline-flex items-center justify-center size-8 rounded-md text-[13px] font-semibold transition-all ${
                  currentPageNumber === page 
                    ? 'bg-[#002d62] text-white border border-[#002d62] shadow-sm' 
                    : 'text-[#43474f] hover:bg-[#f2f4f6] border border-transparent hover:border-[#c4c6d1]'
                }`}
              >
                {page}
              </button>
            ))}
          </div>

          <button
            onClick={() => setCurrentPageNumber(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPageNumber === totalPages}
            className="inline-flex items-center justify-center size-8 rounded-md border border-[#c4c6d1] text-[#43474f] hover:bg-[#f2f4f6] disabled:opacity-40 disabled:pointer-events-none transition-colors"
            aria-label="Página siguiente"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </footer>
    </div>
  );
}