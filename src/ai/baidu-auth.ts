import got from "got";
import { logger } from "mewbot";
import { MiscConfig } from "../models/config.js";

interface BaiduConfig {
    apiKey: string;
    secretKey: string;
}

export class BaiduAuth {

    protected static _auth: any;
    static get auth() {
        return this._auth;
    }

    static async init() {
        const config = await MiscConfig.findOneByName<BaiduConfig>("baiduConfig");
        const url = `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${config.apiKey}&client_secret=${config.secretKey}`;
        logger.debug('Baidu cloud authorizing...');
        try {
            const { body } = await got.post(url);
            const parsed = JSON.parse(body);
            logger.verbose(parsed);
            this._auth = parsed;
            logger.debug('Baidu cloud authorized.');
        } catch (err) {
            logger.error('Baidu cloud authorization failed.');
            logger.error(err);
        }
    }
}
