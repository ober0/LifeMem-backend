import 'reflect-metadata';

const CONTAINS_KEY = Symbol('CONTAINS_KEY');

export function Contains(): PropertyDecorator {
    return (target, propertyKey) => {
        const existing: string[] = Reflect.getMetadata(CONTAINS_KEY, target.constructor) || [];
        Reflect.defineMetadata(CONTAINS_KEY, [...existing, propertyKey.toString()], target.constructor);
    };
}

export function isContains(target: object, propertyKey: string): boolean {
    const keys: string[] = Reflect.getMetadata(CONTAINS_KEY, target.constructor) || [];
    return keys.includes(propertyKey);
}
