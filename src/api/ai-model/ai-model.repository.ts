import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';

import { mapPagination } from '../../common/helpers/map.pagination';
import { mapSearch } from '../../common/helpers/map.search';
import { mapSort } from '../../common/helpers/map.sort';
import { PrismaService } from '../prisma/prisma.service';
import { AiModelFilterDto, type AiModelSearchDto } from './dto/search.dto';

@Injectable()
export class AiModelRepository {
    constructor(private readonly prisma: PrismaService) {}

    private buildWhere(dto: AiModelSearchDto): Prisma.AiModelWhereInput {
        return mapSearch(dto.filters, [], [], dto.query, ['name'], AiModelFilterDto);
    }

    async search(dto: AiModelSearchDto) {
        return this.prisma.aiModel.findMany({
            where: this.buildWhere(dto),
            orderBy: mapSort(dto.sorts),
            ...mapPagination(dto.pagination)
        });
    }

    async count(dto: AiModelSearchDto): Promise<number> {
        return this.prisma.aiModel.count({
            where: this.buildWhere(dto)
        });
    }

    async findById(id: string) {
        return this.prisma.aiModel.findUnique({ where: { id } });
    }

    async findByIds(ids: string[]) {
        if (ids.length === 0) {
            return [];
        }

        return this.prisma.aiModel.findMany({
            where: { id: { in: ids } }
        });
    }

    async updateIsActive(id: string, isActive: boolean) {
        return this.prisma.aiModel.update({
            where: { id },
            data: { isActive }
        });
    }
}
