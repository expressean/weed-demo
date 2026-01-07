import {WarehouseServiceConfig} from '../../../types';

export const createRateLimitChecker =
  (config: WarehouseServiceConfig) =>
    async (mutRequestTimes: number[]) => {
      const now = Date.now();
      const recentRequests = mutRequestTimes.filter(t => now - t < config.rateLimit.perMs);

      if (recentRequests.length >= config.rateLimit.maxRequests) {
        const oldestRequest = recentRequests[0];
        const waitTime = config.rateLimit.perMs - (now - oldestRequest);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        mutRequestTimes.shift();
      }

      mutRequestTimes.push(Date.now());
    };
