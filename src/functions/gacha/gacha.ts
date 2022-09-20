import { logger } from "mewbot";
import { Util } from "../../commons/utils.js";
import { AkMisc, Pickup } from "../../models/ak/ak-misc.js";
import { Character } from "../../models/ak/character.js";
import { Sentence } from "../../models/sentence.js";

const rarities: Record<number, number> = {
    1: 2,
    41: 3,
    91: 4,
    99: 5
};

type Operator = {
    name: string;
    rarity: number;
}

type Pool = {
    name: string;
    type: string;
    ignore: string[];
    extra: string[];
    operators: Operator[]; 
    pickupNames: string[];
    pickup: Pickup;
};

export class Gacha {

    pools: {[name: string]: Pool } = {};

    async refresh() {
        const allOps = new Array<Operator>();   // 所有干员
        const notOps = new Array<Operator>();   // 非干员
        const availOps = new Array<Operator>(); // 可用干员
        this.pools = {};     // 卡池

        logger.debug('Updating gacha pools...');
        // up信息
        const pickups = await AkMisc.findOneByName<Pickup[]>('pickups');
        if (!pickups || pickups.length == 0) {
            logger.error('No pickups found, please check collection "ak-misc"');
            return;
        }

        // 职业大类
        const classes = await AkMisc.findOneByName<any>('classes');
        // 特殊干员
        const special = await AkMisc.findOneByName<any>('specialOperators');

        // 获取所有干员
        const chars = await Character.find().toArray();
        for (const char of chars) {
            // 排除非干员数据
            if (!Reflect.has(classes, char.profession)) {
                notOps.push({
                    name: char.name,
                    rarity: isNaN(char.rarity) ? 0 : char.rarity,
                });
                continue;
            }
            const op = {
                name: char.name.trim(),
                rarity: char.rarity,
            };
            allOps.push(op);
            // 可寻访干员
            if (this.isOperatorAvailable(special, op.name)) {
                availOps.push(op);
            }
        }

        // 创建卡池信息
        for (const pickup of pickups) {
            const pool: Pool = {
                name: pickup.name,
                type: pickup.type,
                ignore: pickup.ignore? pickup.ignore : [],
                extra: pickup.extra,
                operators: [],
                pickupNames: [],
                pickup: pickup,
            };
            pool.pickupNames = pool.pickupNames.concat(pickup['6'])
                .concat(pickup['5'])
                .concat(pickup['4']);
            for (const op of availOps) {
                if (op.rarity < 2) continue;
                if (pool.ignore && pool.ignore.indexOf(op.name) != -1) continue;
                if (pool.pickupNames.indexOf(op.name) != -1) continue;
                if (op.rarity == 5 && pickup.is6UpOnly) continue;
                if (op.rarity == 4 && pickup.is5UpOnly) continue;
                if (op.rarity == 3 && pickup.is4UpOnly) continue;

                pool.operators.push(op);
            }
            this.pools[pool.name] = pool;
        }
        
        logger.debug('Gacha pools updated!');
    }

    isOperatorAvailable(special: any, opName: string): boolean {
        if (!special) {
            return false;
        }
        for (const name of special.limit) {
            if (name === opName)
                return false;
        }
        for (const name of special.linkage) {
            if (name === opName)
                return false;
        }
        for (const key in special.unavailable) {
            for (const name of special.unavailable[key]) {
                if (name === opName)
                    return false;
            }
        }
        return true;
    }

    getOperatorsByRarity(operators: Operator[], rarity: number) {
        const list = [];
        for (const op of operators) {
            if (op.rarity == rarity) {
                list.push(op);
            }
        }
        return list;
    }

