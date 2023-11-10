require('dotenv').config()


let resourcesPath = process.env.RESOURCES_PATH;
if(!resourcesPath){
    console.log("Please set RESOURCES_PATH in .env or as an environment variable");
    process.exit();
}

import fs from 'fs';
import path from 'path';
import * as JSONC from 'jsonc-parser';
import { FightProperties } from './fightprops';
import { AvatarCurveData, AvatarData, AvatarPromoteData, AvatarSkillData, AvatarSkillDepotData, AvatarTalentData, GadgetData, ProudSkillData } from './excels';

function getFile(p:string){
    let c = path.resolve(resourcesPath, p);
    return fs.readFileSync(c, 'utf8');
}
export {getFile}


class ConfigGadgetSkillObj{
    data = {}
    constructor(avatarName: string){
        let path = `json/gadget/ConfigGadget_SkillObj_${avatarName}.json`
        let file = getFile(path);
        this.data = JSONC.parse(file);   
    }
    get(name: string | number){
        return this.data[name];
    }
}



class ConfigAbilityAvatar{
    //maybe this global values should be outside of this class but it works for now.
    //this is from the json
    abilities = <any[]>[]
    //this is from the json.
    modifiers = <Record<string, Record<string,any>>>{}



    gadgetSkillObj: ConfigGadgetSkillObj
    avatar: Avatar;

    constructor(avatar:Avatar){
        let avatarName = avatar.name.split("_")[1]; //avatarName is the configavatar.json name
        let path = `json/ability/Temp/AvatarAbilities/ConfigAbility_Avatar_${avatarName}.json`
        let file = getFile(path);

        let config = JSONC.parse(file);

        this.abilities = [...config.map((c: { Default: any; })=>c.Default)];
        let modifiers = this.abilities.map(x=> {
            return {abilityName : x.abilityName,
                modifiers: x.modifiers}
        });


        for(let values of Object.values(modifiers)){
            let {abilityName, modifiers} = values;
            if(!modifiers) continue;

            this.modifiers[abilityName] = modifiers;
        }
        

        this.gadgetSkillObj = new ConfigGadgetSkillObj(avatarName);
        this.avatar = avatar;

    }

    compare(value: number, target: number, compareType: string){
        switch (compareType){
            case "NoneOrEqual":
                if(target === undefined || target === null) return true;
                if(value === undefined || value === null) return true;
                return value === target;
            case "NotEqual":
                return value !== target;
            case "LessThan":
                return value < target;

            case "LessThanOrEqual":
                return value <= target;
            case "Equal":
                return value === target;
            default:
                this.log(`Compare type ${compareType} not implemented`);
        }

    }

    indent(...args: { (): void; (): void; (): void; (): void; }[]){
        this.depth++;
        args.forEach(arg => {
            arg();
        });
        this.depth--;
    }
    log(msg: string){
        console.log(`${"  ".repeat(this.depth)}${msg}`);
    }

    predicate(predicate: {
        [x: string]: any; $type: string;}, context: any = {}){
        switch (predicate.$type){
            case "ByTargetGlobalValue":
                let compareType = predicate.compareType;
                let target = predicate.target;
                let key = predicate.key;
                let value = predicate.value;

                return this.compare(value, this.getGlobalValue(key), compareType);
                break;
            case "ByNot":
                let preds = predicate.predicates || [];
                return !preds.every((pred: any) => this.predicate(pred));
                break;
            case "ByUnlockTalentParam":
                let talentParam = predicate.talentParam;
                let rootAbilityName = context as string; //dont ask.
                let result = (this.avatar.unlockedTalentParams[rootAbilityName] || []).includes(talentParam);
                this.log(`Checking if ${talentParam} is unlocked: ${result}`)
                return result;
                //todo: this is probably wrong
                // if(this.avatar.abilities.includes(talentParam)) return true;

            default :
                this.log(`Predicate ${predicate.$type} not implemented`);
        }
        return true;
    }

