export type WarehouseServiceConfig = {
  stakePercentage: number;
  baseUrl?: string;
  rateLimit?: {
    maxRequests: number;
    perMs: number;
  };
  requestOptions?: RequestInit,
};
