import { Injectable } from '@nestjs/common';

import type { ServerSettings } from '../../common/classes/server-settings';
import { AI_MODELS_CACHE_PATTERN, cacheConstants, CacheKey } from '../../common/config/constants/cache.constants';
import { apiError } from '../../common/helpers/errors';
import { CacheService } from '../cache/cache.service';
import { DelayedWorkerService } from '../delayed-worker/delayed-worker.service';
import { AiModelRepository } from './ai-model.repository';
import type { AiModelDto, AiModelSearchResponseDto } from './dto/base.dto';
import type { AiModelSearchDto } from './dto/search.dto';
import type { AiModelUpdateDto } from './dto/update.dto';

@Injectable()
export class AiModelService {
    constructor(
        private readonly repository: AiModelRepository,
        private readonly cacheService: CacheService,
        private readonly delayedWorker: DelayedWorkerService
    ) {}

    async search(dto: AiModelSearchDto): Promise<AiModelSearchResponseDto> {
        const result = await this.cacheService.getOrSet<CacheKey.AiModelsSearch>(
            cacheConstants[CacheKey.AiModelsSearch](dto),
            async () => {
                const [data, count] = await Promise.all([this.repository.search(dto), this.repository.count(dto)]);

                return { data, count };
            }
        );

        return result ?? { data: [], count: 0 };
    }

    async findByIds(ids: string[]) {
        return this.repository.findByIds(ids);
    }

    async update(id: string, dto: AiModelUpdateDto, serverSettings: ServerSettings): Promise<AiModelDto> {
        const existing = await this.repository.findById(id);

        if (!existing) {
            throw apiError.notFound('ai_model.not_found');
        }

        if (!dto.isActive && existing.isActive) {
            const models = serverSettings.json.models;
            const usedIds = [
                models?.analyze?.premium,
                models?.analyze?.lite,
                models?.embedding?.premium,
                models?.embedding?.lite
            ].filter((modelId): modelId is string => typeof modelId === 'string' && modelId.length > 0);

            if (usedIds.includes(id)) {
                throw apiError.conflict('ai_model.in_use_in_settings');
            }
        }

        const updated = await this.repository.updateIsActive(id, dto.isActive);

        this.delayedWorker.setImmediate(() => this.cacheService.invalidateByPattern(AI_MODELS_CACHE_PATTERN));

        return updated;
    }
}
