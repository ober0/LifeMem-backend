import { LangEnum } from '../../../common/types/lang.enum';
import { translations } from '../../../common/translation/text-translations';

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
        subject: translations.byTextKey({ key: 'code-email.subject', lang: LangEnum.Ru }),
        title: translations.byTextKey({ key: 'code-email.title', lang: LangEnum.Ru }),
        message: translations.byTextKey({ key: 'code-email.message', lang: LangEnum.Ru }),
        tagline: translations.byTextKey({ key: 'code-email.tagline', lang: LangEnum.Ru }),
        expiresHint: translations.byTextKey({ key: 'code-email.expiresHint', lang: LangEnum.Ru }),
        textBody: translations.byTextKey({ key: 'code-email.textBody', lang: LangEnum.Ru })
    },
    [LangEnum.En]: {
        subject: translations.byTextKey({ key: 'code-email.subject', lang: LangEnum.En }),
        title: translations.byTextKey({ key: 'code-email.title', lang: LangEnum.En }),
        message: translations.byTextKey({ key: 'code-email.message', lang: LangEnum.En }),
        tagline: translations.byTextKey({ key: 'code-email.tagline', lang: LangEnum.En }),
        expiresHint: translations.byTextKey({ key: 'code-email.expiresHint', lang: LangEnum.En }),
        textBody: translations.byTextKey({ key: 'code-email.textBody', lang: LangEnum.En })
    }
};
