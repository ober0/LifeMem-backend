import { Injectable } from '@nestjs/common';
import { type Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { baseEntrySelect, createEntrySelect } from './consts/entry.constants';
import type { ParsedLocation } from './helpers/parse-form-data.helper';
import { CreateEntryInput } from './types/uploaded-file.type';

export type UpdateBaseEntryInput = {
    title?: string;
    location?: ParsedLocation;
    personIds?: string[];
    placeIds?: string[];
};

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

    async findOwnedById(id: string, userId: string) {
        return this.prisma.entry.findFirst({
            where: { id, userId }
        });
    }

    async updateBase(id: string, data: UpdateBaseEntryInput) {
        return this.prisma.$transaction(async (tx) => {
            if (data.personIds) {
                await tx.entryPerson.deleteMany({ where: { entryId: id } });

                if (data.personIds.length > 0) {
                    await tx.entryPerson.createMany({
                        data: data.personIds.map((personId) => ({ entryId: id, personId }))
                    });
                }
            }

            if (data.placeIds) {
                await tx.entryPlace.deleteMany({ where: { entryId: id } });

                if (data.placeIds.length > 0) {
                    await tx.entryPlace.createMany({
                        data: data.placeIds.map((placeId) => ({ entryId: id, placeId }))
                    });
                }
            }

            return tx.entry.update({
                where: { id },
                data: {
                    ...(data.title !== undefined && { title: data.title })
                },
                select: baseEntrySelect
            });
        });
    }

    async create(data: CreateEntryInput) {
        const entryData: Prisma.EntryCreateInput = {
            user: { connect: { id: data.userId } },
            title: data.title,
            text: data.text ?? null,
            isReady: false,
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
                    create: data.images.map(({ description, ...file }) => ({
                        description: description ?? null,
                        file: {
                            create: file
                        }
                    }))
                }
            }),
            ...(data.jobs &&
                data.jobs.length > 0 && {
                    jobs: {
                        create: data.jobs.map((job) => ({
                            type: job.type,
                            status: job.status
                        }))
                    }
                })
        };

        return this.prisma.entry.create({
            data: entryData,
            select: createEntrySelect
        });
    }

    async getById(id: string) {
        return this.prisma.entry.findUnique({
            where: {
                id: id
            }
        });
    }
}
