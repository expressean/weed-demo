// import amqp from 'amqplib';
import {MessageBus, MessageHandler, Message} from '../types';

// conceptual example strategy for RabbitMQ / AMQP, not fully tested...
export const rabbitMqMessageBusStrategy = (
  exchangeName: string = 'inventory',
  rabbitmqUrl?: string
): MessageBus => {
  // let connection: amqp.Connection;
  // let channel: amqp.Channel;
  const handlers = new Set<MessageHandler>();

  return {
    publish: async (message: Message) => {
      // const msg = { ...message, timestamp: message.timestamp || Date.now() };
      // await channel.publish(exchangeName, '', Buffer.from(JSON.stringify(msg)));
      throw new Error('RabbitMQ not implemented yet');
    },

    subscribe: (handler: MessageHandler) => {
      // handlers.add(handler);
      throw new Error('RabbitMQ not implemented yet');
    },

    shutdown: async () => {
      // await channel.close();
      // await connection.close();
      throw new Error('RabbitMQ not implemented yet');
    }
  };
};
