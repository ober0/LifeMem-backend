import { Injectable } from '@nestjs/common';
import { ModelType, type ServiceSettings } from '@prisma/client';

import { appConstants } from '../../common/config/app.constants';
import { cacheConstants, CacheKey } from '../../common/config/constants/cache.constants';
import { deepMerge } from '../../common/helpers/deep-merge';
import { apiError } from '../../common/helpers/errors';
import { AiModelService } from '../ai-model/ai-model.service';
import { CacheService } from '../cache/cache.service';
import { DelayedWorkerService } from '../delayed-worker/delayed-worker.service';
import { ServiceSettingsDto } from './dto/base.dto';
import type { ModelsSettingsDto, ServiceSettingsJsonDto } from './dto/settings-json.dto';
import type { ServiceSettingsUpdateDto } from './dto/update.dto';
import { ServiceSettingsRepository } from './service-settings.repository';

type ModelSettingSlot = {
    id: string | null;
    expectedType: ModelType;
    slot: string;
};

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
        const base = current
            ? deepMerge({ ...appConstants.serviceSettings.base }, current.json as unknown as ServiceSettingsJsonDto)
            : { ...appConstants.serviceSettings.base };

        const merged = deepMerge(base, dto);
        await this.validateModelsSettings(merged.models);

        const updated = await this.repository.upsert(merged);

        this.delayedWorker.setImmediate(() =>
            this.cacheService.invalidateCache(cacheConstants[CacheKey.ServiceSettings]())
        );

        return updated.json as unknown as ServiceSettingsJsonDto;
    }

    private async validateModelsSettings(models: ModelsSettingsDto): Promise<void> {
        const slots: ModelSettingSlot[] = [
            { id: models.analyze.premium, expectedType: ModelType.TextToText, slot: 'models.analyze.premium' },
            { id: models.analyze.lite, expectedType: ModelType.TextToText, slot: 'models.analyze.lite' },
            { id: models.embedding.premium, expectedType: ModelType.Embedding, slot: 'models.embedding.premium' },
            { id: models.embedding.lite, expectedType: ModelType.Embedding, slot: 'models.embedding.lite' }
        ];

        const ids = [...new Set(slots.map((item) => item.id).filter((id) => id !== null))];
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
        return (
            (data.json as unknown as ServiceSettingsJsonDto | null) ?? {
                ...appConstants.serviceSettings.base
            }
        );
    }
}
