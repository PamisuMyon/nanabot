/* eslint-disable no-useless-escape */
import { Util as LibUtils } from "mewbot";

export class Util extends LibUtils {

    static stringFormat(str: string, ...args: string[]) {
        if (args.length == 0)
            return str;
        for (let i = 0; i < args.length; i++) {
            const re = new RegExp('\\{' + i + '\\}', 'gm');
            str = str.replace(re, args[i]);
        }
        return str;
    }

    /**
     * 返回items中元素的所有组合情况
     * 
     * @param items 数组
     * @param limit 组合数量限制
     */
    static combinations<T>(items: T[], limit: number): T[][] {
        return this.doCombination<T>(items, limit, 0);
    }

    /**
     * @param items 数组
     * @param limit 组合数量限制
     * @param index 当前下标
     */
    protected static doCombination<T>(items: T[], limit: number, index: number): T[][] {
        // 递归跳出条件，组合数量为1时，将每个元素作为单独的数组返回，和上一层组合
        if (limit == 1 || index == items.length - 1) {
            const arr: T[][] = [];
            items.slice(index).forEach(elem => arr.push([elem]));
            return arr;
        }
        let results: T[][] = [];
        // 从第0个元素依次向后，将自身与下一层数组组合
        for (; index <= items.length - limit; index++) {
            const arr = this.doCombination<T>(items, limit - 1, index + 1);
            arr.forEach(elem => {
                elem.unshift(items[index]);
            });
            results = results.concat(arr);
        }
        return results;
    }

    static isValidDate(intYear: number, intMonth: number, intDay: number) {
        if (isNaN(intYear) || isNaN(intMonth) || isNaN(intDay)) return false;
        if (intMonth > 12 || intMonth < 1) return false;
        if (intDay < 1 || intDay > 31) return false;
        if ((intMonth == 4 || intMonth == 6 || intMonth == 9 || intMonth == 11) && (intDay > 30)) return false;
        if (intMonth == 2) {
            if (intDay > 29) return false;
            if ((((intYear % 100 == 0) && (intYear % 400 != 0)) || (intYear % 4 != 0)) && (intDay > 28)) return false;
        }
        return true;
    }

    static isValidMonthDate(intMonth: number, intDay: number) {
        if (isNaN(intMonth) || isNaN(intDay)) return false;
        if (intMonth > 12 || intMonth < 1) return false;
        if (intDay < 1 || intDay > 31) return false;
        if ((intMonth == 4 || intMonth == 6 || intMonth == 9 || intMonth == 11) && (intDay > 30)) return false;
        if (intMonth == 2 && intDay > 29) return false;
        return true;
    }

    static removeLabel(text: string) {
        const reg = /<[\@\$\/].*?>/g;
        return text.replace(reg, '');
    }

    static cleanContent(content: string, keepEmpty = false) {
        const puncRegex = /[\ \~\`\!\@\#\$\%\^\&\*\(\)\-\_\+\=\|\\\[\]\{\}\;\:\"\'\,\<\.\>\/\?《》【】「」￥！。，”“、…]/g;
        let replace = content.replace(puncRegex, '');
        const emojiRegex = /(\ud83c[\udf00-\udfff])|(\ud83d[\udc00-\ude4f])|(\ud83d[\ude80-\udeff])/g;
        replace = replace.replace(emojiRegex, '');
        if (replace && !keepEmpty) {
            // 去除标点符号后内容不为空，则保留去除结果
            content = replace;
        } else { // keepEmpty为true时，无论处理后结果是否为空，均返回结果
            content = replace;
        }
        return content;
    }
    
    static getRarityText(rarity: number) {
        let rarityStr = '';
        if (!isNaN(rarity)) {
            if (rarity == 0)
                rarityStr = '⬜';
            else if (rarity == 1)
                rarityStr = '🟩';
            else if (rarity == 2)
                rarityStr = '🟦';
            else if (rarity == 3)
                rarityStr = '🟪';
            else if (rarity == 4)
                rarityStr = '🟨';
            else if (rarity == 5)
                rarityStr = '🟧';
        }
        return rarityStr;
    }

    static zhDigitToArabic(digit: string) {
        // 返回中文大写数字对应的阿拉伯数字
        function getNumber(num: string) {
            for (let i = 0; i < zh.length; i++) {
                if (zh[i] == num) {
                    return i;
                }
            }
            return 0;
        }

        // 取单位
        function getUnit(num: string) {
            for (let i = unit.length; i > 0; i--) {
                if (num == unit[i - 1]) {
                    return Math.pow(10, 4 - i);
                }
            }
            return 1;
        }

        // 取分段
        function getQuot(q: string) {
            for (let i = 0; i < quot.length; i++) {
                if (q == quot[i]) {
                    return Math.pow(10, (i + 1) * 4);
                }
            }
            return 1;
        }

        const zh = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
        const unit = ['千', '百', '十'];
        const quot = ['万', '亿', '兆', '京', '垓', '秭', '穰', '沟', '涧', '正', '载', '极', '恒河沙', '阿僧祗', '那由他', '不可思议', '无量', '大数'];
        let result = 0, quotFlag;

        if (digit[0] === '十') {
            if (digit.length === 1) {
                return 10;
            } else if (digit.length === 2) {
                return 10 + getNumber(digit[1]);
            }
        }

        for (let i = digit.length - 1; i >= 0; i--) {
            if (zh.indexOf(digit[i]) > -1) { // 数字
                if (quotFlag) {
                    result += quotFlag * getNumber(digit[i]);
                } else {
                    result += getNumber(digit[i]);
                }
            } else if (unit.indexOf(digit[i]) > -1) { // 十分位
                if (quotFlag) {
                    result += quotFlag * getUnit(digit[i]) * getNumber(digit[i - 1]);
                } else {
                    result += getUnit(digit[i]) * getNumber(digit[i - 1]);
                }
                --i;
            } else if (quot.indexOf(digit[i]) > -1) { // 万分位
                if (unit.indexOf(digit[i - 1]) > -1) {
                    if (getNumber(digit[i - 1])) {
                        result += getQuot(digit[i]) * getNumber(digit[i - 1]);
                    } else {
                        result += getQuot(digit[i]) * getUnit(digit[i - 1]) * getNumber(digit[i - 2]);
                        quotFlag = getQuot(digit[i]);
                        --i;
                    }
                } else {
                    result += getQuot(digit[i]) * getNumber(digit[i - 1]);
                    quotFlag = getQuot(digit[i]);
                }
                --i;
            }
        }

        return result;
    }

}
