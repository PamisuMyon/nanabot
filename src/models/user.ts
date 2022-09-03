import { Col } from "./db.js";

export enum UserRole {
    Admin = 'admin',
    Moderator = 'moderator',
    Sensei = 'sensei',
}

export interface IUser {
    id: string;
    username: string;
    name: string;
    role: UserRole;
    nodes?: string[];
}

export const User = new Col<IUser>('users');
