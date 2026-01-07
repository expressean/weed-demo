import type {CartItem} from './CartItem';

export type Cart = {
  id: string;
  items: CartItem[];
};
