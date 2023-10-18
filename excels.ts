
import { getFile } from ".";


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
        let props = [];
        let add0t = data[`addProps0PropType`];
        let add0v = data[`addProps0Value`];
        let add1t = data[`addProps1PropType`];
        let add1v = data[`addProps1Value`];
        props.push({ propType: add0t, value: add0v });
        props.push({ propType: add1t, value: add1v });
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



export { ProudSkillData, GadgetData, AvatarData, AvatarSkillDepotData }