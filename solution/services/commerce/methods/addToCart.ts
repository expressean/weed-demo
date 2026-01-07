import type {CartItem, CommerceState} from '../types';
import {getAvailableProductQuantity} from './getAvailableProductQuantity';

export const addToCart = (
  state: CommerceState,
  cartId: string,
  productId: string,
  quantity: number,
  expirationMs: number
): CommerceState | null => {
  const available = getAvailableProductQuantity(state, productId);

  if (available < quantity) {
    console.log(`[DEMO][addToCart] ❌ Insufficient inventory for ${productId}. Available: ${available}, Requested: ${quantity}`);
    return null;
  }

  const cart = state.carts[cartId] || {id: cartId, items: []};

  const existingItemIndex = cart.items.findIndex(item => item.productId === productId);
  if (existingItemIndex !== -1) {
    console.log(`[DEMO][addToCart] ❌ Product ${productId} already in cart ${cartId}. Remove it first to change quantity.`);
    return null;
  }

  const now = Date.now();
  const newItem: CartItem = {
    productId,
    quantity,
    addedAt: now,
    expiresAt: now + expirationMs
  };

  return {
    ...state,
    carts: {
      ...state.carts,
      [cartId]: {
        ...cart,
        items: [...cart.items, newItem]
      }
    }
  };
};
