import type {Product} from './Product';

export type DropshipOrder = {
  id: string;
  nabisOrderId: string;
  items: Product[];
  placedAt: number;
};
