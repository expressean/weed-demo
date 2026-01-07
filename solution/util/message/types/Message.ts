export type Message =
  | { type: 'SYNC_INVENTORY'; payload: {}, timestamp: number }
  | { type: 'WAREHOUSE_INVENTORY_PULLED'; payload: { productCount: number }, timestamp: number }
  | { type: 'INVENTORY_SYNC_FAILED'; payload: any, timestamp: number }
  | { type: 'ADD_TO_CART'; payload: { cartId: string; productId: string; quantity: number }, timestamp: number }
  | { type: 'CART_ITEM_ADDED'; payload: { cartId: string; productId: string; quantity: number }, timestamp: number }
  | { type: 'REMOVE_FROM_CART'; payload: { cartId: string; productId: string }, timestamp: number }
  | { type: 'CART_ITEM_REMOVED'; payload: { cartId: string; productId: string; }, timestamp: number }
  | { type: 'EXPIRE_CART_ITEM'; payload: { cartId: string; productId: string }, timestamp: number }
  | { type: 'CART_ITEM_EXPIRED'; payload: { cartId: string; productId: string }, timestamp: number }
  | { type: 'PURCHASE_CART'; payload: { cartId: string; orderId: string }, timestamp: number }
  | { type: 'ORDER_PLACED'; payload: { cartId: string; orderId: string }, timestamp: number }
  | { type: 'GET_AVAILABILITY'; payload: { productId: string }, timestamp: number };
