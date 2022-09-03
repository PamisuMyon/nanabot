/* eslint-disable no-useless-escape */
import got from "got";
import { logger } from "mewbot";
import { Util } from "mewbot";
import { Conversation, ConversationPriority } from "../../models/conversation.js";

export class Chatter {

    protected _puncRegex = /[\ \~\`\!\@\#\$\%\^\&\*\(\)\-\_\+\=\|\\\[\]\{\}\;\:\"\'\,\<\.\>\/\?《》【】「」￥！。，”“、…]/g;
    protected _emojiRegex = /(\ud83c[\udf00-\udfff])|(\ud83d[\udc00-\ude4f])|(\ud83d[\ude80-\udeff])/g;
    
    wash(content: string) {
        let replace = content.replace(this._puncRegex, ' ');
        replace = replace.replace(this._emojiRegex, '');
        if (replace.trim()) {
            // 去除标点符号后内容不为空，则保留去除结果
            content = replace;
        }
        return content;
    }

    getConversationReply(content: string) {
        for (const item of Conversation.cache) {
            if (item.type == 'sentence') {
                // 完整句子匹配
                let found = false;
                for (const q of item.q) {
                    if (content == q) {
                        found = true;
                        if (item.condition != 'and') {
                            break;
                        }
                    } else if (item.condition == 'and') {
                        found = false;
                        break;
                    }
                }
                if (found) {
                    // 优先级最高，立即返回结果
                    return {
                        content: Util.randomItem(item.a),
                        priority: ConversationPriority.High,
                    };
                }
            } else if (item.type == 'regex') {
                // 正则匹配
                let found = false;
                for (const q of item.q) {
                    const reg = new RegExp(q, 'igm');
                    if (reg.test(content)) {
                        found = true;
                        if (item.condition != 'and') {
                            break;
                        }
                    } else if (item.condition == 'and') {
                        found = false;
                        break;
                    }
                }
                if (found) {
                    return {
                        content: Util.randomItem(item.a),
                        priority: item.priority,
                    };
                }
            }
        }
    }
    
    async requestNanaChat(content: string): Promise<any> {
        const url = `http://127.0.0.1:7700/api/v1/chat?msg=${content}`;
        try {
            const { body } = await got.get(url, { timeout: { request: 2000 } });
            const parsed = JSON.parse(body);
            return parsed;
        } catch (err) {
            logger.error('エラー発生: getNanaChat');
            logger.dir(err);
            return;
        }
    }

}