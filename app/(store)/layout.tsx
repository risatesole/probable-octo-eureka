// app/(store)/layout.tsx

import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import '../globals.css';

import { cookies } from 'next/headers';

import { NavbarWithCart } from '@/components/navbar-with-cart';
import { Footer } from '@/components/Footer';
import type { NavbarCartItem } from '@/components/navbar';
import { CookieConsentBanner } from '@/components/CookieConsentBanner';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'UASD | Buyfast',
  description: 'The easy way to buy in the UASD',
};

interface UserDetails {
  id: number;
  firstname: string;
  lastname: string;
  email: string;
  role: string;
  profilepicture: string | null;
  is_authenticated: boolean;
}

interface MeResponse {
  status: string;
  message?: string;
  data: {
    user: UserDetails | null;
  };
}

interface CartItemRaw {
  id: number | string; // ID del CartItem
  variant_id: number | string; // ID real de ProductVariant
  product_name: string;
  variant_name?: string; // Nombre de la variante
  product_slug?: string;
  selling_price: number | string;
  quantity: number;
  thumbnail?: string | null;
  total_price?: number | string;
}

interface CartResponse {
  status?: string;
  data: {
    items: CartItemRaw[];
  };
}

async function fetchBackend<T>(endpoint: string): Promise<T | null> {
  const backendUrl = process.env.BACKEND_URL;

  if (!backendUrl) {
    console.warn('[Fetch] BACKEND_URL no está definido en el entorno.');
    return null;
  }

  try {
    const cookieStore = await cookies();

    const res = await fetch(`${backendUrl}${endpoint}`, {
      headers: {
        Cookie: cookieStore.toString(),
        Accept: 'application/json',
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      if (res.status !== 401 && res.status !== 403) {
        console.error(`[Fetch] Fallo en ${endpoint}: HTTP ${res.status}`);
      }

      return null;
    }

    return (await res.json()) as T;
  } catch (error) {
    console.error(`[Fetch] Error de red en ${endpoint}:`, error);
    return null;
  }
}

async function getUserDetails(): Promise<MeResponse | null> {
  return fetchBackend<MeResponse>('/api/v1/me/');
}

async function getCartItems(): Promise<NavbarCartItem[]> {
  const json = await fetchBackend<CartResponse>('/api/v1/cart/');

  if (!json?.data?.items) return [];

  return json.data.items.map((item) => ({
    // ID interno del item en el carrito, usado por el componente visual
    id: String(item.id),

    // Aquí va el ID de la variante, no el ID del CartItem
    productId: Number(item.variant_id),

    // Mostrar producto + variante si existe variant_name
    name: item.variant_name
      ? `${item.variant_name}`
      : item.product_name,

    price: Number(item.selling_price),
    quantity: item.quantity,
    image: item.thumbnail || undefined,
  }));
}

export default async function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [userData, cartItems] = await Promise.all([
    getUserDetails(),
    getCartItems(),
  ]);

  const rawUser = userData?.data?.user;
  const user = rawUser?.is_authenticated ? rawUser : null;

  return (
    <div
      style={{ fontFamily: 'var(--font-geist-sans), sans-serif' }}
      className={`${geistSans.variable} ${geistMono.variable}`}
    >
      <NavbarWithCart
        user={
          user
            ? {
                name: `${user.firstname} ${user.lastname}`,
                profilePicture: user.profilepicture ?? '',
                role: user.role ?? '',
              }
            : null
        }
        initialCartItems={cartItems}
      />

      {children}

      <Footer />
      <CookieConsentBanner />
    </div>
  );
}