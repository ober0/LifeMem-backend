import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { mapPagination } from '../../common/helpers/map.pagination';
import { mapSearch } from '../../common/helpers/map.search';
import type { NumberMinMaxFilterDto } from '../../common/types/search/min-max.filter.dto';
import { PrismaService } from '../prisma/prisma.service';
import { placeMapSelect, placeSelect } from './consts/include.prisma';
import type { PlaceListQueryDto } from './dto/place-list-query.dto';
import type { PlaceMapFiltersDto, PlaceMapRequestDto } from './dto/place-map.dto';
import type { CountryFilterRow, ValueFilterRow } from './types';

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

    async findForMap(userId: string, dto: PlaceMapRequestDto) {
        return this.prisma.place.findMany({
            where: this.buildMapWhere(userId, dto),
            select: placeMapSelect,
            orderBy: { name: 'asc' }
        });
    }

    async getMapFilters(userId: string): Promise<PlaceMapFiltersDto> {
        // distinct on: у одного кода страны имя может отличаться, если места создавались на разных языках
        const [countries, regions, cities] = await Promise.all([
            this.prisma.$queryRaw<CountryFilterRow[]>(Prisma.sql`
                SELECT DISTINCT ON (code) code, name
                FROM (
                    SELECT
                        data->'country'->>'code' AS code,
                        data->'country'->>'name' AS name
                    FROM place
                    WHERE user_id = ${userId}::uuid
                      AND NULLIF(data->'country'->>'code', '') IS NOT NULL
                      AND NULLIF(data->'country'->>'name', '') IS NOT NULL
                ) countries
                ORDER BY code, name
            `),
            this.prisma.$queryRaw<ValueFilterRow[]>(Prisma.sql`
                SELECT DISTINCT data->>'region' AS value
                FROM place
                WHERE user_id = ${userId}::uuid
                  AND NULLIF(data->>'region', '') IS NOT NULL
                ORDER BY value
            `),
            this.prisma.$queryRaw<ValueFilterRow[]>(Prisma.sql`
                SELECT DISTINCT data->>'city' AS value
                FROM place
                WHERE user_id = ${userId}::uuid
                  AND NULLIF(data->>'city', '') IS NOT NULL
                ORDER BY value
            `)
        ]);

        return {
            countries,
            regions: regions.map((row) => row.value),
            cities: cities.map((row) => row.value)
        };
    }

    private buildMapWhere(userId: string, dto: PlaceMapRequestDto): Prisma.PlaceWhereInput {
        const and: Prisma.PlaceWhereInput[] = [];

        const countries = this.jsonEqualsAny(['country', 'code'], dto.countries, true);
        const regions = this.jsonEqualsAny(['region'], dto.regions);
        const cities = this.jsonEqualsAny(['city'], dto.cities);

        if (countries) {
            and.push(countries);
        }
        if (regions) {
            and.push(regions);
        }
        if (cities) {
            and.push(cities);
        }

        return {
            userId,
            latitude: this.coordRange(dto.latitude),
            longitude: this.coordRange(dto.longitude),
            ...(and.length > 0 && { AND: and })
        };
    }

    private coordRange(range?: NumberMinMaxFilterDto): Prisma.DecimalNullableFilter<'Place'> {
        return {
            not: null,
            ...(range?.min !== undefined && { gte: range.min }),
            ...(range?.max !== undefined && { lte: range.max })
        };
    }

    // у prisma нет in по json path, поэтому каждое значение отдельным equals
    private jsonEqualsAny(
        path: string[],
        values: string[] | undefined,
        lowerCase = false
    ): Prisma.PlaceWhereInput | undefined {
        if (!values) {
            return undefined;
        }

        const normalized = [
            ...new Set(
                (values ?? [])
                    .map((item) => {
                        const trimmed = item.trim();
                        return lowerCase ? trimmed.toLowerCase() : trimmed;
                    })
                    .filter(Boolean)
            )
        ];

        if (normalized.length === 0) {
            return undefined;
        }

        return {
            OR: normalized.map((value) => ({
                data: {
                    path,
                    equals: value
                }
            }))
        };
    }

    async deleteOwned(userId: string, id: string): Promise<boolean> {
        const result = await this.prisma.place.deleteMany({
            where: { id, userId }
        });

        return result.count > 0;
    }
}
