import { IServerImageDao, ServerImageInfo, Util } from "mewbot";
import { Col } from "./db.js";

export class ServerImageCol extends Col<ServerImageInfo> implements IServerImageDao {

    async findByFileName(fileName: string) {
        return (await this.findOne({ fileName })) as ServerImageInfo | null;
    }

    deleteByFileName(fileName: string) {
        return this.deleteOne({ fileName });
    }

    async getCache(fileName: string) {
        const serverImage = await this.findByFileName(fileName);
        let info = null;
        if (serverImage && serverImage.info) {
            const isAlive = await Util.isUrlAlive(serverImage.info.url, 2000);
            if (isAlive) {
                info = serverImage.info;
            } else {
                // 图片已失效，移除记录
                await this.deleteByFileName(fileName);
            }
        }
        return info;
    }

}

export const ServerImage = new ServerImageCol('server-images');
