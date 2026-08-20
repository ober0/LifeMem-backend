import { Injectable } from '@nestjs/common';
import type { ServiceSettings } from '@prisma/client';

import { appConstants } from '../../common/config/app.constants';
import { cacheConstants, CacheKey } from '../../common/config/constants/cache.constants';
import { apiError } from '../../common/helpers/errors';
import { CacheService } from '../cache/cache.service';
import { ServiceSettingsDto } from './dto/base.dto';
import type { ServiceSettingsJsonDto } from './dto/settings-json.dto';
import type { ServiceSettingsUpdateDto } from './dto/update.dto';
import { ServiceSettingsRepository } from './service-settings.repository';

@Injectable()
export class ServiceSettingsService {
    constructor(
        private readonly repository: ServiceSettingsRepository,
        private readonly cacheService: CacheService
    ) {}

    async getJsonForRequest(): Promise<ServiceSettingsJsonDto> {
        const data = await this.cacheService.getOrSet<CacheKey.ServiceSettings>(
            cacheConstants[CacheKey.ServiceSettings](),
            async () => {
                const row = await this.repository.get();
                return row ? this.toDto(row) : null;
            }
        );

        return data ? this.toJson(data) : { ...appConstants.serviceSettings.base };
    }

    async getServiceSettings(): Promise<ServiceSettingsDto> {
        const data = await this.cacheService.getOrSet<CacheKey.ServiceSettings>(
            cacheConstants[CacheKey.ServiceSettings](),
            async () => {
                const row = await this.repository.get();
                return row ? this.toDto(row) : null;
            }
        );

        if (!data) {
            throw apiError.notFound('service_settings.not_found');
        }

        return data;
    }

    async updateServiceSettings(dto: ServiceSettingsUpdateDto): Promise<ServiceSettingsJsonDto> {
        const current = await this.repository.get();

        if (!current) {
            const created = await this.repository.upsert({
                ...appConstants.serviceSettings.base,
                ...Object.fromEntries(Object.entries(dto).filter(([_, v]) => v !== undefined))
            });

            setImmediate(() => {
                this.cacheService.invalidateCache(cacheConstants[CacheKey.ServiceSettings]());
            });

            return created.json as unknown as ServiceSettingsJsonDto;
        }

        const currentJson = current.json as unknown as ServiceSettingsJsonDto;

        const merged: ServiceSettingsJsonDto = {
            ...currentJson,
            ...Object.fromEntries(Object.entries(dto).filter(([_, v]) => v !== undefined))
        };

        const updated = await this.repository.upsert(merged);

        setImmediate(() => {
            this.cacheService.invalidateCache(cacheConstants[CacheKey.ServiceSettings]());
        });

        return updated.json as unknown as ServiceSettingsJsonDto;
    }

    private toDto(data: ServiceSettings): ServiceSettingsDto {
        return {
            id: data.id,
            json: data.json,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt
        };
    }

    private toJson(data: ServiceSettingsDto): ServiceSettingsJsonDto {
        return (
            (data.json as unknown as ServiceSettingsJsonDto | null) ?? {
                ...appConstants.serviceSettings.base
            }
        );
    }
}
