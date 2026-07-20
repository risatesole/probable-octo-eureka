'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState, useEffect, useCallback, memo } from 'react';
import { LayoutDashboard, Users, Package, ChevronDown, Menu, Truck, LucideIcon } from 'lucide-react';

// ─── Tipado Estricto ────────────────────────────────────────────────────────

interface NavigationSubItem {
  title: string;
  url: string;
}

interface NavigationItem {
  id: string;
  title: string;
  url?: string;
  icon: LucideIcon;
  sub?: NavigationSubItem[];
}

// ─── Estructuras de Datos Estáticas ────────────────────────────────────────

const PLATFORM_ITEMS: NavigationItem[] = [
  {
    id: 'dashboard',
    title: 'Panel Principal',
    url: '/admin',
    icon: LayoutDashboard,
    sub: [
      { title: 'Dashboard Administrativo', url: '/admin' },
    ],
  },
  {
    id: 'customers',
    title: 'Clientes',
    url: '/admin/customer',
    icon: Users,
    sub: [
      { title: 'Directorio', url: '/admin/customers' },
      { title: 'Órdenes', url: '/admin/customers/orders' },
    ],
  },
  {
    id: 'employees',
    title: 'Empleados',
    icon: Users,
    sub: [{ title: 'Gestión de Personal', url: '/admin/employee' }],
  },
  {
    id: 'products',
    title: 'Productos',
    icon: Package,
    sub: [
      { title: 'Catálogo', url: '/admin/products' },
      { title: 'Categorías', url: '/admin/products/categories' },
    ],
  },
  {
    id: 'inventory',
    title: 'Inventario',
    icon: Truck,
    sub: [
      { title: 'Estado Actual', url: '/admin/inventory' },
      { title: 'Movimientos', url: '/admin/inventory/stockmovement' },
      { title: 'Gestión', url: '/admin/inventory/manage' },
    ],
  },
];

const HELP_ITEMS: NavigationSubItem[] = [
  { title: 'Primeros Pasos', url: '/admin/help/gettingstarted' },
  { title: 'Manual Operativo', url: '/admin/help/manual' },
];

// ─── Componentes Puros Memotizados ──────────────────────────────────────────

const BrandLogo = memo(() => (
  <Link 
    href="/" 
    className="flex h-full w-full items-center justify-center gap-3 bg-[#001530] px-4 transition-colors duration-200 hover:bg-[#002048] outline-none focus:ring-2 focus:ring-[#5891ff]"
    aria-label="Ir al inicio de UASD BuyFast"
  >
    <Image 
      src="/image/logo_uasd.svg" 
      alt="UASD Logo" 
      width={140} 
      height={36} 
      className="h-8 w-auto object-contain shrink-0"
      priority
    />
    <div className="h-7 w-px bg-white/20 shrink-0" aria-hidden="true" />
    <div className="flex flex-col justify-center min-w-0">
      <span className="font-serif text-base font-bold tracking-widest text-white leading-tight uppercase truncate">
        BUYFAST
      </span>
      <span className="text-[9px] font-sans font-bold tracking-[0.2em] text-[#7d9ccb] leading-none uppercase mt-0.5 truncate">
        Económato
      </span>
    </div>
  </Link>
));
BrandLogo.displayName = 'BrandLogo';

// ─── Componente Principal ──────────────────────────────────────────────────

