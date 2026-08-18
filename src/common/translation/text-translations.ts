import { LangEnum } from '../types/lang.enum';
import { loadTextTranslations } from './translation.loader';
import { Logger } from '@nestjs/common';
import { TextsTranslationKey } from '../../translations/generated';

type TextEntry = Record<LangEnum, string>;

export const TEXT_TRANSLATIONS = loadTextTranslations() as Record<string, TextEntry>;

export const translations = {
    byTextKey: ({
        key,
        lang = LangEnum.En,
        variables
    }: {
        key: TextsTranslationKey;
        lang?: LangEnum;
        variables?: Record<string, string | number>;
    }) => {
        let text = TEXT_TRANSLATIONS[key]?.[lang];

        if (!text) {
            Logger.error(`Нету перевода "${key}" для "${lang}"`);
            return '';
        }

        if (variables) {
            Object.entries(variables).forEach(([key, value]) => {
                text = text.replaceAll(`{{${key}}}`, String(value));
            });
        }

        return text;
    }
};
