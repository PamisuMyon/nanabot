import { Media, Message, refine, Result } from "mewbot";
import { Col } from "./db.js";

export interface IActionLog {
    type: string;
    content: string;
    media: Media[];
    reply: string;
    data?: any;
    name: string;
    username: string;
    userId: string;
    topicId: string;
    nodeId: string;
    isDirect: boolean;
    createdAt: Date;
    repliedAt: Date;
}

export class ActionLogCol extends Col<IActionLog> {
    
    async log(type: string, msg: Message, reply?: string | Result<Message>, data?: any) {
        let replyContent;
        if (typeof(reply) == 'string') {
            replyContent = reply;
        } else if (reply) {
            replyContent = this.getMessageContentForLog(reply);
        } else {
            replyContent = '';
        }

        const l: IActionLog = {
            type,
            content: this.getMessageContentForLog({ data: msg }),
            media: msg._media,
            reply: replyContent,
            name: msg._author.name,
            username: msg._author.username,
            userId: msg.author_id,
            isDirect: msg._isDirect,
            topicId: msg.topic_id,
            nodeId: msg.node_id,
            createdAt: new Date(msg.created_at),
            repliedAt: new Date(),
            data,
        };

        return this.col.insertOne(l);
    }

    async logMessage(type: string, msgResult: Result<Message>, data?: any) {
        let l: IActionLog;
        if (msgResult.data) {
            const msg = msgResult.data;
            if (!msg._author)
                refine(msg);
            l = {
                type,
                content: this.getMessageContentForLog(msgResult),
                media: msg._media,
                reply: '',
                name: msg._author.name,
                username: msg._author.username,
                userId: msg.author_id,
                isDirect: msg._isDirect,
                topicId: msg.topic_id,
                nodeId: msg.node_id,
                createdAt: new Date(msg.created_at),
                repliedAt: new Date(),
                data,
            };
        } else {
            l = {
                type,
                content: this.getMessageContentForLog(msgResult),
                createdAt: new Date(),
                repliedAt: new Date(),
                data,
            } as IActionLog;
        }
        return this.col.insertOne(l);
    }

    getMessageContentForLog(obj: Result<Message>) {
        if (obj.data) {
            const msg = obj.data;
            if (msg.content) return msg.content;
            if (msg.stamp) return 'stamp:' + msg.stamp;
            if (msg.thought) return 'thought:' + msg.thought;
        } else if (obj.error) {
            const err = obj.error;
            return `${err.name}\n${err.message}\n${err.status}\n${err.code}`;
        }
        return '';
    }
}

export const ActionLog = new ActionLogCol('action-logs');
