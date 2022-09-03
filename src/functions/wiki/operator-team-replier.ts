import { Message } from "mewbot";
import { IBot, NoConfidence, Replied, Replier, ReplyResult, TestInfo, TestParams } from "mewbot";
import { ActionLog } from "../../models/action-log.js";
import { Character, ICharacter } from "../../models/ak/character.js";
import { HandbookTeam } from "../../models/ak/handbook-team.js";

export class OperatorTeamReplier extends Replier {

    type = 'wiki';
    protected _regexes = [
        /(.+?) *　*(所属)?(的)?(势力|国家|地区)/,
    ];

    async test(msg: Message, options: TestParams): Promise<TestInfo> {
        if (!msg.content) return NoConfidence;
        for (const regex of this._regexes) {
            const r = regex.exec(msg.content);
            if (r) {
                const char = await Character.findOne({ name: r[1] });
                if (char)
                    return { confidence: 1, data: char };
            }
        }
        return NoConfidence;
    }

    async reply(bot: IBot, msg: Message, test: TestInfo): Promise<ReplyResult> {
        const char = test.data as ICharacter;
        let reply = '';
        if (char && char.itemDesc) {
            if (char.nationId) {
                const power = await HandbookTeam.findOne( { powerId: char.nationId });
                if (power)
                    reply += power.powerName;
            }
            if (char.groupId) {
                const power = await HandbookTeam.findOne( { powerId: char.groupId });
                if (reply) reply += ' · ';
                if (power)
                    reply += power.powerName;
            }
            if (char.teamId) {
                const power = await HandbookTeam.findOne( { powerId: char.teamId });
                if (reply) reply += ' · ';
                if (power)
                    reply += power.powerName;
            }
        }
        if (!reply)
            reply = `没有查询到所属势力的相关记录呢。`;

        await bot.replyText(msg, reply);
        await ActionLog.log(this.type, msg, reply);
        return Replied;
    }

}
