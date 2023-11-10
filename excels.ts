
import { getFile } from ".";
import { FightProp, FightProperties } from "./fightprops";


//returns an array of numbers from start to end inclusive
function range(start: number, end: number) {
    return Array.from({ length: end - start + 1 }, (v, k) => k + start);
}

class ProudSkillData {
    static data = <any[]>[]

    static getWithGroupId(arg0: any): any {
        if (!this.isLoaded) {
            this.load();
        }
        return this.data.filter(x=>{
            if(!x["proudSkillGroupId"]) return false;

            return x["proudSkillGroupId"].toString() == arg0;
        });
    }
    static isLoaded = false;

    //                                                                                                              paramList[20],                                                                                       costItems[4]        filterConds[2]                 lifeEffectParams[5]
    static header = "proudSkillId,openConfig,addProps0PropType,addProps0Value,addProps1PropType,addProps1Value," + range(1, 20).map(x => `param${x}`).join(",") + ",proudSkillGroupId,level,proudSkillType,coinCost," + ",".repeat(8) + ",".repeat(2) + "breakLevel," + ",".repeat(5) + ",,";
    static headers: string[];
    static load() {
        let path = `txt/ProudSkillData.txt`
        let file = getFile(path);
        //its a tsv...

        let lines = file.split('\n');

        // this.header =  lines[0]
        // this.headers = this.header.split('\t');
        this.headers = this.header.split(',');

        let data = lines.slice(1).map(line => {
            let obj = {};
            let values = line.split('\t');
            this.headers.forEach((header, i) => {
                obj[header] = values[i];
            });
            return obj;
        });
        this.data = data;
        this.isLoaded = true;
    }

    static get(id: any) {
        if (typeof id === "number") id = `${id}`
        if (!this.isLoaded) {
            this.load();
        }
        return this.data.find((d: { [x: string]: any; }) => d["proudSkillId"] == id);
    }

    static getName(id: any) {
        let data = ProudSkillData.get(id);
        return data[`openConfig`];
    }

    static getAddProps(id: any) {
        let data = ProudSkillData.get(id);


        return range(1,2).map(x => {
            let addt = data[`addProps${x}PropType`];
            let addv = data[`addProps${x}Value`];
            return { propType: addt, value: addv }
        })
    }

    static getSkillIdFromSkillGroupIdAndLvl(skillGroupId: number, lvl: number) {
        let data = ProudSkillData.getWithGroupId(skillGroupId);
        let skillId = data.filter(x => x["level"] == lvl)[0]["proudSkillId"];
        return skillId;

    }


    static getParams(id: any) {
        let data = ProudSkillData.get(id);
        let params = [];
        Object.values(data).forEach((v, i) => {
            if (i >= 6 && i <= 25) {
                params.push(v);
            }
        });
        return params;
    }



}

class GadgetData {
    static data = <any[]>[]
    static isLoaded = false;

    static headers: string[];
    static load() {
        let path = `txt/GadgetData_Avatar.txt`
        let file = getFile(path);
        //its a tsv...
        let lines = file.split('\n');
        this.headers = lines[0].split('\t');
        let data = lines.slice(1).map(line => {
            let obj = {};
            let values = line.split('\t');
            this.headers.forEach((header, i) => {
                obj[header] = values[i];
            });
            return obj;
        });
        GadgetData.data = data;
        GadgetData.isLoaded = true;
    }

    static get(id: any) {
        if (typeof id === "number") id = `${id}`
        if (!GadgetData.isLoaded) {
            GadgetData.load();
        }
        return GadgetData.data.find((d: { ID: any; }) => d.ID === id);
    }

    static getName(id: any) {
        let data = GadgetData.get(id);
        return data[`JSON名称`];
    }

}


class AvatarData {
    static data = <any[]>[]
    static isLoaded = false;

    static headers: string[];
    static load() {
        let path = `txt/AvatarData.txt`
        let file = getFile(path);
        //its a tsv...
        let lines = file.split('\n');
        this.headers = lines[0].split('\t');
        let data = lines.slice(1).map(line => {
            let obj = {};
            let values = line.split('\t');
            this.headers.forEach((header, i) => {
                obj[header] = values[i];
            });
            return obj;
        });
        this.data = data;
        this.isLoaded = true;
    }

    static get(id: any) {
        if (typeof id === "number") id = `${id}`

        if (!this.isLoaded) {
            this.load();
        }
        return this.data.find((d: any) => d["ID"] === id);
    }

    static getName(id: any) {
        let data = this.get(id);
        return data[`战斗config`];
    }

