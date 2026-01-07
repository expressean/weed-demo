import {Message} from './Message';
import {MessageHandler} from './MessageHandler';

export type MessageBus<THandler = MessageHandler> = {
  publish(message: Message): Promise<void>;
  subscribe(handler: THandler): () => void;
  shutdown(): Promise<void>;
};
