import { Message } from "mewbot";
import { IBot, NoConfidence, Replied, Replier, ReplyResult, TestInfo, TestParams } from "mewbot";
import { Util } from "../../commons/utils.js";
import { ActionLog } from "../../models/action-log.js";
import { Handbook } from "../../models/ak/handbook.js";
import { Sentence } from "../../models/sentence.js";

export class BirthdayOperatorReplier extends Replier {

    type = 'wiki';
    protected _regex1 = /(大前天|前天|昨天|今天|明天|后天|大后天)是?谁?过?生日(的干员)?/;
    protected _regex2 = /(\d+)(月|\.)(\d+)?(日|号)?是?谁?过?生日(的干员)?/;
    protected _regex3 = /([零一二三四五六七八九十百千万亿兆京垓]+)(月|\.)([零一二三四五六七八九十百千万亿兆京垓]+)?(日|号)?是?谁?过?生日(的干员)?/;
    protected _dateDict: any = {
        '大前天': -3,
        '前天': -2,
        '昨天': -1,
        '今天': 0,
        '明天': 1,
        '后天': 2,
        '大后天': 3,
    };

    async test(msg: Message, options: TestParams): Promise<TestInfo> {
        if (!msg.content) return NoConfidence;

        let r;
        let reply;
        if (this._regex1.test(msg.content)) {
            r = this._regex1.exec(msg.content)!;
            const offset = this._dateDict[r[1]];
            if (!isNaN(offset)) {
                const date = new Date();
                date.setDate(date.getDate() + offset);
                reply = await Handbook.getBirthDayMessage(date.getMonth() + 1, date.getDate());
            }
        } else if (this._regex2.test(msg.content)) {
            r = this._regex2.exec(msg.content)!;
            const month = parseInt(r[1]);
            let date = -1;
            if (r[3]) {
                date = parseInt(r[3]);
            }
            if ((!isNaN(month) && !isNaN(date) && month >= 1 && month <= 12 && date == -1)
                || Util.isValidMonthDate(month, date)) {
                reply = await Handbook.getBirthDayMessage(month, date);
            } else {
                reply = Sentence.getRandomOne('dateError')!;
            }
        } else if (this._regex3.test(msg.content)) {
            r = this._regex3.exec(msg.content)!;
            const month = Util.zhDigitToArabic(r[1]);
            let date = -1;
            if (r[3]) {
                date = Util.zhDigitToArabic(r[3]);
            }
            if (!isNaN(month) && month >= 1 && month <= 12
                && !isNaN(date) && ((date >= 1 && date <= 31) || date == -1)) {
                reply = await Handbook.getBirthDayMessage(month, date);
            } else {
                reply = Sentence.getRandomOne('dateError')!;
            }
        }
        if (reply) {
            return { confidence: 1, data: reply };
        }
        return NoConfidence;
    }

    async reply(bot: IBot, msg: Message, test: TestInfo): Promise<ReplyResult> {
        await bot.replyText(msg, test.data);
        await ActionLog.log(this.type, msg, test.data);
        return Replied;
    }

}
