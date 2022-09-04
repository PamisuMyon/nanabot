import { logger, User } from "mewbot";
import { Account, BotConfig, FileUtil, IBotStorage } from "mewbot";
import { BlockedUser, IBlockedUser } from "./models/block-list.js";
import { defaultNanaBotConfig, MiscConfig } from "./models/config.js";
import { DbUtil } from "./models/db.js";

export class MongoStorage implements IBotStorage {

    protected _botConfig!: Required<BotConfig>;
    protected _blockList!: Array<IBlockedUser>;

    async init() {
        const dbConfig = await FileUtil.readJson('./storage/db.json');
        if (dbConfig && dbConfig.mongodbUri) {
            logger.debug(`Connecting to db: ${dbConfig.mongodbUri}`);
            await DbUtil.connect(dbConfig.mongodbUri);
            logger.debug(`Connected to db.`);
        } else {
            logger.error('Cannot find a valid mongodb uri in db.json');
        }
    }

    async getAccount(): Promise<Account | undefined> {
        const account = await MiscConfig.findOneByName<Account>('account');
        if (!account) {
            logger.error('No account found, please check collection "configs" in db "nana"');
            await MiscConfig.upsertOneByName('account', { token: '',  username: '', password: '' });
            return;
        }
        return account;
    }

    async refreshConfig(): Promise<Required<BotConfig>> {
        const config = await MiscConfig.findOneByName<BotConfig>('botConfig');
        if (config) {
            this._botConfig =  {
                ...defaultNanaBotConfig,
                ...config,
            };
        } else {
            logger.warn('No BotConfig set, using defaults');
            this._botConfig = defaultNanaBotConfig;
            await MiscConfig.insertOne({ name: 'botConfig', value: this._botConfig });
        }
        return this._botConfig;
    }

    get config(): Required<BotConfig> {
        return this._botConfig;
    }

    async refreshBlockList() {
        this._blockList = await BlockedUser.find().toArray();
        return this._blockList;
    }
    
    async updateBlockList(blockList: Partial<User>[]) {
        const operations: any[] = blockList.map(v => {
            return {
                updateOne: {
                    filter: { id: v.id },
                    update: {
                        $set: {
                            id: v.id,
                            username: v.username,
                            name: v.name,
                        }
                    },
                    upsert: true
                }
            };
        });
        await BlockedUser.bulkWrite(operations);
    }

    get blockList() {
        return this._blockList;
    }

}
