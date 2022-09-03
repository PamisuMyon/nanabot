import got from 'got';
import * as fs from 'fs';
import { HttpsProxyAgent } from "hpagent";
import * as stream from 'stream';
import { promisify } from 'util';
import { logger, LogLevel } from "mewbot";
import { FileUtil, Util } from "mewbot";
import { Character, ICharacter } from '../../models/ak/character.js';
import { AkMisc } from '../../models/ak/ak-misc.js';
import { Item } from '../../models/ak/item.js';
import { Handbook } from '../../models/ak/handbook.js';
import { WorkshopFormula } from '../../models/ak/workshop-formula.js';
import { HandbookTeam } from '../../models/ak/handbook-team.js';
import { Enemy } from '../../models/ak/enemy.js';
import { RoguelikeItem } from '../../models/ak/roguelike-item.js';
const pipeline = promisify(stream.pipeline);

const root = 'https://cdn.jsdelivr.net/gh/Kengxxiao/ArknightsGameData/zh_CN/gamedata/';
const fileUris = [
    'excel/handbook_info_table.json',
    'excel/character_table.json',
    'excel/charword_table.json',
    'excel/gacha_table.json',
    'excel/item_table.json',
    'excel/building_data.json',
    'excel/enemy_handbook_table.json',
    'excel/handbook_team_table.json',
    'excel/roguelike_topic_table.json',
    'excel/activity_table.json',
];

export class AkDataImporter {

    static async updateAll(proxy?: string,) {
        try {
            // 下载所有资源至本地
            await this.downloadResources(proxy);
            // 更新角色基本信息
            await this.updateCharacters();
            // // 更新手册
            await this.updateHandbook();
            // // 更新CV
            await this.updateCv();
            // // 更新物品
            await this.updateItems();
            // // 更新基建信息
            await this.updateBuildingData();
            // // 更新势力信息
            await this.updateHandbookTeam();
            // // 更新敌人
            await this.updateEnemyHandbook();
            // // 更新roguelike
            await this.updateRoguelike();
            return true;
        } catch (err) {
            logger.error('Update data error!');
            logger.dir(err, LogLevel.Error);
            return false;
        }
    }

    static async downloadResources(proxy?: string) {
        for (const path of fileUris) {
            const filePath = './cache/' + path;
            if (!(await FileUtil.exists(filePath))) {
                await FileUtil.create(filePath);
            }
            const url = root + path;
            const options = proxy ? {
                https: {
                    rejectUnauthorized: false,
                },
                agent: {
                    https: new HttpsProxyAgent({
                        keepAlive: true,
                        keepAliveMsecs: 1000,
                        maxSockets: 256,
                        maxFreeSockets: 256,
                        scheduling: 'lifo',
                        proxy,
                    })
                }
            } : {};
            logger.debug('Start downloading of file: ' + url);
            await pipeline(got.stream(url, options), fs.createWriteStream(filePath));
        }
        logger.debug('All files are downloaded.');
    }

    static async updateCharacters() {
        let raw = fs.readFileSync('./cache/excel/character_table.json').toString();
        const charsData = JSON.parse(raw);
        raw = fs.readFileSync('./cache/excel/gacha_table.json').toString();
        const recruitDetail: string = JSON.parse(raw).recruitDetail;

        // 获取公招干员列表
        const split = recruitDetail.split('★\\n');
        split.shift();  // 去除第一个
        const recruits = [];
        for (let i = 0; i < split.length; i++) {
            split[i] = split[i].replace(/\n-+\n★+/, '');
            split[i] = split[i].replace(RegExp('<@rc.eml>', 'g'), '');
            split[i] = split[i].replace(RegExp('</>', 'g'), '');
            const s = split[i].split('/');
            for (const item of s) {
                recruits.push(item.trim());
            }
        }

        // 干员导入数据库
        const chars: ICharacter[] = [];
        const tags: string[] = [];     // 同时获取所有干员的tag
        for (const s in charsData) {
            const char = charsData[s] as ICharacter;
            char.charID = s; // 记录下id
            if (recruits.indexOf(char.name) != -1) {
                char.canRecruit = true;  // 记录是否可被公招
            }
            chars.push(char);

            if (char.tagList) {
                Util.pushAllUnique(tags, char.tagList);
            }
        }

        // 干员导入characters
        const result = await Character.upsertMany(['charID'], chars);
        logger.log(`Characters updated, Upsert: ${result.upsertedCount} Modified: ${result.modifiedCount}`);

        // tag导入ak-misc
        await AkMisc.upsertOneByName('tags', tags);
        logger.log('Character tags updated.');
    }

