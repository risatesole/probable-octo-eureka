// features/cart/service/index.ts

import { addProductToCart } from './helpers/AddProductToCart';
import { getCart } from './helpers/GetProductsInCart';
import { removeProductFromCart } from './helpers/RemoveProductFromCart';
import { editProductQuantity } from './helpers/EditProductQuantity';

export type { GetCartResponse } from './helpers/GetProductsInCart';
export type { RemoveCartResponse } from './helpers/RemoveProductFromCart';
export type { EditQuantityResponse } from './helpers/EditProductQuantity';

export interface AddCartPayload {
  variantId: string | number;
  quantity: number;
}

// Exportación nombrada explícita para el AST de Turbopack
export {
  addProductToCart,
  getCart,
  removeProductFromCart,
  editProductQuantity
};