import { createWarehouseService } from './';
import type { WarehouseServiceConfig } from './types';

describe('WarehouseService', () => {
  describe('mockLocal strategy', () => {
    test('getInventory returns mock data', async () => {
      const config: WarehouseServiceConfig = {
        stakePercentage: 100
      };

      const service = createWarehouseService('mockLocal', config);
      const inventory = await service.getInventory();

      expect(inventory.items).toBeDefined();
      expect(inventory.items.length).toBeGreaterThan(0);
      expect(inventory.items[0]).toHaveProperty('id');
      expect(inventory.items[0]).toHaveProperty('quantity');
    });

    test('adjustInventoryForLikelyAvailability applies stake percentage', async () => {
      const config: WarehouseServiceConfig = {
        stakePercentage: 25
      };

      const service = createWarehouseService('mockLocal', config);
      const rawInventory = await service.getInventory();
      const adjustedInventory = service.adjustInventoryForLikelyAvailability(rawInventory);

      // check that quantities are reduced by 75%
      rawInventory.items.forEach((rawItem, index) => {
        const adjustedItem = adjustedInventory.items[index];
        expect(adjustedItem.quantity).toBe(Math.floor(rawItem.quantity * 0.25));
      });
    });

    test('adjustInventoryForLikelyAvailability with 100% returns original quantities', async () => {
      const config: WarehouseServiceConfig = {
        stakePercentage: 100
      };

      const service = createWarehouseService('mockLocal', config);
      const rawInventory = await service.getInventory();
      const adjustedInventory = service.adjustInventoryForLikelyAvailability(rawInventory);

      rawInventory.items.forEach((rawItem, index) => {
        const adjustedItem = adjustedInventory.items[index];
        expect(adjustedItem.quantity).toBe(rawItem.quantity);
      });
    });

    test('adjustInventoryForLikelyAvailability with 50% returns half quantities', async () => {
      const config: WarehouseServiceConfig = {
        stakePercentage: 50
      };

      const service = createWarehouseService('mockLocal', config);
      const rawInventory = await service.getInventory();
      const adjustedInventory = service.adjustInventoryForLikelyAvailability(rawInventory);

      rawInventory.items.forEach((rawItem, index) => {
        const adjustedItem = adjustedInventory.items[index];
        expect(adjustedItem.quantity).toBe(Math.floor(rawItem.quantity * 0.5));
      });
    });

    test('submitOrder returns mock order data', async () => {
      const config: WarehouseServiceConfig = {
        stakePercentage: 100
      };

      const service = createWarehouseService('mockLocal', config);
      const result = await service.submitOrder('test-order-123');

      expect(result).toBeDefined();
      expect(result).toHaveProperty('nabisOrderId', 'test-order-123');
      expect(result).toHaveProperty('items');
    });
  });

  describe('vendorFoo strategy', () => {
    test('creates service with rate limiting config', () => {
      const config: WarehouseServiceConfig = {
        stakePercentage: 25,
        baseUrl: 'https://test-wms.com',
        rateLimit: {
          maxRequests: 100,
          perMs: 60000
        }
      };

      const service = createWarehouseService('vendorFoo', config);
      expect(service).toBeDefined();
      expect(service.getInventory).toBeDefined();
      expect(service.submitOrder).toBeDefined();
    });
  });

  describe('edge cases', () => {
    test('handles zero stake percentage', async () => {
      const config: WarehouseServiceConfig = {
        stakePercentage: 0
      };

      const service = createWarehouseService('mockLocal', config);
      const rawInventory = await service.getInventory();
      const adjustedInventory = service.adjustInventoryForLikelyAvailability(rawInventory);

      adjustedInventory.items.forEach(item => {
        expect(item.quantity).toBe(0);
      });
    });

    test('handles inventory with zero quantities', async () => {
      const config: WarehouseServiceConfig = {
        stakePercentage: 25
      };

      const service = createWarehouseService('mockLocal', config);
      const mockInventory = {
        items: [
          { id: 'test-1', sku: 'TEST-001', name: 'Test', category: 'Test', batchId: 'B001', quantity: 0 }
        ],
        asOfTimestamp: Date.now(),
        fetchedTimestamp: Date.now()
      };

      const adjusted = service.adjustInventoryForLikelyAvailability(mockInventory);
      expect(adjusted.items[0].quantity).toBe(0);
    });
  });
});
