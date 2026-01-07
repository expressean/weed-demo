import type {Product} from './Product';

export type FulfillerInventory = {
  items: Product[];
  asOfTimestamp: number;
  fetchedTimestamp: number;
};
