import { Message } from "mewbot";
import { IBot, NoConfidence, Replied, Replier, ReplyFailed, ReplyResult, TestInfo, TestParams } from "mewbot";
import { ActionLog } from "../../models/action-log.js";
import { AkMisc } from "../../models/ak/ak-misc.js";
import { Character, ICharacter } from "../../models/ak/character.js";
import { Item } from "../../models/ak/item.js";

export class OperatorEvolveReplier extends Replier {

    type = 'wiki';
    protected _regex = /(.+?) *　*的?精(一|二|壹|貳|1|2|英|(化)?)(材料)?/;
    protected _classes: any = {};
    private _evolveGoldCost: any[][] = [];

    async init(bot: IBot): Promise<void> {
        await super.init(bot);
        this._classes = await AkMisc.findOneByName<any>('classes');
        this._evolveGoldCost = await AkMisc.findOneByName<any[][]>('evolveGoldCost');
    }

    async test(msg: Message, options: TestParams): Promise<TestInfo> {
        if (!msg.content) return NoConfidence;
        const r = this._regex.exec(msg.content);
        if (r) {
            const char = await Character.findOne({ name: r[1] });
            if (char)
                return { confidence: 1, data: char };
        }
        return NoConfidence;
    }

    async reply(bot: IBot, msg: Message, test: TestInfo): Promise<ReplyResult> {
        const char = test.data as ICharacter;
        let reply = '';
        if (Reflect.has(this._classes, char.profession)) {
            const phases = char.phases;
            if (phases && phases.length > 1) {
                const goldCosts = this._evolveGoldCost[char.rarity];
                for (let i = 1; i < phases.length; i++) {
                    if (i == 1) {
                        reply += '\n🔷精英化0→1\n';
                        if (goldCosts[0])
                            reply += `[龙门币x${goldCosts[0]}] `;
                    } else if (i == 2) {
                        reply += '\n🔶精英化1→2\n';
                        if (goldCosts[1])
                            reply += `[龙门币x${goldCosts[1]}] `;
                    }
                    for (const it of phases[i].evolveCost!) {
                        const item = await Item.findOne({ itemId: it.id });
                        if (item)
                            reply += `[${item.name}x${it.count}] `;
                    }
                }
            } else {
                reply = `干员${char.name}没有精英化阶段。`;
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
