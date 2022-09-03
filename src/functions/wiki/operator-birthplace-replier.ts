import { Message } from "mewbot";
import { IBot, NoConfidence, Replied, Replier, ReplyResult, TestInfo, TestParams } from "mewbot";
import { ActionLog } from "../../models/action-log.js";
import { Handbook, IHandbook } from "../../models/ak/handbook.js";

export class OperatorBirthplaceReplier extends Replier {

    type = 'wiki';
    protected _regexes = [
        /(.+?) *　*(的)?(出生|出身)地?/,
    ];

    async test(msg: Message, options: TestParams): Promise<TestInfo> {
        if (!msg.content) return NoConfidence;
        for (const regex of this._regexes) {
            const r = regex.exec(msg.content);
            if (r) {
                const char = await Handbook.findOne({ name: r[1] });
                if (char)
                    return { confidence: 1, data: char };
            }
        }
        return NoConfidence;
    }

    async reply(bot: IBot, msg: Message, test: TestInfo): Promise<ReplyResult> {
        const char = test.data as IHandbook;
        let reply;
        if (char) {
            if (char.birthplace)
                reply = char.birthplace;
            else
                reply = `没有${char.name}出身地的相关记录呢。`;
        } else {
            reply = `没有查询到出身地的相关记录呢。`;
        }

        await bot.replyText(msg, reply);
        await ActionLog.log(this.type, msg, reply);
        return Replied;
    }

}
