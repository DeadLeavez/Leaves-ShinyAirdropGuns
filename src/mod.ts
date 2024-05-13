import type { DependencyContainer } from "tsyringe";
import type { ILogger } from "@spt-aki/models/spt/utils/ILogger";
import type { IPostDBLoadMod } from "@spt-aki/models/external/IPostDBLoadMod";
import type { DatabaseServer } from "@spt-aki/servers/DatabaseServer";
import { ConfigTypes } from "@spt-aki/models/enums/ConfigTypes";

import type { ConfigServer } from "@spt-aki/servers/ConfigServer";
import type { IInventoryConfig } from "@spt-aki/models/spt/config/IInventoryConfig";
import type { IAirdropConfig } from "@spt-aki/models/spt/config/IAirdropConfig";

//item creation
import type { CustomItemService } from "@spt-aki/services/mod/CustomItemService";
import type { NewItemFromCloneDetails } from "@spt-aki/models/spt/mod/NewItemDetails";

// remapping preset ids
import type { HashUtil } from "@spt-aki/utils/HashUtil";
import type { JsonUtil } from "@spt-aki/utils/JsonUtil";
import type { IPreset } from "@spt-aki/models/eft/common/IGlobals";

import type { VFS } from "@spt-aki/utils/VFS";
import { jsonc } from "jsonc";
import * as path from "node:path";
import { LogTextColor } from "@spt-aki/models/spt/logging/LogTextColor";
import type { IDatabaseTables } from "@spt-aki/models/spt/server/IDatabaseTables";
import type { ITemplateItem } from "@spt-aki/models/eft/common/tables/ITemplateItem";
import type { IItemConfig } from "@spt-aki/models/spt/config/IItemConfig";

class LeavesShinyAirdropGuns implements IPostDBLoadMod
{
    private logger: ILogger;
    private hashUtil: HashUtil;
    private jsonUtil: JsonUtil;
    private db: DatabaseServer;
    private customItemService: CustomItemService;
    private tables: IDatabaseTables;
    private itemDB: Record<string, ITemplateItem>;
    private vfs: VFS;

    //Config
    private config: any;
    private inventoryConfig: IInventoryConfig;
    private itemConfig: IItemConfig;

