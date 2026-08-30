import { createHash } from 'crypto';

function sortKeysDeep(value: unknown): unknown {
    if (Array.isArray(value)) {
        return value.map(sortKeysDeep);
    }

    if (value && typeof value === 'object' && !(value instanceof Date)) {
        return Object.keys(value as Record<string, unknown>)
            .sort((a, b) => a.localeCompare(b))
            .reduce<Record<string, unknown>>((acc, key) => {
                acc[key] = sortKeysDeep((value as Record<string, unknown>)[key]);
                return acc;
            }, {});
    }

    return value;
}

export function generateObjectHash(value: unknown): string {
    const normalized = JSON.stringify(sortKeysDeep(value));

    return createHash('sha256').update(normalized).digest('hex');
}