    getAbility(name: any){
        let ability = this.abilities.filter((a: { abilityName: any; })=>a.abilityName === name)[0]
        
        return ability;
    }

    getGlobalValue(name: string | number){
        return this.avatar.globalValues[name]
    }
    setGlobalValue(name: string | number, value: any){
        this.avatar.globalValues[name] = value;
    }

    invokeAction(action: any, abilityOrModifier: any, rootAbilityName:string){
        if(action.predicates){
            let predicates = [...action.predicates];
            if(!predicates.every(predicate => this.predicate(predicate, rootAbilityName))) return;
        }

        // this.log(`Invoking action ${action.$type}, w/ rootName ${rootAbilityName}`)
        // console.trace()

        switch (action.$type){
            case "TriggerBullet":
                let gadgetId = action.bulletID;
                let jsonName = GadgetData.getName(gadgetId.toString());
                
                let gadgetSkillObj = this.gadgetSkillObj.get(jsonName);

                //

                //todo: technically the ability isnt always triggered; tehres a condition (collision or something) but im just going to assume its goig to be triggerd immediately;
                let abilities = gadgetSkillObj.abilities;

                //todo: combat.property.useCreatorProperty
                //todo: combat.property.useCreatorBuffedProperty
                //todo: combat.property.useAbilityProperty
                //todo: combat.property.canTriggerBullet
                //todo: combat.property.isInvincible

                //some have "lifetimes"
                //timer.lifeInfinite = false
                //timer.lifeTime = 2

                //todo: you have to do gadget.onAdded as well... 
                //first add the ability to the gadget,
                //then when the ability is triggered, then start it (in kokomi case, its the na hitting a target)
                abilities.forEach((ability: { abilityName: any; }) => {
                    this.avatar.startAbility(ability.abilityName);
                });
                break;
            case "TriggerAttackEvent":
                let target = action.targetType;


                let damagePercentage = action.attackEvent.attackInfo.attackProperty.damagePercentage || "";
                let damageExtra = action.attackEvent.attackInfo.attackProperty.damageExtra || "";
                

                let total = 0;
                if(damagePercentage != ""){
                    let equation = `${damagePercentage}*%FIGHT_PROP_ATTACK`; //this one defaults to atk scaling? i guess
                    let res = this.avatar.resolveEquation(equation, rootAbilityName, abilityOrModifier.params);
                    console.log(`wheee: damagePercentage ${equation} = ${res}`)
                    total += res;
                }
                if(damageExtra != ""){
                    let equation = damageExtra;
                    let res = this.avatar.resolveEquation(damageExtra, rootAbilityName, abilityOrModifier.params);
                    console.log(`wheee: damageExtra ${equation} = ${res}`)
                    total += res
                }

                
                this.indent(()=>{this.log(`Attack Event, ability name ${rootAbilityName} total dmg = ${total}`)})

                //TODO: deal w/ fun polish notation later
                break;

            case "SetGlobalValue":
                let key = action.key;
                let value = action.value;
                this.setGlobalValue(key, value);
                this.log(`Setting global value ${key} to ${value}`)
                break;
            case "AttachModifier":
                // if(action.modifierName == "Avatar_Kokomi_CritRateDown"){
                //     let modifierName = action.modifierName;

                //     let ability = this.getAbility(rootAbilityName);
                //     let modifiers = ability.modifiers;
    
                //     let modifier = modifiers[modifierName];

                // }
            case "ApplyModifier":
                let modifierName = action.modifierName;

                let ability = this.getAbility(rootAbilityName);
                let modifiers = ability.modifiers;

                let modifier = modifiers[modifierName];
                if(!modifier){
                    this.log(`Modifier ${modifierName} not found`);
                    break;
                }
                this.log(`adding ${modifierName} to modifiers`);
                this.depth++;
                this.avatar.addModifier(modifierName, modifier, rootAbilityName);
                this.depth--;
                
                break;
            case "RemoveUniqueModifier":
                this.avatar.removeModifier(action.modifierName, rootAbilityName); //todo: check if this is correct, whyd they have twho things do the same thing?
                break;
            case "RemoveModifier":
                this.avatar.removeModifier(action.modifierName, rootAbilityName);
                break;
            case "TriggerAbility":
                this.log(`Triggering ability ${action.abilityName}`);
                this.avatar.startAbility(action.abilityName); //todo: check...

                break;
            case "AvatarSkillStart":
                //maybe i should implement? idk though.
                break;
            case "ClearEndura": //i *think* this means "clear endurance" so it may be ignorable
            //below should be ignored
            case "SetAnimatorBool": //not sure but probably ignorable
            case "AttachEffect":
            case "ActCameraRadialBlur":
            case "FireHitEffect":
            case "FireEffect": 
                //vfx stuff, can ignore
                break;
            default:
                this.log(`Action ${action.$type} not implemented`);
        }
    }

