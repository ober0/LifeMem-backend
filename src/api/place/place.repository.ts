import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';

import { mapPagination } from '../../common/helpers/map.pagination';
import { mapSearch } from '../../common/helpers/map.search';
import { PrismaService } from '../prisma/prisma.service';
import type { PlaceListQueryDto } from './dto/place-list-query.dto';

const placeSelect = {
    id: true,
    name: true,
    fullName: true,
    latitude: true,
    longitude: true,
    autodetected: true,
    createdAt: true,
    updatedAt: true
};

@Injectable()
export class PlaceRepository {
    constructor(private readonly prisma: PrismaService) {}

    private buildWhere(userId: string, dto: PlaceListQueryDto): Prisma.PlaceWhereInput {
        const search = mapSearch(undefined, [], [], dto.query, ['name', 'fullName']);

        return {
            userId,
            ...search
        };
    }

    async findMany(userId: string, dto: PlaceListQueryDto) {
        return this.prisma.place.findMany({
            where: this.buildWhere(userId, dto),
            select: placeSelect,
            orderBy: { createdAt: 'desc' },
            ...mapPagination({
                page: dto.page ?? 1,
                count: dto.count ?? 10
            })
        });
    }

    async count(userId: string, dto: PlaceListQueryDto): Promise<number> {
        return this.prisma.place.count({
            where: this.buildWhere(userId, dto)
        });
    }

    async deleteOwned(userId: string, id: string): Promise<boolean> {
        const result = await this.prisma.place.deleteMany({
            where: { id, userId }
        });

        return result.count > 0;
    }
}
