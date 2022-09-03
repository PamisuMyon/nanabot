import { Message } from "mewbot";
import { IBot, MatryoshkaReplier, Replied, Replier, ReplyResult, TestInfo } from "mewbot";
import { ActionLog } from "../../models/action-log.js";
import { BlockedUser, IBlockedUser } from "../../models/block-list.js";
import { IUser, User, UserRole } from "../../models/user.js";
import { AkDataImporter } from "../gamedata/ak-data-importer.js";
import { RoleCheckSubReplier } from "./role-check.js";

export class SystemReplier extends MatryoshkaReplier {

    override type = 'system';
    protected override _pickFunc = Replier.pick01;
    protected override _children = [
        new RefreshCacheReplier(),
        new AddBlockListReplier(),
        new RemoveBlockListReplier(),
        new AddModeratorReplier(),
        new RemoveModeratorReplier(),
        new AddSenseiReplier(),
        new RemoveSenseiReplier(),
        new UpdateDataReplier(),
    ];

}

abstract class SystemSubReplier extends RoleCheckSubReplier {
    
    type = 'system';
    protected override _roles = [
        UserRole.Admin,
    ];

}

class RefreshCacheReplier extends SystemSubReplier {

    protected _regex = /^更新缓存$/;

    async reply(bot: IBot, msg: Message, test: TestInfo): Promise<ReplyResult> {
        await bot.refresh();
        await bot.replyText(msg, '缓存已更新，喵喵喵~');
        await ActionLog.log(this.type, msg);
        return Replied;
    }

}

class UpdateDataReplier extends SystemSubReplier {

    protected _regex = /^更新数据$/;

    async reply(bot: IBot, msg: Message, test: TestInfo): Promise<ReplyResult> {
        await bot.replyText(msg, '正在更新数据，请耐心等待...');
        const b = await AkDataImporter.updateAll();
        if (b) {
            await bot.replyText(msg, '数据更新成功，奇怪的知识增加了！');
        } else {
            await bot.replyText(msg, '数据更新失败，正在启动自毁程序...');
        }
        await ActionLog.log(this.type, msg);
        return Replied;
    }
}


class AddBlockListReplier extends SystemSubReplier {

    protected _regex = /^(屏蔽|封印) *　*(.+)/;
    
    async reply(bot: IBot, msg: Message, test: TestInfo): Promise<ReplyResult> {
        const result = await bot.client.getUserInfo(test.data.r[2]);
        let reply = '获取用户信息失败。';
        if (result.data && result.data.id) {
            const user: IBlockedUser = {
                id: result.data.id,
                username: result.data.username,
                name: result.data.name,
                isCursed: test.data.r[1] == '封印',
                updatedAt: new Date(),
            };
            const upsertResult = await BlockedUser.upsertOne({ id: user.id }, user);
            if (upsertResult.upsertedCount == 0)
                reply = `${user.name}@${user.username}已在屏蔽列表中。`;
            else {
                await bot.storage.refreshBlockList();
                reply = `${user.name}@${user.username}已被${test.data.r[1]}`;
            }
        } else if (result.error && result.error.status == 404) {
            reply = '用户不存在，请检查MEW ID是否正确。';
        }
        await bot.replyText(msg, reply);
        await ActionLog.log(this.type, msg, reply);
        return Replied;
    }

}

class RemoveBlockListReplier extends SystemSubReplier {

    protected _regex = /^解除(屏蔽|封印) *　*(.+)/;
    
    async reply(bot: IBot, msg: Message, test: TestInfo): Promise<ReplyResult> {
        let reply = '用户不在屏蔽列表中。';
        const user = await BlockedUser.findOne({ username: test.data.r[2] });
        if (user && user.id) {
            await BlockedUser.deleteOne({ id: user.id });
            await bot.storage.refreshBlockList();
            reply = `${user.name}@${user.username}已解除屏蔽。`;
        }
        await bot.replyText(msg, reply);
        await ActionLog.log(this.type, msg, reply);
        return Replied;
    }

}

class AddModeratorReplier extends SystemSubReplier {

    protected _regex = /^添加管理员 *　*(.+)/;

    async reply(bot: IBot, msg: Message, test: TestInfo): Promise<ReplyResult> {
        const result = await bot.client.getUserInfo(test.data.r[1]);
        let reply = '获取用户信息失败。';
        if (result.data && result.data.id) {
            const user: IUser = {
                id: result.data.id,
                username: result.data.username,
                name: result.data.name,
                role: UserRole.Moderator,
            };
            const upsertResult = await User.upsertOne({ id: user.id }, user);
            if (upsertResult.upsertedCount == 0)                        
                reply = `${user.name}@${user.username}已经是管理员了。`;
            else
                reply = `${user.name}@${user.username}现在是管理员啦！`;
        } else if (result.error && result.error.status == 404) {
            reply = '用户不存在，请检查MEW ID是否正确。';
        }
        await bot.replyText(msg, reply);
        await ActionLog.log(this.type, msg, reply);
        return Replied;
    }   

}

class RemoveModeratorReplier extends SystemSubReplier {

    protected _regex = /^移除管理员 *　*(.+)/;
    
    async reply(bot: IBot, msg: Message, test: TestInfo): Promise<ReplyResult> {
        let reply = '用户不在管理员列表中。';
        const user = await User.findOne({ username: test.data.r[1], role: UserRole.Moderator });
        if (user && user.id) {
            await User.deleteOne({ id: user.id });
            reply = `${user.name}@${user.username}现在不是管理员了。`;
        }
        await bot.replyText(msg, reply);
        await ActionLog.log(this.type, msg, reply);
        return Replied;
    }

}

class AddSenseiReplier extends SystemSubReplier {

    protected _regex = /^添加老师 *　*(.+)/;

    async reply(bot: IBot, msg: Message, test: TestInfo): Promise<ReplyResult> {
        const result = await bot.client.getUserInfo(test.data.r[1]);
        let reply = '获取用户信息失败。';
        if (result.data && result.data.id) {
            const user: IUser = {
                id: result.data.id,
                username: result.data.username,
                name: result.data.name,
                role: UserRole.Sensei,
            };
            const upsertResult = await User.upsertOne({ id: user.id }, user);
            if (upsertResult.upsertedCount == 0)                        
                reply = `${user.name}@${user.username}已经是老师了。`;
            else
                reply = `${user.name}@${user.username}现在是老师啦！`;
        } else if (result.error && result.error.status == 404) {
            reply = '用户不存在，请检查MEW ID是否正确。';
        }
        await bot.replyText(msg, reply);
        await ActionLog.log(this.type, msg, reply);
        return Replied;
    }   

}

class RemoveSenseiReplier extends SystemSubReplier {

    protected _regex = /^移除老师 *　*(.+)/;
    
    async reply(bot: IBot, msg: Message, test: TestInfo): Promise<ReplyResult> {
        let reply = '用户不在老师列表中。';
        const user = await User.findOne({ username: test.data.r[1], role: UserRole.Sensei });
        if (user && user.id) {
            await User.deleteOne({ id: user.id });
            reply = `${user.name}@${user.username}现在不是老师了。`;
        }
        await bot.replyText(msg, reply);
        await ActionLog.log(this.type, msg, reply);
        return Replied;
    }

}
