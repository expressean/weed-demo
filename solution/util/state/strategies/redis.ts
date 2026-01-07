import {StateStore} from '../types';

// conceptual example strategy for Redis, not fully tested...

export const redisStateStrategy = <T>(
  key: string,
  initialState: T,
  redisUrl?: string
): StateStore<T> => {
  // const redis = new Redis(redisUrl || process.env.REDIS_URL || 'redis://localhost:6379');

  return {
    get: async () => {
      // const data = await redis.get(key);
      // return data ? JSON.parse(data) : null;
      throw new Error('Redis not implemented yet');
    },

    set: async (state: T) => {
      // await redis.set(key, JSON.stringify(state));
      throw new Error('Redis not implemented yet');
    },

    merge: async (partial: Partial<T>) => {
      // const current = await this.get();
      // await this.set({ ...current, ...partial } as T);
      throw new Error('Redis not implemented yet');
    },

    shutdown: async () => {
      // await redis.quit();
      throw new Error('Redis not implemented yet');
    }
  };
};
