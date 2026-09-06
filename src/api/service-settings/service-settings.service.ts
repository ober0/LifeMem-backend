import { Injectable } from '@nestjs/common';
import type { ServiceSettings } from '@prisma/client';

import { Actor } from '../../common/classes/actor';
import { appConstants } from '../../common/config/app.constants';
import { cacheConstants, CacheKey } from '../../common/config/constants/cache.constants';
import { Permission } from '../../common/config/role-permission';
import { deepMerge } from '../../common/helpers/deep-merge';
import { apiError } from '../../common/helpers/errors';
import { collectUniqueModelsSettingsIds, getModelsSettingsSlots } from '../../common/helpers/models-settings';
import { AiModelService } from '../ai-model/ai-model.service';
import { CacheService } from '../cache/cache.service';
import { DelayedJob } from '../delayed-worker/delayed-worker.constants';
import { DelayedWorkerService } from '../delayed-worker/delayed-worker.service';
import { ServiceSettingsDto } from './dto/base.dto';
import type { ModelsSettingsDto, ServiceSettingsJsonDto } from './dto/settings-json.dto';
import type { ServiceSettingsUpdateDto } from './dto/update.dto';
import { ServiceSettingsRepository } from './service-settings.repository';

@Injectable()
export class ServiceSettingsService {
    constructor(
        private readonly repository: ServiceSettingsRepository,
        private readonly cacheService: CacheService,
        private readonly delayedWorker: DelayedWorkerService,
        private readonly aiModelService: AiModelService
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

    async getServiceSettings(actor: Actor) {
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

        if (actor.hasPermission(Permission.ServiceSettingsGetFull)) {
            return {
                ...data,
                json: this.toJson(data)
            };
        }

        const { authMethods, appVersion } = this.toJson(data);
        return {
            json: {
                authMethods,
                appVersion
            }
        };
    }

    async updateServiceSettings(dto: ServiceSettingsUpdateDto): Promise<ServiceSettingsJsonDto> {
        const current = await this.repository.get();
        const base = current
            ? deepMerge({ ...appConstants.serviceSettings.base }, current.json as unknown as ServiceSettingsJsonDto)
            : { ...appConstants.serviceSettings.base };

        const merged = deepMerge(base, dto);
        await this.validateModelsSettings(merged.models);

        const updated = await this.repository.upsert(merged);

        this.delayedWorker.setImmediate(async () => {
            await this.cacheService.invalidateCache(cacheConstants[CacheKey.ServiceSettings]());

            if (dto.models?.provider) {
                await this.delayedWorker.delayed(DelayedJob.AiRefreshModels, {}, { queue: 'ai' });
            } else if (
                dto.models?.analyze ||
                dto.models?.embedding ||
                dto.models?.vision ||
                dto.models?.stt ||
                dto.models?.sttRefine
            ) {
                await this.delayedWorker.delayed(DelayedJob.AiAddModels, {}, { queue: 'ai' });
            }
        });

        return this.toJson(this.toDto(updated));
    }

    private async validateModelsSettings(models: ModelsSettingsDto): Promise<void> {
        const slots = getModelsSettingsSlots(models);
        const ids = collectUniqueModelsSettingsIds(models);
        if (ids.length === 0) {
            return;
        }

        const found = await this.aiModelService.findByIds(ids);
        const byId = new Map(found.map((model) => [model.id, model]));

        for (const slot of slots) {
            if (!slot.id) {
                continue;
            }

            const model = byId.get(slot.id);
            if (!model) {
                throw apiError.badRequest('service_settings.model_not_found');
            }

            if (model.type !== slot.expectedType) {
                throw apiError.badRequest('service_settings.model_wrong_type', {
                    name: model.name,
                    slot: slot.slot
                });
            }

            if (!model.isActive) {
                throw apiError.badRequest('service_settings.model_inactive', {
                    name: model.name
                });
            }
        }
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
        return deepMerge(
            { ...appConstants.serviceSettings.base },
            (data.json as unknown as ServiceSettingsJsonDto) ?? {}
        );
    }
}
