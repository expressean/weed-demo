import type { MessageBus, MessageHandler, Message } from '../types';

const globalSubscribers = new Set<MessageHandler>();

export const mockLocalMessageBusStrategy = (): MessageBus => {
  return {
    publish: async (message: Message) => {
      const msg = { ...message, timestamp: message.timestamp || Date.now() };
      globalSubscribers.forEach(handler => {
        try {
          handler(msg);
        } catch (error) {
          console.error('Message handler error:', error);
        }
      });
    },

    subscribe: (handler: MessageHandler) => {
      globalSubscribers.add(handler);
      return () => globalSubscribers.delete(handler);
    },

    shutdown: async () => {
      globalSubscribers.clear();
    }
  };
};
