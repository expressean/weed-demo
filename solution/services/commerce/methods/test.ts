import {
  addToCart,
  expireCartItems,
  getAvailableProductQuantity,
  purchaseCart,
  removeFromCart,
  syncInventory
} from './';

import type { CommerceState, Product } from '../types';

describe('Commerce Methods', () => {
  const mockProducts: Product[] = [
    { id: 'prod-1', sku: 'SKU-001', name: 'Product 1', category: 'Cat1', batchId: 'B001', quantity: 100 },
    { id: 'prod-2', sku: 'SKU-002', name: 'Product 2', category: 'Cat2', batchId: 'B002', quantity: 50 }
  ];

  const createEmptyState = (): CommerceState => ({
    products: {},
    carts: {},
    orders: {},
    lastSync: 0
  });

  describe('syncInventory', () => {
    test('updates products and lastSync timestamp', () => {
      const state = createEmptyState();
      const newState = syncInventory(state, mockProducts);

      expect(Object.keys(newState.products)).toHaveLength(2);
      expect(newState.products['prod-1']).toEqual(mockProducts[0]);
      expect(newState.products['prod-2']).toEqual(mockProducts[1]);
      expect(newState.lastSync).toBeGreaterThan(0);
    });

    test('clears orders after sync', () => {
      const state: CommerceState = {
        products: {},
        carts: {},
        orders: {
          'order-1': {
            id: 'order-1',
            cartId: 'cart-1',
            items: [],
            placedAt: Date.now()
          }
        },
        lastSync: 0
      };

      const newState = syncInventory(state, mockProducts);
      expect(Object.keys(newState.orders)).toHaveLength(0);
    });

    test('preserves carts during sync', () => {
      const state: CommerceState = {
        products: {},
        carts: {
          'cart-1': {
            id: 'cart-1',
            items: [
              { productId: 'prod-1', quantity: 5, addedAt: Date.now(), expiresAt: Date.now() + 10000 }
            ]
          }
        },
        orders: {},
        lastSync: 0
      };

      const newState = syncInventory(state, mockProducts);
      expect(newState.carts['cart-1']).toBeDefined();
      expect(newState.carts['cart-1'].items).toHaveLength(1);
    });

    test('handles empty product list', () => {
      const state = createEmptyState();
      const newState = syncInventory(state, []);

      expect(Object.keys(newState.products)).toHaveLength(0);
      expect(newState.lastSync).toBeGreaterThan(0);
    });
  });

  describe('getAvailableProductQuantity', () => {
    test('returns full quantity when no reservations', () => {
      const state: CommerceState = {
        products: { 'prod-1': mockProducts[0] },
        carts: {},
        orders: {},
        lastSync: Date.now()
      };

      const available = getAvailableProductQuantity(state, 'prod-1');
      expect(available).toBe(100);
    });

    test('reduces quantity by cart items', () => {
      const state: CommerceState = {
        products: { 'prod-1': mockProducts[0] },
        carts: {
          'cart-1': {
            id: 'cart-1',
            items: [
              { productId: 'prod-1', quantity: 10, addedAt: Date.now(), expiresAt: Date.now() + 10000 }
            ]
          }
        },
        orders: {},
        lastSync: Date.now()
      };

      const available = getAvailableProductQuantity(state, 'prod-1');
      expect(available).toBe(90);
    });

    test('reduces quantity by order items', () => {
      const state: CommerceState = {
        products: { 'prod-1': mockProducts[0] },
        carts: {},
        orders: {
          'order-1': {
            id: 'order-1',
            cartId: 'cart-1',
            items: [
              { productId: 'prod-1', quantity: 15, addedAt: Date.now(), expiresAt: Date.now() + 10000 }
            ],
            placedAt: Date.now()
          }
        },
        lastSync: Date.now()
      };

      const available = getAvailableProductQuantity(state, 'prod-1');
      expect(available).toBe(85);
    });

    test('reduces quantity by both carts and orders', () => {
      const state: CommerceState = {
        products: { 'prod-1': mockProducts[0] },
        carts: {
          'cart-1': {
            id: 'cart-1',
            items: [
              { productId: 'prod-1', quantity: 20, addedAt: Date.now(), expiresAt: Date.now() + 10000 }
            ]
          }
        },
        orders: {
          'order-1': {
            id: 'order-1',
            cartId: 'cart-2',
            items: [
              { productId: 'prod-1', quantity: 30, addedAt: Date.now(), expiresAt: Date.now() + 10000 }
            ],
            placedAt: Date.now()
          }
        },
        lastSync: Date.now()
      };

      const available = getAvailableProductQuantity(state, 'prod-1');
      expect(available).toBe(50); // 100 - 20 - 30
    });

    test('returns 0 for non-existent product', () => {
      const state = createEmptyState();
      const available = getAvailableProductQuantity(state, 'non-existent');
      expect(available).toBe(0);
    });

    test('returns 0 when quantity would be negative', () => {
      const state: CommerceState = {
        products: { 'prod-1': { ...mockProducts[0], quantity: 10 } },
        carts: {
          'cart-1': {
            id: 'cart-1',
            items: [
              { productId: 'prod-1', quantity: 15, addedAt: Date.now(), expiresAt: Date.now() + 10000 }
            ]
          }
        },
        orders: {},
        lastSync: Date.now()
      };

      const available = getAvailableProductQuantity(state, 'prod-1');
      expect(available).toBe(0);
    });

    test('handles multiple carts with same product', () => {
      const state: CommerceState = {
        products: { 'prod-1': mockProducts[0] },
        carts: {
          'cart-1': {
            id: 'cart-1',
            items: [
              { productId: 'prod-1', quantity: 10, addedAt: Date.now(), expiresAt: Date.now() + 10000 }
            ]
          },
          'cart-2': {
            id: 'cart-2',
            items: [
              { productId: 'prod-1', quantity: 15, addedAt: Date.now(), expiresAt: Date.now() + 10000 }
            ]
          }
        },
        orders: {},
        lastSync: Date.now()
      };

      const available = getAvailableProductQuantity(state, 'prod-1');
      expect(available).toBe(75); // 100 - 10 - 15
    });
  });

  describe('addToCart', () => {
    test('adds item to new cart', () => {
      const state: CommerceState = {
        products: { 'prod-1': mockProducts[0] },
        carts: {},
        orders: {},
        lastSync: Date.now()
      };

      const newState = addToCart(state, 'cart-1', 'prod-1', 10, 600000);

      expect(newState).not.toBeNull();
      expect(newState!.carts['cart-1']).toBeDefined();
      expect(newState!.carts['cart-1'].items).toHaveLength(1);
      expect(newState!.carts['cart-1'].items[0].productId).toBe('prod-1');
      expect(newState!.carts['cart-1'].items[0].quantity).toBe(10);
    });

    test('rejects when insufficient inventory', () => {
      const state: CommerceState = {
        products: { 'prod-1': mockProducts[0] },
        carts: {},
        orders: {},
        lastSync: Date.now()
      };

      const newState = addToCart(state, 'cart-1', 'prod-1', 150, 600000);
      expect(newState).toBeNull();
    });

    test('rejects duplicate product in same cart', () => {
      const state: CommerceState = {
        products: { 'prod-1': mockProducts[0] },
        carts: {
          'cart-1': {
            id: 'cart-1',
            items: [
              { productId: 'prod-1', quantity: 10, addedAt: Date.now(), expiresAt: Date.now() + 10000 }
            ]
          }
        },
        orders: {},
        lastSync: Date.now()
      };

      const newState = addToCart(state, 'cart-1', 'prod-1', 5, 600000);
      expect(newState).toBeNull();
    });

    test('sets expiration timestamp correctly', () => {
      const state: CommerceState = {
        products: { 'prod-1': mockProducts[0] },
        carts: {},
        orders: {},
        lastSync: Date.now()
      };

      const expirationMs = 300000; // 5 minutes
      const beforeAdd = Date.now();
      const newState = addToCart(state, 'cart-1', 'prod-1', 10, expirationMs);
      const afterAdd = Date.now();

      expect(newState).not.toBeNull();
      const item = newState!.carts['cart-1'].items[0];
      expect(item.addedAt).toBeGreaterThanOrEqual(beforeAdd);
      expect(item.addedAt).toBeLessThanOrEqual(afterAdd);
      expect(item.expiresAt).toBe(item.addedAt + expirationMs);
    });
  });

  describe('removeFromCart', () => {
    test('removes item from cart', () => {
      const state: CommerceState = {
        products: {},
        carts: {
          'cart-1': {
            id: 'cart-1',
            items: [
              { productId: 'prod-1', quantity: 10, addedAt: Date.now(), expiresAt: Date.now() + 10000 }
            ]
          }
        },
        orders: {},
        lastSync: Date.now()
      };

      const newState = removeFromCart(state, 'cart-1', 'prod-1');
      expect(newState.carts['cart-1']).toBeUndefined();
    });

    test('removes cart when last item removed', () => {
      const state: CommerceState = {
        products: {},
        carts: {
          'cart-1': {
            id: 'cart-1',
            items: [
              { productId: 'prod-1', quantity: 10, addedAt: Date.now(), expiresAt: Date.now() + 10000 }
            ]
          }
        },
        orders: {},
        lastSync: Date.now()
      };

      const newState = removeFromCart(state, 'cart-1', 'prod-1');
      expect(Object.keys(newState.carts)).toHaveLength(0);
    });

    test('preserves other items in cart', () => {
      const state: CommerceState = {
        products: {},
        carts: {
          'cart-1': {
            id: 'cart-1',
            items: [
              { productId: 'prod-1', quantity: 10, addedAt: Date.now(), expiresAt: Date.now() + 10000 },
              { productId: 'prod-2', quantity: 5, addedAt: Date.now(), expiresAt: Date.now() + 10000 }
            ]
          }
        },
        orders: {},
        lastSync: Date.now()
      };

      const newState = removeFromCart(state, 'cart-1', 'prod-1');
      expect(newState.carts['cart-1']).toBeDefined();
      expect(newState.carts['cart-1'].items).toHaveLength(1);
      expect(newState.carts['cart-1'].items[0].productId).toBe('prod-2');
    });

    test('returns unchanged state for non-existent cart', () => {
      const state = createEmptyState();
      const newState = removeFromCart(state, 'non-existent', 'prod-1');
      expect(newState).toEqual(state);
    });
  });

  describe('expireCartItems', () => {
    test('removes expired items', () => {
      const now = Date.now();
      const state: CommerceState = {
        products: {},
        carts: {
          'cart-1': {
            id: 'cart-1',
            items: [
              { productId: 'prod-1', quantity: 10, addedAt: now - 20000, expiresAt: now - 10000 }
            ]
          }
        },
        orders: {},
        lastSync: Date.now()
      };

      const newState = expireCartItems(state);
      expect(Object.keys(newState.carts)).toHaveLength(0);
    });

    test('preserves non-expired items', () => {
      const now = Date.now();
      const state: CommerceState = {
        products: {},
        carts: {
          'cart-1': {
            id: 'cart-1',
            items: [
              { productId: 'prod-1', quantity: 10, addedAt: now, expiresAt: now + 10000 }
            ]
          }
        },
        orders: {},
        lastSync: Date.now()
      };

      const newState = expireCartItems(state);
      expect(newState.carts['cart-1']).toBeDefined();
      expect(newState.carts['cart-1'].items).toHaveLength(1);
    });

    test('handles mixed expired and non-expired items', () => {
      const now = Date.now();
      const state: CommerceState = {
        products: {},
        carts: {
          'cart-1': {
            id: 'cart-1',
            items: [
              { productId: 'prod-1', quantity: 10, addedAt: now - 20000, expiresAt: now - 10000 },
              { productId: 'prod-2', quantity: 5, addedAt: now, expiresAt: now + 10000 }
            ]
          }
        },
        orders: {},
        lastSync: Date.now()
      };

      const newState = expireCartItems(state);
      expect(newState.carts['cart-1'].items).toHaveLength(1);
      expect(newState.carts['cart-1'].items[0].productId).toBe('prod-2');
    });
  });

  describe('purchaseCart', () => {
    test('converts cart to order', () => {
      const state: CommerceState = {
        products: {},
        carts: {
          'cart-1': {
            id: 'cart-1',
            items: [
              { productId: 'prod-1', quantity: 10, addedAt: Date.now(), expiresAt: Date.now() + 10000 }
            ]
          }
        },
        orders: {},
        lastSync: Date.now()
      };

      const newState = purchaseCart(state, 'cart-1', 'order-1');

      expect(newState).not.toBeNull();
      expect(newState!.carts['cart-1']).toBeUndefined();
      expect(newState!.orders['order-1']).toBeDefined();
      expect(newState!.orders['order-1'].cartId).toBe('cart-1');
      expect(newState!.orders['order-1'].items).toHaveLength(1);
    });

    test('returns null for non-existent cart', () => {
      const state = createEmptyState();
      const newState = purchaseCart(state, 'non-existent', 'order-1');
      expect(newState).toBeNull();
    });

    test('returns null for empty cart', () => {
      const state: CommerceState = {
        products: {},
        carts: {
          'cart-1': {
            id: 'cart-1',
            items: []
          }
        },
        orders: {},
        lastSync: Date.now()
      };

      const newState = purchaseCart(state, 'cart-1', 'order-1');
      expect(newState).toBeNull();
    });

    test('sets placedAt timestamp', () => {
      const state: CommerceState = {
        products: {},
        carts: {
          'cart-1': {
            id: 'cart-1',
            items: [
              { productId: 'prod-1', quantity: 10, addedAt: Date.now(), expiresAt: Date.now() + 10000 }
            ]
          }
        },
        orders: {},
        lastSync: Date.now()
      };

      const beforePurchase = Date.now();
      const newState = purchaseCart(state, 'cart-1', 'order-1');
      const afterPurchase = Date.now();

      expect(newState).not.toBeNull();
      expect(newState!.orders['order-1'].placedAt).toBeGreaterThanOrEqual(beforePurchase);
      expect(newState!.orders['order-1'].placedAt).toBeLessThanOrEqual(afterPurchase);
    });
  });
});
