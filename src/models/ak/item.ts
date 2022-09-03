import { Col } from "../db.js";

export const Item = new Col<IItem>('items');

export interface IItem {
    itemId: string;
    name: string;
    description: string;
    rarity: number;
    iconId: string;
    overrideBkg?: any;
    stackIconId: string;
    sortId: number;
    usage: string;
    obtainApproach?: string;
    classifyType: string;
    itemType: string;
    stageDropList: StageDropList[];
    buildingProductList: BuildingProductList[];
    dataSource: string;
}

interface BuildingProductList {
    roomType: string;
    formulaId: string;
}

interface StageDropList {
    stageId: string;
    occPer: string;
}
