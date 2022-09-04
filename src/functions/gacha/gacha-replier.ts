import { Message } from "mewbot";
import { IBot, NoConfidence, Replied, Replier, ReplyResult, Spam, TestInfo, TestParams } from "mewbot";
import { Util } from "../../commons/utils.js";
import { ActionLog } from "../../models/action-log.js";
import { GachaInfo } from "../../models/ak/gacha-info.js";
import { GachaInst } from "./gacha.js";

export class GachaReplier extends Replier {

    type = 'gacha';
    protected _regex = /(寻访十次|尋訪十次|寻访十连|尋訪十連|十次寻访|十次尋訪|十连|十連|抽十次|寻访|尋訪|单抽|單抽) *(.*)/;

    protected override checkSpam(topic_id: string, targetId: string) {
        const spam = this._spams[topic_id];
        if (spam) {
            return spam.check(targetId);
        } else {
            this._spams[topic_id] = new Spam(0, 1, 1000);
        }
        return { pass: true };
    }

    override async test(msg: Message, options: TestParams): Promise<TestInfo> {
        if(!msg.content) return NoConfidence;
        if (this._regex.test(msg.content)) {
            const r = this._regex.exec(msg.content);
            return { confidence: 1, data: r };
        }
        return NoConfidence;
    }

    override async reply(bot: IBot, msg: Message, test: TestInfo): Promise<ReplyResult> {
        if (!await this.checkAvailable(bot, msg)) {
            return Replied;
        }

        // Spam
        if (!msg._isDirect) {
            const check = this.checkSpam(msg.topic_id, msg.topic_id);
            if (!check.pass) {
                const reply = `指令冷却中(${Util.getTimeCounterText(check.remain! / 1000)})`;
                const hintMsg = await bot.replyText(msg, reply);
                await ActionLog.log(this.type, msg, reply);
                if (hintMsg.data) {
                    return {
                        success: true,
                        recall: { messageId: hintMsg.data.id, delay: 2000 }
                    };
                } else
                    return Replied;
            }
        }

        const r = test.data as RegExpExecArray;
        const cmd = r[1];
        const poolInfo = GachaInst.getPoolInfo(r[2]);
        let times = 1;
        // 抽取次数
        if (cmd.indexOf('十') != -1) {
            times = 10;
        }

        // 获取当前主题该卡池的水位信息
        let waterLevel = 0;
        const gachaInfo = await GachaInfo.findById(msg.topic_id);
        if (gachaInfo) {
            waterLevel = this.getWaterLevel(gachaInfo, poolInfo.type);
        }

        // roll
        const roll = GachaInst.roll(poolInfo.name, times, waterLevel);
        let reply = GachaInst.beautifyRollResults(roll.results, poolInfo.name);

        // 更新水位
        GachaInfo.updateWaterLevel(msg.topic_id, poolInfo.type, roll.waterLevel);

        if (msg._isDirect) {
            reply += `\n距离上次抽到6★: ${roll.waterLevel}次寻访`;
        } else {
            // 群聊中进入短暂群体冷却
            this.recordSpam(msg.topic_id, msg.topic_id);
            reply += `\n距离上次抽到6★: ${roll.waterLevel}次寻访`;
        }
        
        const replyMsg = await bot.replyText(msg, reply);
        await ActionLog.log(this.type, msg, reply);
        if (replyMsg.data && replyMsg.data.id) {
            const config = this.getConfig(bot, msg.topic_id);
            if (config && config.recall) {
                return { 
                    success: true, 
                    recall: {
                        messageId: replyMsg.data.id,
                        delay: config.delay? config.delay : 1800000
                    }
                };
            }
        }
        return Replied;
    }

    getWaterLevel(gachaInfo: GachaInfo, type: string) {
        if (!gachaInfo.waterLevels || gachaInfo.waterLevels.length == 0) {
            return 0;
        }
        for (const item of gachaInfo.waterLevels) {
            if (item.type == type) {
                return item.value;
            }
        }
        return 0;
    }

}
