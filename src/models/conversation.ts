import { CachedCol } from "./db.js";

export enum ConversationType {
    Sentence = 'sentence',
    Regex = 'regex',
}

export enum ConversationPriority {
    Low = '0',
    Medium = '1',
    High = '2',
}

export interface IConversation {
    type: ConversationType;
    condition: 'or' | 'and';
    priority: ConversationPriority;
    a: string[];
    q: string[];
}

export const Conversation = new CachedCol<IConversation>('conversations');
