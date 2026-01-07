import * as R from 'ramda';
import type {FulfillerInventory} from '../../commerce/types';
import {WarehouseServiceConfig} from '../types';

export const createInventoryStakeAdjuster =
  (config: WarehouseServiceConfig) =>
    (inventory: FulfillerInventory) => {
      const itemsLens = R.lensProp('items');
      const quantityLens = R.lensProp('quantity');
      const adjustQuantity = (q: number) => Math.floor(q * (config.stakePercentage / 100));
      const adjustQuantities = R.map(R.over(quantityLens, adjustQuantity));

      return R.over(
        itemsLens,
        adjustQuantities
      )(inventory);
    }
