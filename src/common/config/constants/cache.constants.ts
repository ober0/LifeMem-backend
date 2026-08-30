import { AiModelSearchResponseDto } from '../../../api/ai-model/dto/base.dto';
import { AiModelSearchDto } from '../../../api/ai-model/dto/search.dto';
import { ServiceSettingsDto } from '../../../api/service-settings/dto/base.dto';
import { generateObjectHash } from '../../helpers/generate-object-hash';

export enum CacheKey {
    ServiceSettings = 'serviceSettings',
    AiModelsSearch = 'aiModelsSearch'
}

export enum CacheTtl {
    Minute = 60 * 1000,
    FifteenMinute = 15 * 60 * 1000,
    OneHour = 60 * 60 * 1000,
    SixHour = 6 * 60 * 60 * 1000,
    Day = 24 * 60 * 60 * 1000,
    Week = 7 * 24 * 60 * 60 * 1000
}

export type CacheTypes = {
    [CacheKey.ServiceSettings]: ServiceSettingsDto;
    [CacheKey.AiModelsSearch]: AiModelSearchResponseDto;
};

export type CacheConfig = {
    ttl?: number;
    key: string;
};

export type CacheConstants = {
    [K in CacheKey]: (...params: any[]) => CacheConfig;
};

export const AI_MODELS_CACHE_KEY_PREFIX = 'ai-models';
export const AI_MODELS_CACHE_PATTERN = `${AI_MODELS_CACHE_KEY_PREFIX}:*`;

export const cacheConstants: CacheConstants = {
    [CacheKey.ServiceSettings]: () => ({
        key: 'service-settings'
    }),
    [CacheKey.AiModelsSearch]: (dto: AiModelSearchDto) => ({
        key: `${AI_MODELS_CACHE_KEY_PREFIX}:${generateObjectHash(dto)}`
    })
};
