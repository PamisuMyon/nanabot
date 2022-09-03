import { Message } from "mewbot";
import { IBot, NoConfidence, Replied, Replier, ReplyResult, TestInfo, TestParams } from "mewbot";
import { Util } from "../../commons/utils.js";
import { ActionLog } from "../../models/action-log.js";
import { Character } from "../../models/ak/character.js";
import { HandbookTeam } from "../../models/ak/handbook-team.js";
import { Handbook } from "../../models/ak/handbook.js";

export class TeamOperatorReplier extends Replier {

    type = 'wiki';

    async test(msg: Message, options: TestParams): Promise<TestInfo> {
        if (!msg.content) return NoConfidence;

        let content = msg.content.replace(/(帝国|国|地区|区|小队|队|组)$/, '');
        content = Util.cleanContent(content);
        if (!content) return NoConfidence;

        const team = await HandbookTeam.findFuzzyOne('powerName', content);
        if (team && team.powerId) {
            let reply = '';
            const chars = this.charToTeamNameArray(await Character.findByNationGroupTeamId(team.powerId), team.powerId);
            const powerName = team.powerName.replace(/^(.+)-/, '');
            const birthChars = this.toNameArray(await Handbook.findByBirthplace(powerName));
            if (chars && chars.length > 0
                && birthChars && birthChars.length > 0) {
                // 处理相同元素
                let isDup = false;
                const bothChars = [];
                for (let i = birthChars.length - 1; i >= 0; i--) {
                    const charIndex = chars.indexOf(birthChars[i]);
                    if (charIndex != -1) {
                        bothChars.push(birthChars.splice(i, 1));
                        chars.splice(charIndex, 1);
                        isDup = true;
                    }
                }
                if (isDup) {
                    reply = `\n🗺势力且出身地为【${team.powerName}】的干员：\n`;
                    reply += bothChars.join('、');
                    if (chars.length > 0) {
                        reply += `\n🗺势力为【${team.powerName}】的干员：\n`;
                        reply += chars.join('、');
                    }
                    if (birthChars.length > 0) {
                        reply += `\n🗺出身地为【${team.powerName}】的干员：\n`;
                        reply += birthChars.join('、');
                    }
                    return { confidence: 1, data: reply };
                }
            }
            if (chars && chars.length > 0) {
                if (birthChars && birthChars.length > 0)
                    reply += '\n';
                reply = `🗺势力为【${team.powerName}】的干员：\n`;
                reply += chars.join('、');
            }
            if (birthChars && birthChars.length > 0) {
                if (reply) reply += '\n';
                reply += `\n🗺出身地为【${team.powerName}】的干员：\n`;
                reply += birthChars.join('、');
            }
            if (reply) {
                return { confidence: 1, data: reply };
            }
        } else {
            // 出身地为 未公开 或 不在势力表中的地区
            const birthChars = this.toNameArray(await Handbook.findByBirthplace(content));
            if (birthChars && birthChars.length > 0) {
                let reply = `🗺出身地为【${content}】的干员：\n`;
                reply += birthChars.join('、');
                return { confidence: 1, data: reply };
            }
        }
        return NoConfidence;
    }

    async reply(bot: IBot, msg: Message, test: TestInfo): Promise<ReplyResult> {
        await bot.replyText(msg, test.data);
        await ActionLog.log(this.type, msg, test.data);
        return Replied;
    }

    protected charToTeamNameArray(docs: any[], powerId: string) {
        if (!docs) return null;
        // 同时具有 nationId, groupId, teamId的情况下，如果检索的是nation，则排除
        // 比如检索“龙门”，排除group为企鹅物流的能天使等
        const names = [];
        for (const doc of docs) {
            if (doc.nationId == powerId
                && (doc.groupId != null || doc.teamId != null))
                continue;
            names.push(doc.name);
        }
        return names;
    }

    protected toNameArray(docs: any[]) {
        if (!docs) return null;
        const names = [];
        for (const doc of docs) {
            names.push(doc.name);
        }
        return names;
    }

}