    static getSkillDepotId(id: any) {
        let data = this.get(id);
        return data[`技能库ID`];
    }

    static getPromoteId(id: any) {
        let data = this.get(id);
        //  '角色突破ID': '35',
        return data[`角色突破ID`];
    }
    static getBaseProps(id : any){
        let data = this.get(id);

        let props : Partial<{[PROP in FightProp] : string}> = {};
        //基础生命值
        let hpBase = data[`基础生命值`];
        props["FIGHT_PROP_BASE_HP"] = hpBase;
        //基础攻击力
        let atkBase = data[`基础攻击力`];
        props["FIGHT_PROP_BASE_ATTACK"] = atkBase;

        //基础防御力
        let defBase = data[`基础防御力`];
        props["FIGHT_PROP_BASE_DEFENSE"] = defBase;


        //暴击率
        let critRate = data[`暴击率`];
        props["FIGHT_PROP_CRITICAL"] = critRate;

        //暴击抗性
        // let critResistance = data[`暴击抗性`]; // ignore i guess

        //暴击伤害
        let critDamage = data[`暴击伤害`];
        props["FIGHT_PROP_CRITICAL_HURT"] = critDamage;

        //[属性成长]1类型
        //[属性成长]1曲线

        let PropGrowth1Type = data[`[属性成长]1类型`];
        let PropGrowth1Curve = data[`[属性成长]1曲线`];

        //[属性成长]2类型
        //[属性成长]2曲线

        let PropGrowth2Type = data[`[属性成长]2类型`];
        let PropGrowth2Curve = data[`[属性成长]2曲线`];

        //[属性成长]3类型
        //[属性成长]3曲线

        let PropGrowth3Type = data[`[属性成长]3类型`];
        let PropGrowth3Curve = data[`[属性成长]3曲线`];

        let propGrowthCurves = [
            {type: PropGrowth1Type, growCurve: PropGrowth1Curve},
            {type: PropGrowth2Type, growCurve: PropGrowth2Curve},
            {type: PropGrowth3Type, growCurve: PropGrowth3Curve},
        ]

        return {props, propGrowthCurves};


    }



}


class AvatarCurveData {
    static data = <any[]>[]
    static isLoaded = false;

    static headers: string[];
    static load() {
        let path = `txt/AvatarCurveData.txt`
        let file = getFile(path);
        //its a tsv...
        let lines = file.split('\n');
        this.headers = lines[0].split('\t');
        let data = lines.slice(1).map(line => {
            let obj = {};
            let values = line.split('\t');
            this.headers.forEach((header, i) => {
                obj[header] = values[i];
            });
            return obj;
        });
        this.data = data;
        this.isLoaded = true;
    }

    static get(level: any) {
        if (typeof level === "number") level = `${level}`

        if (!this.isLoaded) {
            this.load();
        }
        return this.data.find((d: any) => d["等级"] === level);
    }

    static getCurveForLevel(level : number, curveType:number|string){
        //等级	[曲线]1类型	[曲线]1运算	[曲线]1值	[曲线]2类型	[曲线]2运算	[曲线]2值	[曲线]3类型	[曲线]3运算	[曲线]3值	[曲线]4类型	[曲线]4运算	[曲线]4值

        let data = this.get(level);
        let curves = [];
        
        range(1,4).forEach(x=>{
            let type = data[`[曲线]${x}类型`];
            let op = data[`[曲线]${x}运算`];
            let val = data[`[曲线]${x}值`];
            curves.push({type, op, val});
        })
        
        return curves.filter(x=>x.type == curveType)[0];


    }



}
class AvatarSkillDepotData {
    static data = <any[]>[]
    static isLoaded = false;

    static headers: string[];
    static load() {
        let path = `txt/AvatarSkillDepotData.txt`
        let file = getFile(path);
        //its a tsv...
        let lines = file.split('\n');
        this.headers = lines[0].split('\t');
        let data = lines.slice(1).map(line => {
            let obj = {};
            let values = line.split('\t');
            this.headers.forEach((header, i) => {
                obj[header] = values[i];
            });
            return obj;
        });
        this.data = data;
        this.isLoaded = true;
    }

    static get(id: any) {
        if (typeof id === "number") id = `${id}`
        if (!this.isLoaded) {
            this.load();
        }
        return this.data.find((d: any) => d["ID"] === id);
    }

    static getName(id: any) {
        let data = this.get(id);
        return data[`战斗config`];
    }

    static getTalentName(id: any) {
        let data = this.get(id);
        return data[`天赋星盘名称`];
    }

    static getTalentIds(id: any) {
        let data = this.get(id);
        return range(1, 6).map(x => data[`天赋${x}`]);
    }

