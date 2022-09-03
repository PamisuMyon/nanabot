import { Message } from "mewbot";
import { FullConfidence, IBot, NoConfidence, Replied, Replier, ReplyResult, TestInfo, TestParams } from "mewbot";
import { ActionLog } from "../models/action-log.js";
import { Sentence } from "../models/sentence.js";

export class HelpReplier extends Replier {

    type = 'help';
    protected _regex = /^(帮助|help)$/i;

    override async test(msg: Message, options: TestParams): Promise<TestInfo> {
        if (!msg.content) return NoConfidence;
        if (this._regex.test(msg.content)) return FullConfidence;
        else return NoConfidence;
    }

    override async reply(bot: IBot, msg: Message, test: TestInfo): Promise<ReplyResult> {
        if (!msg._isDirect && !await this.checkAvailable(bot, msg, false)) {
            const reply = Sentence.getRandomOne('helpHint')!;
            await bot.replyText(msg, reply);
            await ActionLog.log(this.type, msg, reply);
            return Replied;
        }

        const reply = Sentence.getRandomOne('help')!;
        await bot.replyText(msg, reply);
        await bot.replyThought(msg, Sentence.getRandomOne('helpThought')!);
        await ActionLog.log(this.type, msg, reply);
        return Replied;
    }

}