    public postDBLoad ( container: DependencyContainer ): void
    {
        // Resolve stiff
        this.logger = container.resolve<ILogger>( "WinstonLogger" );
        this.db = container.resolve<DatabaseServer>( "DatabaseServer" );
        this.jsonUtil = container.resolve<JsonUtil>( "JsonUtil" );
        this.hashUtil = container.resolve<HashUtil>( "HashUtil" );
        this.vfs = container.resolve<VFS>( "VFS" );
        this.customItemService = container.resolve<CustomItemService>( "CustomItemService" );
        const configServer = container.resolve<ConfigServer>( "ConfigServer" );

        // config lazy-loaded here
        const configFile = path.resolve( __dirname, "../config/config.jsonc" );
        this.config = jsonc.parse( this.vfs.readFile( configFile ) );

        //Configs
        this.itemConfig = configServer.getConfig<IItemConfig>( ConfigTypes.ITEM );
        this.inventoryConfig = configServer.getConfig<IInventoryConfig>( ConfigTypes.INVENTORY );
        const airdropConfig = configServer.getConfig<IAirdropConfig>( ConfigTypes.AIRDROP );

        this.printColor( "[ShinyAirdropGuns] ShinyAirdropGuns Starting. Hello from sweden!" );

        // Get tables from database
        this.tables = this.db.getTables();
        this.itemDB = this.tables.templates.items;

        const weaponIDs: any = {};

        //Has to be above, because weighting is set when generated now.
        if ( this.config.replaceAllAirdrops )
        {
            this.inventoryConfig.sealedAirdropContainer.weaponRewardWeight = {};
        }

        //Generate the new weapons
        for ( const group in this.config.weaponGroups )
        {
            this.addWeaponGroup( group, weaponIDs );
        }

        for ( const ID in weaponIDs && this.config.debug )
        {
            this.logger.info( `NEW_ID:${ID}  OLD_ID:${weaponIDs[ ID ]}` );
        }

        if ( this.config.addToQuests )
        {
            this.fixQuests( weaponIDs );
        }

        if ( this.config.addToMasteries )
        {
            this.fixMastery( weaponIDs );
        }

        this.debugJsonOutput( this.inventoryConfig.sealedAirdropContainer.weaponRewardWeight, "inventoryConfig.sealedAirdropContainer.weaponRewardWeight" );

        //Add some debug values and outputs.
        if ( this.config.debug )
        {
            for ( const location in airdropConfig.airdropChancePercent )
            {
                airdropConfig.airdropChancePercent[ location ] = 100;
            }
            airdropConfig.airdropMinStartTimeSeconds = 30;
            airdropConfig.airdropMaxStartTimeSeconds = 60;
            airdropConfig.airdropTypeWeightings.mixed = 0;
            airdropConfig.airdropTypeWeightings.weaponarmor = 1;
            airdropConfig.airdropTypeWeightings.foodmedical = 0;
            airdropConfig.airdropTypeWeightings.barter = 0;

            this.debugJsonOutput( airdropConfig.airdropChancePercent, "airdropConfig.airdropChancePercent" );
        }

        if ( this.config.blacklistFromAirdrop )
        {
            const loot = airdropConfig.loot;

            const newIDs: string[] = [];

            for ( const ID in weaponIDs )
            {
                newIDs.push( ID );
            }
            this.debugJsonOutput( newIDs, "newIDs" );

            loot.mixed.itemBlacklist = loot.mixed.itemBlacklist.concat( newIDs );
            loot.weaponArmor.itemBlacklist = loot.weaponArmor.itemBlacklist.concat( newIDs );
            loot.foodMedical.itemBlacklist = loot.foodMedical.itemBlacklist.concat( newIDs );
            loot.barter.itemBlacklist = loot.barter.itemBlacklist.concat( newIDs );

            this.itemConfig.blacklist = this.itemConfig.blacklist.concat( newIDs );

            this.debugJsonOutput( loot.mixed.itemBlacklist, "loot.mixed.itemBlacklist" );
            this.debugJsonOutput( loot.weaponArmor.itemBlacklist, "loot.weaponArmor.itemBlacklist" );
            this.debugJsonOutput( loot.foodMedical.itemBlacklist, "loot.foodMedical.itemBlacklist" );
            this.debugJsonOutput( loot.barter.itemBlacklist, "loot.barter.itemBlacklist" );
        }

        this.fixPresets( weaponIDs );
    }

