import type { Message } from '../../../util/message/types';
import type { CommerceState } from './CommerceState';

export type CommerceMessageHandler = (msg: Message, state: CommerceState) => CommerceState;
