import got from "got";
import { logger, LogLevel, Message } from "mewbot";
import { IBot, MatryoshkaReplier, Replied, Replier, ReplyResult, TestInfo } from "mewbot";
import { ActionLog } from "../../models/action-log.js";
import { Sentence } from "../../models/sentence.js";
import { UserRole } from "../../models/user.js";
import { RoleCheckSubReplier } from "./role-check.js";

export class SenseiReplier extends MatryoshkaReplier {

    override type = 'sensei';
    protected override _pickFunc = Replier.pick01;
    protected override _children = [
        new LearnReplier(),
    ];

}

abstract class SenseiSubReplier extends RoleCheckSubReplier {

    type = 'sensei';
    protected override _roles = [
        UserRole.Admin,
        UserRole.Moderator,
        UserRole.Sensei,
    ];

}

class LearnReplier extends SenseiSubReplier {

    protected _regex = /^问 *　*\n.*?\n答 *　*\n.*/;

    async reply(bot: IBot, msg: Message, test: TestInfo): Promise<ReplyResult> {
        const lines = msg.content!.split('\n');
        if (lines.length < 4) {
            await bot.replyText(msg, Sentence.getRandomOne('commandError')!);
            return Replied;
        }
        // 获取问答训练数据
        const qs = [];
        const as = [];
        let flag = 1;
        for (let line of lines) {
            line = line.trim();
            if (!line) continue;
            if (line == '问') {
                if (flag != 1) {
                    logger.debug('Q A mismatch, abort.');
                    await bot.replyText(msg, Sentence.getRandomOne('commandError')!);
                    return Replied;
                }
                flag = 0;
            } else if (line == '答') {
                if (flag != 0) {
                    logger.debug('Q A mismatch, abort.');
                    await bot.replyText(msg, Sentence.getRandomOne('commandError')!);
                    return Replied;
                }
                flag = 1;
            } else if (flag == 0) {
                line = line.replace('~n~', ' ');
                qs.push(line);
            } else if (flag == 1) {
                line = line.replace('~n~', '\n');
                as.push(line);
            }
        }
        if (qs.length == 0 || as.length == 0) {
            await bot.replyText(msg, Sentence.getRandomOne('commandError')!);
            return Replied;
        }
        // 请求服务器
        const success = await this.trainNanaChat({ q: qs, a: as });
        let reply;
        if (success) {
            reply = '学习成功，奇怪的知识增加了！';
        } else {
            reply = '学习失败😿，请稍后再试或联系维护员。';
        }
        await bot.replyText(msg, reply);
        await ActionLog.log(this.type, msg, reply);
        return Replied;
    }

    async trainNanaChat(data: any) {
        const url = `http://127.0.0.1:7700/api/v1/train`;
        try {
            const { body } = await got.post<any>(url, {
                headers: {
                    'Content-Type': 'application/json',
                },
                json: data,
                responseType: 'json',
            });
            return body.success;
        } catch (err) {
            logger.dir(err, LogLevel.Error);
            logger.error('エラー発生: trainNanaChat');
            return;
        }
    }
}
