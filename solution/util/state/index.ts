import { mockLocalStateStrategy } from './strategies/mockLocal';
import { redisStateStrategy } from './strategies/redis';
import type { StateStore } from './types';

export type StateStrategy =
  | 'mockLocal'
  | 'redis';

const mockLocalGlobalStore: Record<string, any> = {};

export const createStateStore = <T>(
  strategy: StateStrategy,
  key: string,
  initialState: T,
  options?: { redisUrl?: string }
): StateStore<T> => {
  switch (strategy) {
    case 'mockLocal':
      return mockLocalStateStrategy(key, initialState, mockLocalGlobalStore);
    case 'redis':
      return redisStateStrategy(key, initialState, options?.redisUrl);
    default:
      throw new Error(`Unknown state strategy: ${strategy}`);
  }
};
