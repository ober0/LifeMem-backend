import { join } from 'path';
import { readdirSync, readFileSync } from 'fs';

export function getTranslationsPath(): string {
    return process.env.NODE_ENV === 'production'
        ? join(process.cwd(), 'dist', 'translations')
        : join(process.cwd(), 'src', 'translations');
}

export function loadTranslations(): Record<string, unknown> {
    const translationsPath = getTranslationsPath();
    const entries = readdirSync(translationsPath, { withFileTypes: true });

    return entries.reduce<Record<string, unknown>>((acc, entry) => {
        if (!entry.isFile() || !entry.name.endsWith('.json')) {
            return acc;
        }

        const name = entry.name.split('.json')[0];

        try {
            const content = JSON.parse(readFileSync(join(translationsPath, entry.name), 'utf-8'));
            return mergeDeep(acc, content, name);
        } catch {
            return acc;
        }
    }, {});
}

function mergeDeep(
    target: Record<string, unknown>,
    source: Record<string, unknown>,
    name: string
): Record<string, unknown> {
    const result = { ...target };

    for (const key of Object.keys(source)) {
        if (
            typeof source[key] === 'object' &&
            source[key] !== null &&
            !Array.isArray(source[key]) &&
            typeof result[`error.${name}.${key}`] === 'object' &&
            result[`error.${name}.${key}`] !== null
        ) {
            result[`error.${name}.${key}`] = mergeDeep(
                result[key] as Record<string, unknown>,
                source[key] as Record<string, unknown>,
                name
            );
        } else {
            result[`error.${name}.${key}`] = source[key];
        }
    }

    return result;
}
