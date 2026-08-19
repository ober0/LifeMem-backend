import { LangEnum } from '../../types/common/lang.enum';
import type { UserSettingsDto } from '../../types/user';

export const userSettingsConstants = {
    base: {
        enableNotification: true,
        lang: LangEnum.Ru
    } satisfies UserSettingsDto
} as const;
