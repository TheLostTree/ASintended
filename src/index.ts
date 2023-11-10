export class InvocationContext{
    private _globalValues: {[key: string]: any} = {};

    getGlobalValue(key: string){
        return this._globalValues[key];
    };
    setGlobalValue(key: string, value: any){
        this._globalValues[key] = value;
    };
    


}


