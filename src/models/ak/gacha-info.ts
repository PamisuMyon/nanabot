import { Col } from "../db.js";

export interface GachaInfo {
    id: string;
    waterLevels: WaterLevel[];
}

export interface WaterLevel {
    type: string;
    value: number;
}

export class GachaInfoCol extends Col<GachaInfo> {

    async findById(id: string) {
        return await this.findOne({ id });
    }
    
    async updateWaterLevel(id: string, type: string, value: number) {
        let item = await this.findById(id);
        if (item) {
            item = await this.findOne({ id, "waterLevels.type": type });
            if (item) {
                await this.col.updateOne({ id, "waterLevels.type": type }, 
                    { $set: { "waterLevels.$.value": value } });
            } else {
                await this.col.updateOne({ id },
                    {
                        $push: {
                            waterLevels: { type, value }
                        }
                    });
            }
        } else {
            await this.insertOne({ id, waterLevels: [{ type, value }] });
        }
    }
    
    async updateRemain(id: string, remain: number, limit = -1) {
        const update = limit == -1 ? { $set: { rollRemain: remain } } : { $set: { rollRemain: remain, rollLimit: limit } };
        await this.col.updateOne({ id }, update, { upsert: true });
    }

}

export const GachaInfo = new GachaInfoCol('gacha-info');
