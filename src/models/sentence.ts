import { logger } from "mewbot";
import { Util } from "mewbot";
import { CachedCol } from "./db.js";

export interface ISentence {
    name: string;
    contents: string[];
}

export class SentenceCol extends CachedCol<ISentence> {

    get(name: string) {
        for (const item of this._cache) {
            if (item.name == name)
                return item.contents;
        }
        logger.error(`No sentence matched ${name}, please check your sentence collection.`);
        return;
    }

    getRandomOne(name: string) {
        const contents = this.get(name);
        if (contents)
            return Util.randomItem(contents);
        logger.error(`No sentence matched ${name}, please check your sentence collection.`);
        return;
    }

}

export const Sentence = new SentenceCol('sentences');
