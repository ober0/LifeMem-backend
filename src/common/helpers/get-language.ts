import { Request } from 'express';

export type SupportedLanguage = 'en' | 'ru';

export function getLanguageFromRequest(request: Request, fallback: SupportedLanguage = 'en'): SupportedLanguage {
    const header =
        typeof request.headers['accept-language'] === 'string'
            ? (request.headers['accept-language'] as string)
            : Array.isArray(request.headers['accept-language'])
              ? request.headers['accept-language']?.[0]
              : undefined;

    if (!header) {
        return fallback;
    }

    const normalized = header.split(',')[0].trim().toLowerCase();
    return normalized === 'ru' ? 'ru' : fallback;
}
