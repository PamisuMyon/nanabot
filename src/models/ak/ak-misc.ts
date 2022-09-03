import { MiscConfigCol } from "../config.js";

/**
 * 卡池Up信息
 */
export interface Pickup {
    '4': string[];
    '5': string[];
    '6': string[];
    extra: string[];
    ignore?: string[];
    name: string;
    type: string;
}

export const AkMisc = new MiscConfigCol('ak-misc');
