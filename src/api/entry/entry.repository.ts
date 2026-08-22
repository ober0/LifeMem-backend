import { Injectable } from '@nestjs/common';
import { type Entry, EntryProcessingStageKind, EntryProcessingStatus, type Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { CreateEntryInput } from './types/uploaded-file.type';

@Injectable()
export class EntryRepository {
    constructor(private readonly prisma: PrismaService) {}

    async findPersonsByUser(userId: string, ids: string[]) {
        if (ids.length === 0) {
            return [];
        }

        return this.prisma.person.findMany({
            where: {
                userId,
                id: { in: ids }
            }
        });
    }

    async findPlacesByUser(userId: string, ids: string[]) {
        if (ids.length === 0) {
            return [];
        }

        return this.prisma.place.findMany({
            where: {
                userId,
                id: { in: ids }
            }
        });
    }

    async create(data: CreateEntryInput): Promise<Entry & { processing: { status: EntryProcessingStatus } | null }> {
        const entryData: Prisma.EntryCreateInput = {
            user: { connect: { id: data.userId } },
            title: data.title,
            text: data.text ?? null,
            latitude: data.location?.latitude,
            longitude: data.location?.longitude,
            locationLabel: data.location?.locationLabel ?? null,
            isReady: false,
            processing: {
                create: {
                    status: EntryProcessingStatus.Uploaded,
                    stages: {
                        create: {
                            stage: EntryProcessingStageKind.Upload
                        }
                    }
                }
            },
            ...(data.personIds.length > 0 && {
                people: {
                    create: data.personIds.map((personId) => ({ personId }))
                }
            }),
            ...(data.placeIds.length > 0 && {
                places: {
                    create: data.placeIds.map((placeId) => ({ placeId }))
                }
            }),
            ...(data.voice && {
                voice: {
                    create: {
                        file: {
                            create: data.voice
                        }
                    }
                }
            }),
            ...(data.images.length > 0 && {
                images: {
                    create: data.images.map((image) => ({
                        file: {
                            create: image
                        }
                    }))
                }
            })
        };

        return this.prisma.entry.create({
            data: entryData,
            include: {
                processing: {
                    select: { status: true }
                }
            }
        });
    }
}
