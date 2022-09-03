import { Col } from "./db.js";

export interface IBlockedUser {
    id: string,
    username: string,
    name: string,
    isCursed: boolean,
    updatedAt: Date,
}

export const BlockedUser = new Col<IBlockedUser>('block-list');
