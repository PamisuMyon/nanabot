import { Util } from "mewbot";
import { CachedCol } from "../db.js";

export interface IAlias {
    name: string;
    alias: string[];
}

export class AliasCol extends CachedCol<IAlias> {

    getAllByAlias(alias: string) {
        const items = [];
        for (const item of this._cache) {
            if (item.alias.indexOf(alias) != -1) {
                items.push(item);
            }
        }
        return items;
    }

    getRandomOneByAlias(alias: string) {
        const items = this.getAllByAlias(alias);
        if (items.length > 0)
            return Util.randomItem(items);
        return;
    }

}

export const Alias = new AliasCol('aliases');
