import { Message } from "mewbot";
import { FullConfidence, IBot, NoConfidence, Replied, Replier, ReplyResult, TestInfo, TestParams } from "mewbot";
import { BaiduOcr } from "../../ai/baidu-ocr.js";
import { ActionLog } from "../../models/action-log.js";
import { Sentence } from "../../models/sentence.js";
import { RecruitInst } from "./recruit.js";


export class OcrRecruitReplier extends Replier {

    type = 'recruit/ocr';

    override async test(msg: Message, options: TestParams): Promise<TestInfo> {
        if (!msg._isDirect && !options.isReplyMe) return NoConfidence;
        if (!msg._media || msg._media.length == 0) return NoConfidence;
        return FullConfidence;
    }

    override async reply(bot: IBot, msg: Message, test: TestInfo): Promise<ReplyResult> {
        if (!await this.checkAvailable(bot, msg, false)) {
            // await bot.replyText(msg, Sentence.getRandomOne('recruitDMOnlyHint')!);
            // return Replied;
            return Replied;
        }

        let reply = '';
        const words = await BaiduOcr.execute(msg._media[0].url);
        if (!words) {
            if (BaiduOcr.limitReached) {
                reply = Sentence.getRandomOne('ocrLimited')!;
            } else {
                reply = Sentence.getRandomOne('ocrError')!;
            }
            await bot.replyText(msg, reply);
            return Replied;
        }

        // 剔除不存在的tag
        const allTags = RecruitInst.tags;
        const tags = [];
        for (let i = words.length - 1; i >= 0; i--) {
            let word = words[i].words.trim();
            word = this.correct(word);
            if (word != '' && allTags.indexOf(word) != -1) {
                tags.push(word);
            }
        }
        if (tags.length == 0) {
            reply = Sentence.getRandomOne('ocrError')!;
            await bot.replyText(msg, reply);
            return Replied;
        }

        // 根据tag计算
        const reuslts = await RecruitInst.calculate(tags);
        reply = '识别到的标签：\n';
        for (const tag of tags) {
            reply += tag + ' ';
        }
        reply += '\n\n';
        reply += RecruitInst.beautifyRecruitResults(reuslts);

        await bot.replyText(msg, reply);
        await ActionLog.log(this.type, msg, reply);
        return Replied;
    }

    correct(word: string): string
    {
        word = word.replace('于员', '干员');
        return word;
    }
}