    AbilityStart(ability: {
        [x: string]: string; onAbilityStart: any; 
}){
        if(!ability.onAbilityStart) return;
        let actions = ability.onAbilityStart;

        actions.forEach((action: any) => {
            this.invokeAction(action, ability, ability.abilityName);
        })
    }

    AbilityAdded(ability: {
        [x: string]: string; onAdded: any; 
}){
        if(!ability.onAdded) return;
        let actions = ability.onAdded;
        actions.forEach((action: any) => {
            this.invokeAction(action, ability, ability.abilityName);
        })
    }

    AbilityFieldEnter(ability: { onFieldEnter: any; }){
        if(!ability.onFieldEnter) return;
        let actions = ability.onFieldEnter;
    }

    AbilityFieldExit(ability: { onFieldExit: any; }){
        if(!ability.onFieldExit) return;
        let actions = ability.onFieldExit;
        
    }
    depth = 0;
}

class ConfigTalent{
    data = {}
    constructor(name){
        //json/talent/AvatarTalents/ConfigTalent_Kokomi.json
        let path = `json/talent/AvatarTalents/${name}.json`
        let file = getFile(path);
        this.data = JSONC.parse(file);
    }
    get(name){
        return this.data[name];
    }
}


class SkillDepot{

    depotId: string;
    avatar: Avatar;
    talentIds: any[];
    constructor(depotId:string){
        this.depotId = depotId;
    }

    energySkill: string; //burstId
    eSkill: string;
    normalAttack: string;

    skills: {[key:string]: number} = {}
    subSkills: {[key:string]: number} = {}
    chargeCount : {[key:string] :number} = {}

    proudSkillIds: any[]; 

    openConfigSkillIdMap : Map<string, string> = new Map();

    addProudSkill(id:number){
        let proudSkill = ProudSkillData.get(id.toString());
        let proudSkillId = proudSkill.proudSkillId;

        let openConfig = proudSkill.openConfig;
        // this.avatar.configAbility.log(`adding config ${openConfig}`)

        if(this.openConfigSkillIdMap.has(openConfig)){
            let toBeRemoved = this.openConfigSkillIdMap.get(openConfig)
            //todo: remove 

        }

        this.openConfigSkillIdMap.set(openConfig, proudSkillId)

        let params = ProudSkillData.getParams(proudSkillId.toString());

        let addProps = ProudSkillData.getAddProps(proudSkillId.toString());
        for(let prop of addProps){
            this.avatar.fightProps[prop.propType] = (this.avatar.fightProps[prop.propType] || 0) + Number(prop.value);
        }

        let mixins = this.avatar.configTalent.get(openConfig);

        for(let mixin of mixins){
            this.avatar.mixin(mixin, openConfig, params)
        }
    }
    

