import { logger } from "mewbot";
import { Util } from "../../commons/utils.js";
import { AkMisc } from "../../models/ak/ak-misc.js";
import { Character } from "../../models/ak/character.js";
import { Sentence } from "../../models/sentence.js";

export class Recruit {

    protected _tags!: string[];
    protected _class = ['先锋', '狙击', '医疗', '术师', '近卫', '重装', '辅助', '特种'];
    protected _classFormal = new Array<string>();

    get tags() {
        return this._tags;
    }

    async refresh() {
        this._tags = await AkMisc.findOneByName<string[]>('tags');
        this._tags.push('资深干员', '高级资深干员', '资深', '高资', '高姿', '支援机械');
        this._tags.push('远程位', '近战位', '远程', '近战');
        this._tags = this._tags.concat(this._class);
        this._class.forEach(elem => this._classFormal.push(elem + '干员'));
        this._tags = this._tags.concat(this._classFormal);
    }

    async calculate(userTags: string[]): Promise<any[]> {
        // 别名替换
        for (let i = 0; i < userTags.length; i++) {
            if (userTags[i] == '高姿' || userTags[i] == '高资') {
                userTags[i] = '高级资深干员';
            } else if (userTags[i] == '资深') {
                userTags[i] = '资深干员';
            } else if (userTags[i] == '远程') {
                userTags[i] = '远程位';
            } else if (userTags[i] == '近战') {
                userTags[i] = '近战位';
            } else if (this._classFormal.indexOf(userTags[i]) != -1) {
                userTags[i] = this._class[this._classFormal.indexOf(userTags[i])];
            }
        }
        // 去重
        const set = new Set(userTags);
        userTags = Array.from(set);
        logger.debug('Recruit user tags: ');
        logger.dir(userTags);

        let results = [];
        // 针对单tag、2tag、3tag分别判断是否有超过4星的干员
        const allClasses = await AkMisc.findOneByName<any>('classes');
        for (let i = 1; i <= Math.min(userTags.length, 3); i++) {
            const combs = Util.combinations(userTags, i);  // tag的指定数量组合
            for (const combTags of combs) {
                const rarities = [];
                const positions = [];
                const classes = [];
                const tags = [];
                let isConflit = false;
                // tag分类
                for (const tag of combTags) {
                    if (tag == '高级资深干员') {
                        rarities.push(5);
                        if (rarities.length > 1) {  // 组合中稀有度tag数量不可超过1
                            isConflit = true;
                            break;
                        }
                        continue;
                    }
                    if (tag == '资深干员') {
                        rarities.push(4);
                        if (rarities.length > 1) {  // 组合中稀有度tag数量不可超过1
                            isConflit = true;
                            break;
                        }
                        continue;
                    }
                    if (tag == '支援机械') {
                        rarities.push(0);
                        if (rarities.length > 1) {  // 组合中稀有度tag数量不可超过1
                            isConflit = true;
                            break;
                        }
                        continue;
                    }
                    if (tag == '远程位') {
                        positions.push('RANGED');
                        if (positions.length > 1) {  // 组合中位置tag数量不可超过1
                            isConflit = true;
                            break;
                        }
                        continue;
                    }
                    if (tag == '近战位') {
                        positions.push('MELEE');
                        if (positions.length > 1) {  // 组合中位置tag数量不可超过1
                            isConflit = true;
                            break;
                        }
                        continue;
                    }
                    // 职业tag
                    let tagIsClass = false;
                    for (const key in allClasses) {
                        if (allClasses[key] == tag) {
                            if (classes.length > 0) { // 组合中职业tag数量不可超过1
                                isConflit = true;
                                break;
                            }
                            classes.push(key);
                            tagIsClass = true;
                            break;
                        }
                    }
                    if (tagIsClass) {
                        continue;
                    }
                    // 其余类型tag
                    tags.push(tag);
                }
                if (isConflit) {
                    // 如果当前组合存在冲突则跳过
                    continue;
                }
                // 执行查询
                const chars = await Character.findByRecruit(Util.getElemSafe(rarities, 0)!, Util.getElemSafe(positions, 0)!, Util.getElemSafe(classes, 0)!, tags);
                // 期望效果为仅保留必出、小车及4星以上情况
                // 如果结果中包含3、2星则排除
                let shouldExclude = false;
                const has6 = combTags.indexOf('高级资深干员') != -1;
                for (let i = chars.length - 1; i >= 0; i--) {
                    const item = chars[i];
                    if (item.rarity == 1 || item.rarity == 2) {
                        // 排除低星
                        shouldExclude = true;
                        break;
                    }
                    if (!has6 && item.rarity == 5) {
                        chars.splice(i, 1);     // 没有高资tag，移除6星
                    }
                }
                if (shouldExclude || chars.length == 0) {
                    continue;
                }
                // logger.dir(chars);
                // 干员按星级排序
                chars.sort((a, b) => {
                    return b.rarity - a.rarity;
                });
                combTags.sort((a, b) => {
                    return b.length - a.length;
                });
                // 返回tag组合和对应查询结果
                results.push({
                    combine: combTags,
                    characters: chars,
                });
            }
        }

        // 排序
        results = results.sort((a, b) => {
            let na = 0;
            let nb = 0;
            if (a.combine.indexOf('高级资深干员') != -1) {
                na++;
            }
            if (b.combine.indexOf('高级资深干员') != -1) {
                nb++;
            }
            if (na != nb) {
                return nb - na;
            }
            if (a.combine.indexOf('资深干员') != -1) {
                na++;
            }
            if (b.combine.indexOf('资深干员') != -1) {
                nb++;
            }
            if (na != nb) {
                return nb - na;
            }
            na = 0;
            for (const char of a.characters) {
                if (char.rarity > na) {
                    na = char.rarity;
                }
            }
            nb = 0;
            for (const char of b.characters) {
                if (char.rarity > nb) {
                    nb = char.rarity;
                }
            }
            if (na != nb) {
                return nb - na;
            }
            return b.combine.length - a.combine.length;
        });

        return results;
    }

    beautifyRecruitResults(results: any[]) {
        if (results == null || results.length == 0) {
            return Sentence.getRandomOne('recruitNoResult')!;
        }
        let text = '找到以下包含稀有干员的标签组合：';
        for (const item of results) {
            text += '\n------------------------\n';
            for (const tag of item.combine) {
                text += tag + '   ';
            }
            text += '\n';
            for (const char of item.characters) {
                text += this.getStarText(char.rarity) + char.name + '  ';
            }
        }
        return text;
    }

    getStarText(rarity: number) {
        let text;
        if (rarity == 5) {
            text = '[6★]';
        } else if (rarity == 4) {
            text = '[5★]';
        } else if (rarity == 3) {
            text = '[4☆]';
        } else {
            text = '[☆]';
        }
        return text;
    }
}

export const RecruitInst = new Recruit();
