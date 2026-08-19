import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';

import { appConfig } from '../config/env';

export function getTranslationsPath(): string {
    const app = appConfig();
    return app.isProduction ? join(process.cwd(), 'dist', 'translations') : join(process.cwd(), 'src', 'translations');
}

export function loadErrorTranslations(): Record<string, unknown> {
    const translationsPath = join(getTranslationsPath(), 'errors');
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

export function loadTextTranslations(): Record<string, unknown> {
    const translationsPath = join(getTranslationsPath(), 'texts');
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
    prefix: string
): Record<string, unknown> {
    const result = { ...target };

    for (const key of Object.keys(source)) {
        const fullKey = `${prefix}.${key}`;

        if (
            typeof source[key] === 'object' &&
            source[key] !== null &&
            !Array.isArray(source[key]) &&
            typeof result[fullKey] === 'object' &&
            result[fullKey] !== null
        ) {
            result[fullKey] = mergeDeep(
                result[fullKey] as Record<string, unknown>,
                source[key] as Record<string, unknown>,
                fullKey
            );
        } else {
            result[fullKey] = source[key];
        }
    }

    return result;
}
