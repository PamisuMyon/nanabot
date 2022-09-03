import { Message } from "mewbot";
import { IBot, NoConfidence, Replied, Replier, ReplyResult, TestInfo, TestParams } from "mewbot";
import { ActionLog } from "../../models/action-log.js";
import { Handbook } from "../../models/ak/handbook.js";

export class ArtistOperatorReplier extends Replier {

    type = 'wiki';

    async test(msg: Message, options: TestParams): Promise<TestInfo> {
        if (!msg.content) return NoConfidence;
        const results = await Handbook.findByArtist(msg.content);
        if (results && results.length > 0) {
            let reply = '';
            for (let i = 0; i < results.length; i++) {
                reply += results[i].name;
                if (i != results.length - 1) {
                    reply += '、';
                }
            }
            if (reply) {
                reply = `🎨画师为${msg.content}的干员：` + reply;
                return { confidence: 1, data: reply };
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
