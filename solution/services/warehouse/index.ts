import type {WarehouseServiceConfig, WarehouseService} from './types';
import {mockLocalWarehouseStrategy, vendorFooWarehouseStrategy} from './strategies';

export type WarehouseStrategy =
  | 'mockLocal'
  | 'vendorFoo';

export const createWarehouseService = <T>(
  strategy: WarehouseStrategy,
  config: WarehouseServiceConfig,
): WarehouseService => {
  switch (strategy) {
    case 'mockLocal':
      return mockLocalWarehouseStrategy(config);
    case 'vendorFoo':
      return vendorFooWarehouseStrategy(config);
    default:
      throw new Error(`Unknown state strategy: ${strategy}`);
  }
};
