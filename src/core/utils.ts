
export const delay = (time:number) => new Promise(res=>setTimeout(res,time));

export function validateNotNullUndefinedOrEmpty(key: string) {
    return (value: any) => {
        if (value === undefined || value === null || !value?.length) throw new Error(`${key} failed ${validateNotNullUndefinedOrEmpty.name}.`);
        return value;
    }
}

export function validateMinMax(key: string, min: number, max: number, isMandetory: boolean) {
    return (value: any) => {
        if (isMandetory) (validateNotNullUndefinedOrEmpty(key))(value);
        let length = value?.length || 0;
        if (length < min || length > max) throw new Error(`${key} failed ${validateMinMax.name}.`);
        return value;
    }
}