    initProudSkills(){
        let proudSkillsGroups = AvatarSkillDepotData.getInherentProudSkillIds(this.depotId)
            .filter(x=>x.needAvatarPromoteLevel<=this.avatar.ascension)
            .filter(x=>x.proudSkillGroupId!=0).map(x=>x.proudSkillGroupId);

        this.proudSkillIds = proudSkillsGroups.flatMap(x=>ProudSkillData.getWithGroupId(x.toString())).map(x=>x.proudSkillId);



        for(let id of this.proudSkillIds){
            this.addProudSkill(id)
        }
    }

    initTalentSkills(){
        this.talentIds = AvatarSkillDepotData.getTalentIds(this.depotId)


        this.talentIds.forEach((talentId, i) => {
            if(i >= this.avatar.constellation) return;
            let talent = AvatarTalentData.get(talentId);
            let openConfig = AvatarTalentData.getOpenConfig(talentId);

            // this.avatar.configAbility.log(`adding config ${openConfig}`)

            if(this.openConfigSkillIdMap.has(openConfig)){
                let toBeRemoved = this.openConfigSkillIdMap.get(openConfig)
                //todo: remove 
    
            }
            this.openConfigSkillIdMap.set(openConfig, talentId)

            let params = AvatarTalentData.getParams(talentId);

            //addProps

            let addProps = AvatarTalentData.getAddProps(talentId);
            for(let prop of addProps){
                this.avatar.fightProps[prop.propType] = (this.avatar.fightProps[prop.propType] || 0) + Number(prop.value);
            }

            let mixins = this.avatar.configTalent.get(openConfig) || [];



            for(let mixin of mixins){
                this.avatar.mixin(mixin, openConfig, params)
            }
        })
    }



    init(avatar:Avatar){
        this.avatar = avatar
        this.energySkill = AvatarSkillDepotData.getEnergySkillId(this.depotId)
        AvatarSkillDepotData.getSkills(this.depotId).forEach((skillId, i) => {
            if(!skillId){
                return;
            };
            this.skills[skillId] = 1;
            this.setSkillLevel(skillId, 1);
            switch(i){
                case 0:
                    this.normalAttack = skillId;
                    break;
                case 1:
                    this.eSkill = skillId;
                    break;

            }
            // console.log(AvatarSkillData.get(skillId))
            // console.log(`Adding skill ${skillId} to skills`)
        });


        this.initTalentSkills();


        let subskills = AvatarSkillDepotData.getSubSkills(this.depotId);
        //todo

        this.initProudSkills();


        
    }

    setSkillLevel(skillId: string, level: number){
        this.skills[skillId] = level;
        //let x = AvatarSkillDepotData.getSkills(AvatarData.getSkillDepotId(avatarId));
        let y = AvatarSkillData.getSkillDepotId(skillId)
        

        //y*100 + level 

        let proudSkillId = ProudSkillData.getSkillIdFromSkillGroupIdAndLvl(y, level);
        // console.log(proudSkillId)
        this.addProudSkill(proudSkillId);
        //

    }
}



class Avatar{
    constellation: number = 0;
    configTalent: ConfigTalent
    ascension: number=1; //idk it might even be 0 lol
    level = 1;
    avatarId: string;
    depotId: string;
    promoteId: string;
    name:string
    configAvatar: ConfigAvatar;

    //todo: this is probably wrong i dont really quite remember; will fix later
    fightProps : {[key:string]: number}= {}



    abilities = [];
    configAbility: ConfigAbilityAvatar;

    globalValues = <any>{}
    abilitySpecials = <Record<string, any>>{}
    modifiers = <any>{}

