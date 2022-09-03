import { Message } from "mewbot";
import { IBot, NoConfidence, Replied, Replier, ReplyResult, TestInfo, TestParams } from "mewbot";
import { ActionLog } from "../../models/action-log.js";
import { Handbook } from "../../models/ak/handbook.js";

export class OperatorCvReplier extends Replier {

    type = 'wiki';
    protected _regexes = [
        /(.+?) *　*的?(声优|cv)/i,
        /(.+?) *　*是?由?谁?配音/
    ];

    async test(msg: Message, options: TestParams): Promise<TestInfo> {
        if (!msg.content) return NoConfidence;
        for (const regex of this._regexes) {
            const r = regex.exec(msg.content);
            if (r) {
                const info = await Handbook.findCv(r[1]);
                if (info)
                    return { confidence: 1, data: '🎙' + info };
            }
        }
        return NoConfidence;
    }

    async reply(bot: IBot, msg: Message, test: TestInfo): Promise<ReplyResult> {
        await bot.replyText(msg, test.data);
        await ActionLog.log(this.type, msg, test.data);
        return Replied;
    }

}
