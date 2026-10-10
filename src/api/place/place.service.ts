import { Injectable } from '@nestjs/common';

import type { Actor } from '../../common/classes/actor';
import { cacheConstants, CacheKey } from '../../common/config/constants/cache.constants';
import { apiError } from '../../common/helpers/errors';
import { CacheService } from '../cache/cache.service';
import { DelayedWorkerService } from '../delayed-worker/delayed-worker.service';
import type { PlaceListResponseDto } from './dto/place.dto';
import type { PlaceListQueryDto } from './dto/place-list-query.dto';
import type { PlaceMapFiltersDto, PlaceMapRequestDto, PlaceMapResponseDto } from './dto/place-map.dto';
import { placeMapper } from './place.mapper';
import { PlaceRepository } from './place.repository';

@Injectable()
export class PlaceService {
    constructor(
        private readonly repository: PlaceRepository,
        private readonly cacheService: CacheService,
        private readonly delayedWorker: DelayedWorkerService
    ) {}

    async list(actor: Actor, dto: PlaceListQueryDto): Promise<PlaceListResponseDto> {
        const userId = actor.user.id;

        const [rows, count] = await Promise.all([
            this.repository.findMany(userId, dto),
            this.repository.count(userId, dto)
        ]);

        return {
            data: rows.map((place) => placeMapper.toDto(place)),
            count
        };
    }

    async map(actor: Actor, dto: PlaceMapRequestDto): Promise<PlaceMapResponseDto> {
        const rows = await this.repository.findForMap(actor.user.id, dto);

        return {
            data: rows.map((place) => placeMapper.toMapItem(place))
        };
    }

    async getMapFilters(actor: Actor): Promise<PlaceMapFiltersDto> {
        const userId = actor.user.id;
        const cached = await this.cacheService.getOrSet<CacheKey.PlaceMapFilters>(
            cacheConstants[CacheKey.PlaceMapFilters](userId),
            () => this.repository.getMapFilters(userId)
        );

        return cached ?? { countries: [], regions: [], cities: [] };
    }

    refreshMapFilters(userId: string): void {
        const config = cacheConstants[CacheKey.PlaceMapFilters](userId);

        this.delayedWorker.setImmediate(async () => {
            const filters = await this.repository.getMapFilters(userId);
            await this.cacheService.setInCache<CacheKey.PlaceMapFilters>(config, filters);
        });
    }

    async delete(actor: Actor, id: string): Promise<void> {
        const userId = actor.user.id;
        const deleted = await this.repository.deleteOwned(userId, id);

        if (!deleted) {
            throw apiError.notFound('place.not_found');
        }

        this.refreshMapFilters(userId);
    }
}
