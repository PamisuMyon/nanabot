import { Message } from "mewbot";
import { IBot, NoConfidence, Replied, Replier, ReplyFailed, ReplyResult, TestInfo, TestParams } from "mewbot";
import { Util } from "../../commons/utils.js";
import { ActionLog } from "../../models/action-log.js";
import { IItem, Item } from "../../models/ak/item.js";
import { WorkshopFormula } from "../../models/ak/workshop-formula.js";

export class ItemReplier extends Replier {

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
            item = await Item.findFuzzyOne('name', msg.content);
        } else {
            item = await Item.findOne({ name: msg.content });
        }
        if (item) {
            return { confidence: this.isFuzzy? .9 : 1, data: item };
        } else return NoConfidence;
    }

    async reply(bot: IBot, msg: Message, test: TestInfo): Promise<ReplyResult> {
        const item = test.data as IItem;

        let reply = '';
        const rarityStr = Util.getRarityText(item.rarity);
        reply += '💎' + item.name + rarityStr + '\n';
        if (item.usage)
            reply += `${item.usage}`;
        if (item.description) {
            if (reply) reply += '\n';
            reply += item.description;
        } else if (!item.usage) {
            reply += '暂无相关描述。'; 
        }

        if (item.obtainApproach)
            reply += `\n获得方式：${item.obtainApproach}`;
        if (item.buildingProductList && item.buildingProductList.length > 0) {
            const product = item.buildingProductList[0];
            // 加工材料
            if (product.roomType == 'WORKSHOP' && product.formulaId) {
                const formula = await WorkshopFormula.findOne({ formulaId: product.formulaId} );
                if (formula && formula.costs && formula.costs.length > 0) {
                    reply += '\n♻合成公式\n';
                    for (const cost of formula.costs) {
                        const subItem = await Item.findOne({ itemId: cost.id});
                        if (subItem)
                            reply += `[${subItem.name}x${cost.count}] `;
                    }
                }
            }
        }

        if (reply) {
            await bot.replyText(msg, reply);
            await ActionLog.log(this.type, msg, reply);
            return Replied;
        }
        return ReplyFailed;
    }
    
}
