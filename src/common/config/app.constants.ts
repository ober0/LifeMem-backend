import { codeConstants } from './constants/code.constants';
import { languageConstants } from './constants/language.constants';
import { phoneConstants } from './constants/phone.constants';
import { serviceSettingsConstants } from './constants/service-settings.constants';
import { userSettingsConstants } from './constants/user-settings.constants';

export const appConstants = {
    code: codeConstants,
    language: languageConstants,
    userSettings: userSettingsConstants,
    serviceSettings: serviceSettingsConstants,
    phone: phoneConstants
} as const;
