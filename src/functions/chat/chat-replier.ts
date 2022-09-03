import { Message } from "mewbot";
import { Replier, TestParams, TestInfo, NoConfidence, FullConfidence, IBot, ReplyResult, Replied, Util, ReplyFailed } from "mewbot";
import { ActionLog } from "../../models/action-log.js";
import { ConversationPriority } from "../../models/conversation.js";
import { Sentence } from "../../models/sentence.js";
import { Chatter } from "./chatter.js";

export class ChatReplier extends Replier {

    type = 'chat';
    protected _chatter: Chatter = new Chatter();

    override async test(msg: Message, options: TestParams): Promise<TestInfo> {
        if (options.isCommandMode) return NoConfidence;
        if (msg._isDirect && !msg.content) return NoConfidence;
        return FullConfidence;
    }

    override async reply(bot: IBot, msg: Message, test: TestInfo): Promise<ReplyResult> {
        if (!msg._isDirect
            && msg.content != null
            && (!msg.content || !msg.content.replace('　', ''))) {
            // 群聊无文字消息
            const reply = Sentence.getRandomOne('atOnly')!;
            await bot.replyText(msg, reply);
            await ActionLog.log(this.type, msg, reply);
            return Replied;
        }

        if (!await this.checkAvailable(bot, msg)) {
            return Replied;
        }

        if (!msg.content)
            return ReplyFailed;

        const content = this._chatter.wash(msg.content);

        // Conversations
        const convReply = this._chatter.getConversationReply(msg.content);
        if (convReply && convReply.priority == ConversationPriority.High) {
            await bot.replyText(msg, convReply.content);
            await ActionLog.log(this.type, msg, convReply.content);
            return Replied;
        }

        // nana chat
        const chatReply = await this._chatter.requestNanaChat(content);
        let reply = '';
        if (chatReply && chatReply.reply) {
            if (convReply && convReply.priority == ConversationPriority.Medium) {
                // 存在conversation表匹配情况，比较置信度
                if (chatReply.confidence > 0.5 && Util.randomFloat(0, 1) < 0.2) {   // hard-code
                    // 双方均可选情况，按概率随机选择
                    reply = chatReply.reply;
                } else {
                    reply = convReply.content;
                }
            } else {
                reply = chatReply.reply;
            }
        } else if (convReply) {
            reply = convReply.content;
        }

        if (!reply) {
            reply = Sentence.getRandomOne('test')!;
        }

        await bot.replyText(msg, reply);
        await ActionLog.log(this.type, msg, reply);
        return Replied;
    }

}