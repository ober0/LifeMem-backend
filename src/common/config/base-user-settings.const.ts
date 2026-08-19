import { LangEnum } from '../types/common/lang.enum';
import type { UserSettingsDto } from '../types/user';

export const BASE_USER_SETTINGS: UserSettingsDto = {
    enableNotification: true,
    lang: LangEnum.Ru
};
