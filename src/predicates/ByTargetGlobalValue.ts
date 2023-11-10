import { InvocationContext } from "..";

export function apply(predicate: ByTargetGlobalValue, context:InvocationContext){
    let target = predicate.target;

    let value = context.getGlobalValue(predicate.key);

    switch (predicate.compareType) {
        case "Equal":
            return value === target;
        case "MoreThan":
            return value > target;
        case "LessAndEqual":
            return value <= target;

        // case "Between":

        case "MoreThanAndEqual":
            return value >= target;
        case "NoneOrEqual":
            if(target === undefined || target === null) return true;
            if(value === undefined || value === null) return true;
            return value === target;
        default:
    }
}


type ByTargetGlobalValue = {
    compareType: keyof typeof RelationType;
    target: string;
    key: string;
    value: string;
    forceByCaster: boolean;
}
enum RelationType{
    Equal = 0,
	MoreThan = 1,
	LessAndEqual = 2,
	Between = 3,
	MoreThanAndEqual = 4,
	NoneOrEqual = 5,
}



