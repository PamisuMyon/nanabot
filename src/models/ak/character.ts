import { Col } from "../db.js";

export class CharacterCol extends Col<ICharacter> {

    async findByRecruit(rarity: number, position: string, profession: string, tags: string[]) {
        const query: any = { canRecruit: true };
        if (rarity != null) {
            query.rarity = rarity;
        }
        if (position != null) {
            query.position = position;
        }
        if (profession != null) {
            query.profession = profession;
        }
        if (tags && tags.length > 0) {
            query.tagList = { $all: tags };
        }
        return await this.col.find(query).toArray();
    }

    async findByNationGroupTeamId(id: string) {
        const results = await this.col.find({ 
            $or:[ 
                {nationId: id}, 
                {groupId: id},
                {teamId: id},
            ]
        }).toArray();
        return results;
    }
    
}

export const Character = new CharacterCol('characters');

export interface ICharacter {
    name: string;
    description: string;
    canUseGeneralPotentialItem: boolean;
    potentialItemId: string;
    nationId: string;
    groupId: string;
    teamId?: any;
    displayNumber: string;
    tokenKey?: any;
    appellation: string;
    position: string;
    tagList: string[];
    itemUsage: string;
    itemDesc: string;
    itemObtainApproach: string;
    isNotObtainable: boolean;
    isSpChar: boolean;
    maxPotentialLevel: number;
    rarity: number;
    profession: string;
    subProfessionId: string;
    trait?: any;
    phases: Phase[];
    skills: Skill[];
    talents: Talent[];
    potentialRanks: PotentialRank[];
    favorKeyFrames: AttributesKeyFrame[];
    allSkillLvlup: AllSkillLvlup[];
    charID: string;
    canRecruit: boolean;
}

interface AllSkillLvlup {
    unlockCond: UnlockCond;
    lvlUpCost: EvolveCost[];
}

interface PotentialRank {
    type: number;
    description: string;
    buff?: Buff;
    equivalentCost?: any;
}

interface Buff {
    attributes: Attributes;
}

interface Attributes {
    abnormalFlags?: any;
    abnormalImmunes?: any;
    abnormalAntis?: any;
    abnormalCombos?: any;
    abnormalComboImmunes?: any;
    attributeModifiers: AttributeModifier[];
}

interface AttributeModifier {
    attributeType: number;
    formulaItem: number;
    value: number;
    loadFromBlackboard: boolean;
    fetchBaseValueFromSourceEntity: boolean;
}

interface Talent {
    candidates: Candidate[];
}

interface Candidate {
    unlockCondition: UnlockCond;
    requiredPotentialRank: number;
    prefabKey: string;
    name: string;
    description: string;
    rangeId?: any;
    blackboard: Blackboard[];
}

interface Blackboard {
    key: string;
    value: number;
}

interface Skill {
    skillId: string;
    overridePrefabKey?: any;
    overrideTokenKey?: any;
    levelUpCostCond: LevelUpCostCond[];
    unlockCond: UnlockCond;
}

interface LevelUpCostCond {
    unlockCond: UnlockCond;
    lvlUpTime: number;
    levelUpCost: EvolveCost[];
}

interface UnlockCond {
    phase: number;
    level: number;
}

interface Phase {
    characterPrefabKey: string;
    rangeId: string;
    maxLevel: number;
    attributesKeyFrames: AttributesKeyFrame[];
    evolveCost?: EvolveCost[];
}

interface EvolveCost {
    id: string;
    count: number;
    type: string;
}

interface AttributesKeyFrame {
    level: number;
    data: Data;
}

interface Data {
    maxHp: number;
    atk: number;
    def: number;
    magicResistance: number;
    cost: number;
    blockCnt: number;
    moveSpeed: number;
    attackSpeed: number;
    baseAttackTime: number;
    respawnTime: number;
    hpRecoveryPerSec: number;
    spRecoveryPerSec: number;
    maxDeployCount: number;
    maxDeckStackCnt: number;
    tauntLevel: number;
    massLevel: number;
    baseForceLevel: number;
    stunImmune: boolean;
    silenceImmune: boolean;
    sleepImmune: boolean;
    frozenImmune: boolean;
    levitateImmune: boolean;
}
