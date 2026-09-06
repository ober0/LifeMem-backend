import { aiConstants } from './constants/ai.constants';
import { cacheConstants } from './constants/cache.constants';
import { codeConstants } from './constants/code.constants';
import { embeddingConstants } from './constants/embedding.constants';
import { entryConstants } from './constants/entry.constants';
import { languageConstants } from './constants/language.constants';
import { localEmbeddingConstants } from './constants/local-embedding.constants';
import { phoneConstants } from './constants/phone.constants';
import { serviceSettingsConstants } from './constants/service-settings.constants';
import { telegramConstants } from './constants/telegram.constants';
import { throttleConstants } from './constants/throttle.constants';
import { userConstants } from './constants/user.constants';
import { userSettingsConstants } from './constants/user-settings.constants';

export const appConstants = {
    code: codeConstants,
    entry: entryConstants,
    language: languageConstants,
    user: userConstants,
    userSettings: userSettingsConstants,
    serviceSettings: serviceSettingsConstants,
    phone: phoneConstants,
    throttle: throttleConstants,
    cache: cacheConstants,
    telegram: telegramConstants,
    ai: aiConstants,
    localEmbedding: localEmbeddingConstants,
    embedding: embeddingConstants
} as const;
