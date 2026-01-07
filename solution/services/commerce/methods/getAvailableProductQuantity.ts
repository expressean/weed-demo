import type {CommerceState} from '../types';

export const getAvailableProductQuantity =
  (state: CommerceState, productId: string): number => {
    const product = state.products[productId];
    if (!product) return 0;

    let mutAvailable = product.quantity;

    const _reduceByItemsInCarts = () => Object.values(state.carts).forEach(cart => {
      cart.items
        .filter(item => item.productId === productId)
        .forEach(item => {
          mutAvailable -= item.quantity;
        });
    });

    const _reduceByItemsInOrders = () => Object.values(state.orders).forEach(order => {
      order.items
        .filter(item => item.productId === productId)
        .forEach(item => {
          mutAvailable -= item.quantity;
        });
    });

    _reduceByItemsInCarts();
    _reduceByItemsInOrders();

    return Math.max(0, mutAvailable);
  };
