export const isPlainObject = (value: unknown): value is Record<string, unknown> =>
    value !== null && typeof value === 'object' && !Array.isArray(value);

export const deepMerge = <T>(current: T, patch: unknown): T => {
    if (patch === undefined) {
        return current;
    }

    if (Array.isArray(patch)) {
        return patch as T;
    }

    if (!isPlainObject(current) || !isPlainObject(patch)) {
        return patch as T;
    }

    const result: Record<string, unknown> = { ...current };

    for (const [key, value] of Object.entries(patch)) {
        if (value === undefined) {
            continue;
        }

        result[key] = deepMerge(result[key], value);
    }

    return result as T;
};
