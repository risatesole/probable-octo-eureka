// app/(store)/cart/page.tsx

import Link from 'next/link';
import Image from 'next/image';
import { cookies } from 'next/headers';

interface CartItemRaw {
  id: number | string;
  variant_id: number | string;
  product_name: string;
  variant_name?: string;
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

async function getCart(): Promise<CartItemRaw[]> {
  const backendUrl = process.env.BACKEND_URL;

  if (!backendUrl) {
    console.warn('[Cart Page] BACKEND_URL no está definido.');
    return [];
  }

  try {
    const cookieStore = await cookies();

    const response = await fetch(`${backendUrl}/api/v1/cart/`, {
      headers: {
        Cookie: cookieStore.toString(),
        Accept: 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      console.error(`[Cart Page] Error HTTP ${response.status} obteniendo carrito.`);
      return [];
    }

    const json = (await response.json()) as CartResponse;

    return json.data?.items ?? [];
  } catch (error) {
    console.error('[Cart Page] Error obteniendo carrito:', error);
    return [];
  }
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-DO', {
    style: 'currency',
    currency: 'DOP',
  }).format(value);
}

export default async function CartPage() {
  const items = await getCart();

  const subtotal = items.reduce((sum, item) => {
    const price = Number(item.selling_price);
    return sum + price * item.quantity;
  }, 0);

  return (
    <main className="min-h-screen bg-[#f7f9fb] px-4 py-10">
      <section className="mx-auto max-w-6xl">
        <h1 className="mb-8 font-serif text-3xl font-bold text-[#002d62]">
          Carrito de compra
        </h1>

        {items.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
            <p className="mb-6 text-gray-600">Tu carrito está vacío.</p>

             <Link href="/" className="inline-block rounded bg-[#002d62] px-6 py-3 text-white hover:bg-[#004080]">
              Seguir comprando
            </Link>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
            <section className="rounded-lg border border-gray-200 bg-white">
              <div className="border-b border-gray-200 px-6 py-4">
                <h2 className="font-serif text-xl font-bold text-[#002d62]">
                  Productos
                </h2>
              </div>

              <div className="divide-y divide-gray-200">
                {items.map((item) => {
                  const itemName = item.variant_name || item.product_name;
                  const price = Number(item.selling_price);
                  const total = price * item.quantity;

                  return (
                    <article
                      key={item.id}
                      className="grid grid-cols-[96px_1fr] gap-4 px-6 py-5 md:grid-cols-[110px_1fr_auto]"
                    >
                      <div className="relative h-24 w-24 overflow-hidden border border-gray-200 bg-gray-50 md:h-28 md:w-28">
                        {item.thumbnail ? (
                          <img
                            src={item.thumbnail}
                            alt={itemName}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-gray-400">
                            Sin imagen
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col justify-center">
                        <h3 className="font-semibold uppercase text-[#191c1e]">
                          {itemName}
                        </h3>

                        {item.variant_name && item.variant_name !== item.product_name && (
                          <p className="mt-1 text-sm text-gray-500">
                            Producto: {item.product_name}
                          </p>
                        )}

                        <p className="mt-3 text-sm text-gray-600">
                          Cantidad: <span className="font-medium">{item.quantity}</span>
                        </p>

                        <p className="mt-1 text-sm text-gray-600">
                          Precio unitario:{' '}
                          <span className="font-medium">{formatCurrency(price)}</span>
                        </p>
                      </div>

                      <div className="col-span-2 flex items-center justify-between border-t border-gray-100 pt-4 md:col-span-1 md:border-t-0 md:pt-0">
                        <span className="text-sm text-gray-500 md:hidden">Total</span>
                        <span className="font-bold text-[#002d62]">
                          {formatCurrency(total)}
                        </span>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>

            <aside className="h-fit rounded-lg border border-gray-200 bg-white p-6">
              <h2 className="mb-5 font-serif text-xl font-bold text-[#002d62]">
                Resumen del pedido
              </h2>

              <div className="space-y-3 border-b border-gray-200 pb-5 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Productos</span>
                  <span className="font-medium">{items.length}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">{formatCurrency(subtotal)}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">Impuestos y envío</span>
                  <span className="text-gray-500">Calculados al pagar</span>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between">
                <span className="font-serif text-lg font-bold text-[#191c1e]">
                  Total
                </span>
                <span className="font-serif text-xl font-bold text-[#002d62]">
                  {formatCurrency(subtotal)}
                </span>
              </div>

              <div className="mt-6 space-y-3">
                <Link
                  href="/checkout"
                  className="inline-block rounded bg-[#002d62] px-6 py-3 text-white hover:bg-[#004080]"
                >
                  Finalizar compra
                </Link>

                <Link
                  href="/"
                  className="inline-block rounded border border-[#002d62] px-6 py-3 text-[#002d62] hover:bg-[#002d62] hover:text-white"
                >
                  Seguir comprando
                </Link>
              </div>
            </aside>
          </div>
        )}
      </section>
    </main>
  );
}