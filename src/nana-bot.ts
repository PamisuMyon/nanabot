import { MewBot } from "mewbot";
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

    override async refresh() {
        await Task.refreshAllCache();
        await super.refresh();
    }

}
