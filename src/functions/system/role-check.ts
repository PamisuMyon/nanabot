import { Message } from "mewbot";
import { Replier, TestParams, TestInfo, NoConfidence } from "mewbot";
import { User, UserRole } from "../../models/user.js";

export abstract class RoleCheckSubReplier extends Replier {

    protected abstract _regex: RegExp;
    protected abstract _roles: UserRole[];

    override async test(msg: Message, options: TestParams): Promise<TestInfo> {
        // if (!msg._isDirect) return NoConfidence;
        if (!msg.content) return NoConfidence;
        const r = this._regex.exec(msg.content);
        if (r) {
            const user = await User.findOne({ id: msg.author_id });
            if (user && this._roles.indexOf(user.role) != -1) 
                return { confidence: 1, data: { r, user } };
        } 
        return NoConfidence;
    }

}
