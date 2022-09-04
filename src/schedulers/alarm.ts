import { logger } from 'mewbot';
import * as schedule from 'node-schedule';
import { IBot } from "mewbot";
import { Util } from '../commons/utils.js';
import { Pxkore, PxkoreOptions } from '../functions/picture/pxkore.js';
import { Handbook } from '../models/ak/handbook.js';
import { Sentence } from '../models/sentence.js';
import { ServerImage } from '../models/server-image.js';
import { ActionLog } from '../models/action-log.js';


export class Alarm {

    type = 'alarm';
    protected _bot: IBot;

    constructor(bot: IBot) {
        this._bot = bot;
    }

    schedule() {
        this.scheduleMorning(7, 30, 1);
        // this.scheduleNoon(12, 30, 1);
        this.scheduleNight(22, 30, 1);
        this.scheduleBirthday(0, 0, 22);
        this.schedulePicture(12, 30, 1);
        this.schedulePicture(18, 30, 1);
        logger.debug('Alarms scheduled.');
    }

    protected scheduleMorning(hour: number, minute: number, second: number) {
        const rule = new schedule.RecurrenceRule();
        rule.hour = hour;
        rule.minute = minute;
        rule.second = second;
        schedule.scheduleJob(rule, (date) => {
            (async () => {
                const birthdayMsg = await Handbook.getBirthDayMessageSimple(date);

                const config = this._bot.config;
                for(const key in config.topics) {
                    const topic = config.topics[key];
                    const scheduleConfig = topic.repliers.schedule;
                    if (!scheduleConfig || !scheduleConfig.morning)
                        continue;

                    let content: string;
                    const specials = Sentence.get('morningSpecial');
                    if (specials && specials.length > 0) {
                        content = Util.randomItem(specials);
                    } else if (date.getDay() == 0) {
                        content = Sentence.getRandomOne('morningSunday')!;
                    } else {
                        content = Sentence.getRandomOne('morning')!;
                    }
                    if (birthdayMsg) {
                        content += '\n' + birthdayMsg;
                    }
                    logger.debug(`Morning message to ${topic}, content: ${content}`);
                    if (content) {
                        const result = await this._bot.client.sendTextMessage(key, content);
                        await ActionLog.logMessage(this.type, result);
                        await Util.sleep(500);
                    }
                }
            })();
        });
    }

    protected scheduleNoon(hour: number, minute: number, second: number) {
        const rule = new schedule.RecurrenceRule();
        rule.hour = hour;
        rule.minute = minute;
        rule.second = second;
        schedule.scheduleJob(rule, (date) => {
            (async () => {
                const config = this._bot.config;
                for(const key in config.topics) {
                    const topic = config.topics[key];
                    const scheduleConfig = topic.repliers.schedule;
                    if (!scheduleConfig || !scheduleConfig.noon)
                        continue;

                    let content: string;
                    const specials = Sentence.get('noonSpecial');
                    if (specials && specials.length > 0) {
                        content = Util.randomItem(specials);
                    } else if (date.getDay() == 0) {
                        content = Sentence.getRandomOne('noonSunday')!;
                    } else {
                        content = Sentence.getRandomOne('noon')!;
                    }
                    logger.debug(`Noon message to ${topic}, content: ${content}`);
                    if (content) {
                        const result = await this._bot.client.sendTextMessage(key, content);
                        await ActionLog.logMessage(this.type, result);
                        await Util.sleep(500);
                    }
                }
            })();
        });
    }

    protected scheduleNight(hour: number, minute: number, second: number) {
        const rule = new schedule.RecurrenceRule();
        rule.hour = hour;
        rule.minute = minute;
        rule.second = second;
        schedule.scheduleJob(rule, (date) => {
            (async () => {
                const config = this._bot.config;
                for(const key in config.topics) {
                    const topic = config.topics[key];
                    const scheduleConfig = topic.repliers.schedule;
                    if (!scheduleConfig || !scheduleConfig.night)
                        continue;

                    let content: string;
                    const specials = Sentence.get('nightSpecial');
                    if (specials && specials.length > 0) {
                        content = Util.randomItem(specials);
                    } else if (date.getDay() == 0) {
                        content = Sentence.getRandomOne('nightSunday')!;
                    } else {
                        content = Sentence.getRandomOne('night')!;
                    }
                    logger.debug(`Night message to ${topic}, content: ${content}`);
                    if (content) {
                        const result = await this._bot.client.sendTextMessage(key, content);
                        await ActionLog.logMessage(this.type, result);
                        await Util.sleep(500);
                    }
                }
            })();
        });
    }


    protected scheduleBirthday(hour: number, minute: number, second: number) {
        const rule = new schedule.RecurrenceRule();
        rule.hour = hour;
        rule.minute = minute;
        rule.second = second;
        schedule.scheduleJob(rule, (date) => {
            (async () => {
                const birthdayMsg = await Handbook.getBirthDayMessageSimple(date);
                if (!birthdayMsg) return;

                const config = this._bot.config;
                for(const key in config.topics) {
                    const topic = config.topics[key];
                    const scheduleConfig = topic.repliers.schedule;
                    if (!scheduleConfig || !scheduleConfig.birthday)
                        continue;

                    const result = await this._bot.client.sendTextMessage(key, birthdayMsg);
                    await ActionLog.logMessage(this.type, result);
                    await Util.sleep(500);
                }
            })();
        });
    }

    protected schedulePicture(hour: number, minute: number, second: number) {
        const rule = new schedule.RecurrenceRule();
        rule.hour = hour;
        rule.minute = minute;
        rule.second = second;
        schedule.scheduleJob(rule, (date) => {
            (async () => {
                const config = this._bot.config;
                for(const key in config.topics) {
                    const topic = config.topics[key];
                    const scheduleConfig = topic.repliers.schedule;
                    if (!scheduleConfig || !scheduleConfig.picture)
                        continue;
                    
                    const options: PxkoreOptions = {
                        tags: scheduleConfig.picture.tags,
                        shouldRecord: false,
                        isRandomSample: false,
                        appendTotalSampleInfo: false
                    };
                    const result = await Pxkore.request(options);
                    if (result && result.path) {
                        const imageMsg = await this._bot.sendImageWithCache(key, result.path, ServerImage);
                        if (result.info && imageMsg.data && imageMsg.data.id) {
                            Util.sleep(200);
                            this._bot.client.sendTextMessage(key, result.info);
                        }
                        await ActionLog.logMessage(this.type, imageMsg, result.data);
                        Util.sleep(200);
                    }
                }
            })();
        });
    }
    
}