export function AppSidebar() {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState<boolean>(false);
  const [openAccordions, setOpenAccordions] = useState<Record<string, boolean>>({});

  // Cierre de menú móvil al navegar
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  const isPathActive = useCallback((url?: string) => !!url && pathname === url, [pathname]);
  const isSubPathActive = useCallback(
    (subItems?: NavigationSubItem[]) => subItems?.some((sub) => pathname === sub.url) ?? false,
    [pathname]
  );

  // Sincronización automática del acordeón activo según la ruta
  useEffect(() => {
    const activeAccordions: Record<string, boolean> = {};
    PLATFORM_ITEMS.forEach((item) => {
      if (item.sub && (isPathActive(item.url) || isSubPathActive(item.sub))) {
        activeAccordions[item.id] = true;
      }
    });
    setOpenAccordions((prev) => ({ ...prev, ...activeAccordions }));
  }, [isPathActive, isSubPathActive]);

  const toggleAccordion = useCallback((id: string) => {
    setOpenAccordions((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  return (
    <>
      {/* Backdrop Móvil */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-[#000d20]/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`
          fixed top-0 left-0 bottom-0 z-50 w-64 bg-[#001530] text-white
          border-r border-[#002554]
          transition-transform duration-300 ease-in-out
          lg:translate-x-0
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
        aria-label="Barra lateral principal"
      >
        {/* Header Institucional */}
        <div className="h-20 border-b border-[#002554] w-full">
          <BrandLogo />
        </div>

        {/* Navegación Principal */}
        <nav className="flex flex-col gap-y-6 px-3 py-6 h-[calc(100%-5rem)] overflow-y-auto custom-scrollbar">
          
          {/* Sección: Plataforma */}
          <div>
            <p className="px-3 mb-3 text-xs font-sans font-bold uppercase tracking-wider text-[#7d9ccb]">
              Plataforma
            </p>
            <ul className="space-y-1.5">
              {PLATFORM_ITEMS.map((item) => {
                const Icon = item.icon;
                const hasSub = !!item.sub;
                const isOpen = openAccordions[item.id] || false;
                const isActiveModule = isPathActive(item.url) || isSubPathActive(item.sub);

                const baseClasses = "w-full flex items-center gap-x-3.5 px-3.5 py-3 rounded-xl text-sm font-sans font-medium transition-all duration-200 outline-none";
                const activeClasses = isActiveModule
                  ? "bg-[#5891ff] text-[#001530] font-semibold shadow-sm"
                  : "text-white hover:bg-[#002554]/60";

                if (!hasSub) {
                  return (
                    <li key={item.id}>
                      <Link href={item.url ?? '#'} className={`${baseClasses} ${activeClasses}`}>
                        <Icon className={`size-5 shrink-0 ${isActiveModule ? 'text-[#001530]' : 'text-white'}`} />
                        <span className="truncate">{item.title}</span>
                      </Link>
                    </li>
                  );
                }

                return (
                  <li key={item.id}>
                    <button
                      onClick={() => toggleAccordion(item.id)}
                      className={`${baseClasses} ${activeClasses}`}
                      aria-expanded={isOpen}
                    >
                      <Icon className={`size-5 shrink-0 ${isActiveModule ? 'text-[#001530]' : 'text-white'}`} />
                      <span className="flex-1 text-left truncate">{item.title}</span>
                      <ChevronDown
                        className={`size-4 shrink-0 transition-transform duration-200 ${isOpen ? '-rotate-180' : ''} ${
                          isActiveModule ? 'text-[#001530]' : 'text-white'
                        }`}
                      />
                    </button>

                    {/* Sub-menú colapsable */}
                    {isOpen && (
                      <ul className="mt-1 space-y-1 pl-11 pr-2 animate-in fade-in duration-200">
                        {item.sub!.map((sub) => {
                          const isSubActiveItem = isPathActive(sub.url);
                          return (
                            <li key={sub.url}>
                              <Link
                                href={sub.url}
                                className={`
                                  block py-2 px-3 rounded-lg text-sm font-sans transition-colors truncate
                                  ${isSubActiveItem 
                                    ? 'text-white font-bold bg-[#00285a]' 
                                    : 'text-[#d0e1ff] hover:text-white hover:bg-[#002048]'
                                  }
                                `}
                              >
                                {sub.title}
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Sección: Soporte */}
          <div>
            <p className="px-3 mb-3 text-xs font-sans font-bold uppercase tracking-wider text-[#7d9ccb]">
              Soporte
            </p>
            <ul className="space-y-1.5">
              {HELP_ITEMS.map((item) => {
                const isActive = isPathActive(item.url);
                return (
                  <li key={item.url}>
                    <Link
                      href={item.url}
                      className={`
                        block px-3.5 py-3 rounded-xl text-sm font-sans font-medium transition-all duration-200 truncate
                        ${isActive
                          ? 'bg-[#5891ff] text-[#001530] font-semibold'
                          : 'text-white hover:bg-[#002554]/60'
                        }
                      `}
                    >
                      {item.title}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Sección Footer / Perfil de Usuario */}
          <div className="mt-auto pt-4 border-t border-[#002554]">
            <div className="px-2 py-2 flex items-center gap-x-3">
              <div className="size-10 rounded-xl bg-[#5891ff] text-[#001530] font-sans text-sm font-bold flex items-center justify-center shrink-0 shadow-sm">
                AD
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-sans font-bold text-white truncate leading-snug">
                  Admin Principal
                </p>
                <p className="text-xs font-sans text-[#7d9ccb] truncate">
                  admin@uasd.edu.do
                </p>
              </div>
            </div>
          </div>

        </nav>
      </aside>

      {/* Botón Flotante Móvil */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="lg:hidden fixed bottom-6 right-6 z-30 p-3.5 rounded-xl bg-[#5891ff] text-[#001530] shadow-xl hover:bg-[#437ff5] transition-colors outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#5891ff]"
        aria-label="Abrir menú"
      >
        <Menu className="size-5" />
      </button>
    </>
  );
}