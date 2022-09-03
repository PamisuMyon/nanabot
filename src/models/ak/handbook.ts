import { Col } from "../db.js";

export class HandbookCol extends Col<IHandbook> {

    async findByArtist(artist: string): Promise<any[]> {
        const cursor = this.col.find({ drawName: artist }).project({ name: 1 });
        return await cursor.toArray();
    }

    async findByCv(cv: string) {
        const cursor = this.col.find(
            { 
                $or: [ 
                    {'cvDictionary.CN_MANDARIN.cvName': cv },
                    {'cvDictionary.CN_TOPOLECT.cvName': cv },
                    {'cvDictionary.JP.cvName': cv },
                    {'cvDictionary.LINKAGE.cvName': cv },
                    {'cvDictionary.EN.cvName': cv },
                    {'cvDictionary.KR.cvName': cv },
                ]
            });
        return await cursor.toArray();
    }

    async findByBirthday(month: number, date: number) {
        let cursor: any;
        if (date == -1) {
            cursor = this.col.find({ birthday: { $regex: `^${month}月.+` } });
        } else {
            cursor = this.col.find({ birthday: `${month}月${date}日` });
        }
        return await cursor.toArray();
    }
    
    async findByBirthplace(birthplace: string) {
        let results = await this.col.find({ birthplace: birthplace }).toArray();
        if (results == null || results.length == 0)
            results = await this.col.find({ birthplace: birthplace + '国' }).toArray();
        return results;
    }

    async findCv(name: string) {
        const char = await this.findOne({ name });
        if (!char) {
            return;
        }
        const cv = char.cvDictionary;
        if (!cv) {
            return;
        }
        let str = '';
        if (cv.CN_MANDARIN && cv.CN_MANDARIN.cvName.trim() != '-') {
            str += cv.CN_MANDARIN.cvName + '（中文-普通话）';
        }
        if (cv.CN_TOPOLECT) {
            if (str) {
                str += ' ';
            }
            str += cv.CN_TOPOLECT.cvName;
            if (str.trim() != '-') {
                str += '（中文-方言）';
            }
        }
        if (cv.JP) {
            if (str) {
                str += ' ';
            }
            str += cv.JP.cvName;
            if (str.trim() != '-') {
                str += '（日文）';
            }
        }
        if (cv.LINKAGE && cv.LINKAGE.cvName.trim() != '-') {
            if (str) {
                str += ' ';
            }
            str += cv.LINKAGE.cvName + '（联动）';
        }
        if (cv.EN && cv.EN.cvName.trim() != '-') {
            if (str) {
                str += ' ';
            }
            str += cv.EN.cvName + '（英文）';
        }
        if (cv.KR && cv.KR.cvName.trim() != '-') {
            if (str) {
                str += ' ';
            }
            str += cv.KR.cvName + '（韩文）';
        }
        return str;
    }

    async getBirthDayMessageSimple(date: Date) {
        const ops = await this.findByBirthday(date.getMonth() + 1, date.getDate());
        if (!ops || ops.length == 0) {
            return '';
        }
        let msg = '';
        for (let i = 0; i < ops.length; i++) {
            if (ops[i].name) {
                msg += ops[i].name;
                if (i != ops.length - 1) {
                    msg += '、';
                }
            }
        }
        if (msg) {
            msg = '🎂今天生日的干员：' + msg; 
        }
        return msg;
    }

    async getBirthDayMessage(month: number, date: number, day?: string) {
        const ops = await this.findByBirthday(month, date);
        let msg = '';
        if (ops) {
            for (let i = 0; i < ops.length; i++) {
                if (ops[i].name) {
                    msg += ops[i].name;
                    if (i != ops.length - 1) {
                        msg += '、';
                    }
                }
            }
        }
        if (msg) {
            if (day) {
                msg = '🎂' + day + '生日的干员：' + msg; 
            } else {
                if (date == -1) {
                    msg = `🎂${month}月生日的干员：` + msg;
                } else {
                    msg = `🎂${month}月${date}日生日的干员：` + msg;
                }
            }
        } else {
            if (day) {
                msg = day + '没有干员过生日哦。'; 
            } else {
                if (date == -1) {
                    msg = `${month}月没有干员过生日哦。`;
                } else {
                    msg = `${month}月${date}日没有干员过生日哦。`;
                }
            }
        }
        return msg;
    }

}

export const Handbook = new HandbookCol('handbooks');

export interface IHandbook {
    charID: string;
    drawName: string;
    infoName: string;
    storyTextAudio: StoryTextAudio[];
    handbookAvgList: HandbookAvgList[];
    name: string;
    gender: string;
    experience: string;
    birthplace: string;
    birthday: string;
    race: string;
    height: string;
    condition: string;
    ability: string;
    cvDictionary: CvDictionary;
}

interface CvDictionary {
    CN_MANDARIN: Cv;
    CN_TOPOLECT: Cv;
    JP: Cv;
    LINKAGE: Cv;
    EN: Cv;
    KR: Cv;
}

interface Cv {
    wordkey: string;
    voiceLangType: string;
    cvName: string;
}

interface HandbookAvgList {
    storySetId: string;
    storySetName: string;
    sortId: number;
    storyGetTime: number;
    rewardItem: any[];
    unlockParam: UnlockParam[];
    avgList: AvgList[];
    charId: string;
}

interface AvgList {
    storyId: string;
    storySetId: string;
    storySort: number;
    storyCanShow: boolean;
    storyIntro: string;
    storyInfo: string;
    storyTxt: string;
}

interface UnlockParam {
    unlockType: number;
    unlockParam1: string;
    unlockParam2?: string;
    unlockParam3?: any;
}

interface StoryTextAudio {
    stories: Story[];
    storyTitle: string;
    unLockorNot: boolean;
}

interface Story {
    storyText: string;
    unLockType: number;
    unLockParam: string;
    unLockString: string;
}
