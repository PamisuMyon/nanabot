import got from "got";
import { logger } from "mewbot";
import { FileUtil, NetUtil, Util } from "mewbot";
import { MiscConfig } from "../../models/config.js";

export interface PxkoreOptions {
    tags?: string[];
    excludedTags?: string[];
    fallback?: boolean;
    fallbackTags?: string[];
    retryTimes?: number;
    clientId?: string;
    shouldRecord: boolean;
    //----------
    isRandomSample: boolean;
    appendTotalSampleInfo: boolean;
}

export interface PxkoreResult{
    path: string;
    data: any;
    totalSample: number;
    fallback: boolean;
    info: string;
}

export class Pxkore {
    
    private static _timeout = 3000;
    private static _defaultRetryTimes = 5;

    static async request(options?: PxkoreOptions) {
        const o: PxkoreOptions = {
            ...{ 
                fallback: true,
                shouldRecord: false, 
                isRandomSample: true,  
                appendTotalSampleInfo: false,
                retryTimes: this._defaultRetryTimes,
            },
            ...options,
        };

        const result = await this.doRequest(o as Required<PxkoreOptions>);
        if (!result || !result.data)
            return;
        const data = result.data;
        let info = '';
        if (data.title) {
            info += data.title;
        }
        info += '  by ' + data.author_name;
        info += '  作品id: ' + data.id;
        if (o.appendTotalSampleInfo) {
            if (!o.isRandomSample && result.totalSample > 0 && !result.fallback)
                info += `    -🖼${result.totalSample}-`;
            else
                info += '    -🎲-';
        }
        result.info = info;
        return result;
    }

    static async doRequest(o: Required<PxkoreOptions>): Promise<PxkoreResult | undefined> {
        if (o.retryTimes == -100) {
            o.retryTimes = this._defaultRetryTimes;
        } else if (o.retryTimes <= 0) {
            return;
        }
        const url = 'http://127.0.0.1:7007/api/v1/illust';
        const params = {
            tags: o.tags,
            excludedTags: o.excludedTags,
            fallback: true,
            fallbackTags: o.fallbackTags,
            matchMode: 'tags',
            returnTotalSample: true,
            clientId: o.clientId,
            shouldRecord: o.shouldRecord,
        };
        try {
            logger.debug('Downloading setu collector');

            const { body } = await got.post<any>(url, {
                timeout: { request: this._timeout },
                json: params,
                headers: {
                    'Content-Type': 'application/json',
                },
                responseType: 'json',
            });
            if (body.data && body.data.length > 0) {
                // 检查作品是否已被屏蔽
                const id = body.data[0].id;
                const blockedIds = await MiscConfig.findOneByName<string[]>('blockedPicIds');
                for (const blockedId of blockedIds) {
                    if (id == blockedId) {
                        logger.debug(`Blocked id detected, retry: ${id}`);
                        if (o.tags)
                            Util.removeElem(o.tags, id + '');
                        // 重新请求
                        o.retryTimes -= 1;
                        return this.doRequest(o);
                    }
                }
                const data = body.data[0];
                const imageUrl = data.urls.regular;
                const split = imageUrl.split('/');
                const fileName = split[split.length - 1];
                const path = await this.downloadFile(imageUrl, fileName);
                return { 
                    path, 
                    data, 
                    totalSample: body.totalSample as number, 
                    fallback: body.fallback as boolean,
                    info: '',
                };
            }
        } catch (err) {
            logger.error(err);
            return;
        }
    }

    private static async downloadFile(fileUrl: string, fileName: string) {
        const cachePath = '../storage/illusts/' + fileName;
        try {
            if (await FileUtil.exists(cachePath)) {
                logger.debug('Use illust from cache: ' + fileName);
                return cachePath;
            }
            logger.debug('Start downloading of illust: ' + fileUrl);
            await NetUtil.download(fileUrl, cachePath);
            logger.debug('Illust downloaded: ' + fileName);
            return cachePath;
        } catch (err) {
            logger.error(err);
            return '';
        }
    }

}