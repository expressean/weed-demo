import {createStateStore} from '../../util/state';
import {createMessageBus} from '../../util/message';
import {createWarehouseService} from '../warehouse';
import {createCommerceService} from './';

import type {WarehouseServiceConfig} from '../warehouse/types';
import type {CommerceServiceConfig, CommerceState} from './types';

const createMockCommerceService = (stakePercentage = 100) => {
  const initialInventoryState: CommerceState = {
    products: {},
    carts: {},
    orders: {},
    lastSync: 0
  };

  const warehouseServiceConfig: WarehouseServiceConfig = {
    stakePercentage
  };

  const SHORT_EXPIRATION_FOR_FAST_TESTING_MS = 100;
  const inventoryServiceConfig: CommerceServiceConfig = {
    syncIntervalMs: 60000,
    cartExpirationMs: SHORT_EXPIRATION_FOR_FAST_TESTING_MS,
    inventoryStakePercentage: stakePercentage
  };

  const warehouseStrategy = 'mockLocal';
  const warehouseService = createWarehouseService(
    warehouseStrategy,
    warehouseServiceConfig
  );

  const uniqueTestKeyToAvoidStatePollution = `test-${Date.now()}-${Math.random()}`;
  const inventoryStateStore = createStateStore(
    'mockLocal',
    uniqueTestKeyToAvoidStatePollution,
    initialInventoryState
  );

  const messageBus = createMessageBus('mockLocal');

  return createCommerceService(
    inventoryServiceConfig,
    warehouseService,
    inventoryStateStore,
    messageBus
  );
};

describe('CommerceService', () => {
  let service: ReturnType<typeof createMockCommerceService> | null = null;

  afterEach(async () => {
    if (service) {
      await service.shutdown();
      service = null;
    }
    await new Promise(resolve => setTimeout(resolve, 150));
  });

  test('blocks second order when inventory insufficient', async () => {
    service = createMockCommerceService();
    await new Promise(resolve => setTimeout(resolve, 100)); // Wait for sync

    const productId = 'og-kush-1';
    const initial = await service.getAvailability(productId);

    expect(initial).toBe(100);

    // user 1 adds 60
    const user1 = await service.addToCart('cart-1', productId, 60);
    expect(user1).toBe(true);
    expect(await service.getAvailability(productId)).toBe(40);

    // user 2 tries 60 (should fail)
    const user2 = await service.addToCart('cart-2', productId, 60);
    expect(user2).toBe(false);
    expect(await service.getAvailability(productId)).toBe(40);

    // explicit cleanup before test ends
    await service.shutdown();
    service = null;
  });

  test('prevents overselling with sequential additions', async () => {
    service = createMockCommerceService();
    await new Promise(resolve => setTimeout(resolve, 100));

    const productId = 'blue-dream-1'; // 150 units

    // sequential additions to test availability checking
    const add1 = await service.addToCart('cart-1', productId, 80);
    expect(add1).toBe(true);
    expect(await service.getAvailability(productId)).toBe(70);

    const add2 = await service.addToCart('cart-2', productId, 80);
    expect(add2).toBe(false); // should fail,  only 70 left
    expect(await service.getAvailability(productId)).toBe(70);
  });

  test('releases inventory on cart expiration', async () => {
    service = createMockCommerceService();
    await new Promise(resolve => setTimeout(resolve, 100));

    const productId = 'sour-diesel-1';

    await service.addToCart('cart-1', productId, 40);
    expect(await service.getAvailability(productId)).toBe(40);

    await new Promise(resolve => setTimeout(resolve, 200));

    expect(await service.getAvailability(productId)).toBe(80);
  });

  test('moves cart to order on purchase', async () => {
    service = createMockCommerceService();
    await new Promise(resolve => setTimeout(resolve, 100));

    const productId = 'gelato-1';

    await service.addToCart('cart-1', productId, 30);
    expect(await service.getAvailability(productId)).toBe(90);

    const purchased = await service.purchaseCart('cart-1', 'order-001');
    expect(purchased).toBe(true);

    const state = await service.getState();
    expect(state?.carts['cart-1']).toBeUndefined();
    expect(state?.orders['order-001']).toBeDefined();
    expect(state?.orders['order-001'].items.length).toBe(1);
  });

  test('respects inventory stake percentage', async () => {
    service = createMockCommerceService(25); // 25% stake
    await new Promise(resolve => setTimeout(resolve, 100));

    const productId = 'og-kush-1';
    const available = await service.getAvailability(productId);

    // OG Kush has 100 units, 25% = 25 units
    expect(available).toBe(25);
  });

  test('both users can purchase after reserving in cart', async () => {
    service = createMockCommerceService();
    await new Promise(resolve => setTimeout(resolve, 100));

    const productId = 'gsc-1'; // 90 units

    // two users add items that fit
    await service.addToCart('cart-1', productId, 40);
    await service.addToCart('cart-2', productId, 40);

    expect(await service.getAvailability(productId)).toBe(10); // 90 - 40 - 40

    // both purchases succeed - items already reserved
    const order1 = await service.purchaseCart('cart-1', 'order-001');
    expect(order1).toBe(true);

    const order2 = await service.purchaseCart('cart-2', 'order-002');
    expect(order2).toBe(true);

    const state = await service.getState();
    expect(state?.orders['order-001']).toBeDefined();
    expect(state?.orders['order-002']).toBeDefined();
  });
});
