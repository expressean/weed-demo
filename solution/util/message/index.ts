import type {MessageBus} from './types';

import { mockLocalMessageBusStrategy } from './strategies/mockLocal';
import { rabbitMqMessageBusStrategy } from './strategies/rabbitmq';

export type MessageBusStrategy = 'mockLocal' | 'rabbitmq';

export const createMessageBus = (
  strategy: MessageBusStrategy,
  options?: { exchangeName?: string; rabbitmqUrl?: string }
): MessageBus => {
  switch (strategy) {
    case 'mockLocal':
      return mockLocalMessageBusStrategy();
    case 'rabbitmq':
      return rabbitMqMessageBusStrategy(options?.exchangeName, options?.rabbitmqUrl);
    default:
      throw new Error(`Unknown message bus strategy: ${strategy}`);
  }
};
