import 'reflect-metadata';

const CONTAINS_KEY = Symbol('CONTAINS_KEY');

export function Contains(): PropertyDecorator {
    return (target, propertyKey) => {
        const key = propertyKey.toString();
        const metaTargets: object[] = [target];
        if (typeof (target as { constructor?: unknown }).constructor === 'function') {
            metaTargets.push((target as { constructor: object }).constructor);
        }

        for (const metaTarget of metaTargets) {
            const existing: string[] = Reflect.getMetadata(CONTAINS_KEY, metaTarget) || [];
            if (!existing.includes(key)) {
                Reflect.defineMetadata(CONTAINS_KEY, [...existing, key], metaTarget);
            }
        }
    };
}

export function isContains(target: object, propertyKey: string): boolean {
    const seen = new Set<object>();
    let current: object | null = target;

    while (current && current !== Object.prototype && !seen.has(current)) {
        seen.add(current);

        const onTarget: string[] = Reflect.getMetadata(CONTAINS_KEY, current) || [];
        if (onTarget.includes(propertyKey)) {
            return true;
        }

        const ctor = (current as { constructor?: object }).constructor;
        if (ctor && typeof ctor === 'function') {
            const onCtor: string[] = Reflect.getMetadata(CONTAINS_KEY, ctor) || [];
            if (onCtor.includes(propertyKey)) {
                return true;
            }
        }

        current = Object.getPrototypeOf(current);
    }

    return false;
}
