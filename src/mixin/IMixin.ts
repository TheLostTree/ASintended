export interface IMixin {
    apply(context:any, openConfig:string, params: string[]):void;
}