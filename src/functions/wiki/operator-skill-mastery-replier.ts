import { Message } from "mewbot";
import { IBot, NoConfidence, Replied, Replier, ReplyFailed, ReplyResult, TestInfo, TestParams } from "mewbot";
import { Util } from "../../commons/utils.js";
import { ActionLog } from "../../models/action-log.js";
import { AkMisc } from "../../models/ak/ak-misc.js";
import { Character, ICharacter } from "../../models/ak/character.js";
import { Item } from "../../models/ak/item.js";

export class OperatorSkillMasteryReplier extends Replier {

    type = 'wiki';
    protected _regex = /(.+?) *　*的?第?([0-9零一二三四五六七八九十百千万亿兆京垓]+)个?技能的?(专精)?(材料)?/;
    protected _classes: any = {};

    async init(bot: IBot): Promise<void> {
        await super.init(bot);
        this._classes = await AkMisc.findOneByName<any>('classes');
    }

    async test(msg: Message, options: TestParams): Promise<TestInfo> {
        if (!msg.content) return NoConfidence;
        const r = this._regex.exec(msg.content);
        if (r) {
            const char = await Character.findOne({ name: r[1] });
            if (char) {
                let skillNum = parseInt(r[2]);
                if (isNaN(skillNum)) {
                    skillNum = Util.zhDigitToArabic(r[2]);
                }
                return { confidence: 1, data: { char, skillNum } };
            }
        }
        return NoConfidence;
    }

    async reply(bot: IBot, msg: Message, test: TestInfo): Promise<ReplyResult> {
        const char = test.data.char as ICharacter;
        const skillNum = test.data.skillNum as number;

        let reply = '';
        if (Reflect.has(this._classes, char.profession)) {
            const skills = char.skills;
            if (skills && skills.length > 0) {
                if (skillNum > 0 && skillNum <= skills.length) {
                    const cond = skills[skillNum - 1].levelUpCostCond;
                    if (cond && cond.length > 0) {
                        for (let i = 0; i < cond.length; i++) {
                            if (i == 0)
                                reply += '\n🟢专精等级Ⅰ\n';
                            else if (i == 1)
                                reply += '\n🔵专精等级Ⅱ\n';
                            else if (i == 2)
                                reply += '\n🟣专精等级Ⅲ\n';
                            for (const it of cond[i].levelUpCost) {
                                const item = await Item.findOne({ itemId: it.id });
                                if (item)
                                    reply += `[${item.name}x${it.count}] `;
                            }
                        }
                    } else {
                        reply = `干员${char.name}的${skillNum}技能无法专精。`;
                    }
                } else {
                    reply = `博士，干员${char.name}没有这个技能。`;
                }
            } else {
                reply = `干员${char.name}没有技能哦。`;
            }
        } else {
            reply = `博士，${char.name}可能不是干员哦。`;
        }
        
        if (reply) {
            await bot.replyText(msg, reply);
            await ActionLog.log(this.type, msg, reply);
            return Replied;
        }
        return ReplyFailed;
    }

}
