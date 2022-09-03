import { IServerImageDao, ServerImageInfo } from "mewbot";
import { Col } from "./db.js";

export class ServerImageCol extends Col<ServerImageInfo> implements IServerImageDao {

    async findByFileName(fileName: string) {
        return (await this.findOne({ fileName })) as ServerImageInfo | null;
    }

    deleteByFileName(fileName: string) {
        return this.deleteOne({ fileName });
    }

}

export const ServerImage = new ServerImageCol('server-images');
