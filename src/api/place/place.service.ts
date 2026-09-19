import { Injectable } from '@nestjs/common';

import type { Actor } from '../../common/classes/actor';
import { apiError } from '../../common/helpers/errors';
import type { PlaceListResponseDto } from './dto/place.dto';
import type { PlaceListQueryDto } from './dto/place-list-query.dto';
import { placeMapper } from './place.mapper';
import { PlaceRepository } from './place.repository';

@Injectable()
export class PlaceService {
    constructor(private readonly repository: PlaceRepository) {}

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

    async delete(actor: Actor, id: string): Promise<void> {
        const userId = actor.user.id;
        const deleted = await this.repository.deleteOwned(userId, id);

        if (!deleted) {
            throw apiError.notFound('place.not_found');
        }
    }
}
