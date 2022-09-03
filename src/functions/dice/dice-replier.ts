import { Message } from "mewbot";
import { FullConfidence, IBot, NoConfidence, Replied, Replier, ReplyResult, TestInfo, TestParams } from "mewbot";
import { Util } from "../../commons/utils.js";
import { ActionLog } from "../../models/action-log.js";
import { MiscConfig } from "../../models/config.js";
import { Sentence } from "../../models/sentence.js";

/**
 * 骰娘的本职工作
 */
export class DiceReplier extends Replier {

    type = 'dice';

    // protected _regexStrict = /^((\d+) ?\+ ?)?((\d*) )?(\d*)d(\d+)( ?\+ ?(\d+))?=?$/i;
    protected _regexLax = /((\d+) ?\+ ?)?((\d*) )?(\d*)d(\d+)( ?\+ ?(\d+))?=?/i;
    protected _ignores: RegExp[] = [];

    async init(bot: IBot) {
        await super.init(bot);
        const ignores = await MiscConfig.findOneByName<string[]>('diceIgnores');
        this._ignores = [];
        for (const item of ignores) {
            this._ignores.push(new RegExp(item, 'i'));
        }
    }

    override async test(msg: Message, options: TestParams): Promise<TestInfo> {
        if (!msg.content) return NoConfidence;
        // if (this._regexStrict.test(msg.content)) return FullConfidence;
        // else if (this._regexLax.test(msg.content)) return HalfConfidence;
        for (const item of this._ignores) {
            if (item.test(msg.content)) return NoConfidence;
        }
        if (this._regexLax.test(msg.content)) return FullConfidence;
        else return NoConfidence;
    }

    override async reply(bot: IBot, msg: Message, test: TestInfo): Promise<ReplyResult> {
        if (!await this.checkAvailable(bot, msg)) {
            return Replied;
        }
        
        const lines = msg.content!.split('\n');
        const options = new Array<DiceOptions>();
        for (const line of lines) {
            const r = this._regexLax.exec(line);
            if (!r) continue;
            const option: DiceOptions = {
                add: Util.getNumber(r[2], 0),
                rounds: Util.getNumber(r[4], 1),
                times: Util.getNumber(r[5], 1),
                dice: Util.getNumber(r[6], 0),
                add2: Util.getNumber(r[8], 0),
            };
            options.push(option);
        }
        let reply = Dice.rolls(options, Sentence.get('commandError')!, Sentence.get('diceTooMany')!);
        if (!msg._isDirect && reply.indexOf('\n') != -1) {
            reply = '\n' + reply;
        }

        await bot.replyText(msg, reply);
        ActionLog.log(this.type, msg, reply);
        return Replied;
    }

}

export interface DiceOptions {
    add: number;        // 前置加数
    rounds: number;     // 掷几轮
    times: number;      // 骰子数
    dice: number;       // 骰子
    add2: number;       // 后置加数
}

export class Dice {
    static roll(o: DiceOptions) {
        let result = '';
        if (o.rounds <= 0 || o.times <= 0 || o.dice <= 0) {
            return result;
        } else {
            for (let i = 0; i < o.rounds; i++) {
                let num: number;
                let sum = 0;
                if (o.rounds > 1) {
                    result += `${i + 1} »  `;
                }
                if (o.add != 0) {
                    result += `${o.add}+`;
                }
                result += `${o.times}d${o.dice}`;
                if (o.add2 != 0) {
                    result += `+${o.add2}`;
                }
                result += '=';
                if (o.times == 1) {
                    num = Util.randomInt(1, o.dice);
                    if (o.add != 0 || o.add2 != 0) {
                        if (o.add != 0) {
                            result += `${o.add}+`;
                        }
                        result += num;
                        if (o.add2 != 0) {
                            result += `+${o.add2}`;
                        }
                        sum = o.add + num + o.add2;
                        result += `=${sum}`;
                    } else {
                        result += o.add + num + o.add2;
                    }
                } else {
                    if (o.add != 0) {
                        result += `${o.add}+`;
                    }
                    sum += o.add;
                    for (let j = 0; j < o.times; j++) {
                        num = Util.randomInt(1, o.dice);
                        sum += num;
                        result += num;
                        if (j < o.times - 1) {
                            result += '+';
                        }
                    }
                    if (o.add2 != 0) {
                        result += `+${o.add2}`;
                    }
                    sum += o.add2;
                    result += `=${sum}`;
                }
                if (o.rounds != 1 && i < o.rounds - 1) {
                    result += '\n';
                }
            }
        }
        return result;
    }

    static rolls(options: DiceOptions[],
        errorHints: string[],
        tooManyHints: string[],
        maxRounds = 20,
        maxTimes = 50) {
        const results = new Array<string>();
        for (const o of options) {
            let result = '';
            if (o.rounds <= 0 || o.times <= 0 || o.dice <= 0) {
                result = Util.randomItem(errorHints);
            } else if (o.rounds >= maxRounds || o.times > maxTimes) {
                result = Util.randomItem(tooManyHints);
            } else {
                result = this.roll(o);
            }
            results.push(result);
        }
        let reply = '';
        if (results.length > 1) {
            for (let i = 0; i < results.length; i++) {
                const splits = results[i].split('\n');
                for (let j = 0; j < splits.length; j++) {
                    reply += `${i + 1} ·  `;
                    reply += splits[j];
                    if (j < splits.length - 1) {
                        reply += '\n';
                    }
                }
                if (i < results.length - 1) {
                    reply += '\n';
                }
            }
        } else if (results.length == 1) {
            reply = results[0];
        } else {
            reply = Util.randomItem(errorHints);
        }
        return reply;
    }
}
