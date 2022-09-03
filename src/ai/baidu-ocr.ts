import got from 'got';
import { logger } from 'mewbot';
import { Util } from '../commons/utils.js';
import { MiscConfig } from '../models/config.js';
import { BaiduAuth } from './baidu-auth.js';

const GENERAL_API = 'https://aip.baidubce.com/rest/2.0/ocr/v1/general_basic';
const ACCURATE_API = 'https://aip.baidubce.com/rest/2.0/ocr/v1/general_basic';
const RETRY_TIMES = 3;
const RETRY_WAIT = 500;
const BAIDU_MAX_QPS = 2;

export class BaiduOcr {

    protected static _concurrency = 0;
    protected static _limitReached = false;
    static get limitReached() {
        return this._limitReached;
    }
    
    static async execute(imageUrl: string) {
        if (this._limitReached) {
            return;
        }
        while (this._concurrency >= BAIDU_MAX_QPS) {
            logger.debug('Baidu max qps limit reached, concurrency: ' + this._concurrency);
            await Util.sleep(RETRY_WAIT);
        }
        this._concurrency++;
        const useAccurate = await MiscConfig.findOneByName<boolean>('useAccurateOcr');
        const apiUrl = useAccurate? ACCURATE_API : GENERAL_API;
        const url = apiUrl + `?&access_token=${BaiduAuth.auth.access_token}`;
        const options = {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            form: {
                url: imageUrl,
            }
        };
        try {
            let shouldRetry = false;
            let retry = RETRY_TIMES + 1;
            let words: any[];
            do {
                shouldRetry = false;
                const { body } = await got.post(url, options);
                const parsed = JSON.parse(body);
                logger.debug(`Ocr ${useAccurate? 'accurate basic' : 'general basic'} result:`);
                logger.dir(parsed);
                words = parsed.words_result;
                if (words == null) {
                    // 错误码 https://ai.baidu.com/ai-doc/OCR/dk3h7y5vr
                    const errorCode = parsed.error_code;
                    if (errorCode == 17 || errorCode == 19) {
                        // 请求超过限额 不再进行尝试
                        logger.error('Baidu ocr limit reached.');
                        this._limitReached = true;
                    } else if (errorCode == 18) {
                        // QPS超过限额
                        shouldRetry = true;
                        logger.error('Baidu max qps limit reached.');
                        await Util.sleep(Util.randomFloat(RETRY_WAIT, RETRY_WAIT * 2));
                    } else {
                        shouldRetry = true;
                        await Util.sleep(RETRY_WAIT);
                    }
                }
                retry--;
            } while (shouldRetry && retry > 0);
            this._concurrency--;
            return words;
        } catch (err) {
            logger.error(`Ocr ${useAccurate? 'accurate basic' : 'general basic'} error.`);
            logger.error(err);
            this._concurrency--;
            return;
        }
    }
    
}
