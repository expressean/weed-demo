import {Message} from './Message';

export type MessageHandler = (message: Message) => void | Promise<void> | number;
