export interface IModifier {
    apply(context:any, openConfig:string, params: string[]):void;
}