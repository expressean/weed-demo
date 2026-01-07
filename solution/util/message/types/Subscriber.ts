import {Message} from './Message';
import {CommerceState} from '../../../services/commerce';

export type Subscriber = (msg: Message, state: InventoryState) => void;
