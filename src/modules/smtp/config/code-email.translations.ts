import { LangEnum } from '../../../common/types/lang.enum';

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
        subject: 'Код подтверждения - LifeMem',
        title: 'Ваш код подтверждения',
        message: 'Введите этот код в приложении LifeMem, чтобы продолжить.',
        tagline: 'Твои воспоминания - в одном месте',
        expiresHint:
            'Код действует {{EXPIRES_MINUTES}} мин. Если вы не запрашивали письмо - просто проигнорируйте его.',
        textBody: '{{TITLE}}\n\nКод: {{CODE}}\n\nДействует {{EXPIRES_MINUTES}} мин.'
    },
    [LangEnum.En]: {
        subject: 'Verification code - LifeMem',
        title: 'Your verification code',
        message: 'Enter this code in the LifeMem app to continue.',
        tagline: 'Your memories - in one place',
        expiresHint:
            'This code is valid for {{EXPIRES_MINUTES}} min. If you did not request this email, you can ignore it.',
        textBody: '{{TITLE}}\n\nCode: {{CODE}}\n\nValid for {{EXPIRES_MINUTES}} min.'
    }
};
