import type {FulfillerInventory} from '../../commerce/types';

export type WarehouseService = {
  getInventory: () => Promise<FulfillerInventory>;
  adjustInventoryForLikelyAvailability: (inventory: FulfillerInventory) => FulfillerInventory;
  submitOrder: (orderId: string) => Promise<any>;
};
