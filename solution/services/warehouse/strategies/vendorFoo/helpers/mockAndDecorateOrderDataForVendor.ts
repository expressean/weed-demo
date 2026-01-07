import { v4 as uuid } from 'uuid';
import type {DropshipOrder} from '../../../../commerce/types';

export const mockGetAndDecorateOrderDataForVendor = (orderId: string): DropshipOrder => {
  // TODO fetch order from db, decorate for vendor payload
  return {
    id: uuid(),
    nabisOrderId: orderId,
    items: [
      {id: 'sour-diesel-1', sku: 'SRD-001', name: 'Sour Diesel', category: 'Flower', batchId: 'B2024-003', quantity: 2},
      {id: 'gelato-1', sku: 'GEL-001', name: 'Gelato', category: 'Flower', batchId: 'B2024-004', quantity: 4},
    ],
    placedAt: Date.now(),
  };
}