    roll(poolName: string, times: number, waterLevel = 0) {
        const pool = this.pools[poolName];
        const results = [];
        for (let i = 0; i < times; i++) {
            // 稀有度
            const num = Util.randomInt(1, 100);
            let rarity = 0;

            for (const key in rarities) {
                if (num >= parseInt(key))
                    rarity = rarities[key];
            }

            if (waterLevel > 50) {
                const up = 99 - (waterLevel - 50) * 2;
                if (num >= up) {
                    rarity = 5;
                }
            }

            if (rarity == 5) {
                waterLevel = 0;
            } else {
                waterLevel++;
            }

            // 是否位于pickup
            let ops: Operator[] = [];
            if (rarity == 5) {
                if (pool.pickup['6'] && pool.pickup['6'].length > 0) {
                    const num = pool.pickup.is6UpOnly? 100 : Util.randomInt(1, 100);
                    let p = 51;
                    if (pool.type.indexOf('limited') != -1) {
                        p = 31; // 限定池6星up占70%
                    }
                    if (num >= p) {
                        for (const item of pool.pickup['6']) {
                            ops.push({
                                name: item + '  ↑',
                                rarity: rarity
                            });
                        }
                    }
                }
            } else if (rarity == 4) {
                if (pool.pickup['5'] && pool.pickup['5'].length > 0) {
                    const num = pool.pickup.is5UpOnly? 100 : Util.randomInt(1, 100);
                    if (num >= 51) {
                        for (const item of pool.pickup['5']) {
                            ops.push({
                                name: item + '  ↑',
                                rarity: rarity
                            });
                        }
                    }
                }
            } else if (rarity == 3) {
                if (pool.pickup['4'] && pool.pickup['4'].length > 0) {
                    const num = pool.pickup.is4UpOnly? 100 :  Util.randomInt(1, 100);
                    if (num >= 81) {
                        for (const item of pool.pickup['4']) {
                            ops.push({
                                name: item + '  ↑',
                                rarity: rarity
                            });
                        }
                    }
                }
            }
            if (ops.length == 0) {
                ops = this.getOperatorsByRarity(pool.operators, rarity);
                // 5倍权值 目前仅6星
                if (rarity == 5 && pool.extra && pool.extra.length > 0) {
                    for (let i = 0; i < 5; i++) {
                        for (const item of pool.extra) {
                            ops.push({
                                name: item + '  ▲',
                                rarity: rarity
                            });
                        }
                    }
                }
            }

            // 抽取
            results.push(Util.randomItem(ops));
        }
        // console.log('Roll result(s): ');
        // console.dir(results);
        return { results, waterLevel };
    }

    randomTicketPrefix() {
        const s = Sentence.getRandomOne('ticketPrefix');
        return s? s : '';
    }

    beautifyRollResults(results: any[], poolName: string) {
        let text = '';
        if (results.length == 1) {
            text += `使用${this.randomTicketPrefix()}600合成玉进行了一次【${poolName}】寻访，结果：\n`;
            text += this.getStarText(results[0].rarity) + results[0].name;
        } else if (results.length == 10) {
            text += `使用${this.randomTicketPrefix()}寻访凭证进行了十次【${poolName}】寻访，结果：\n`;
            for (const result of results) {
                text += this.getStarText(result.rarity) + result.name;
                text += '\n';
            }
        }
        return text;
    }

    getStarText(rarity: number): string {
        if (rarity <= 0) return '[✧]';
        let text = '[';
        for (let i = 0; i < rarity + 1; i++) {
            if (rarity > 3) {
                text += '★';
            } else {
                text += '☆';
            }
        }
        text += ']';
        return text;
    }

    getPoolInfo(name: string) {
        if (name) {
            for (const key in this.pools) {
                // 匹配卡池名
                if (key.search(name) != -1) {
                    return { name: key, type: this.pools[key].type };
                }
                // 匹配up干员
                for (const op of this.pools[key].pickupNames) {
                    if (op == name) {
                        return { name: key, type: this.pools[key].type };
                    }
                    if (this.pools[key].type.indexOf('april_fool') != -1
                        && op.indexOf(name) != -1) {
                        return { name: key, type: this.pools[key].type };
                    }
                }
            }
            return { name: '标准', type: 'normal' };
        }
        const key = Object.keys(this.pools)[0];
        return { name: key, type: this.pools[key].type };
    }

}

export const GachaInst = new Gacha();
