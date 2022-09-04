import { Message } from "mewbot";
import { FullConfidence, IBot, NoConfidence, Replied, Replier, ReplyResult, TestInfo, TestParams } from "mewbot";
import { ActionLog } from "../../models/action-log.js";
import { Sentence } from "../../models/sentence.js";
import { RecruitInst } from "./recruit.js";


export class TextRecruitReplier extends Replier {

    type = 'recruit/text';
    protected _regex = /^(公开招募|公招)(查询)*/;

    override async test(msg: Message, options: TestParams): Promise<TestInfo> {
        if (!msg.content) return NoConfidence;
        if (this._regex.test(msg.content)) return FullConfidence;
        return NoConfidence;
    }

    override async reply(bot: IBot, msg: Message, test: TestInfo): Promise<ReplyResult> {
        if (!await this.checkAvailable(bot, msg, false)) {
            await bot.replyText(msg, Sentence.getRandomOne('recruitDMOnlyHint')!);
            return Replied;
        }

        let reply = '';
        const split = msg.content!.replace('　', ' ').trim().split(' ');
        // 剔除不存在的tag
        const allTags = RecruitInst.tags;
        for (let i = split.length - 1; i >= 0; i--) {
            if (split[i].trim() === '' || allTags.indexOf(split[i].trim()) == -1) {
                split.splice(i, 1);
            }
        }
        if (split.length == 0) {
            await bot.replyText(msg, Sentence.getRandomOne('recruitNoTagError')!);
            return Replied;
        }
        // 根据tag计算
        const reuslts = await RecruitInst.calculate(split);
        reply = '🔍' + RecruitInst.beautifyRecruitResults(reuslts);

        await bot.replyText(msg, reply);
        await ActionLog.log(this.type, msg, reply);
        return Replied;
    }

}