    private addWeaponGroup ( groupname: string, newIDs: any )
    {
        // Get handbook from tables
        const handbook = this.tables.templates.handbook;

        const weaponGroup = this.config.weaponGroups[ groupname ];
        const weaponList = weaponGroup.weaponsToMakeShiny;

        for ( const weapon of weaponList )
        {
            //generate data
            const newLocaleName = weaponGroup.prefix + this.tables.locales.global.en[ `${weapon} Name` ] + weaponGroup.suffix;
            const newShortName = weaponGroup.shortNamePrefix + this.tables.locales.global.en[ `${weapon} ShortName` ] + weaponGroup.shortNameSuffix;

            //const newName = itemDB[weapon]._name;
            const newName = newLocaleName;

            this.printColor( `[LeavesShinyGuns]\tModding: ${weapon} ${newName}`, LogTextColor.YELLOW );

            const price = 250000;

            const data = this.readWeaponConfigData( weaponGroup, weapon );

            const handbookEntry = handbook.Items.find( ( item ) => item.Id === weapon );
            const handbookParentId = handbookEntry
                ? handbookEntry.ParentId
                : undefined;

            const newID = `${weapon}_shiny_${groupname}`;

            const leavesUp: NewItemFromCloneDetails = {
                itemTplToClone: weapon,
                overrideProperties: {
                    bFirerate: data.fireRate,
                    Ergonomics: data.ergonomics,
                    RecoilForceUp: data.horizontalRecoil,
                    RecoilForceBack: data.verticalRecoil,
                    weapFireType: data.fireModes,
                    HeatFactorGun: data.heatFactor,
                    HeatFactorByShot: data.heatFactorByShot,
                    BackgroundColor: data.backgroundColor,
                    shotgunDispersion: data.dispersion,
                    ShotgunDispersion: data.dispersion,
                    DurabilityBurnRatio: data.durabilityBurn,
                    CenterOfImpact: data.accuracy,
                    Velocity: data.velocity,
                    DoubleActionAccuracyPenalty: data.doubleActionAccuracy,
                },
                newId: newID,
                parentId: this.itemDB[ weapon ]._parent,
                handbookParentId: handbookParentId,
                fleaPriceRoubles: price,
                handbookPriceRoubles: price,
                locales: {
                    en: {
                        name: newLocaleName,
                        shortName: newShortName,
                        description:
                            "Modded weapon by an expert gunsmith. Better in almost every way.",
                    },
                },
            };

            this.customItemService.createItemFromClone( leavesUp );

            //Add to special slot
            if ( this.config.allowSpecialSlots && weaponGroup.addToSpecialSlots )
            {
                const pocketsInventory = "627a4e6b255f7527fb05a0f6";
                this.itemDB[ pocketsInventory ]._props.Slots[ 0 ]._props.filters[ 0 ].Filter.push( newID );
                this.itemDB[ pocketsInventory ]._props.Slots[ 1 ]._props.filters[ 0 ].Filter.push( newID );
                this.itemDB[ pocketsInventory ]._props.Slots[ 2 ]._props.filters[ 0 ].Filter.push( newID );
            }

            //BSG FUCKING SNOWFLAKE FILTERS FIXING
            const characterInventory = "55d7217a4bdc2d86028b456d";

            const snowflakeWeapons = [
                "624c2e8614da335f1e034d8c", //Rhino
                "61a4c8884f95bc3b2c5dc96f", //Rhino
                "633ec7c2a6918cb895019c6c", //Rsh 50
                "64748cb8de82c85eaf0a273a" //Sawed off
            ];

            if ( snowflakeWeapons.includes( weapon ) )
            {
                this.printColor( `[LeavesShinyGuns]\tAdding special exception for silly holster slot items:${this.itemDB[ weapon ]._name}`, LogTextColor.CYAN );
                this.itemDB[ characterInventory ]._props.Slots[ 2 ]._props.filters[ 0 ].Filter.push( newID );

                //Add all new revolvers to pistol case - and don't add sawed off
                const sawedOffID = "64748cb8de82c85eaf0a273a";
                const pistolCase = "567143bf4bdc2d1a0f8b4567";
                if ( this.config.addRevolversIntoPistolCase && weapon !== sawedOffID )
                {
                    this.printColor( `[LeavesShinyGuns]\tAdding revolver to pistol case: ${this.itemDB[ weapon ]._name}`, LogTextColor.CYAN );
                    this.itemDB[ pistolCase ]._props.Grids[ 0 ]._props.filters[ 0 ].Filter.push( newID );
                }
            }

            //if shotgun, add to primary filters. (EXCEPT IF ITS THE SAWED OFF.)
            const shotgunParentID = "5447b6094bdc2dc3278b4567";

            if ( this.itemDB[ weapon ]._parent === shotgunParentID && weapon !== "64748cb8de82c85eaf0a273a" )
            {
                this.printColor( `[LeavesShinyGuns]\tAdding special exception for silly shotguns:${this.itemDB[ weapon ]._name}`, LogTextColor.CYAN );
                this.itemDB[ characterInventory ]._props.Slots[ 0 ]._props.filters[ 0 ].Filter.push( newID );
                this.itemDB[ characterInventory ]._props.Slots[ 1 ]._props.filters[ 0 ].Filter.push( newID );
            }

            //BSG, please consider the following: Fuck off!

            //Add weighting to pool
            this.inventoryConfig.sealedAirdropContainer.weaponRewardWeight[ newID ] = data.weight;

            newIDs[ newID ] = weapon;
        }

        return newIDs;
    }

