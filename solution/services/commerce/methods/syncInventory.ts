import type {Product, CommerceState} from '../types';

export const syncInventory =
  (state: CommerceState, products: Product[] = []): CommerceState => {
    const productsMap = products.reduce((acc, product) => ({
      ...acc,
      [product.id]: product
    }), {} as Record<string, Product>);

    return {
      ...state,
      products: productsMap,
      lastSync: Date.now(),

      // ASSUMPTION
      // assuming orders have been received by WMS, and subsequent
      // warehouse inventory pulls will account for their claimed items offset
      orders: {}
    };
  };
