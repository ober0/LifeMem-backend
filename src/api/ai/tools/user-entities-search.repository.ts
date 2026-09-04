import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class UserEntitiesSearchRepository {
    constructor(private readonly prisma: PrismaService) {}

    async searchPeople(userId: string, query: string, take = 20) {
        return this.prisma.person.findMany({
            where: {
                userId,
                name: { contains: query, mode: 'insensitive' }
            },
            select: { id: true, name: true },
            take,
            orderBy: { name: 'asc' }
        });
    }

    async searchPlaces(userId: string, query: string, take = 20) {
        return this.prisma.place.findMany({
            where: {
                userId,
                OR: [
                    { name: { contains: query, mode: 'insensitive' } },
                    { fullName: { contains: query, mode: 'insensitive' } }
                ]
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
}
