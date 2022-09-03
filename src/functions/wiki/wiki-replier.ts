import { MatryoshkaReplier, Replier } from "mewbot";
import { ArtistOperatorReplier } from "./artist-operator-replier.js";
import { BirthdayOperatorReplier } from "./birthday-operater-replier.js";
import { CvOperatorReplier } from "./cv-operator-replier.js";
import { EnemyReplier } from "./enemy-replier.js";
import { ItemReplier } from "./item-replier.js";
import { OperatorArtistReplier } from "./operator-artist-replier.js";
import { OperatorBirthdayReplier } from "./operator-birthday-replier.js";
import { OperatorBirthplaceReplier } from "./operator-birthplace-replier.js";
import { OperatorCvReplier } from "./operator-cv-replier.js";
import { OperatorEvolveReplier } from "./operator-evolve-replier.js";
import { OperatorReplier } from "./operator-replier.js";
import { OperatorSkillMasteryReplier } from "./operator-skill-mastery-replier.js";
import { OperatorTeamReplier } from "./operator-team-replier.js";
import { RoguelikeItemReplier } from "./roguelike-item-replier.js";
import { TeamOperatorReplier } from "./team-operator-replier.js";

export class WikiReplier extends MatryoshkaReplier {

    override type = 'wiki';
    protected override _pickFunc = Replier.pick01Fuzzy;
    protected override _children = [
        // Regex
        new OperatorEvolveReplier(),
        new OperatorSkillMasteryReplier(),
        new OperatorCvReplier(),
        new OperatorArtistReplier(),
        new BirthdayOperatorReplier(),
        new OperatorBirthdayReplier(),
        new OperatorTeamReplier(),
        new OperatorBirthplaceReplier(),
        // No Regex
        new ArtistOperatorReplier(),
        new CvOperatorReplier(),
        new OperatorReplier(false),
        new EnemyReplier(false),
        new ItemReplier(false),
        new RoguelikeItemReplier(false),
        new TeamOperatorReplier(),
        // Fuzzy
        new OperatorReplier(true),
        new EnemyReplier(true),
        new ItemReplier(true),
        new RoguelikeItemReplier(true),
    ];

}