import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import '../globals.css';

import { cookies } from 'next/headers';

import { NavbarWithCart } from '@/components/navbar-with-cart';
import { Footer } from '@/components/Footer';
import type { NavbarCartItem } from '@/components/navbar';
import { AlertBanner } from '@/components/AlertBanner';
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

type MeResponse = {
  status: string;
  message?: string;
  data: {
    user: {
      id: number;
      firstname: string;
      lastname: string;
      email: string;
      role: string;
      profilepicture: string | null;
      is_authenticated: boolean;
    } | null;
  };
};

async function getUserDetails(): Promise<MeResponse | null> {
  try {
    const backendUrl = process.env.BACKEND_URL;
    if (!backendUrl) return null;

    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();

    const res = await fetch(`${backendUrl}/api/v1/me`, {
      headers: { Cookie: cookieHeader },
      cache: 'no-store',
    });

    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function getCartItems(): Promise<NavbarCartItem[]> {
  try {
    const backendUrl = process.env.BACKEND_URL;
    if (!backendUrl) return [];

    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();

    const res = await fetch(`${backendUrl}/api/v1/cart/`, {
      headers: { Cookie: cookieHeader },
      cache: 'no-store',
    });

    if (!res.ok) {
      console.error('[Cart] Failed to fetch cart:', res.status);
      return [];
    }

    const json = await res.json();
    const items = json.data.items.map((item: any) => ({
      id: item.id,
      name: item.name,
      productId: item.id,
      price: item.selling_price,
      quantity: item.quantity,
      image: item.thumbnail || undefined,
    }));

    console.log('[Cart] Loaded items:', items.length);
    return items;
  } catch (error) {
    console.error('[Cart] Error fetching cart items:', error);
    return [];
  }
}

export default async function HomeLayout({ children }: { children: React.ReactNode }) {
  const [userData, cartItems] = await Promise.all([getUserDetails(), getCartItems()]);
  const rawUser = userData?.data?.user;
  const user = rawUser?.is_authenticated ? rawUser : null;

  return (
    <div
      style={{ fontFamily: 'var(--font-geist-sans), sans-serif' }}
      className={`${geistSans.variable} ${geistMono.variable}`}
    >
      {/* <AlertBanner
          type="info"
          message="Please verify your email address to unlock all features"
          dismissible={true}
        /> */}

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
