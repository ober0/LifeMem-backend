import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';

import { mapPagination } from '../../common/helpers/map.pagination';
import { mapSearch } from '../../common/helpers/map.search';
import { mapSort } from '../../common/helpers/map.sort';
import { PrismaService } from '../prisma/prisma.service';
import type { LogsCreateDto } from './dto/base.dto';
import type { LogsSearchDto } from './dto/search.dto';
import { LogsFilterDto } from './dto/search.dto';

@Injectable()
export class LogsRepository {
    constructor(private readonly prisma: PrismaService) {}

    private buildWhere(dto: LogsSearchDto): Prisma.LogsWhereInput {
        return mapSearch(dto.filters, [], [], dto.query, ['code', 'path', 'method'], LogsFilterDto);
    }

    async search(dto: LogsSearchDto) {
        return this.prisma.logs.findMany({
            where: this.buildWhere(dto),
            orderBy: mapSort(dto.sorts),
            ...mapPagination(dto.pagination),
            include: {
                user: {
                    select: {
                        id: true,
                        nickname: true,
                        email: true,
                        phoneNumber: true
                    }
                }
            }
        });
    }

    async count(dto: LogsSearchDto): Promise<number> {
        return this.prisma.logs.count({
            where: this.buildWhere(dto)
        });
    }

    async create(data: LogsCreateDto) {
        return this.prisma.logs.create({
            data: {
                ...(data.userId && {
                    user: {
                        connect: {
                            id: data.userId
                        }
                    }
                }),
                duration: data.duration,
                code: data.code,
                path: data.path,
                method: data.method ?? 'Undefined',
                ip: data.ip
            }
        });
    }
}
