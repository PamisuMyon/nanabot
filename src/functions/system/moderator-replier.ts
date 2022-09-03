import { Message } from "mewbot";
import { IBot, MatryoshkaReplier, Replied, Replier, ReplyResult, TestInfo, TopicConfig } from "mewbot";
import { ActionLog } from "../../models/action-log.js";
import { MiscConfig } from "../../models/config.js";
import { UserRole } from "../../models/user.js";
import { RoleCheckSubReplier } from "./role-check.js";

export class ModeratorReplier extends MatryoshkaReplier {

    override type = 'moderator';
    protected override _pickFunc = Replier.pick01;
    protected override _children = [
        new EnterTopicReplier(),
        new ExitTopicReplier(),
    ];

}

abstract class ModeratorSubReplier extends RoleCheckSubReplier {
    
    type = 'system';
    protected override _roles = [
        UserRole.Admin,
        UserRole.Moderator,
    ];

    protected async getNodeTopic(bot: IBot, nodes: string[], topic: string) {
        for (const node of nodes) {
            const info = await bot.client.getNodeInfo(node);
            if (!info.data || !info.data.topics || info.data.topics.length == 0) continue;
            for (const t of info.data.topics) {
                if (t.name.indexOf(topic) != -1 || t.id == topic) {
                    return t;
                }
            }
        }
    }

}

class EnterTopicReplier extends ModeratorSubReplier {

    protected _regex = /^进驻 *　*(.+)/;

    async reply(bot: IBot, msg: Message, test: TestInfo): Promise<ReplyResult> {
        const nodes = test.data.user.nodes;
        if (!nodes) {
            await bot.replyText(msg, '粗心的维护员忘记配置据点信息了，快去提醒一下他吧！');
            return Replied;
        }
        const topic = await this.getNodeTopic(bot, nodes, test.data.r[1]);
        if (!topic) {
            await bot.replyText(msg, '获取节点信息失败😿，请稍后再试或联系维护员。');
            return Replied;
        }

        const config = bot.storage.config;
        const topics = config.topics;
        let reply;
        if (topics[topic.id]) {
            reply = `已经进驻这个节点啦\n名称:${topic.name} \nID:${topic.id}`;
        } else {
            const template = await MiscConfig.findOneByName<TopicConfig>('topicConfigDefault');
            template.id = topic.id;
            template.name = topic.name;
            topics[topic.id] = template;

            const upsertResult = await MiscConfig.upsertOne( { name: 'botConfig' }, { name: 'botConfig', value: config });

            if (upsertResult.modifiedCount == 0) {
                reply = `进驻节点失败😿，请稍后再试或联系维护员。\n名称:${topic.name} \nID:${topic.id}`;
            } else {
                await bot.refresh();
                reply = `成功进驻节点！\n名称:${topic.name} \nID:${topic.id}`;
            }
        }
        await bot.replyText(msg, reply);
        await ActionLog.log(this.type, msg, reply);
        return Replied;
    }

}

class ExitTopicReplier extends ModeratorSubReplier {

    protected _regex = /^撤离 *　*(.+)/;

    async reply(bot: IBot, msg: Message, test: TestInfo): Promise<ReplyResult> {
        const nodes = test.data.user.nodes;
        if (!nodes) {
            await bot.replyText(msg, '粗心的维护员忘记配置据点信息了，快去提醒一下他吧！');
            return Replied;
        }
        const topic = await this.getNodeTopic(bot, nodes, test.data.r[1]);
        if (!topic) {
            await bot.replyText(msg, '获取节点信息失败😿，请稍后再试或联系维护员。');
            return Replied;
        }

        const config = bot.storage.config;
        const topics = config.topics;
        let reply;
        if (topics[topic.id]) {
            delete topics[topic.id];

            const upsertResult = await MiscConfig.upsertOne( { name: 'botConfig' }, { name: 'botConfig', value: config });

            if (upsertResult.modifiedCount == 0) {
                reply = `撤离节点失败😿，请稍后再试或联系维护员。\n名称:${topic.name} \nID:${topic.id}`;
            } else {
                await bot.refresh();
                reply = `成功撤离节点！\n名称:${topic.name} \nID:${topic.id}`;
            }
        } else {
            reply = `并没有进驻过这个节点呢\n名称:${topic.name} \nID:${topic.id}`;
        }
        await bot.replyText(msg, reply);
        await ActionLog.log(this.type, msg, reply);
        return Replied;
    }

}
