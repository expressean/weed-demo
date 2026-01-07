import type {CommerceState} from '../types';
import {removeFromCart} from './removeFromCart';

export const expireCartItems = (state: CommerceState): CommerceState => {
  const now = Date.now();
  let newState = state;

  Object.entries(state.carts).forEach(([cartId, cart]) => {
    cart.items.forEach(item => {
      if (item.expiresAt <= now) {
        console.log(`[DEMO][expireCartItems]⏰ Expiring ${item.productId} from cart ${cartId}`);
        newState = removeFromCart(newState, cartId, item.productId);
      }
    });
  });

  return newState;
};