    private readWeaponConfigData ( weaponGroup: any, weapon: string ): any
    {
        let data: any = {};
        data.fireRate = this.itemDB[ weapon ]._props.bFirerate;
        data.fireRate += weaponGroup.fireRateFlatIncrease ? weaponGroup.fireRateFlatIncrease : 0;
        data.fireRate *= weaponGroup.fireRateMultiplier ? weaponGroup.fireRateMultiplier : 1;

        data.ergonomics = this.itemDB[ weapon ]._props.Ergonomics;
        data.ergonomics += weaponGroup.ergoFlatIncrease ? weaponGroup.ergoFlatIncrease : 0;
        data.ergonomics *= weaponGroup.ergoMultiplier ? weaponGroup.ergoMultiplier : 1;

        data.horizontalRecoil = this.itemDB[ weapon ]._props.RecoilForceUp;
        data.horizontalRecoil -= weaponGroup.horizontalRecoilFlatReduction ? weaponGroup.horizontalRecoilFlatReduction : 0;
        data.horizontalRecoil *= weaponGroup.horizontalRecoilMultiplier ? weaponGroup.horizontalRecoilMultiplier : 1;

        data.verticalRecoil = this.itemDB[ weapon ]._props.RecoilForceBack;
        data.verticalRecoil -= weaponGroup.verticalRecoilFlatReduction ? weaponGroup.verticalRecoilFlatReduction : 0;
        data.verticalRecoil *= weaponGroup.verticalRecoilMultiplier ? weaponGroup.verticalRecoilMultiplier : 1;

        data.fireModes = this.itemDB[ weapon ]._props.weapFireType;
        if ( weaponGroup.setFireMode )
        {
            data.fireModes = weaponGroup.setFireMode;
        }

        data.heatFactor = this.itemDB[ weapon ]._props.HeatFactorGun;
        data.heatFactor *= weaponGroup.heatFactorMultiplier ? weaponGroup.heatFactorMultiplier : 1;

        data.heatFactorByShot = this.itemDB[ weapon ]._props.HeatFactorByShot;
        data.heatFactorByShot *= weaponGroup.heatFactorByShotMultiplier ? weaponGroup.heatFactorByShotMultiplier : 1;

        data.durabilityBurn = this.itemDB[ weapon ]._props.DurabilityBurnRatio;
        data.durabilityBurn *= weaponGroup.durabilityBurnMultiplier ? weaponGroup.durabilityBurnMultiplier : 1;

        data.accuracy = this.itemDB[ weapon ]._props.CenterOfImpact;
        data.accuracy *= weaponGroup.accuracyMultiplier ? weaponGroup.accuracyMultiplier : 1;

        data.velocity = this.itemDB[ weapon ]._props.Velocity;
        data.velocity *= weaponGroup.velocityMultiplier ? weaponGroup.velocityMultiplier : 1;

        data.doubleActionAccuracy = this.itemDB[ weapon ]._props.DoubleActionAccuracyPenalty;
        data.doubleActionAccuracy *= weaponGroup.doubleActionAccuracyPenaltyMultiplier ? weaponGroup.doubleActionAccuracyPenaltyMultiplier : 1;

        data.backgroundColor = weaponGroup.background;

        data.weight = weaponGroup.weaponBoxWeight ? weaponGroup.weaponBoxWeight : 1;

        //Shotguns are fucking snowflakes.
        const shotgunParentID = "5447b6094bdc2dc3278b4567";
        data.dispersion = this.itemDB[ weapon ]._parent === shotgunParentID ? 1.25 : 0;

        return data;
    }

    private fixQuests ( weaponsArray: any )
    {
        const quests = this.tables.templates.quests;

        for ( const questId in quests )
        {
            const quest = quests[ questId ];

            for ( const data of quest.conditions.AvailableForFinish )
            {
                // ensure counter exist
                if ( !data.counter )
                {
                    continue;
                }

                if ( !data.counter.conditions )
                {
                    continue;
                }

                const conditions = data.counter.conditions;

                if ( !conditions )
                {
                    continue;
                }

                for ( const condition of conditions )
                {
                    // make sure weapons key exists
                    if ( !condition.weapon )
                    {
                        break;
                    }

                    const weapons = condition.weapon;

                    for ( const weapon of weapons )
                    {
                        if ( this.addNewWeaponsToArrayThatIncludesOriginalWeapon( weaponsArray, weapon, weapons ) && this.config.debug )
                        {
                            this.debugJsonOutput( weapons, `New Weapon Array for Quest: ${quest.QuestName}` );
                        }
                    }
                }
            }
        }
    }

