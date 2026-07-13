import type { Product } from '@/entities/product';
export type CartItem = {
  id: number; // product variant id
  name: string;
  description: string;
  selling_price: number;
  slug: string;
  tax_rate: number;
  quantity: number;
  thumbnail: string;
};
