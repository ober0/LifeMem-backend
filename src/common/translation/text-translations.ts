import { Logger } from '@nestjs/common';

import type { TextsTranslationKey } from '../../translations/generated';
import { LangEnum } from '../types/common/lang.enum';
import { loadTextTranslations } from './translation.loader';

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
