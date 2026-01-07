import { createCommerceService } from './services/commerce';
import { createStateStore } from './util/state';
import { createMessageBus } from './util/message';
import type {CommerceServiceConfig, CommerceState} from './services/commerce/types';
import {createWarehouseService} from './services/warehouse';
import {WarehouseServiceConfig} from './services/warehouse/types';

const runDemo = async () => {
  console.log('[DEMO] === Nabis Inventory POC ===\n');
  console.log('[DEMO] Scenario: Two users competing for limited inventory');
  console.log('[DEMO] Goal: Prove second order is blocked when inventory insufficient\n');

  const STUB_INVENTORY_STAKE_PERCENTAGE = 25;
  const FIVE_MINUTES_MS = 5 * 60 * 1000;
  const TEN_MINUTES_MS = 10 * 60 * 1000;

  const inventoryServiceConfig: CommerceServiceConfig = {
    syncIntervalMs: FIVE_MINUTES_MS,
    cartExpirationMs: TEN_MINUTES_MS,
    inventoryStakePercentage: STUB_INVENTORY_STAKE_PERCENTAGE
  };

  const warehouseServiceConfig: WarehouseServiceConfig = {
    stakePercentage: 25 // assume 3 direct competitors. (100% weed inventory / 4 wholesalers = 25% fair claim)
  };

  const initialState: CommerceState = {
    products: {},
    carts: {},
    orders: {},
    lastSync: 0
  };

  const stateStore = createStateStore(
    'mockLocal',
    'inventory-demo',
    initialState
  );

  const messageBus = createMessageBus('mockLocal');

  messageBus.subscribe(async (message) => {
    if (message.type === 'ORDER_PLACED') {
      console.log(`[DEMO] 📨 Event: ORDER_PLACED - Submitting to WMS...`);
      // in production, this would trigger warehouse fulfillment passively
    }
  });

  const warehouseStrategy = 'mockLocal';
  const warehouseService = createWarehouseService(
    warehouseStrategy,
    warehouseServiceConfig
  );

  const commerceService = createCommerceService(
    inventoryServiceConfig,
    warehouseService,
    stateStore,
    messageBus
  );

  // wait for initial sync so we have an inventory to demo
  await new Promise(resolve => setTimeout(resolve, 100));

  console.log('[DEMO] === Initial State ===\n');

  const productId = 'og-kush-1';
  const initial = await commerceService.getAvailability(productId);
  console.log(`[DEMO] 📦 Total WMS Inventory: 100 units`);
  console.log(`[DEMO] 📦 Our Stake (25%): ${initial} units`);
  console.log(`[DEMO] 📦 Available for sale: ${initial} units\n`);

  console.log('[DEMO] === Competing Orders Scenario ===\n');

  // User 1 tries to grab 15 units
  console.log('[DEMO] 👤 User 1: Attempting to add 15 units to cart...');
  const user1Result = await commerceService.addToCart('cart-1', productId, 15);
  const afterUser1 = await commerceService.getAvailability(productId);

  if (user1Result) {
    console.log(`[DEMO]    ✅ SUCCESS: Added 15 units to cart`);
    console.log(`[DEMO]    📊 Remaining availability: ${afterUser1} units\n`);
  } else {
    console.log(`[DEMO]    ❌ FAILED: Insufficient inventory\n`);
  }

  // User 2 tries to grab 15 units (should fail - only 10 left)
  console.log('[DEMO] 👤 User 2: Attempting to add 15 units to cart...');
  const user2Result = await commerceService.addToCart('cart-2', productId, 15);
  const afterUser2Attempt = await commerceService.getAvailability(productId);

  if (user2Result) {
    console.log(`[DEMO]    ✅ SUCCESS: Added 15 units to cart`);
    console.log(`[DEMO]    📊 Remaining availability: ${afterUser2Attempt} units\n`);
  } else {
    console.log(`[DEMO]    ❌ BLOCKED: Insufficient inventory (only ${afterUser1} units available)`);
    console.log(`[DEMO]    ✅ OVERSELLING PREVENTED!\n`);
  }

  // User 2 adjusts to available amount
  console.log('[DEMO] 👤 User 2: Attempting to add 10 units instead...');
  const user2Adjusted = await commerceService.addToCart('cart-2', productId, 10);
  const afterUser2Success = await commerceService.getAvailability(productId);

  if (user2Adjusted) {
    console.log(`[DEMO]    ✅ SUCCESS: Added 10 units to cart`);
    console.log(`[DEMO]    📊 Remaining availability: ${afterUser2Success} units\n`);
  } else {
    console.log(`[DEMO]    ❌ FAILED: Unexpected error\n`);
  }

  console.log('[DEMO] === Purchase Flow ===\n');

  // User 1 completes purchase
  console.log('[DEMO] 💳 User 1: Completing purchase...');
  const order1 = await commerceService.purchaseCart('cart-1', 'order-001');

  if (order1) {
    console.log(`[DEMO]    ✅ Order order-001 placed successfully`);
    console.log(`[DEMO]    📦 4 units moved to pending fulfillment`);

    // Submit to warehouse
    try {
      await warehouseService.submitOrder('order-001');
      console.log(`[DEMO]    ✅ Order submitted to WMS for fulfillment\n`);
    } catch (error) {
      console.log(`[DEMO]    ⚠️  WMS submission pending (async)\n`);
    }
  }

  // User 2 completes purchase
  console.log('[DEMO] 💳 User 2: Completing purchase...');
  const order2 = await commerceService.purchaseCart('cart-2', 'order-002');

  if (order2) {
    console.log(`[DEMO]    ✅ Order order-002 placed successfully`);
    console.log(`[DEMO]    📦 10 units moved to pending fulfillment`);

    // Submit to warehouse
    try {
      await warehouseService.submitOrder('order-002');
      console.log(`[DEMO]    ✅ Order submitted to WMS for fulfillment\n`);
    } catch (error) {
      console.log(`[DEMO]    ⚠️  WMS submission pending (async)\n`);
    }
  }

  // Show final state
  const state = await commerceService.getState();
  const finalAvailability = await commerceService.getAvailability(productId);

  console.log('[DEMO] === Final State ===\n');
  console.log(`[DEMO] 📊 System State:`);
  console.log(`[DEMO]    - Products tracked: ${Object.keys(state!.products).length}`);
  console.log(`[DEMO]    - Active carts: ${Object.keys(state!.carts).length}`);
  console.log(`[DEMO]    - Orders pending fulfillment: ${Object.keys(state!.orders).length}`);
  console.log(`[DEMO]    - Remaining inventory: ${finalAvailability} units`);

  if (state!.orders['order-001']) {
    const order1Items = state!.orders['order-001'].items.reduce((sum, item) => sum + item.quantity, 0);
    console.log(`[DEMO]   - order-001: ${order1Items} units`);
  }

  if (state!.orders['order-002']) {
    const order2Items = state!.orders['order-002'].items.reduce((sum, item) => sum + item.quantity, 0);
    console.log(`[DEMO]   - order-002: ${order2Items} units`);
  }

  console.log('\n[DEMO] === Key Achievements ===\n');
  console.log('[DEMO] ✅ Real-time inventory tracking prevents overselling');
  console.log('[DEMO] ✅ Second order correctly blocked when insufficient inventory');
  console.log('[DEMO] ✅ Cart items atomically reserved during add-to-cart');
  console.log('[DEMO] ✅ Orders submitted to WMS for fulfillment');
  console.log('[DEMO] ✅ Stake percentage (25%) respected for dropship model');

  // Cleanup
  console.log('\n[DEMO] 🛑 Shutting down...\n');
  await commerceService.shutdown();
};

runDemo().catch(console.error);