    unlockedTalentParams: Record<string, string[]> = {}
    skillDepot: SkillDepot;

    
    setConstellation(arg0: number) {
        this.constellation = arg0;
        //AvatarTalent
        this.skillDepot.initTalentSkills();
    }
    mixin(mixin: any, openConfig:string, params: string[]) {
        let abilityName = mixin.abilityName;
        switch(mixin.$type){
            case "UnlockTalentParam":
                let talentParam = mixin.talentParam;
                if(!this.unlockedTalentParams[abilityName]){
                    this.unlockedTalentParams[abilityName] = [];
                }
                this.unlockedTalentParams[abilityName].push(talentParam);
                break;
            case "AddAbility":
                this.addAbility(abilityName);
                break;
    
            case "ModifyAbility":

                let abilitySpecials = this.abilitySpecials[abilityName];
    
                let paramSpecial = mixin.paramSpecial;
                let paramDelta :string = mixin.paramDelta;
                if(paramDelta.startsWith("%")){
                    //sub in value param{Num}
                    let index = Number(paramDelta.replace("%", "")) -1;
                    let value:number = params[index] as unknown as number;
                    if(typeof(value) === "string"){
                        value = Number(value);
                    }
                    
                    // console.log(params)
                    // console.log(`OpenConfig ${openConfig} ModifyAbility ${abilityName}.${paramSpecial} = ${value}`)
                    
                    if(!this.abilitySpecials[abilityName]){
                        this.abilitySpecials[abilityName] = {};
                    }
                    this.abilitySpecials[abilityName][paramSpecial] = value;
                    // console.log(this.abilitySpecials[abilityName])

                }
                break;
            case "AddTalentExtraLevel":
                let talentType = mixin.talentType;
                let talentIndex = mixin.talentIndex;
                let extraLevel = mixin.extraLevel;

                //talentIndex is 1 or 2 or 9 
                // hacky!
                switch (talentIndex){
                    case 1:
                        this.skillDepot.setSkillLevel(this.skillDepot.normalAttack, extraLevel);
                        break;
                    case 2:
                        this.skillDepot.setSkillLevel(this.skillDepot.eSkill, extraLevel);
                        break;
                    case 9:
                        this.skillDepot.setSkillLevel(this.skillDepot.energySkill, extraLevel);
                        break;

                }
                

                break;
            default:
                this.configAbility.log(`Mixin ${mixin.$type} not implemented`);
        }
    }


    setAscension(arg0: number) {
        this.ascension = arg0;
        this.skillDepot.initProudSkills()
    }

    setLevel(arg0: number) {
        this.level = arg0;
        this.reCalcFightProps();
    }
    
    defaultFP(){
        let fp = {}
        
        for(let key of Object.keys(FightProperties)){
            if(!Number.isNaN(Number(key))){
                fp[key] = 0;
            }
        }

        fp[FightProperties.FIGHT_PROP_CHARGE_EFFICIENCY] = 1;
        fp[FightProperties.FIGHT_PROP_CRITICAL_HURT] = 0.5;
    }

    reCalcFightProps(){
        let {props, propGrowthCurves} = AvatarData.getBaseProps(this.avatarId);
        // console.log(props);
        // console.log(propGrowthCurves);

        this.fightProps = {...this.fightProps}

        

        let level = this.level;
        propGrowthCurves.forEach((curve => {
            let propT = curve.type;

            let growCurve = curve.growCurve;

            let base = props[FightProperties[propT]];

            let {type, op, val} = AvatarCurveData.getCurveForLevel(level, growCurve);
            // console.log(type, op, val)

            let amt = Number(val) * base;
            // console.log(`Setting ${type} to ${amt}, ${base} * ${val}, lvl ${level}`)
            this.fightProps[propT] = amt;
        }));

        // for(let i = this.ascension; i >= 0; i--){
            
        // }
        AvatarPromoteData.getAddProps(this.promoteId, this.ascension).forEach(prop => {
            this.fightProps[prop.propType] = (this.fightProps[prop.propType] || 0) + Number(prop.value);
        });
        
        //these shuold be recalced based on the above?
        
        this.updateATKDEFHP();
        //todo lol
        // console.log(this.fightProps)
    }

