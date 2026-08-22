import { cacheConstants } from './constants/cache.constants';
import { codeConstants } from './constants/code.constants';
import { languageConstants } from './constants/language.constants';
import { phoneConstants } from './constants/phone.constants';
import { serviceSettingsConstants } from './constants/service-settings.constants';
import { throttleConstants } from './constants/throttle.constants';
import { userConstants } from './constants/user.constants';
import { userSettingsConstants } from './constants/user-settings.constants';

export const appConstants = {
    code: codeConstants,
    language: languageConstants,
    user: userConstants,
    userSettings: userSettingsConstants,
    serviceSettings: serviceSettingsConstants,
    phone: phoneConstants,
    throttle: throttleConstants,
    cache: cacheConstants
} as const;
