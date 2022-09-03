import { Col } from "../db.js";

export const Enemy = new Col<IEnemy>('enemies');

export interface IEnemy {
    enemyId: string;
    ability: string;
    attack: string;
    attackType: string;
    defence: string;
    description: string;
    endure: string;
    enemyIndex: string;
    enemyLevel: string;
    enemyRace?: any;
    enemyTags?: any;
    hideInHandbook: boolean;
    isInvalidKilled: boolean;
    name: string;
    overrideKillCntInfos: any;
    resistance: string;
    sortId: number;
}
