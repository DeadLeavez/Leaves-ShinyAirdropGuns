/// <reference types="node" />
import { DependencyContainer } from "tsyringe";
import { IQuest } from "@spt/models/eft/common/tables/IQuest";
import { IPreSptLoadMod } from "@spt/models/external/IPreSptLoadMod";
import { LeavesQuestManager } from "./LeavesQuestManager";
import { IncomingMessage, ServerResponse } from "http";
export declare class Questrandomizer implements IPreSptLoadMod {
    private onUpdateModService;
    private databaseServer;
    private customItemService;
    private httpServer;
    private static originalHandleMethod;
    static leavesQuestManager: LeavesQuestManager;
    private leavesIdManager;
    private leavesUtils;
    private leavesQuestTools;
    private leavesSettingsManager;
    private leavesLocaleGeneration;
    preSptLoad(container: DependencyContainer): void;
    postDBLoad(container: DependencyContainer): void;
    handleRequestReplacement(req: IncomingMessage, resp: ServerResponse<IncomingMessage>): Promise<void>;
    private generateCategoryItem;
    private setupHandbookCategories;
    editQuest(quest: IQuest): IQuest;
    private editHandoverItemTask;
    private editCounterCreatorTask;
    private editKillsDetails;
    generateWeaponCategorySheet(): void;
    addToCategorySheet(weaponGroup: any, modcategory: string, localename: string, language: string): string;
}