    static getEnergySkillId(id: any) {
        let data = this.get(id);
        return data[`充能技能`];
    }

    static getSkills(id: any) {
        let data = this.get(id);
        return range(1, 4).map(x => data[`技能${x}`]);
    }

    static getSubSkills(id: any) {
        let data = this.get(id);
        let str = data["次级技能"]
        return str.split(',').map(x => x.trim());
    }

    static getInherentProudSkillIds(id: any) {
        let data = this.get(id);
        //todo: thres also "required ascension level" to deal with but i literaly dont care
        return range(1, 5).map(x => { return { proudSkillGroupId: data[`固有得意技组${x}ID`], needAvatarPromoteLevel: data[`固有得意技组${x}激活所需角色突破等级`] } });
    }
}


class AvatarSkillData{
    static data = <any[]>[]
    static isLoaded = false;
    static headers: any;

    static load(){
        let path = `txt/AvatarSkillData.txt`
        let file = getFile(path);
        //its a tsv...
        let lines = file.split('\n');
        this.headers = lines[0].split('\t');
        let data = lines.slice(1).map(line => {
            let obj = {};
            let values = line.split('\t');
            this.headers.forEach((header, i) => {
                obj[header] = values[i];
            });
            return obj;
        });
        this.data = data;
        this.isLoaded = true;
    }

    static get(id: any) {
        if (typeof id === "number") id = `${id}`
        if (!this.isLoaded) {
            this.load();
        }
        return this.data.find((d: any) => d["ID"] === id);
    }

    static getSkillDepotId(id: any) {
        let data = this.get(id);
        return data[`升级技能组ID`];
    }

    

}

class AvatarTalentData{

    static data = <any[]>[]
    static isLoaded = false;
    static headers: any;

    static load(){
        let path = `txt/TalentSkillData.txt`
        let file = getFile(path);
        //its a tsv...
        let lines = file.split('\n');
        this.headers = lines[0].split('\t');
        let data = lines.slice(1).map(line => {
            let obj = {};
            let values = line.split('\t');
            this.headers.forEach((header, i) => {
                obj[header] = values[i];
            });
            return obj;
        });
        this.data = data;
        this.isLoaded = true;
    }

    static get(id: any) {
        if (typeof id === "number") id = `${id}`
        if (!this.isLoaded) {
            this.load();
        }
        return this.data.find((d: any) => d["天赋ID"] === id);
    }

    static getOpenConfig(id: any) {
        let data = this.get(id);
        return data[`开启天赋配置`];
    }

    static getAddProps(id:any){
        let data = this.get(id);

        return range(1,2).map(x=>{
            //[增加属性]1类型	[增加属性]1值
            let propType = data[`[增加属性]${x}类型`];
            let value = data[`[增加属性]${x}值`];
            return {
                propType, value
            }
        
        })
    }

    static getParams(talentId: any) {
        let data = this.get(talentId);
        return range(1, 7).map(x => {
            return data[`参数${x}`]
        })
    }

    

}

class AvatarPromoteData{

    static data = <any[]>[]
    static isLoaded = false;
    static headers: any;

    static load(){
        let path = `txt/AvatarPromoteData.txt`
        let file = getFile(path);
        //its a tsv...
        let lines = file.split('\n');
        this.headers = lines[0].split('\t');
        let data = lines.slice(1).map(line => {
            let obj = {};
            let values = line.split('\t');
            this.headers.forEach((header, i) => {
                obj[header] = values[i];
            });
            return obj;
        });
        this.data = data;
        this.isLoaded = true;
    }

    static get(id: any) {
        if (typeof id === "number") id = `${id}`
        if (!this.isLoaded) {
            this.load();
        }
        return this.data.filter((d: any) => d["角色突破ID"] === id);
    }

    static getUnlockMaxLevel(id: any, promoteLevel: any) {
        let data = this.get(id).filter(x=>x["突破等级"] == promoteLevel)[0];

        return data[`解锁等级上限`];
    }

    static getAddProps(id: any, promoteLevel: any){

        let data = this.get(id).filter(x=>x["突破等级"] == promoteLevel)[0];

        //[增加属性]1类型
        //[增加属性]1值
        return range(1,4).map(x=>{
            let propType = data[`[增加属性]${x}类型`];
            let value = data[`[增加属性]${x}值`]||"0";
            return {propType, value}
        })
    }

    

}



export { ProudSkillData, GadgetData, AvatarData, AvatarSkillDepotData, AvatarTalentData, AvatarCurveData, AvatarSkillData, AvatarPromoteData}