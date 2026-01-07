import type {FulfillerInventory} from '../../../commerce/types';
import type {WarehouseServiceConfig, WarehouseService} from '../../types';

import {createInventoryStakeAdjuster} from '../../helpers';

import {
  createRateLimitChecker,
  mockGetAndDecorateOrderDataForVendor
} from './helpers';

export const vendorFooWarehouseStrategy = (config: WarehouseServiceConfig): WarehouseService => {
  let mutRequestTimes: number[] = [];
  const checkRateLimit = createRateLimitChecker(config);

  return {
    getInventory: async <T>(): Promise<T> => {
      await checkRateLimit(mutRequestTimes);
      const response = await fetch(`${config.baseUrl}/api/v1/inventory`, config.requestOptions);
      return response.json();
    },
    adjustInventoryForLikelyAvailability: (inventory: FulfillerInventory): FulfillerInventory => {
      return createInventoryStakeAdjuster(config)(inventory);
    },
    submitOrder: async <T>(orderId: string): Promise<T> => {
      await checkRateLimit(mutRequestTimes);

      const data = mockGetAndDecorateOrderDataForVendor(orderId);
      const response = await fetch(`${config.baseUrl}/order`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(data)
      });
      return response.json();
    }
  };
};
