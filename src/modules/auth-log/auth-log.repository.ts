import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { mapPagination } from '../../common/helpers/map.pagination';
import { mapSearch } from '../../common/helpers/map.search';
import { mapSort } from '../../common/helpers/map.sort';
import { PrismaService } from '../prisma/prisma.service';
import { AuthLogCreate } from './dto/create';
import { AuthLogFilterDto, AuthLogSearchDto } from './dto/search.dto';

@Injectable()
export class AuthLogRepository {
    constructor(private readonly prisma: PrismaService) {}

    private buildWhere(dto: AuthLogSearchDto): Prisma.AuthLogsWhereInput {
        return mapSearch(dto.filters, [], [], dto.query, ['ip'], AuthLogFilterDto);
    }

    async create(data: AuthLogCreate) {
        return this.prisma.authLogs.create({
            data: {
                type: data.type,
                ip: data.ip,
                user: {
                    connect: { id: data.userId }
                }
            }
        });
    }

    async search(dto: AuthLogSearchDto) {
        return this.prisma.authLogs.findMany({
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

    async count(dto: AuthLogSearchDto): Promise<number> {
        return this.prisma.authLogs.count({
            where: this.buildWhere(dto)
        });
    }
}
