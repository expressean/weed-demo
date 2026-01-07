import type {Cart, Order, Product} from './';

export type CommerceState = {
  products: Record<string, Product>;
  carts: Record<string, Cart>;
  orders: Record<string, Order>;
  lastSync: number;
};
