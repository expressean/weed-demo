import type {CommerceState} from '../types/CommerceState';

export const removeFromCart = (
  state: CommerceState,
  cartId: string,
  productId: string
): CommerceState => {
  const cart = state.carts[cartId];
  if (!cart) return state;

  const filteredItems = cart.items.filter(item => item.productId !== productId);

  if (filteredItems.length === 0) {
    const { [cartId]: _, ...remainingCarts } = state.carts;
    return { ...state, carts: remainingCarts };
  }

  return {
    ...state,
    carts: {
      ...state.carts,
      [cartId]: { ...cart, items: filteredItems }
    }
  };
};
