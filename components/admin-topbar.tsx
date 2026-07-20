'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useMemo, useRef, useEffect } from 'react';
import { Bell, Search, ChevronRight } from 'lucide-react';

// ─── Interfaces y Tipos Estrictos ──────────────────────────────────────────

interface Crumb {
  label: string;
  href: string;
}

type ActiveMenuType = 'search' | 'notifications' | 'user' | null;

// ─── Utilidades Puras ──────────────────────────────────────────────────────

const buildCrumbs = (pathname: string): Crumb[] => {
  const segments = pathname.split('/').filter(Boolean);
  return segments.map((seg, i) => ({
    label: seg.charAt(0).toUpperCase() + seg.slice(1),
    href: '/' + segments.slice(0, i + 1).join('/'),
  }));
};

// ─── Componente Principal ──────────────────────────────────────────────────

export function AdminTopbar() {
  const pathname = usePathname();
  const topbarRef = useRef<HTMLElement>(null);
  
  const crumbs = useMemo(() => buildCrumbs(pathname), [pathname]);
  const [activeMenu, setActiveMenu] = useState<ActiveMenuType>(null);

  useEffect(() => {
    if (!activeMenu) return;

    const handleOutsideClick = (e: MouseEvent) => {
      if (topbarRef.current && !topbarRef.current.contains(e.target as Node)) {
        setActiveMenu(null);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [activeMenu]);

  const toggleMenu = (menu: ActiveMenuType) => {
    setActiveMenu((prev) => (prev === menu ? null : menu));
  };

  return (
    <header
      ref={topbarRef}
      className="sticky top-0 z-40 w-full bg-[#ffffff] border-b border-[#c4c6d1]" 
    >
      <div className="flex items-center justify-between px-8 h-20 relative">
        
        {/* ─── Breadcrumbs ─── */}
        <nav className="hidden sm:flex items-center gap-x-2 text-base font-sans" aria-label="Ruta de navegación">
          {crumbs.map((crumb, idx) => {
            const isLast = idx === crumbs.length - 1;
            return (
              <div key={crumb.href} className="flex items-center gap-x-2">
                {idx > 0 && <ChevronRight className="size-4 text-[#747781]" aria-hidden="true" />}
                {isLast ? (
                  <span className="text-[#191c1e] font-semibold tracking-wide" aria-current="page">
                    {crumb.label}
                  </span>
                ) : (
                  <Link
                    href={crumb.href}
                    className="text-[#43474f] hover:text-[#002d62] transition-colors font-medium tracking-wide"
                  >
                    {crumb.label}
                  </Link>
                )}
              </div>
            );
          })}
        </nav>

        <div className="flex-1" />

        {/* ─── Buscador Global (Desktop) ─── */}
        <div className="hidden md:block relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-[#747781] pointer-events-none" />
          <input
            type="search"
            className="w-80 pl-12 pr-4 py-2.5 text-base rounded-none border border-[#c4c6d1] bg-transparent text-[#191c1e] placeholder:text-[#747781] focus:outline-none focus:border-[#002d62] focus:border-b-2 transition-all font-sans"
            placeholder="Buscar recursos..."
            aria-label="Búsqueda global"
          />
        </div>

        {/* ─── Contenedor de Acciones (Derecha) ─── */}
        <div className="flex items-center gap-x-4 ml-6">
          
          {/* Toggle de Búsqueda (Mobile) */}
          <div className="md:hidden relative">
            <button
              onClick={() => toggleMenu('search')}
              className="p-2 text-[#43474f] hover:text-[#002d62] transition-colors rounded-none hover:bg-[#f2f4f6]"
              aria-label="Alternar búsqueda"
            >
              <Search className="size-6" />
            </button>
            {activeMenu === 'search' && (
              <div className="absolute top-full right-0 mt-4 w-80 bg-[#ffffff] rounded-none border border-[#c4c6d1] p-3 z-50">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-[#747781]" />
                  <input
                    type="search"
                    className="w-full pl-10 pr-3 py-3 text-base rounded-none border border-[#c4c6d1] focus:outline-none focus:border-[#002d62] focus:border-b-2 font-sans"
                    placeholder="Buscar..."
                    autoFocus
                  />
                </div>
              </div>
            )}
          </div>

          {/* Toggle de Notificaciones */}
          <div className="relative">
            <button
              onClick={() => toggleMenu('notifications')}
              className="p-2 text-[#43474f] hover:text-[#002d62] transition-colors rounded-none hover:bg-[#f2f4f6]"
              aria-label="Alternar notificaciones"
              aria-expanded={activeMenu === 'notifications'}
            >
              <Bell className="size-6" />
            </button>

            {activeMenu === 'notifications' && (
              <div className="absolute top-full right-0 mt-4 w-96 bg-[#ffffff] rounded-none border border-[#c4c6d1] z-50 animate-in fade-in slide-in-from-top-2">
                <div className="px-5 py-4 border-b border-[#e2e8f0] bg-[#f7f9fb]">
                  <h3 className="font-serif text-base font-bold text-[#00193c] tracking-wide">
                    NOTIFICACIONES
                  </h3>
                </div>
                <ul className="divide-y divide-[#e2e8f0] max-h-[400px] overflow-y-auto">
                  {[
                    { id: 1, title: 'Inventario agotado: Química 101', time: 'Hace 2 min' },
                    { id: 2, title: 'Uso del servidor al 90%', time: 'Hace 1 hr' },
                    { id: 3, title: 'Nuevo usuario registrado', time: 'Hace 3 hrs' },
                  ].map((n) => (
                    <li key={n.id}>
                      <button className="w-full text-left px-5 py-4 hover:bg-[#f2f4f6] transition-colors outline-none focus:bg-[#f2f4f6]">
                        <p className="text-base font-sans font-medium text-[#191c1e]">
                          {n.title}
                        </p>
                        <p className="text-sm font-sans text-[#747781] mt-1">{n.time}</p>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Toggle de Usuario */}
          <div className="relative">
            <button
              onClick={() => toggleMenu('user')}
              className="flex items-center outline-none focus:ring-2 focus:ring-[#002d62] focus:ring-offset-2 transition-all rounded-none"
              aria-label="Alternar menú de usuario"
              aria-expanded={activeMenu === 'user'}
            >
              <div className="size-10 rounded-none bg-[#002d62] text-[#ffffff] font-sans text-sm font-bold flex items-center justify-center border border-[#00193c]">
                AD
              </div>
            </button>

            {activeMenu === 'user' && (
              <div className="absolute top-full right-0 mt-4 w-64 bg-[#ffffff] rounded-none border border-[#c4c6d1] z-50 animate-in fade-in slide-in-from-top-2">
                <div className="px-5 py-4 border-b border-[#e2e8f0] bg-[#f7f9fb]">
                  <p className="font-serif text-base font-bold text-[#00193c] truncate">
                    admin@ejemplo.com
                  </p>
                </div>
                <div className="p-0 flex flex-col">
                  <Link
                    href="/admin/profile"
                    className="px-5 py-3 font-sans text-base font-medium text-[#43474f] hover:text-[#002d62] hover:bg-[#f2f4f6] transition-colors"
                  >
                    Perfil
                  </Link>
                  <Link
                    href="/admin/settings/billing"
                    className="px-5 py-3 font-sans text-base font-medium text-[#43474f] hover:text-[#002d62] hover:bg-[#f2f4f6] transition-colors"
                  >
                    Facturación
                  </Link>
                  <div className="border-t border-[#e2e8f0]" />
                  <button className="w-full text-left px-5 py-3 font-sans text-base font-semibold text-[#ba1a1a] hover:bg-[#ffdad6] transition-colors outline-none">
                    Cerrar sesión
                  </button>
                </div>
              </div>
            )}
          </div>
          
        </div>
      </div>
    </header>
  );
}