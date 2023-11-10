export class Serialized{
    $type = "Base";
    fromJson(json: unknown): void {
        if(!isSerializable(json))return;
        if(json.$type !== this.$type){
            throw new Error(`Cannot deserialize ${json.$type} to ${this.$type}`);
        }
    }
}

export function isSerializable(obj: any): obj is Serialized{
    return (obj as Serialized).$type !== undefined;
}