    static async updateHandbook() {
        const charsRaw = fs.readFileSync('./cache/excel/character_table.json').toString();
        const charsData = JSON.parse(charsRaw);
        const raw = fs.readFileSync('./cache/excel/handbook_info_table.json').toString();
        const data = JSON.parse(raw);
        const handbookDict = data.handbookDict;
        const items = [];
        const nameReg = /.代号.(.*?)\n/;
        const genderReg = /.性别.(.*?)\n/;
        const expReg = /.(.*?经验).(.*?)\n/;
        const birthplaceReg = /.出身地.(.*?)\n/;
        const birthdayReg = /.生日.(.*?)\n/;
        const raceReg = /.种族.(.*?)\n/;
        const heightReg = /.身高.(.*?)\n/;
        const conditionReg = /.矿石病感染情况.(.*?)\n/;
        for (const key in handbookDict) {
            const item = handbookDict[key];
            if (item.storyTextAudio[0]) {
                const text0 = item.storyTextAudio[0].stories[0].storyText;
                if (charsData[key] && charsData[key].name) {
                    item.name = charsData[key].name;
                }
                else if (nameReg.test(text0)) {
                    const r = nameReg.exec(text0)!;
                    item.name = r[1].trim();
                }
                if (genderReg.test(text0)) {
                    const r = genderReg.exec(text0)!;
                    item.gender = r[1].trim();
                }
                if (expReg.test(text0)) {
                    const r = expReg.exec(text0)!;
                    item.experience = r[1].trim() + '：' + r[2].trim();
                }
                if (birthplaceReg.test(text0)) {
                    const r = birthplaceReg.exec(text0)!;
                    item.birthplace = r[1].trim();
                }
                if (birthdayReg.test(text0)) {
                    const r = birthdayReg.exec(text0)!;
                    item.birthday = r[1].trim();
                }
                if (raceReg.test(text0)) {
                    const r = raceReg.exec(text0)!;
                    item.race = r[1].trim();
                }
                if (heightReg.test(text0)) {
                    const r = heightReg.exec(text0)!;
                    item.height = r[1].trim();
                }
                if (conditionReg.test(text0)) {
                    const r = conditionReg.exec(text0)!;
                    item.condition = r[1].trim();
                }
            }
            if (item.storyTextAudio[1]) {
                item.ability = item.storyTextAudio[1].stories[0].storyText.trim();
            }
            items.push(item);
        }
        const result = await Handbook.upsertMany(['charID'], items);
        logger.debug(`Handbook updated, Upsert: ${result.upsertedCount} Modified: ${result.modifiedCount}`);
    }    

    static async updateCv() {
        const raw = fs.readFileSync('./cache/excel/charword_table.json').toString();
        const data = JSON.parse(raw);
        for(const key in data.voiceLangDict) {
            const item = data.voiceLangDict[key];
            const char = await Handbook.findOne({ charID: key});
            if (char && item.dict) {
                char.cvDictionary = item.dict;
                await Handbook.updateOne({ charID: char.charID }, char);
            }
        }
        logger.debug('Handbook cv updated.');
    }

    static async updateItems() {
        let raw = fs.readFileSync('./cache/excel/item_table.json').toString();
        let data = JSON.parse(raw);
        let items = [];
        for (const key in data.items) {
            const item = data.items[key];
            if (item.description) {
                item.description = item.description.replace('\\n', '\n');
            }
            item.dataSource = 'item_table';
            items.push(item);
        }
        const result = await Item.upsertMany(['itemId'], items);
        logger.debug(`Items updated(item_table), Upsert: ${result.upsertedCount} Modified: ${result.modifiedCount}`);

        raw = fs.readFileSync('./cache/excel/activity_table.json').toString();
        data = JSON.parse(raw);
        items = [];
        // 车车配件
        if (data.carData && data.carData.carDict) {
            for (const key in data.carData.carDict) {
                const item = data.carData.carDict[key];
                item.itemId = key;
                item.description = item.itemDesc;
                delete item.itemDesc;
                item.usage = item.itemUsage;
                delete item.itemUsage;
                item.obtainApproach = item.itemObtain;
                delete item.itemObtain;
                if (item.description) {
                    item.description = item.description.replace('\\n', '\n');
                }
                item.dataSource = 'activity_table/carData';
                items.push(item);
            }
            const result = await Item.upsertMany(['itemId'], items);
            logger.debug(`Items updated(activity_table/carData), Upsert: ${result.upsertedCount} Modified: ${result.modifiedCount}`);
        }
    }

    static async updateBuildingData() {
        const raw = fs.readFileSync('./cache/excel/building_data.json').toString();
        const data = JSON.parse(raw);
        const workshopFormulas = [];
        // 材料加工配方
        for (const key in data.workshopFormulas) {
            const item = data.workshopFormulas[key];
            workshopFormulas.push(item);
        }
        const result = await WorkshopFormula.upsertMany(['sortId', 'formulaId'], workshopFormulas);
        logger.debug(`Workshop Formula updated, Upsert: ${result.upsertedCount} Modified: ${result.modifiedCount}`);
    }

    static async updateHandbookTeam() {
        const raw = fs.readFileSync('./cache/excel/handbook_team_table.json').toString();
        const data = JSON.parse(raw);
        const teams = [];
        for (const key in data) {
            const item = data[key];
            teams.push(item);
        }
        const result = await HandbookTeam.upsertMany(['powerId'], teams);
        logger.debug(`Handbook team updated, Upsert: ${result.upsertedCount} Modified: ${result.modifiedCount}`);
    }

    static async updateEnemyHandbook() {
        const raw = fs.readFileSync('./cache/excel/enemy_handbook_table.json').toString();
        const data = JSON.parse(raw);
        const enemies = [];
        for (const key in data) {
            enemies.push(data[key]);
        }
        const result = await Enemy.upsertMany(['enemyId'], enemies);
        logger.debug(`Enemy handbook updated, Upsert: ${result.upsertedCount} Modified: ${result.modifiedCount}`);
    }

    static async updateRoguelike() {
        const raw = fs.readFileSync('./cache/excel/roguelike_topic_table.json').toString();
        const data = JSON.parse(raw);
        for (const rogueNum in data.details) {
            const rogue = data.details[rogueNum];
            const items = [];
            for (const itemKey in rogue.items) {
                const item = rogue.items[itemKey];
                item.rogueId = rogueNum;
                items.push(item);
            }
            const result = await RoguelikeItem.upsertMany(['id', 'rogueId'], items);
            logger.debug(`Roguelike item updated, Upsert: ${result.upsertedCount} Modified: ${result.modifiedCount}`);
        }
    }
}