    updateATKDEFHP(){
        this.fightProps[FightProperties.FIGHT_PROP_MAX_HP] = this.fightProps[FightProperties.FIGHT_PROP_BASE_HP] * (1 + this.getFightProp(FightProperties.FIGHT_PROP_HP_PERCENT)) + this.getFightProp(FightProperties.FIGHT_PROP_HP); 
        this.fightProps[FightProperties.FIGHT_PROP_DEFENSE] = this.fightProps[FightProperties.FIGHT_PROP_BASE_DEFENSE] * (this.getFightProp(FightProperties.FIGHT_PROP_DEFENSE_PERCENT)+1);
        this.fightProps[FightProperties.FIGHT_PROP_ATTACK] = this.fightProps[FightProperties.FIGHT_PROP_BASE_ATTACK] * (this.getFightProp(FightProperties.FIGHT_PROP_ATTACK_PERCENT)+1);

    }

    getFightProp(prop: FightProperties){
        return this.fightProps[prop] || 0;
    }



    addModifier(name: string | number, modifier: {[key: string]:any}, rootAbilityName: string){
        this.modifiers[name] = modifier;

        let duration = modifier.duration; // may be in an equation rather than a constant
        if(duration){
            let durationValue = this.resolveEquation(duration, rootAbilityName, modifier.params);
            this.configAbility.log(`Modifier ${name} has a duration: ${durationValue}`)
        }
        //onAdded

        this.configAbility.log(`Adding modifier ${name} to modifiers`)

        let onAdded = [...(modifier.onAdded || [])];
        onAdded.forEach(action => {
            // this.invokeModifier(action, modifier);
            this.configAbility.depth++
            this.configAbility.invokeAction(action, modifier, rootAbilityName);
            this.configAbility.depth--
        })

        let properties = modifier.properties

        //todo: this is wrong.
        false && Object.keys(properties).forEach(key => {
            let v = properties[key];

            let abilitySpecials = this.abilitySpecials[rootAbilityName];
            console.log(abilitySpecials, rootAbilityName, v)

            let value = this.resolveEquation(v, rootAbilityName, abilitySpecials);

        })
        // console.log(this.modifiers)
        
    }
    

    removeModifier(name: string | number, rootAbilityName: string){
        let m =  this.modifiers[name]; //
        if(!m){
            // console.log(`Modifier ${name} not found when trying to remove...`);
            // should be safe to ignore?
            return
        };

        //on removed
        let onRemoved = m.onRemoved;
        onRemoved.forEach(action => {
            this.configAbility.depth++
            this.configAbility.invokeAction(action, m, rootAbilityName);
            this.configAbility.depth--
        })


        delete this.modifiers[name];
    }

    constructor(avatarId: any){
        this.avatarId = avatarId;
        this.depotId = AvatarData.getSkillDepotId(avatarId);
        this.name = AvatarData.getName(avatarId);
        this.promoteId = AvatarData.getPromoteId(avatarId);
        this.configTalent = new ConfigTalent(this.name.replace("Avatar", "Talent"));
        
        this.configAvatar = new ConfigAvatar(this.name);
        this.configAbility = new ConfigAbilityAvatar(this);
    }

    initSkills(){
        //todo: proud skills
        //talents (constellations)
        this.configAbility.log(`init skills`)

        let skillDepot = new SkillDepot(this.depotId);
        this.skillDepot = skillDepot;

        skillDepot.init(this)
        
        skillDepot.setSkillLevel(skillDepot.energySkill, 9);


        


    }

    initAbilities(){
        this.configAbility.log(`start loading default abilities`)
        this.configAvatar.abilities.forEach(embryo => {
            this.addAbility(embryo);
        });

        this.configAbility.depth--;
    }

