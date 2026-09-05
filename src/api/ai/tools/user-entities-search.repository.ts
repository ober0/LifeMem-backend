import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class UserEntitiesSearchRepository {
    constructor(private readonly prisma: PrismaService) {}

    async searchPeople(userId: string, queries: string[], take = 50) {
        const normalized = this.normalizeQueries(queries);
        if (normalized.length === 0) {
            return [];
        }

        return this.prisma.person.findMany({
            where: {
                userId,
                OR: normalized.map((query) => ({
                    name: { contains: query, mode: 'insensitive' as const }
                }))
            },
            select: { id: true, name: true },
            take,
            orderBy: { name: 'asc' }
        });
    }

    async searchPlaces(userId: string, queries: string[], take = 50) {
        const normalized = this.normalizeQueries(queries);
        if (normalized.length === 0) {
            return [];
        }

        return this.prisma.place.findMany({
            where: {
                userId,
                OR: normalized.flatMap((query) => [
                    { name: { contains: query, mode: 'insensitive' as const } },
                    { fullName: { contains: query, mode: 'insensitive' as const } }
                ])
            },
            select: {
                id: true,
                name: true,
                fullName: true,
                latitude: true,
                longitude: true
            },
            take,
            orderBy: { name: 'asc' }
        });
    }

    private normalizeQueries(queries: string[]): string[] {
        return [...new Set(queries.map((item) => item.trim()).filter(Boolean))];
    }
}
