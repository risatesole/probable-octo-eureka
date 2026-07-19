'use client';

import { useState, useMemo, useCallback, memo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  Search,
  User,
  Heart,
  ShoppingCart,
  Menu,
  X,
  LogOut,
  ShieldCheck,
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────

export type AuthUser = {
  name: string;
  profilePicture: string;
  role: 'employee' | 'customer' | string;
};

export type NavbarCartItem = {
  id: string | number;
  productId: number;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  variant?: string;
};

interface NavbarProps {
  user: AuthUser | null;
  cartItems?: NavbarCartItem[];
  onRemoveCartItem?: (id: NavbarCartItem['id']) => void;
  onUpdateCartItemQuantity?: (id: NavbarCartItem['id'], quantity: number) => void;
  onCheckout?: () => void;
}

type DrawerType = 'cart' | 'account' | null;

// ── Constants & Routing ────────────────────────────────────────

const NAV_LINKS = [
  { href: '/', label: 'INICIO' },
  { href: '/categories', label: 'CATEGORÍAS' },
  { href: '/catalog', label: 'CATÁLOGO' },
  { href: '/bundles', label: 'COMBOS Y OFERTAS' },
  { href: '/contact', label: 'CONTACTO' },
] as const;

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP' }).format(amount);

// ── Shared Tailwind Classes ────────────────────────────────────

const interactiveClasses = {
  iconBtn: "relative p-2 text-[#43474f] transition-colors duration-200 ease-in-out hover:bg-[#f2f4f6] hover:text-[#115cb9] active:scale-95 rounded-full",
  primaryBtn: "bg-[#002d62] px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-200 ease-in-out hover:bg-[#115cb9] active:scale-95 rounded-xl shadow-sm border border-[#002d62]",
  secondaryBtn: "border border-[#c4c6d1] bg-white px-4 py-2.5 text-sm font-medium text-[#43474f] transition-colors duration-200 ease-in-out hover:border-[#115cb9] hover:text-[#115cb9] active:scale-95 rounded-xl shadow-sm",
  dangerBtn: "flex w-full items-center gap-3 px-3 py-2 text-left text-sm font-medium text-[#ba1a1a] transition-colors duration-200 ease-in-out hover:bg-[#ffdad6] active:scale-95 rounded-lg",
  navLinkBase: "inline-flex h-full items-center border-b-2 px-4 text-sm font-bold tracking-wide transition-all duration-200 ease-in-out hover:bg-[#f2f4f6] hover:text-[#115cb9]",
  drawerLinkBase: "flex w-full items-center gap-3 border border-transparent px-3 py-2.5 text-sm font-bold tracking-wide transition-all duration-200 ease-in-out hover:bg-[#f2f4f6] hover:border-[#e0e3e5] hover:text-[#115cb9] rounded-lg",
};

// ── Memoized Static Components ─────────────────────────────────

const BrandLogo = memo(() => (
  <Link 
    href="/" 
    className="mr-6 inline-flex items-center justify-center gap-4 rounded-2xl bg-[#002d62] px-5 py-2.5 shadow-sm transition-all duration-300 ease-in-out hover:bg-[#00193c] active:scale-[0.98]"
  >
    <Image 
      src="/image/logo_uasd.svg" 
      alt="UASD Logo" 
      width={140} 
      height={36} 
      className="h-8 w-auto object-contain"
      priority
    />
    <div className="h-7 w-px bg-white/20"></div>
    <div className="flex flex-col justify-center">
      <span className="font-serif text-base font-bold tracking-widest text-white leading-tight uppercase">
        BUYFAST
      </span>
      <span className="text-[9px] font-medium tracking-[0.2em] text-[#abc7ff] leading-none uppercase mt-0.5">
        Económato
      </span>
    </div>
  </Link>
));
BrandLogo.displayName = 'BrandLogo';

// ── Main Component ─────────────────────────────────────────────

export function Navbar({
  user,
  cartItems = [],
  onRemoveCartItem,
  onUpdateCartItemQuantity,
  onCheckout,
}: NavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeDrawer, setActiveDrawer] = useState<DrawerType>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const { totalItems, totalPrice } = useMemo(() => {
    return cartItems.reduce(
      (acc, item) => {
        acc.totalItems += item.quantity;
        acc.totalPrice += item.price * item.quantity;
        return acc;
      },
      { totalItems: 0, totalPrice: 0 }
    );
  }, [cartItems]);

  const hasItems = totalItems > 0;

  const toggleDrawer = useCallback((drawer: DrawerType) => {
    setActiveDrawer(prev => (prev === drawer ? null : drawer));
    setMobileMenuOpen(false);
    setSearchOpen(false);
  }, []);

  const closeOverlays = useCallback(() => {
    setActiveDrawer(null);
    setSearchOpen(false);
  }, []);

  const handleSearchSubmit = useCallback((e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;
    
    closeOverlays();
    router.push(`/search?q=${encodeURIComponent(query)}`);
  }, [searchQuery, closeOverlays, router]);

  const handleLogout = useCallback(async () => {
    try {
      await fetch('/api/v1/signout/', { method: 'POST', credentials: 'include' });
    } finally {
      closeOverlays();
      router.push('/signin');
    }
  }, [closeOverlays, router]);

  const handleQuantityChange = useCallback((id: string | number, value: string) => {
    const val = parseInt(value, 10);
    if (val > 0) onUpdateCartItemQuantity?.(id, val);
  }, [onUpdateCartItemQuantity]);

  const handleNavigateToCart = useCallback(() => {
    closeOverlays();
    router.push('/cart');
  }, [closeOverlays, router]);

  const handleNavigateToCheckout = useCallback(() => {
    onCheckout?.();
    router.push('/checkout');
  }, [onCheckout, router]);

  return (
    <>
      {activeDrawer && (
        <div className="fixed inset-0 z-40 bg-[#191c1e]/40 backdrop-blur-sm transition-opacity" onClick={closeOverlays} aria-hidden="true" />
      )}

      {/* ── Cart Drawer ── */}
      <aside className={`fixed right-0 top-0 z-50 flex h-full w-full sm:w-[26rem] flex-col rounded-l-3xl border-l border-[#e0e3e5] bg-[#ffffff] shadow-2xl transition-transform duration-300 ease-in-out will-change-transform ${activeDrawer === 'cart' ? 'translate-x-0' : 'translate-x-full'}`} aria-label="Carrito de compras" aria-hidden={activeDrawer !== 'cart'}>
        <header className="flex items-center justify-between border-b border-[#eceef0] px-6 py-5">
          <div className="flex items-center gap-3">
            <h2 className="font-serif text-xl font-semibold tracking-tight text-[#002d62]">Carrito</h2>
            {hasItems && <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#115cb9] text-xs font-bold text-white shadow-sm">{totalItems}</span>}
          </div>
          <button onClick={closeOverlays} aria-label="Cerrar carrito" className={interactiveClasses.iconBtn}><X className="h-5 w-5" /></button>
        </header>

        {hasItems ? (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-4 custom-scrollbar">
              {cartItems.map((item, index) => {
                const uniqueKey = `${item.id}-${item.variant ?? 'default'}-${index}`;
                
                return (
                  <article key={uniqueKey} className="group flex gap-4 rounded-2xl border border-[#eceef0] bg-[#ffffff] p-4 mb-4 transition-all hover:border-[#c4c6d1] hover:shadow-sm">
                    <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-xl border border-[#eceef0] bg-[#f7f9fb]">
                      {item.image ? (
                        <Image src={item.image} alt={item.name} fill className="object-cover transition-transform duration-300 group-hover:scale-105" sizes="96px" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center"><ShoppingCart className="h-6 w-6 text-[#c4c6d1]" /></div>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col justify-between">
                      <div>
                        <h3 className="line-clamp-2 text-sm font-medium leading-tight text-[#191c1e] transition-colors group-hover:text-[#115cb9]">{item.name}</h3>
                        {item.variant && <p className="mt-1 text-xs text-[#747781]">{item.variant}</p>}
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-base font-bold text-[#002d62]">{formatCurrency(item.price)}</span>
                        <div className="flex items-center gap-3">
                          <input 
                            type="number" 
                            min={1} 
                            value={item.quantity} 
                            onChange={(e) => handleQuantityChange(item.id, e.target.value)} 
                            className="w-14 rounded-lg border border-[#c4c6d1] bg-[#f7f9fb] px-2 py-1 text-center text-sm font-medium outline-none transition-all duration-200 focus:border-[#115cb9] focus:ring-1 focus:ring-[#115cb9]" 
                            aria-label={`Cantidad de ${item.name}`} 
                          />
                          <button 
                            onClick={() => onRemoveCartItem?.(item.id)} 
                            className="rounded-full p-1.5 text-[#747781] transition-all hover:bg-[#ffdad6] hover:text-[#ba1a1a]" 
                            aria-label={`Eliminar ${item.name} del carrito`}
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
            <footer className="border-t border-[#eceef0] bg-[#f7f9fb] px-6 py-6 rounded-bl-3xl">
              <div className="mb-5 flex items-end justify-between">
                <div>
                  <p className="text-sm font-medium text-[#43474f]">Subtotal</p>
                  <p className="mt-1 text-xs text-[#747781]">Impuestos y envío calculados al pagar</p>
                </div>
                <span className="text-xl font-bold text-[#002d62]">{formatCurrency(totalPrice)}</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={handleNavigateToCart} className={interactiveClasses.secondaryBtn}>Ver carrito</button>
                <button onClick={handleNavigateToCheckout} className={interactiveClasses.primaryBtn}>Finalizar compra</button>
              </div>
            </footer>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
            <div className="rounded-full border border-[#e0e3e5] bg-[#f2f4f6] p-5 transition-transform duration-300 hover:scale-110">
              <ShoppingCart className="h-8 w-8 text-[#747781]" />
            </div>
            <p className="text-base font-medium text-[#43474f]">Tu carrito está vacío</p>
            <button onClick={handleNavigateToCart} className={`${interactiveClasses.primaryBtn} mt-2 w-full max-w-[200px]`}>
              Continuar comprando
            </button>
          </div>
        )}
      </aside>

      {/* ── Account Drawer ── */}
      <aside className={`fixed right-0 top-0 z-50 flex h-full w-full sm:w-80 flex-col rounded-l-3xl border-l border-[#e0e3e5] bg-[#ffffff] shadow-2xl transition-transform duration-300 ease-in-out will-change-transform ${activeDrawer === 'account' ? 'translate-x-0' : 'translate-x-full'}`} aria-label="Menú de cuenta" aria-hidden={activeDrawer !== 'account'}>
        <header className="flex items-center justify-between border-b border-[#eceef0] px-6 py-5">
          <span className="font-serif text-lg font-semibold tracking-tight text-[#002d62]">{user ? `Hola, ${user.name.split(' ')[0]}` : 'Mi cuenta'}</span>
          <button onClick={closeOverlays} aria-label="Cerrar menú de cuenta" className={interactiveClasses.iconBtn}><X className="h-5 w-5" /></button>
        </header>

        <div className="flex flex-col gap-2 p-5">
          {user ? (
            <>
              <Link href="/account" onClick={closeOverlays} className={`${interactiveClasses.drawerLinkBase} ${pathname.startsWith('/account') ? 'border-[#abc7ff] bg-[#f2f4f6] text-[#115cb9]' : 'text-[#43474f]'}`}>
                <User className="h-4 w-4" /> Mi perfil
              </Link>
              {user.role === 'employee' && (
                <Link href="/admin" onClick={closeOverlays} className={`${interactiveClasses.drawerLinkBase} ${pathname.startsWith('/admin') ? 'border-[#abc7ff] bg-[#d7e2ff] text-[#115cb9]' : 'text-[#115cb9] hover:bg-[#d7e2ff]'}`}>
                  <ShieldCheck className="h-4 w-4" /> Panel de administración
                </Link>
              )}
              <hr className="my-3 border-[#eceef0]" />
              <button onClick={handleLogout} className={interactiveClasses.dangerBtn}><LogOut className="h-4 w-4" /> Cerrar sesión</button>
            </>
          ) : (
            <div className="flex flex-col gap-3">
              <Link href="/signin" onClick={closeOverlays} className={`${interactiveClasses.primaryBtn} text-center`}>Iniciar sesión</Link>
              <Link href="/signup" onClick={closeOverlays} className={`${interactiveClasses.secondaryBtn} text-center`}>Crear cuenta</Link>
            </div>
          )}
        </div>
      </aside>

      {/* ── Main Navbar ── */}
      <nav className="sticky top-0 z-30 w-full border-b border-[#e0e3e5] bg-[#ffffff]/95 backdrop-blur-md supports-[backdrop-filter]:bg-[#ffffff]/80 shadow-sm">
        
        {/* Search Bar Dropdown */}
        {searchOpen && (
          <div className="absolute left-0 top-full w-full border-b border-[#e0e3e5] bg-[#ffffff] px-4 py-4 shadow-md animate-in slide-in-from-top-2">
            <form onSubmit={handleSearchSubmit} className="container mx-auto flex max-w-3xl items-center gap-3">
              <button type="submit" aria-label="Ejecutar búsqueda" className={interactiveClasses.iconBtn}><Search className="h-5 w-5 text-[#115cb9]" /></button>
              <input autoFocus type="search" placeholder="Buscar productos en el ecónomato..." className="flex-1 border-b-2 border-[#e0e3e5] bg-transparent py-2 text-base text-[#191c1e] outline-none transition-all placeholder:text-[#747781] focus:border-[#115cb9]" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
              <button type="button" onClick={() => setSearchOpen(false)} aria-label="Cerrar buscador" className={interactiveClasses.iconBtn}><X className="h-5 w-5" /></button>
            </form>
          </div>
        )}

        <div className="container mx-auto flex h-[4.5rem] items-center justify-between px-4 sm:px-6">
          <BrandLogo />

          {/* Desktop Links */}
          <div className="hidden h-full flex-1 items-center justify-center gap-2 px-6 lg:flex">
            {NAV_LINKS.map(link => {
              // Corrección de estado activo para evitar falsos positivos en la ruta raíz '/'
              const isActive = link.href === '/' 
                ? pathname === '/' 
                : pathname === link.href || pathname.startsWith(`${link.href}/`);
                
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`${interactiveClasses.navLinkBase} ${
                    isActive 
                      ? 'border-[#115cb9] text-[#115cb9] bg-[#f7f9fb]' 
                      : 'border-transparent text-[#43474f] hover:border-[#e0e3e5]'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1 sm:gap-3">
            <button onClick={() => { setSearchOpen(!searchOpen); setActiveDrawer(null); }} className={interactiveClasses.iconBtn} aria-label="Alternar barra de búsqueda" aria-expanded={searchOpen}><Search className="h-5 w-5" /></button>
            <button onClick={() => toggleDrawer('account')} className={`hidden sm:block ${interactiveClasses.iconBtn}`} aria-label="Abrir menú de cuenta" aria-expanded={activeDrawer === 'account'}><User className="h-5 w-5" /></button>
            <Link href="/wishlist" className={`hidden sm:block ${interactiveClasses.iconBtn}`} aria-label="Ver lista de deseos"><Heart className="h-5 w-5" /></Link>
            
            <button onClick={() => toggleDrawer('cart')} className={`${interactiveClasses.iconBtn} border border-[#e0e3e5] bg-[#f7f9fb] hover:border-[#115cb9]`} aria-label={`Abrir carrito con ${totalItems} artículos`} aria-expanded={activeDrawer === 'cart'}>
              <ShoppingCart className="h-5 w-5 text-[#002d62]" />
              {hasItems && <span className="absolute -right-1.5 -top-1.5 flex h-[1.125rem] w-[1.125rem] items-center justify-center rounded-full bg-[#115cb9] text-[10px] font-bold text-white ring-2 ring-[#ffffff] transition-transform duration-200 hover:scale-110 shadow-sm">{totalItems}</span>}
            </button>

            <button onClick={() => { setMobileMenuOpen(!mobileMenuOpen); setActiveDrawer(null); setSearchOpen(false); }} className={`lg:hidden ${interactiveClasses.iconBtn}`} aria-label="Alternar menú móvil" aria-expanded={mobileMenuOpen}><Menu className="h-6 w-6" /></button>
          </div>
        </div>

        {/* Mobile Navigation Links */}
        {mobileMenuOpen && (
          <div className="border-t border-[#e0e3e5] bg-[#ffffff] shadow-lg lg:hidden">
            <div className="container mx-auto flex flex-col gap-2 px-4 py-4">
              {NAV_LINKS.map(link => {
                // Corrección de estado activo
                const isActive = link.href === '/' 
                  ? pathname === '/' 
                  : pathname === link.href || pathname.startsWith(`${link.href}/`);
                  
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`${interactiveClasses.drawerLinkBase} ${
                      isActive 
                        ? 'border-[#abc7ff] bg-[#f2f4f6] text-[#115cb9]' 
                        : 'border-transparent text-[#43474f]'
                    }`}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    {link.label}
                  </Link>
                );
              })}
              <hr className="my-2 border-[#e0e3e5]" />
              <button onClick={() => toggleDrawer('account')} className={`${interactiveClasses.drawerLinkBase} text-[#43474f]`}><User className="h-5 w-5" /> MI CUENTA</button>
              <Link href="/wishlist" onClick={() => setMobileMenuOpen(false)} className={`${interactiveClasses.drawerLinkBase} text-[#43474f]`}><Heart className="h-5 w-5" /> LISTA DE DESEOS</Link>
            </div>
          </div>
        )}
      </nav>
    </>
  );
}