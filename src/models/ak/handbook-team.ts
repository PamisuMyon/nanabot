import { Col } from "../db.js";


export const HandbookTeam = new Col<IHandbookTeam>('handbook-teams');

export interface IHandbookTeam {
    powerId: string;
    orderNum: number;
    powerLevel: number;
    powerName: string;
    powerCode: string;
    color: string;
    isLimited: boolean;
    isRaw: boolean;
}
