import type {StateStore} from '../../util/state/types';
import type {MessageBus} from '../../util/message/types';
import type {WarehouseService} from '../warehouse/types';

import type {
  CommerceService,
  CommerceState,
  CommerceMessageHandler,
  CommerceServiceConfig,
} from './types';

import {
  syncInventory,
  addToCart,
  removeFromCart,
  purchaseCart,
  expireCartItems,
  getAvailableProductQuantity
} from './methods';

const THIRTY_SECONDS_MS = 30000;

export const createCommerceService = (
  config: CommerceServiceConfig,
  warehouseService: WarehouseService,
  stateStore: StateStore<CommerceState>,
  messageBus: MessageBus
): CommerceService => {
  let syncInterval: NodeJS.Timeout | null = null;
  let expirationInterval: NodeJS.Timeout | null = null;
  let isShuttingDown = false;
  const cartExpirationTimers = new Map<string, NodeJS.Timeout>();

  const handleMessage: CommerceMessageHandler = (msg, state) => {
    switch (msg.type) {
      case 'CART_ITEM_EXPIRED':
        return removeFromCart(state, msg.payload.cartId, msg.payload.productId);
      default:
        return state;
    }
  };

  messageBus.subscribe(async (message) => {
    if (isShuttingDown) return;
    const currentState = await stateStore.get();
    if (currentState) {
      const newState = handleMessage(message, currentState);
      if (newState !== currentState) {
        await stateStore.set(newState);
      }
    }
  });

  const updateState = async (
    updater: (state: CommerceState) => CommerceState
  ): Promise<CommerceState | null> => {
    if (isShuttingDown) return null;

    const current = await stateStore.get();
    if (!current) throw new Error('State not initialized');
    const updated = updater(current);
    await stateStore.set(updated);
    return updated;
  };

  const maybePullWarehouseInventory = async () => {
    if (isShuttingDown) return;

    try {
      console.log('[DEMO][CommerceService][maybePullWarehouseInventory] 🔄 Syncing inventory from WMS...');
      const grossInventory = await warehouseService.getInventory();
      const { items: netInventory } = warehouseService.adjustInventoryForLikelyAvailability(grossInventory);

      await updateState(state => syncInventory(state, netInventory));

      await messageBus.publish({
        type: 'WAREHOUSE_INVENTORY_PULLED',
        payload: {productCount: netInventory.length},
        timestamp: Date.now(),
      });

      console.log(`[DEMO][CommerceService][maybePullWarehouseInventory] ✅ Synced ${netInventory.length} products`);
    } catch (error) {
      console.error('❌ Sync failed:', error);
      await messageBus.publish({
        type: 'INVENTORY_SYNC_FAILED',
        payload: {error: String(error)},
        timestamp: Date.now()
      });
    }
  };

  const startSync = () => {
    syncInterval = setInterval(() => {
      if (!isShuttingDown) {
        maybePullWarehouseInventory();
      }
    }, config.syncIntervalMs);
  };

  const startExpirationCheck = () => {
    const check = async () => {
      if (!isShuttingDown) {
        await updateState(state => expireCartItems(state));
      }
    };

    check();
    expirationInterval = setInterval(check, THIRTY_SECONDS_MS);
  };

  Promise.all([maybePullWarehouseInventory()]).then(() => {
    if (!isShuttingDown) {
      startSync();
      startExpirationCheck();
    }
  });

  const scheduleExpiration = (cartId: string, productId: string) => {
    const timerKey = `${cartId}:${productId}`;

    const timer = setTimeout(async () => {
      if (isShuttingDown) return;

      console.log(`[DEMO][CommerceService][scheduleExpiration]⏰ Expiring ${productId} from cart ${cartId}`);
      await updateState(state => removeFromCart(state, cartId, productId));

      await messageBus.publish({
        type: 'CART_ITEM_EXPIRED',
        payload: {cartId, productId},
        timestamp: Date.now()
      });

      cartExpirationTimers.delete(timerKey);
    }, config.cartExpirationMs);

    cartExpirationTimers.set(timerKey, timer);
  };

  const clearCartExpirationTimers = (cartId: string) => {
    for (const [key, timer] of cartExpirationTimers.entries()) {
      if (key.startsWith(`${cartId}:`)) {
        clearTimeout(timer);
        cartExpirationTimers.delete(key);
      }
    }
  };

  return {
    getAvailability: async (productId: string) => {
      const state = await stateStore.get();
      if (!state) return 0;
      return getAvailableProductQuantity(state, productId);
    },

    addToCart: async (cartId: string, productId: string, quantity: number) => {
      try {
        const current = await stateStore.get();
        if (!current) return false;

        const newState = addToCart(current, cartId, productId, quantity, config.cartExpirationMs);

        if (newState) {
          await stateStore.set(newState);
          scheduleExpiration(cartId, productId);
          console.log(`[DEMO][CommerceService][addToCart] ✅ Added ${quantity}x ${productId} to cart ${cartId}`);

          await messageBus.publish({
            type: 'CART_ITEM_ADDED',
            payload: {cartId, productId, quantity},
            timestamp: Date.now()
          });

          return true;
        }
        return false;
      } catch (error) {
        console.error('Failed to add to cart:', error);
        return false;
      }
    },

    removeFromCart: async (cartId: string, productId: string) => {
      const timerKey = `${cartId}:${productId}`;
      const timer = cartExpirationTimers.get(timerKey);
      if (timer) {
        clearTimeout(timer);
        cartExpirationTimers.delete(timerKey);
      }

      await updateState(state => removeFromCart(state, cartId, productId));
      console.log(`[DEMO][CommerceService][removeFromCart] 🗑️  Removed ${productId} from cart ${cartId}`);

      await messageBus.publish({
        type: 'CART_ITEM_REMOVED',
        payload: {cartId, productId},
        timestamp: Date.now(),
      });
    },

    purchaseCart: async (cartId: string, orderId: string) => {
      try {
        const current = await stateStore.get();
        if (!current) return false;

        const newState = purchaseCart(current, cartId, orderId);

        if (newState) {
          await stateStore.set(newState);
          clearCartExpirationTimers(cartId);

          console.log(`[DEMO][CommerceService][purchaseCart] ✅ Order ${orderId} placed successfully`);

          await messageBus.publish({
            type: 'ORDER_PLACED',
            payload: {cartId, orderId},
            timestamp: Date.now(),
          });

          return true;
        }
        return false;
      } catch (error) {
        console.error('Failed to purchase cart:', error);
        return false;
      }
    },

    getState: async () => {
      const state = await stateStore.get();
      return state ? {...state} : null;
    },

    shutdown: async () => {
      isShuttingDown = true; // Set flag first

      if (syncInterval) {
        clearInterval(syncInterval);
        syncInterval = null;
      }
      if (expirationInterval) {
        clearInterval(expirationInterval);
        expirationInterval = null;
      }

      for (const timer of cartExpirationTimers.values()) {
        clearTimeout(timer);
      }
      cartExpirationTimers.clear();

      await new Promise(resolve => setImmediate(resolve));

      await stateStore.shutdown();
      await messageBus.shutdown();
      console.log('[DEMO][CommerceService][shutDown] 🛑 Commerce service stopped');
    }
  };
};
