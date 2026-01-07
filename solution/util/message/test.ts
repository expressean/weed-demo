import type { Message } from './types';
import { createMessageBus } from './';

describe('MessageBus', () => {
  describe('mockLocal strategy', () => {
    test('publishes message to subscribers', async () => {
      const bus = createMessageBus('mockLocal');
      const received: Message[] = [];

      bus.subscribe((msg) => {
        received.push(msg);
      });

      const message: Message = {
        type: 'CART_ITEM_ADDED',
        payload: { cartId: 'cart-1', productId: 'prod-1', quantity: 5 },
        timestamp: Date.now()
      };

      await bus.publish(message);

      expect(received).toHaveLength(1);
      expect(received[0]).toMatchObject(message);
    });

    test('publishes to multiple subscribers', async () => {
      const bus = createMessageBus('mockLocal');
      const received1: Message[] = [];
      const received2: Message[] = [];

      bus.subscribe((msg) => received1.push(msg));
      bus.subscribe((msg) => received2.push(msg));

      const message: Message = {
        type: 'ORDER_PLACED',
        payload: { cartId: 'cart-1', orderId: 'order-1' },
        timestamp: Date.now()
      };

      await bus.publish(message);

      expect(received1).toHaveLength(1);
      expect(received2).toHaveLength(1);
      expect(received1[0]).toMatchObject(message);
      expect(received2[0]).toMatchObject(message);
    });

    test('unsubscribe removes handler', async () => {
      const bus = createMessageBus('mockLocal');
      const received: Message[] = [];

      const unsubscribe = bus.subscribe((msg) => {
        received.push(msg);
      });

      const message1: Message = {
        type: 'SYNC_INVENTORY',
        payload: {},
        timestamp: Date.now()
      };

      await bus.publish(message1);
      expect(received).toHaveLength(1);

      unsubscribe();

      const message2: Message = {
        type: 'SYNC_INVENTORY',
        payload: {},
        timestamp: Date.now()
      };

      await bus.publish(message2);
      expect(received).toHaveLength(1); // still 1, not 2
    });

    test('handles async subscribers', async () => {
      const bus = createMessageBus('mockLocal');
      const results: string[] = [];

      bus.subscribe(async (msg) => {
        await new Promise(resolve => setTimeout(resolve, 10));
        results.push('handler-1');
      });

      bus.subscribe(async (msg) => {
        await new Promise(resolve => setTimeout(resolve, 5));
        results.push('handler-2');
      });

      const message: Message = {
        type: 'INVENTORY_SYNC_FAILED',
        payload: { error: 'test error' },
        timestamp: Date.now()
      };

      await bus.publish(message);

      // give async handlers time to complete
      await new Promise(resolve => setTimeout(resolve, 20));

      expect(results).toHaveLength(2);
      expect(results).toContain('handler-1');
      expect(results).toContain('handler-2');
    });

    test('continues publishing if one subscriber throws', async () => {
      const bus = createMessageBus('mockLocal');
      const received: Message[] = [];

      // subscriber that throws
      bus.subscribe(() => {
        throw new Error('Handler error');
      });

      // subscriber that works
      bus.subscribe((msg) => {
        received.push(msg);
      });

      const message: Message = {
        type: 'CART_ITEM_REMOVED',
        payload: { cartId: 'cart-1', productId: 'prod-1' },
        timestamp: Date.now()
      };

      await bus.publish(message);

      // second subscriber should still receive the message
      expect(received).toHaveLength(1);
    });

    test('shutdown clears all subscribers', async () => {
      const bus = createMessageBus('mockLocal');
      const received: Message[] = [];

      bus.subscribe((msg) => received.push(msg));
      bus.subscribe((msg) => received.push(msg));

      await bus.shutdown();

      const message: Message = {
        type: 'CART_ITEM_EXPIRED',
        payload: { cartId: 'cart-1', productId: 'prod-1' },
        timestamp: Date.now()
      };

      await bus.publish(message);

      expect(received).toHaveLength(0);
    });

    test('adds timestamp if not provided', async () => {
      const bus = createMessageBus('mockLocal');
      let receivedMessage: Message | null = null;

      bus.subscribe((msg) => {
        receivedMessage = msg;
      });

      const messageWithoutTimestamp = {
        type: 'WAREHOUSE_INVENTORY_PULLED' as const,
        payload: { productCount: 5 },
        timestamp: 0
      };

      await bus.publish(messageWithoutTimestamp);

      expect(receivedMessage).not.toBeNull();
      expect(receivedMessage!.timestamp).toBeGreaterThan(0);
    });
  });

  describe('rabbitmq strategy', () => {
    test('throws error for unimplemented methods', async () => {
      const bus = createMessageBus('rabbitmq', {
        exchangeName: 'test-exchange',
        rabbitmqUrl: 'amqp://localhost'
      });

      const message: Message = {
        type: 'SYNC_INVENTORY',
        payload: {},
        timestamp: Date.now()
      };

      await expect(bus.publish(message)).rejects.toThrow('RabbitMQ not implemented yet');
      expect(() => bus.subscribe(() => {})).toThrow('RabbitMQ not implemented yet');
    });
  });
});
