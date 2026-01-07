import type {FulfillerInventory} from '../../commerce/types';
import type {WarehouseService, WarehouseServiceConfig} from '../types';

import {createInventoryStakeAdjuster} from '../helpers';

export const mockLocalWarehouseStrategy = (config: WarehouseServiceConfig): WarehouseService => ({
  getInventory: async <T>(): Promise<T> => {
    const mockInventoryCallResponse = {
      items: [
        {id: 'og-kush-1', sku: 'OGK-001', name: 'OG Kush', category: 'Flower', batchId: 'B2024-001', quantity: 100},
        {id: 'blue-dream-1', sku: 'BLD-001', name: 'Blue Dream', category: 'Flower', batchId: 'B2024-002', quantity: 150},
        {id: 'sour-diesel-1', sku: 'SRD-001', name: 'Sour Diesel', category: 'Flower', batchId: 'B2024-003', quantity: 80},
        {id: 'gelato-1', sku: 'GEL-001', name: 'Gelato', category: 'Flower', batchId: 'B2024-004', quantity: 120},
        {id: 'gsc-1', sku: 'GSC-001', name: 'Girl Scout Cookies', category: 'Flower', batchId: 'B2024-005', quantity: 90}
      ]
    };

    return mockInventoryCallResponse as T;
  },
  adjustInventoryForLikelyAvailability: (inventory: FulfillerInventory): FulfillerInventory => {
    return createInventoryStakeAdjuster(config)(inventory);
  },
  submitOrder: async <T>(orderId: string): Promise<T> => {
    const mockOrderDetailsFromImaginaryDatabase = nabisOrderId => ({
      nabisOrderId,
      items: [
        {id: 'gsc-1', sku: 'GSC-001', name: 'Girl Scout Cookies', category: 'Flower', batchId: 'B2024-005', quantity: 2},
        {id: 'blue-dream-1', sku: 'BLD-001', name: 'Blue Dream', category: 'Flower', batchId: 'B2024-002', quantity: 1},
      ]
    });

    return mockOrderDetailsFromImaginaryDatabase(orderId) as T;
  }
});
