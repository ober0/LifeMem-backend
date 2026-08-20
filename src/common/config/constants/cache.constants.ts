import { ServiceSettingsDto } from '../../../modules/service-settings/dto/base.dto';

export enum CacheKey {
    ServiceSettings = 'serviceSettings'
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
};

export type CacheConfig = {
    ttl?: number;
    key: string;
};

export type CacheConstants = {
    [K in CacheKey]: (...params: any[]) => CacheConfig;
};

export const cacheConstants: CacheConstants = {
    [CacheKey.ServiceSettings]: () => ({
        key: 'service-settings'
    })
};
