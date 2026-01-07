import type {CommerceState} from '../types';

export const purchaseCart = (
  state: CommerceState,
  cartId: string,
  orderId: string
): CommerceState | null => {
  const cart = state.carts[cartId];
  if (!cart || cart.items.length === 0) {
    console.log(`[DEMO][purchaseCart] ❌ Cart ${cartId} is empty or doesn't exist`);
    return null;
  }

  const { [cartId]: _, ...remainingCarts } = state.carts;

  return {
    ...state,
    carts: remainingCarts,
    orders: {
      ...state.orders,
      [orderId]: {
        id: orderId,
        cartId,
        items: cart.items,
        placedAt: Date.now()
      }
    }
  };
};
