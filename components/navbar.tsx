'use client';

import { useState, useMemo, useCallback } from 'react';
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

// Corrección de Rutas (Capa de Enrutamiento vs Capa de Presentación)
const NAV_LINKS = [
  { href: '/categories', label: 'Categorías' },     // Restaurado al endpoint original del App Router
  { href: '/catalog', label: 'Catálogo' },
  { href: '/bundles', label: 'Combos y Ofertas' },
  { href: '/contact', label: 'Contacto' },
] as const;

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP' }).format(amount);

// ── Shared Tailwind Classes (Design System - Strict Shape) ──────

const interactiveClasses = {
  iconBtn: "relative p-2 text-slate-600 transition-colors duration-200 ease-in-out hover:bg-[#f2f4f6] hover:text-[#115cb9] active:scale-95 rounded-none",
  primaryBtn: "bg-[#002d62] px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-200 ease-in-out hover:bg-[#115cb9] active:scale-95 rounded-none",
  secondaryBtn: "border border-[#e2e8f0] bg-white px-4 py-2.5 text-sm font-medium text-[#43474f] transition-colors duration-200 ease-in-out hover:border-[#115cb9] hover:text-[#115cb9] active:scale-95 rounded-none",
  dangerBtn: "flex items-center gap-3 px-3 py-2 text-left text-sm font-medium text-[#ba1a1a] transition-colors duration-200 ease-in-out hover:bg-[#ffdad6] active:scale-95 rounded-none",
  navLinkBase: "inline-flex h-full items-center border-b-2 px-4 text-sm font-medium transition-all duration-200 ease-in-out hover:bg-[#f2f4f6] hover:text-[#115cb9]",
  drawerLinkBase: "flex items-center gap-3 border-l-2 px-3 py-2.5 text-sm font-medium transition-all duration-200 ease-in-out hover:bg-[#f2f4f6] hover:text-[#115cb9] rounded-none",
};

// ── Components ─────────────────────────────────────────────────

