import { BaiduAuth } from "../ai/baidu-auth.js";
import { GachaInst } from "../functions/gacha/gacha.js";
import { RecruitInst } from "../functions/recruit/recruit.js";
import { Alias } from "../models/ak/alias.js";
import { Conversation } from "../models/conversation.js";
import { Sentence } from "../models/sentence.js";


export class Task {
    static async refreshAllCache() {
        await BaiduAuth.init();
        await Sentence.refresh();
        await Conversation.refresh();
        await GachaInst.refresh();
        await RecruitInst.refresh();
        await Alias.refresh();
    }
}
