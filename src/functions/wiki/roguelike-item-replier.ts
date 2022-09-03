import { Message } from "mewbot";
import { IBot, NoConfidence, Replied, Replier, ReplyFailed, ReplyResult, TestInfo, TestParams } from "mewbot";
import { ActionLog } from "../../models/action-log.js";
import { IRoguelikeItem, RoguelikeItem } from "../../models/ak/roguelike-item.js";

export class RoguelikeItemReplier extends Replier {

    type = 'wiki';
    isFuzzy = false;

    constructor(isFuzzy: boolean) {
        super();
        this.isFuzzy = isFuzzy;
    }

    async test(msg: Message, options: TestParams): Promise<TestInfo> {
        if (!msg.content) return NoConfidence;
        let item;
        if (this.isFuzzy) {
            item = await RoguelikeItem.findFuzzyOne('name', msg.content);
        } else {
            item = await RoguelikeItem.findOne({ name: msg.content });
        }
        if (item) {
            return { confidence: this.isFuzzy? .9 : 1, data: item };
        } else return NoConfidence;
    }

    async reply(bot: IBot, msg: Message, test: TestInfo): Promise<ReplyResult> {
        const item = test.data as IRoguelikeItem;
        let reply = '';
        reply += '💠' + item.name;
        if (item.usage && item.usage != item.name)
            reply += `\n${item.usage}`;
        else if (item.obtainApproach) {
            reply += `\n${item.obtainApproach}`;
        }
        if (item.description) {
            if (reply) reply += '\n';
            reply += item.description;
        } else if (!item.usage) {
            reply += '暂无相关描述。';
        }
        if (item.value && item.value > 0) {
            reply += '\n售价：💰' + item.value;
        }
        if (item.unlockCondDesc) {
            reply += '\n解锁条件：' + item.unlockCondDesc;
        }
        if (reply) {
            await bot.replyText(msg, reply);
            await ActionLog.log(this.type, msg, reply);
            return Replied;
        }
        return ReplyFailed;
    }
    
}
