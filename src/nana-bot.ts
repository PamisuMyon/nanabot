import { ConnectOptions, InitOptions, MewBot, MewClient, ServerInfo } from "mewbot";
import { ChatReplier } from "./functions/chat/chat-replier.js";
import { DiceReplier } from "./functions/dice/dice-replier.js";
import { GachaReplier } from "./functions/gacha/gacha-replier.js";
import { HelpReplier } from "./functions/help-replier.js";
import { PictureReplier } from "./functions/picture/picture-replier.js";
import { OcrRecruitReplier } from "./functions/recruit/ocr-recruit-replier.js";
import { TextRecruitReplier } from "./functions/recruit/text-recruit-replier.js";
import { SilenceReplier } from "./functions/silence-replier.js";
import { ModeratorReplier } from "./functions/system/moderator-replier.js";
import { SenseiReplier } from "./functions/system/sensei-replier.js";
import { SystemReplier } from "./functions/system/system-replier.js";
import { WikiReplier } from "./functions/wiki/wiki-replier.js";
import { Task } from "./schedulers/task.js";
import { MongoStorage } from "./storage.js";

export class NanaBot extends MewBot {

    protected _storage = new MongoStorage();
    protected _repliers = [
        new SystemReplier(),
        new ModeratorReplier(),
        new SenseiReplier(),
        new SilenceReplier(),
        new GachaReplier(),
        new PictureReplier(),
        new DiceReplier(),
        new HelpReplier(),
        new TextRecruitReplier(),
        new OcrRecruitReplier(),
        new WikiReplier(),
        new ChatReplier(),
    ];


    constructor(options?: InitOptions) {
        super(options);
        const opt: Partial<ConnectOptions> = {
            serverInfo: vrollServerInfo
        };
        this._client = new MewClient(opt);
    }
    
    override async refresh() {
        await Task.refreshAllCache();
        await super.refresh();
    }

}

const vrollServerInfo: ServerInfo = {
    apiHost: 'https://api.vroll.me',
    wsHost: 'wss://gateway.vroll.me/socket.io/?EIO=4&transport=websocket',
    getHeaders(): Record<string, any> {
        return {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'zh-CN,zh;q=0.8,zh-TW;q=0.7,zh-HK;q=0.5,en-US;q=0.3,en;q=0.2',
            'Referer': 'https://vroll.me/',
            'Origin': 'https://vroll.me',
        };
    },
    getWsHeaders(): Record<string, any> {
        return {
            'Host': 'gateway.vroll.me',
            'Connection': 'Upgrade',
            'Pragma': 'no-cache',
            'Cache-Control': 'no-cache',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
            'Upgrade': 'websocket',
            'Origin': 'https://vroll.me',
            'Accept-Encoding': 'gzip, deflate, br',
            'Accept-Language': 'zh-CN,zh;q=0.9',
        };
    }
};
