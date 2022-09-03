import { logger, LogLevel } from "mewbot";
import { NanaBot } from "./nana-bot.js";
import { Alarm } from "./schedulers/alarm.js";

(async () => {
    logger.logLevel = LogLevel.Debug;
    
    const nana = new NanaBot();
    await nana.launch();
    
    const alarm = new Alarm(nana);
    alarm.schedule();
})();
