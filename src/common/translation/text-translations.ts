import { LangEnum } from '../types/lang.enum';
import { loadTextTranslations } from './translation.loader';
import { Logger } from '@nestjs/common';

type TextEntry = Record<LangEnum, string>;

export const TEXT_TRANSLATIONS = loadTextTranslations() as Record<string, TextEntry>;

export function translateText(key: string, lang: LangEnum): string {
    const text = TEXT_TRANSLATIONS[key]?.[lang];

    if (!text) {
        Logger.error(`Нету перевода "${key}" для "${lang}"`);
        return '';
    }

    return text;
}