    addAbility(embryo: string){
        this.configAbility.depth++;
        let ability = this.configAbility.getAbility(embryo);
        if(!ability) {
            // this.configAbility.log(`Ability ${embryo} not found`); //some configabilities are in Common or AllDefault
            return;
        };
        this.configAbility.AbilityAdded(ability);
        this.configAbility.log(`Added ability ${embryo}`);
        this.configAbility.depth--;

        let abilitySpecials = ability.abilitySpecials;
        

        for(let key in abilitySpecials){
            if(!this.abilitySpecials[embryo]){
                this.abilitySpecials[embryo] = {};
            }
            let value = abilitySpecials[key];


            this.abilitySpecials[embryo][key] = value;

            // this.configAbility.log(`Set ability special ${key} to ${value} for ability ${embryo}`)
        }

        this.abilities.push(embryo);

    }

    startAbility(embryo: string){
        
        let ability = this.configAbility.getAbility(embryo);
        if(!ability) {
            this.configAbility.log(`Ability ${embryo} not found`);
            return;
        };
        this.configAbility.log(`Started ability ${embryo}`);
        this.configAbility.depth++;

        this.configAbility.AbilityStart(ability);

        this.configAbility.depth--;

    }

    resolveEquation(eq: string, ability:string, params: string[]){
        if(Number(eq)) return Number(eq);
        let result = eq;

        let abilitySpecials = this.abilitySpecials[ability];

        for(let key in abilitySpecials){
            let value = abilitySpecials[key];
            
            result = result.replace(`%${key}`, value);
        }
        //do the same for fightprops...
        for(let key in FightProperties){
            if(!Number.isNaN(Number(key))) continue;
            result = result.replace(`%${key}`, (this.fightProps[`${FightProperties[key]}`] || 0).toString());
        }

        if(eq.includes("%")){
            //something is missing!
        }
        
        // console.log(result);



        return Number(eval(result));
    }
}
class ConfigAvatar{
    data = <any>{}
    abilities = <string[]>[]
    constructor(name: string){
        let path = `json/avatar/${name}.json`
        let file = getFile(path);
        this.data = JSONC.parse(file);

        this.abilities = this.data.abilities.map(x=>x.abilityName);
    }    
}


// let configAvatar = 

// AvatarPromoteData.load();

// console.log(AvatarPromoteData.getAddProps("35", 6));
// process.exit();

let avatarId = 10000054; //kokomi

let kokomi = new Avatar(avatarId);
// let kokomiConfigAbility = new ConfigAbilityAvatar(kokomi);
// kokomiConfigAbility.traverseAbility("");

kokomi.initAbilities();
kokomi.initSkills()

// console.log([...kokomi.skillDepot.openConfigSkillIdMap.keys()])

kokomi.setAscension(6);
kokomi.setLevel(90);


kokomi.setConstellation(6);

//apprentice notes
kokomi.fightProps[FightProperties.FIGHT_PROP_BASE_ATTACK] = kokomi.fightProps[FightProperties.FIGHT_PROP_BASE_ATTACK] + 23;

kokomi.updateATKDEFHP();
console.log(Object.entries(kokomi.fightProps).filter(x=>!isNaN(Number(x[0])))
.map(x=>[FightProperties[Number(x[0])], x[1]]).map(x=>`${x[0]}: ${x[1]}`).join("\n"));

kokomi.skillDepot.setSkillLevel(kokomi.skillDepot.energySkill, 8); 
kokomi.skillDepot.setSkillLevel(kokomi.skillDepot.normalAttack, 4); 
console.log(`
/// DONE INIT SKILLS AND LEVELING AND SETTING CONSTELLATION ETC
`)

// console.log([...kokomi.skillDepot.openConfigSkillIdMap.keys()])

//logging stats:




// console.log(JSON.stringify(kokomi.abilitySpecials, null, 4))



kokomi.startAbility("Avatar_Kokomi_ElementalBurst_Initiate")
kokomi.startAbility("Avatar_Kokomi_Attack01")



// kokomi.traverseAbility("Avatar_Kokomi_Attack01");


//NormalAttack_01_Damage = 0.6837599873542786 for lvl1 normal attack
//"damageExtra" : "%FIGHT_PROP_MAX_HP*%NormalAttack_MaxHP_Percentage", 
// maxHP * 