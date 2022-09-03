import { Col } from "../db.js";

export const WorkshopFormula = new Col<IWorkshopFormula>('workshop-formulas');

export interface IWorkshopFormula {
    sortId: number;
    formulaId: string;
    rarity: number;
    itemId: string;
    count: number;
    goldCost: number;
    apCost: number;
    formulaType: string;
    buffType: string;
    extraOutcomeRate: number;
    extraOutcomeGroup: ExtraOutcomeGroup[];
    costs: Cost[];
    requireRooms: RequireRoom[];
    requireStages: any[];
}

interface RequireRoom {
    roomId: string;
    roomLevel: number;
    roomCount: number;
}

interface Cost {
    id: string;
    count: number;
    type: string;
}

interface ExtraOutcomeGroup {
    weight: number;
    itemId: string;
    itemCount: number;
}
