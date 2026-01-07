import type {CommerceState} from './CommerceState';

export type CommerceService = {
  getAvailability: (productId: string) => Promise<number>;
  addToCart: (cartId: string, productId: string, quantity: number) => Promise<boolean>;
  removeFromCart: (cartId: string, productId: string) => void;
  purchaseCart: (cartId: string, orderId: string) => Promise<boolean>;
  getState: () => Promise<CommerceState | null>;
  shutdown: () => Promise<void>;
};