    private fixMastery ( weaponsArray: any )
    {
        const masteries = this.tables.globals.config.Mastering;

        for ( const mastery of masteries )
        {
            for ( const weapon of mastery.Templates )
            {
                if ( this.addNewWeaponsToArrayThatIncludesOriginalWeapon( weaponsArray, weapon, mastery.Templates ) && this.config.debug )
                {
                    this.printColor( `Found mastery to push:${mastery.Name}`, LogTextColor.YELLOW );
                }
            }
        }

        //this.debugJsonOutput( masteries, "masteries" );
    }

    private fixPresets ( weaponIDs: any )
    {
        //Fix presets
        const newPresets: IPreset[] = [];
        const presets = this.tables.globals.ItemPresets;

        for ( const entry in presets )
        {
            const preset: IPreset = presets[ entry ];

            if ( preset.hasOwnProperty( "_encyclopedia" ) )
            {
                for ( const newWeapon in this.getNewIDsForRelatedWeapon( weaponIDs, preset._items[ 0 ]._tpl ) )
                {
                    //Found a preset to copy
                    //this.logger.info(preset._id);
                    const newPreset = this.jsonUtil.clone( preset );

                    this.generateNewItemIds( newPreset );

                    //Fix the link to the receiver.
                    newPreset._items[ 0 ]._tpl = newWeapon;
                    newPreset._encyclopedia = newPreset._items[ 0 ]._tpl;
                    newPreset._changeWeaponName = false;

                    newPresets.push( newPreset );

                    if ( this.config.debug )
                    {
                        this.logger.info( `Made new preset for: ${newWeapon}` );
                    }
                }
            }
        }

        for ( const preset of newPresets )
        {
            this.tables.globals.ItemPresets[ preset._id ] = preset;
        }
    }

    private addNewWeaponsToArrayThatIncludesOriginalWeapon ( newWeapons: any, originalWeapon: string, Array: any ): boolean
    {
        let found = false;
        for ( const NewID in newWeapons )
        {
            //Check if the original weapon has been made any copies of.
            if ( newWeapons[ NewID ] === originalWeapon )
            {
                Array.push( NewID );
                found = true;
            }
        }
        return found;
    }

    private getNewIDsForRelatedWeapon ( weaponIDs: any, weapon: string ): any
    {
        const foundIDs: any = {};
        for ( const ID in weaponIDs )
        {
            if ( weaponIDs[ ID ] === weapon )
            {
                foundIDs[ ID ] = ID;
            }
        }
        return foundIDs;
    }

    private generateNewItemIds ( preset: IPreset )
    {
        // replace the presetId
        preset._id = this.hashUtil.generate();

        //Possibly delete any "_encyclopedia" entry.

        // scan for item ids
        const items = preset._items;
        const ids = {}; // this is a map / record / dictionary

        for ( const item of items )
        {
            if ( !ids[ item._id ] )
            {
                // add item id to change
                ids[ item._id ] = this.hashUtil.generate();
                //this.logger.error(`Found id ${item._id}, replace with: ${ids[item._id]}`);
            }
        }

        // replace the item ids
        for ( const oldId in ids )
        {
            // not sure if this actually modifies the reference.
            // you might need a normal for(;;) loop here
            for ( const item of items )
            {
                // update node id
                // not sure if debug messages of the server are shown in release mode, test this!
                if ( item._id === oldId )
                {
                    item._id = ids[ oldId ];
                    //this.logger.error(`Replacing id ${item._id} with: ${ids[oldId]}`);
                }

                if ( item.parentId && item.parentId === oldId )
                {
                    // update parent node id (if it exists)
                    item.parentId = ids[ oldId ];
                    //this.logger.error(`Replacing parent id ${item.parentId} with: ${ids[oldId]}`);
                }
            }
        }

        //Fix the outlier _parent
        preset._parent = preset._items[ 0 ]._id;
    }

    private debugJsonOutput ( jsonObject: any, label = "" )
    {
        if ( this.config.debug )
        {
            if ( label.length > 0 )
            {
                this.logger.logWithColor( `[${label}]`, LogTextColor.GREEN );
            }
            this.logger.logWithColor( JSON.stringify( jsonObject, null, 4 ), LogTextColor.MAGENTA );
        }
    }

    private printColor ( message: string, color: LogTextColor = LogTextColor.GREEN )
    {
        this.logger.logWithColor( message, color );
    }
}

module.exports = { mod: new LeavesShinyAirdropGuns() };
