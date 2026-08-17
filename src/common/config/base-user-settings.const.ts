import { UserSettingsDto } from '../types/user';
import { LangEnum } from '../types/lang.enum';

export const BASE_USER_SETTINGS: UserSettingsDto = {
    enableNotification: true,
    lang: LangEnum.Ru
};
