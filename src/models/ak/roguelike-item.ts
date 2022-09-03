import { Col } from "../db.js";

export const RoguelikeItem = new Col<IRoguelikeItem>('roguelike-items');

export interface IRoguelikeItem {
    id: string;
    rogueId: string;
    description: string;
    iconId: string;
    name: string;
    obtainApproach: string;
    rarity: string;
    sortId: number;
    subType: string;
    type: string;
    unlockCondDesc: string;
    usage: string;
    value: number;
}
