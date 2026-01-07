import type {CartItem} from './CartItem';

export type Order = {
  id: string;
  cartId: string;
  items: CartItem[];
  placedAt: number;
};
