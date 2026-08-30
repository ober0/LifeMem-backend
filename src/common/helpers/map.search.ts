import { DateMinMaxFilterDto, NumberMinMaxFilterDto } from '../types/search/min-max.filter.dto';
import { isContains } from './contains.decorator';

// Обходит дто, делает из него фильтры для призмы.
// Массивы айдишников должны иметь название как в бд с окончанием Ids,
// енамы и прочие константы должны иметь на себе декоратор Contains
// @filters исходное дто
// @modifiedPath измененная вложенность, например в фильтрах есть name, а в бд user: {name: any}}
// использовать { key: name, path: "user.name" }
// @excludedValues исключенные знаения
// @query поле поиска
// @queryFields массив полей по которым будет поиск, например name или users.some.name
export function mapSearch<T>(
    filters: T | undefined,
    modifiedPath: { key: keyof T; path: string }[] = [],
    excludedValues: (keyof T | string)[] = [],
    query?: string,
    queryFields: string[] = [],
    filterClass?: new () => T
): any {
    const mappedFilters: Record<string, any> = {};
    const containsMetaTarget = filterClass?.prototype ?? (filters as object | undefined);

    if (filters) {
        for (const [key, value] of Object.entries(filters)) {
            if (
                value === undefined ||
                value === null ||
                (typeof value === 'string' && value.trim() === '') ||
                (Array.isArray(value) && value.length === 0)
            ) {
                continue;
            }

            if (excludedValues.includes(key)) {
                continue;
            }

            let data: Record<string, any> = {};

            const exist = modifiedPath.find((item) => item.key === key);
            if (value instanceof NumberMinMaxFilterDto) {
                if (exist) {
                    data = exist.path
                        .split('.')
                        .reverse()
                        .reduce<Record<string, unknown>>((acc, key) => ({ [key]: acc }), {
                            gte: value.min ?? undefined,
                            lte: value.max ?? undefined
                        });
                } else {
                    mappedFilters[key] = {
                        gte: value.min ?? undefined,
                        lte: value.max ?? undefined
                    };
                }
            } else if (value instanceof DateMinMaxFilterDto) {
                if (exist) {
                    data = exist.path
                        .split('.')
                        .reverse()
                        .reduce<Record<string, unknown>>((acc, key) => ({ [key]: acc }), {
                            gte: value.from ?? undefined,
                            lte: value.to ?? undefined
                        });
                } else {
                    mappedFilters[key] = {
                        gte: value.from ?? undefined,
                        lte: value.to ?? undefined
                    };
                }
            } else if (
                (containsMetaTarget && isContains(containsMetaTarget, key)) ||
                key === 'id' ||
                key.endsWith('Id')
            ) {
                if (exist) {
                    data = exist.path
                        .split('.')
                        .reverse()
                        .reduce((acc, key) => ({ [key]: acc }), value) as Record<string, typeof value>;
                } else {
                    mappedFilters[key] = value;
                }
            } else if (key.endsWith('Ids') && Array.isArray(value)) {
                if (exist) {
                    data = exist.path
                        .split('.')
                        .reverse()
                        .reduce<Record<string, any>>((acc, key) => ({ [key]: acc }), {
                            in: value
                        });
                } else {
                    const newKey = key.slice(0, key.length - 1);
                    mappedFilters[newKey] = {
                        in: value
                    };
                }
            } else if (typeof value === 'string') {
                if (exist) {
                    data = exist.path
                        .split('.')
                        .reverse()
                        .reduce<Record<string, any>>((acc, key) => ({ [key]: acc }), {
                            contains: value.toLowerCase(),
                            mode: 'insensitive'
                        });
                } else {
                    mappedFilters[key] = { contains: value.toLowerCase(), mode: 'insensitive' };
                }
            } else {
                if (exist) {
                    data = exist.path
                        .split('.')
                        .reverse()
                        .reduce((acc, key) => ({ [key]: acc }), value) as Record<string, typeof value>;
                } else {
                    mappedFilters[key] = value;
                }
            }

            const dataKeys = Object.keys(data);
            if (dataKeys?.length) {
                const dataKey = dataKeys.at(0);
                if (dataKey) {
                    if (mappedFilters[dataKey]) {
                        Object.assign(mappedFilters[dataKey], data[dataKey]);
                    } else {
                        mappedFilters[dataKey] = data[dataKey];
                    }
                }
            }
        }
    }
    const andConditions: any[] = [];

    if (Object.keys(mappedFilters).length > 0) {
        andConditions.push(mappedFilters);
    }

    if (query && queryFields.length > 0) {
        const queryConditions: Record<string, any>[] = [];

        queryFields.forEach((fieldPath) => {
            const field = fieldPath.split('.').pop()!;

            const value =
                containsMetaTarget && isContains(containsMetaTarget, field)
                    ? query
                    : {
                          contains: query.toLowerCase(),
                          mode: 'insensitive'
                      };

            const condition = fieldPath
                .split('.')
                .reverse()
                .reduce((acc: any, key: string) => ({ [key]: acc }), value);

            queryConditions.push(condition);
        });

        andConditions.push({
            OR: queryConditions
        });
    }
    return andConditions.length > 0 ? { AND: andConditions } : {};
}
