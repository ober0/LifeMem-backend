import { LangEnum } from '../../../common/types/lang.enum';
import { translateText } from '../../../common/translation/text-translations';

export type CodeEmailTranslation = {
    subject: string;
    title: string;
    message: string;
    tagline: string;
    expiresHint: string;
    textBody: string;
};

export const CODE_EMAIL_TRANSLATIONS: Record<LangEnum, CodeEmailTranslation> = {
    [LangEnum.Ru]: {
        subject: translateText('code-email.subject', LangEnum.Ru),
        title: translateText('code-email.title', LangEnum.Ru),
        message: translateText('code-email.message', LangEnum.Ru),
        tagline: translateText('code-email.tagline', LangEnum.Ru),
        expiresHint: translateText('code-email.expiresHint', LangEnum.Ru),
        textBody: translateText('code-email.textBody', LangEnum.Ru)
    },
    [LangEnum.En]: {
        subject: translateText('code-email.subject', LangEnum.En),
        title: translateText('code-email.title', LangEnum.En),
        message: translateText('code-email.message', LangEnum.En),
        tagline: translateText('code-email.tagline', LangEnum.En),
        expiresHint: translateText('code-email.expiresHint', LangEnum.En),
        textBody: translateText('code-email.textBody', LangEnum.En)
    }
};
