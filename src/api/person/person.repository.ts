import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';

import { mapPagination } from '../../common/helpers/map.pagination';
import { mapSearch } from '../../common/helpers/map.search';
import { PrismaService } from '../prisma/prisma.service';
import type { PersonListQueryDto } from './dto/person-list-query.dto';

const personSelect = {
    id: true,
    name: true,
    autodetected: true,
    createdAt: true,
    updatedAt: true
};

@Injectable()
export class PersonRepository {
    constructor(private readonly prisma: PrismaService) {}

    private buildWhere(userId: string, dto: PersonListQueryDto): Prisma.PersonWhereInput {
        const search = mapSearch(undefined, [], [], dto.query, ['name']);

        return {
            userId,
            ...search
        };
    }

    async findMany(userId: string, dto: PersonListQueryDto) {
        return this.prisma.person.findMany({
            where: this.buildWhere(userId, dto),
            select: personSelect,
            orderBy: { createdAt: 'desc' },
            ...mapPagination({
                page: dto.page ?? 1,
                count: dto.count ?? 25
            })
        });
    }

    async count(userId: string, dto: PersonListQueryDto): Promise<number> {
        return this.prisma.person.count({
            where: this.buildWhere(userId, dto)
        });
    }
}
