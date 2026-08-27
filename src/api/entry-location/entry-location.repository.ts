import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { CreateLocationDto } from './types';

@Injectable()
export class EntryLocationRepository {
    constructor(private readonly prisma: PrismaService) {}

    async createLocation(data: CreateLocationDto, userId: string, entryId: string) {
        return this.prisma.entryPlace.create({
            data: {
                place: {
                    connectOrCreate: {
                        where: {
                            userId_name: {
                                name: data.shortName,
                                userId: userId
                            }
                        },
                        create: {
                            userId,
                            name: data.shortName,
                            fullName: data.fullName,
                            latitude: data.latitude,
                            longitude: data.longitude,
                            ...(data.json != null && { data: data.json as unknown as Prisma.InputJsonValue })
                        }
                    }
                },
                entry: {
                    connect: {
                        id: entryId
                    }
                }
            }
        });
    }
}