const BrandLogo = () => (
  <Link 
    href="/" 
    className="mr-6 flex flex-shrink-0 items-center gap-2 transition-opacity duration-300 ease-in-out hover:opacity-80 active:scale-[0.98]"
  >
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 41" width="32" height="32" aria-hidden="true">
      <path d="M40 13.4683C40.0001 10.7823 39.1891 8.1589 37.673 5.9417C36.1569 3.72451 34.0065 2.01688 31.5035 1.04252C29.0005 0.0681476 26.2615 -0.127534 23.6455 0.48109C21.0293 1.08971 18.658 2.47428 16.8421 4.45341H0V40H35.5601V23.3873C36.9557 22.139 38.0726 20.6104 38.8377 18.9012C39.6027 17.192 39.9988 15.3409 40 13.4683ZM33.1579 13.4683C33.1606 14.7553 32.7814 16.0143 32.0683 17.0858C31.3551 18.1572 30.3402 18.9931 29.1518 19.4874C27.9634 19.9819 26.6552 20.1127 25.3924 19.8631C24.1298 19.6137 22.9695 18.9953 22.0584 18.0861C21.1474 17.1769 20.5266 16.0179 20.2745 14.7557C20.0224 13.4936 20.1505 12.185 20.6424 10.9957C21.1343 9.80626 21.968 8.78957 23.0379 8.07423C24.108 7.35888 25.3661 6.97705 26.6532 6.97703C28.376 6.97703 30.0285 7.6605 31.2479 8.87745C32.4675 10.0944 33.1544 11.7455 33.1579 13.4683ZM28.7179 33.1579H6.84211V11.2955H13.5088C13.38 12.0128 13.3123 12.7397 13.3063 13.4683C13.31 17.007 14.7173 20.3997 17.2196 22.902C19.7217 25.4042 23.1144 26.8116 26.6532 26.8151C27.3451 26.8115 28.0355 26.7528 28.7179 26.6397V33.1579Z" fill="#002d62" />
    </svg>
    <div className="flex flex-col">
      <span className="font-serif text-lg font-extrabold leading-none tracking-tight text-[#002d62]">UASD</span>
      <span className="text-[10px] font-bold uppercase tracking-wider text-[#43474f]">BuyFast Ecónomato</span>
    </div>
  </Link>
);

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

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;
    
    closeOverlays();
    router.push(`/search?q=${encodeURIComponent(query)}`);
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/v1/signout/', { method: 'POST', credentials: 'include' });
    } finally {
      closeOverlays();
      router.push('/signin');
    }
  };

  return (
    <>
      {activeDrawer && (
        <div className="fixed inset-0 z-40 bg-[#191c1e]/40 backdrop-blur-sm transition-opacity" onClick={closeOverlays} aria-hidden="true" />
      )}

      {/* ── Cart Drawer ── */}
      <aside className={`fixed right-0 top-0 z-50 flex h-full w-full sm:w-96 flex-col border-l border-[#e2e8f0] bg-[#ffffff] transition-transform duration-300 ease-in-out will-change-transform ${activeDrawer === 'cart' ? 'translate-x-0' : 'translate-x-full'}`} aria-label="Carrito de compras" aria-hidden={activeDrawer !== 'cart'}>
        <header className="flex items-center justify-between border-b border-[#e2e8f0] px-6 py-4">
          <div className="flex items-center gap-2">
            <h2 className="font-serif text-lg font-semibold tracking-tight text-[#002d62]">Carrito</h2>
            {hasItems && <span className="flex h-5 w-5 items-center justify-center rounded-sm bg-[#115cb9] text-[10px] font-bold text-white">{totalItems}</span>}
          </div>
          <button onClick={closeOverlays} aria-label="Cerrar carrito" className={interactiveClasses.iconBtn}><X className="h-5 w-5" /></button>
        </header>

        {hasItems ? (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-2">
              {cartItems.map(item => (
                <article key={item.id} className="group flex gap-4 border-b border-[#e2e8f0] py-4 transition-colors hover:bg-[#f2f4f6] last:border-0">
                  <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-none border border-[#e2e8f0] bg-[#f7f9fb]">
                    {item.image ? <Image src={item.image} alt={item.name} fill className="object-cover transition-transform duration-300 group-hover:scale-105" sizes="80px" /> : <div className="flex h-full w-full items-center justify-center"><ShoppingCart className="h-6 w-6 text-[#747781]" /></div>}
                  </div>
                  <div className="flex flex-1 flex-col justify-between">
                    <div>
                      <h3 className="line-clamp-2 text-sm font-medium leading-tight transition-colors group-hover:text-[#115cb9]">{item.name}</h3>
                      {item.variant && <p className="mt-1 text-xs text-[#747781]">{item.variant}</p>}
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-sm font-semibold text-[#191c1e]">{formatCurrency(item.price)}</span>
                      <div className="flex items-center gap-2">
                        <input type="number" min={1} value={item.quantity} onChange={e => { const val = parseInt(e.target.value, 10); if (val > 0) onUpdateCartItemQuantity?.(item.id, val); }} className="w-12 rounded-none border border-[#e2e8f0] bg-transparent px-2 py-1 text-center text-sm outline-none transition-all duration-200 focus:border-b-2 focus:border-[#115cb9]" aria-label={`Cantidad de ${item.name}`} />
                        <button onClick={() => onRemoveCartItem?.(item.id)} className="text-xs font-medium text-[#747781] transition-all duration-200 hover:text-[#ba1a1a] hover:underline active:scale-95" aria-label={`Eliminar ${item.name} del carrito`}>Eliminar</button>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
            <footer className="border-t border-[#e2e8f0] bg-[#f7f9fb] px-6 py-5">
              <div className="mb-4 flex items-end justify-between">
                <div>
                  <p className="text-sm text-[#43474f]">Subtotal</p>
                  <p className="mt-0.5 text-xs text-[#747781]">Impuestos y <span className="cursor-pointer underline transition-colors hover:text-[#115cb9]">envío</span> calculados al pagar</p>
                </div>
                <span className="text-lg font-bold text-[#191c1e]">{formatCurrency(totalPrice)}</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => { closeOverlays(); router.push('/cart'); }} className={interactiveClasses.secondaryBtn}>Ver carrito</button>
                <button onClick={() => { onCheckout?.(); router.push('/checkout'); }} className={interactiveClasses.primaryBtn}>Finalizar compra</button>
              </div>
            </footer>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
            <div className="rounded-none border border-[#e2e8f0] bg-[#f2f4f6] p-4 transition-transform duration-300 hover:scale-110"><ShoppingCart className="h-8 w-8 text-[#747781]" /></div>
            <p className="text-sm font-medium text-[#43474f]">Tu carrito está vacío</p>
            <button onClick={() => { closeOverlays(); router.push('/products'); }} className={interactiveClasses.primaryBtn + " mt-2 w-full"}>Continuar comprando</button>
          </div>
        )}
      </aside>

      {/* ── Account Drawer ── */}
      <aside className={`fixed right-0 top-0 z-50 flex h-full w-full sm:w-80 flex-col border-l border-[#e2e8f0] bg-[#ffffff] transition-transform duration-300 ease-in-out will-change-transform ${activeDrawer === 'account' ? 'translate-x-0' : 'translate-x-full'}`} aria-label="Menú de cuenta" aria-hidden={activeDrawer !== 'account'}>
        <header className="flex items-center justify-between border-b border-[#e2e8f0] px-6 py-4">
          <span className="font-serif font-semibold text-[#002d62]">{user ? `Hola, ${user.name.split(' ')[0]}` : 'Mi cuenta'}</span>
          <button onClick={closeOverlays} aria-label="Cerrar menú de cuenta" className={interactiveClasses.iconBtn}><X className="h-5 w-5" /></button>
        </header>

        <div className="flex flex-col gap-2 p-4">
          {user ? (
            <>
              <Link href="/account" onClick={closeOverlays} className={`${interactiveClasses.drawerLinkBase} ${pathname.startsWith('/account') ? 'border-[#115cb9] bg-[#f2f4f6] text-[#115cb9]' : 'border-transparent text-[#43474f]'}`}>
                <User className="h-4 w-4" /> Mi perfil
              </Link>
              {user.role === 'employee' && (
                <Link href="/admin" onClick={closeOverlays} className={`${interactiveClasses.drawerLinkBase} ${pathname.startsWith('/admin') ? 'border-[#115cb9] bg-[#d7e2ff] text-[#115cb9]' : 'border-transparent text-[#115cb9] hover:bg-[#d7e2ff]'}`}>
                  <ShieldCheck className="h-4 w-4" /> Panel de administración
                </Link>
              )}
              <hr className="my-2 border-[#e2e8f0]" />
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
      <nav className="sticky top-0 z-30 w-full border-b border-[#e2e8f0] bg-[#ffffff]/95 backdrop-blur supports-[backdrop-filter]:bg-[#ffffff]/80">
        
        {/* Search Bar Dropdown */}
        {searchOpen && (
          <div className="absolute left-0 top-full w-full border-b border-[#e2e8f0] bg-[#ffffff] px-4 py-3 animate-in slide-in-from-top-2">
            <form onSubmit={handleSearchSubmit} className="container mx-auto flex max-w-3xl items-center gap-3">
              <button type="submit" aria-label="Ejecutar búsqueda" className={interactiveClasses.iconBtn}><Search className="h-4 w-4" /></button>
              <input autoFocus type="search" placeholder="Buscar productos en el ecónomato..." className="flex-1 border-b border-transparent bg-transparent pb-1 text-sm text-[#191c1e] outline-none transition-all placeholder:text-[#747781] focus:border-[#115cb9]" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
              <button type="button" onClick={() => setSearchOpen(false)} aria-label="Cerrar buscador" className={interactiveClasses.iconBtn}><X className="h-4 w-4" /></button>
            </form>
          </div>
        )}

        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <BrandLogo />

          {/* Desktop Links */}
          <div className="hidden h-16 flex-1 items-center justify-center gap-2 px-6 md:flex">
            {NAV_LINKS.map(link => {
              const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`${interactiveClasses.navLinkBase} ${
                    isActive 
                      ? 'border-[#115cb9] bg-[#f7f9fb] text-[#115cb9]' 
                      : 'border-transparent text-[#43474f]'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1 sm:gap-2">
            <button onClick={() => { setSearchOpen(!searchOpen); setActiveDrawer(null); }} className={interactiveClasses.iconBtn} aria-label="Alternar barra de búsqueda" aria-expanded={searchOpen}><Search className="h-5 w-5" /></button>
            <button onClick={() => toggleDrawer('account')} className={`hidden sm:block ${interactiveClasses.iconBtn}`} aria-label="Abrir menú de cuenta" aria-expanded={activeDrawer === 'account'}><User className="h-5 w-5" /></button>
            <Link href="/wishlist" className={`hidden sm:block ${interactiveClasses.iconBtn}`} aria-label="Ver lista de deseos"><Heart className="h-5 w-5" /></Link>
            
            <button onClick={() => toggleDrawer('cart')} className={interactiveClasses.iconBtn} aria-label={`Abrir carrito con ${totalItems} artículos`} aria-expanded={activeDrawer === 'cart'}>
              <ShoppingCart className="h-5 w-5" />
              {hasItems && <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-sm bg-[#115cb9] text-[10px] font-bold text-white ring-2 ring-[#ffffff] transition-transform duration-200 hover:scale-110">{totalItems}</span>}
            </button>

            <button onClick={() => { setMobileMenuOpen(!mobileMenuOpen); setActiveDrawer(null); setSearchOpen(false); }} className={`md:hidden ${interactiveClasses.iconBtn}`} aria-label="Alternar menú móvil" aria-expanded={mobileMenuOpen}><Menu className="h-5 w-5" /></button>
          </div>
        </div>

        {/* Mobile Navigation Links */}
        {mobileMenuOpen && (
          <div className="border-t border-[#e2e8f0] bg-[#ffffff] md:hidden">
            <div className="container mx-auto flex flex-col gap-1 px-4 py-3">
              {NAV_LINKS.map(link => {
                const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`${interactiveClasses.drawerLinkBase} ${
                      isActive 
                        ? 'border-[#115cb9] bg-[#f2f4f6] text-[#115cb9]' 
                        : 'border-transparent text-[#43474f]'
                    }`}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    {link.label}
                  </Link>
                );
              })}
              <hr className="my-2 border-[#e2e8f0]" />
              <button onClick={() => toggleDrawer('account')} className={`${interactiveClasses.drawerLinkBase} border-transparent text-[#43474f]`}><User className="h-4 w-4" /> Mi cuenta</button>
              <Link href="/wishlist" onClick={() => setMobileMenuOpen(false)} className={`${interactiveClasses.drawerLinkBase} border-transparent text-[#43474f]`}><Heart className="h-4 w-4" /> Lista de deseos</Link>
            </div>
          </div>
        )}
      </nav>
    </>
  );
}