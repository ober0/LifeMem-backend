import type { ErrorsTranslationKey } from '../../translations/generated';
import { appConstants } from '../config/app.constants';
import type { ErrorVariables } from '../helpers/errors';
import { LangEnum } from '../types/common/lang.enum';
import { loadErrorTranslations } from './translation.loader';

type ErrorEntry = Partial<Record<LangEnum, string>>;

const ERROR_TRANSLATIONS = loadErrorTranslations() as Record<string, ErrorEntry>;

export const errorTranslations = {
    hasKey(code: string): boolean {
        return code in ERROR_TRANSLATIONS;
    },

    byCode({
        code,
        lang = appConstants.language.defaultErrors,
        variables,
        fallback
    }: {
        code: string;
        lang?: LangEnum;
        variables?: ErrorVariables;
        fallback?: string;
    }): string {
        let text = ERROR_TRANSLATIONS[code]?.[lang] ?? ERROR_TRANSLATIONS[code]?.[appConstants.language.defaultErrors];

        if (!text) {
            return fallback ?? code;
        }

        if (variables) {
            for (const [name, value] of Object.entries(variables)) {
                text = text.replaceAll(`{{${name}}}`, String(value));
            }
        }

        return text;
    },

    byErrorKey({
        key,
        lang = appConstants.language.defaultErrors,
        variables
    }: {
        key: ErrorsTranslationKey;
        lang?: LangEnum;
        variables?: ErrorVariables;
    }): string {
        return this.byCode({ code: key, lang, variables, fallback: key });
    }
};
