import got from "got";
import * as fs from 'fs';
import * as stream from 'stream';
import { promisify } from 'util';
import { FileUtil, logger, LogLevel, NetUtil as LibNetUtil } from "mewbot";
import { HttpsProxyAgent } from "hpagent";

export class NetUtil extends LibNetUtil {

    static pipeline = promisify(stream.pipeline);

    static agent: HttpsProxyAgent;

    static override async download(url: string, filePath: string, timeout = 360000) {
        try {
            await FileUtil.create(filePath);
            logger.debug('Start downloading of file: ' + url);
            const options: any = { 
                timeout: { 
                    request: timeout 
                } 
            };
            if (this.agent) {
                options.https = {
                    rejectUnauthorized: false,
                };
                options.agent = {
                    https: this.agent
                };
            }
            await this.pipeline(got.stream(url, options), fs.createWriteStream(filePath));
            logger.debug('File downloaded: ' + filePath);
            return filePath;
        } catch (err) {
            logger.dir(err, LogLevel.Error);
        }
        return;
    }

}
