export const TEXT_TRANSLATIONS: Record<string, unknown> = {};

export function setTextTranslations(translations: Record<string, unknown>): void {
    Object.assign(TEXT_TRANSLATIONS, translations);
}

export function translateText(key: keyof typeof TEXT_TRANSLATIONS) {
    return TEXT_TRANSLATIONS[key];
}
