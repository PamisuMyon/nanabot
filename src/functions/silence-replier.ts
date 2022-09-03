import { Message } from "mewbot";
import { FullConfidence, IBot, NoConfidence, Replied, Replier, ReplyResult, Spam, TestInfo, TestParams } from "mewbot";
import { Util } from "../commons/utils.js";
import { ActionLog } from "../models/action-log.js";
import { NanaBotConfig } from "../models/config.js";
import { Sentence } from "../models/sentence.js";

/**
 * 安静指令回复器
 * 
 * 生效时将会抢夺比其优先级低回复器的回复权，不做任何回复直到失效，bot中需要使用类似{@link Replier.pick01}的挑选函数
 */
export class SilenceReplier extends Replier {

    type = 'silence';

    protected _regex = /^安静$/;
    protected _silenceSpam!: Spam;
    protected _silenceDuration!: number;

    override async init(bot: IBot) {
        await super.init(bot);
        this._silenceDuration = (bot.storage.config as NanaBotConfig).silenceDuration;
        if (!this._silenceSpam)
            this._silenceSpam = new Spam(0, 1, this._silenceDuration);
        else 
            this._silenceSpam.init(0, 1, this._silenceDuration);
    }

    async test(msg: Message, options: TestParams): Promise<TestInfo> {
        // 检测生效
        const check = this._silenceSpam.check(msg.topic_id);
        if (!check.pass) {
            return FullConfidence;
        }

        if (!msg.content) return NoConfidence;
        // 检测指令
        if (this._regex.test(msg.content)) {
            this._silenceSpam.record(msg.topic_id);
            return { confidence: 1, data: 1};
        }
        return NoConfidence;
    }

    async reply(bot: IBot, msg: Message, test: TestInfo): Promise<ReplyResult> {
        if (test.data) {
            let reply = Util.getTimeCounterText(this._silenceDuration / 1000);
            reply = Util.stringFormat(Sentence.getRandomOne('silence')!, reply);
            await bot.replyText(msg, reply);
            await ActionLog.log(this.type, msg, reply);
        } else {
            await ActionLog.log(this.type, msg);
        }
        return Replied;
    }

}