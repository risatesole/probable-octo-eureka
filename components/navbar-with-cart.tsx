// components/navbar-with-cart.tsx

'use client';

import { useState, useCallback } from 'react';
import { Navbar, type NavbarCartItem } from '@/components/navbar';
import { removeProductFromCart, editProductQuantity } from '@/features/cart/service';

export interface NavbarWithCartProps {
  user: {
    name: string;
    profilePicture: string;
    role: string;
  } | null;
  initialCartItems?: NavbarCartItem[];
}

export function NavbarWithCart({ user, initialCartItems = [] }: NavbarWithCartProps) {
  const [cartItems, setCartItems] = useState<NavbarCartItem[]>(initialCartItems);

  const handleRemove = useCallback(
    async (id: NavbarCartItem['id']) => {
      const itemToRemove = cartItems.find((i) => i.id === id);
      if (!itemToRemove) return;

      console.log('[Cart Remove] Item seleccionado:', itemToRemove);

      setCartItems((prev) => prev.filter((i) => i.id !== id));

      try {
        await removeProductFromCart(itemToRemove.productId, 1);
      } catch (error) {
        console.error(
          `[Cart] Fallo al eliminar la variante ${itemToRemove.productId}:`,
          error
        );

        setCartItems((prev) => [...prev, itemToRemove]);
      }
    },
    [cartItems]
  );

  const handleUpdateQuantity = useCallback(
    async (id: NavbarCartItem['id'], quantity: number) => {
      const itemToUpdate = cartItems.find((i) => i.id === id);
      if (!itemToUpdate) return;

      console.log('[Cart Update] Item seleccionado:', itemToUpdate);

      const previousQuantity = itemToUpdate.quantity;

      setCartItems((prev) =>
        prev.map((i) => (i.id === id ? { ...i, quantity } : i))
      );

      try {
        await editProductQuantity(itemToUpdate.productId, quantity);
      } catch (error) {
        console.error(
          `[Cart] Fallo al actualizar variante ${itemToUpdate.productId}:`,
          error
        );

        setCartItems((prev) =>
          prev.map((i) =>
            i.id === id ? { ...i, quantity: previousQuantity } : i
          )
        );
      }
    },
    [cartItems]
  );

  return (
    <Navbar
      user={user}
      cartItems={cartItems}
      onRemoveCartItem={handleRemove}
      onUpdateCartItemQuantity={handleUpdateQuantity}
    />
  );
}