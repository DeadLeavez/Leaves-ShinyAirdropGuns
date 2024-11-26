import { ILogger } from "@spt/models/spt/utils/ILogger";
import { DatabaseServer } from "@spt/servers/DatabaseServer";
import { JsonUtil } from "@spt/utils/JsonUtil";
import { HashUtil } from "@spt/utils/HashUtil";
import { VFS } from "@spt/utils/VFS";
import { IQuest } from "@spt/models/eft/common/tables/IQuest";
import { LeavesUtils } from "./LeavesUtils";
import { LeavesQuestTools } from "./LeavesQuestTools";
import { LeavesSettingsManager } from "./LeavesSettingsManager";
import { LeavesLocaleGeneration } from "./LeavesLocaleGeneration";
import { LeavesIdManager } from "./LeavesIdManager";
export declare class LeavesQuestGeneration {
    protected databaseServer: DatabaseServer;
    protected vfs: VFS;
    protected jsonUtil: JsonUtil;
    protected hashUtil: HashUtil;
    protected logger: ILogger;
    protected leavesUtils: LeavesUtils;
    protected leavesQuestTools: LeavesQuestTools;
    protected leavesSettingsManager: LeavesSettingsManager;
    protected leavesLocaleGeneration: LeavesLocaleGeneration;
    protected leavesIdManager: LeavesIdManager;
    constructor(databaseServer: DatabaseServer, vfs: VFS, jsonUtil: JsonUtil, hashUtil: HashUtil, logger: ILogger, leavesUtils: LeavesUtils, leavesQuestTools: LeavesQuestTools, leavesSettingsManager: LeavesSettingsManager, leavesLocaleGeneration: LeavesLocaleGeneration, leavesIdManager: LeavesIdManager);
    generateEmptyQuest(name: string, trader: string, location: string, ID: string): IQuest;
    setBaseQuestLocale(ID: string, locale: string, acceptPlayerMessage: string, changeQuestMessageText: string, completePlayerMessage: string, description: string, failMessageText: string, declinePlayerMessage: string, startedMessageText: string, successMessageText: string, questName: string): void;
    addRewardsToQuest(quest: IQuest, questNumber: number): void;
    generateKillQuest(name: string, previousQuest: string, trader: string, questNumber: number, killCount: number, specificWeaponGroup?: string, distance?: boolean): IQuest;
    generateHandoverQuest(name: string, previousQuest: string, trader: string, questNumber: number): IQuest;
}
