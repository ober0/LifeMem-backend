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

    async findByUserAndName(userId: string, name: string) {
        return this.prisma.person.findUnique({
            where: {
                userId_name: { userId, name }
            },
            select: { id: true }
        });
    }

    async create(userId: string, name: string) {
        return this.prisma.person.create({
            data: {
                userId,
                name,
                autodetected: false
            },
            select: personSelect
        });
    }

    async deleteOwned(userId: string, id: string): Promise<boolean> {
        const result = await this.prisma.person.deleteMany({
            where: { id, userId }
        });

        return result.count > 0;
    }
}
