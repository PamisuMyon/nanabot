import { BotConfig, MesageReplyMode } from "mewbot";
import { Col } from "./db.js";

export interface IMiscConfig {
    name: string,
    value: any,
}

export class MiscConfigCol extends Col<IMiscConfig> {

    async findOneByName<T>(name: string) {
        return (await this.findOne({ name }))?.value as T;
    }

    async upsertOneByName(name: string, value: any) {
        return this.upsertOne({ name }, { name, value });
    }
}

export const MiscConfig = new MiscConfigCol('configs');

export interface NanaBotConfig extends BotConfig {
    /**
     * 安静时长
     */
    silenceDuration: number;
}

export const defaultNanaBotConfig: Required<NanaBotConfig> = {
    alias: [],
    triggers: {
        username: true,
        name: false,
        alias: true,
        mention: true,
        reply: true,
        command: false,
    },
    replySelf: false,
    replyDM: true,
    messageReplyMode: MesageReplyMode.Derivative,
    messageProcessInterval: 200,
    // 订阅据点，将会收到来自这些据点的消息
    nodes: [
        "100554577263091712", // 不是机器人
    ],
    // 话题（节点）功能配置，群聊中仅回复已配置话题中的消息，同时通过此配置实现话题中的功能定制
    topics: {
        // 在 不是机器人据点 的 🍄 话题（节点）中，配置功能
        "219353468583456768": {
            id: "219353468583456768",
            name: "🍄",
            repliers: { 
                all: {},
                schedule: {
                    birthday: true,
                    morning: false,
                    noon: false,
                    night: false,
                }
            }
        },
    },
    // 提示文本
    hints: {
        replierUnavailable: [
            "对不起，本节点不支持这个功能😿"
        ],
        fallback: [
            "我不知道怎么跟你说，因为我只是一个机器人",
        ]
    },
    // 防御机制，用来避免短时间内被频繁刷屏，例如两个bot互相回复陷入死循环
    defender: {
        interval: 1500,
        threshold: 10, // 防御连击阈值，达到此阈值时将对方加入屏蔽列表
    },
    silenceDuration: 600000,
};
