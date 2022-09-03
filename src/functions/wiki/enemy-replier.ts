import { Message } from "mewbot";
import { IBot, NoConfidence, Replied, Replier, ReplyFailed, ReplyResult, TestInfo, TestParams } from "mewbot";
import { Util } from "../../commons/utils.js";
import { ActionLog } from "../../models/action-log.js";
import { Enemy, IEnemy } from "../../models/ak/enemy.js";

export class EnemyReplier extends Replier {

    type = 'wiki';
    isFuzzy = false;

    constructor(isFuzzy: boolean) {
        super();
        this.isFuzzy = isFuzzy;
    }

    async test(msg: Message, options: TestParams): Promise<TestInfo> {
        if (!msg.content) return NoConfidence;
        let enemy;
        if (this.isFuzzy) {
            enemy = await Enemy.findFuzzyOne('name', msg.content);
        } else {
            enemy = await Enemy.findOne({ name: msg.content });
        }
        if (enemy) {
            return { confidence: this.isFuzzy? .9 : 1, data: enemy };
        } else return NoConfidence;
    }

    async reply(bot: IBot, msg: Message, test: TestInfo): Promise<ReplyResult> {
        const enemy = test.data as IEnemy;
        let reply = '';
        reply += '📑' + enemy.name;
        if (enemy.enemyRace)
            reply += ' · ' + enemy.enemyRace;
        if (enemy.enemyLevel) {
            if (enemy.enemyLevel == 'ELITE')
                reply += ' · 精英';
            else if (enemy.enemyLevel == 'BOSS')
                reply += ' · 领袖';
        }
        reply += '\n';
        const fourD = `耐久${enemy.endure} 攻击${enemy.attack} 防御${enemy.defence} 法抗${enemy.resistance}`;
        reply += fourD;
        reply += '\n';
        if (enemy.description)
            reply += enemy.description;
        else
            reply += '暂无相关描述。';
        if (enemy.ability) {
            reply += '\n';
            reply += Util.removeLabel(enemy.ability);
        }
        if (reply) {
            await bot.replyText(msg, reply);
            await ActionLog.log(this.type, msg, reply);
            return Replied;
        }
        return ReplyFailed;
    }
    
}
