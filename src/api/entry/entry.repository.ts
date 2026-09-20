import { Injectable } from '@nestjs/common';
import { FileType, type Prisma } from '@prisma/client';

import { mapPagination } from '../../common/helpers/map.pagination';
import { mapSearch } from '../../common/helpers/map.search';
import { mapSort } from '../../common/helpers/map.sort';
import { SortTypes } from '../../common/types/search/sort-types.dto';
import { PrismaService } from '../prisma/prisma.service';
import { baseEntrySelect, createEntrySelect, entryDetailSelect, searchEntrySelect } from './consts/entry.constants';
import { EntrySearchContentType, EntrySearchDto, EntrySearchFilterDto } from './dto/search/search-request.dto';
import type { ParsedLocation } from './helpers/parse-form-data.helper';
import { CreateEntryInput } from './types/uploaded-file.type';

export type UpdateBaseEntryInput = {
    title?: string;
    location?: ParsedLocation;
    personIds?: string[];
    placeIds?: string[];
};

export type DetachedEntryMedia = {
    type: FileType;
    firstFrame: { id: string; key: string } | null;
};

@Injectable()
export class EntryRepository {
    constructor(private readonly prisma: PrismaService) {}

    private readonly notDeleted = { deletedAt: null };

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
            where: { id, userId, ...this.notDeleted },
            include: {
                _count: {
                    select: { places: true }
                }
            }
        });
    }

    async softDelete(id: string, userId: string) {
        const result = await this.prisma.entry.updateMany({
            where: { id, userId, ...this.notDeleted },
            data: { deletedAt: new Date() }
        });

        return result.count > 0;
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

            const updated = await tx.entry.updateMany({
                where: { id, ...this.notDeleted },
                data: {
                    ...(data.title !== undefined && { title: data.title })
                }
            });

            if (updated.count === 0) {
                return null;
            }

            return tx.entry.findFirstOrThrow({
                where: { id, ...this.notDeleted },
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
                            connect: { id: data.voice.fileId }
                        }
                    }
                }
            }),
            ...(data.media.length > 0 && {
                media: {
                    create: data.media.map((item) => ({
                        type: item.type,
                        description: item.description ?? null,
                        file: {
                            connect: { id: item.fileId }
                        }
                    }))
                }
            }),
            ...(data.jobs &&
                data.jobs.length > 0 && {
                    jobs: {
                        create: data.jobs.map((job) => ({
                            type: job.type,
                            status: job.status,
                            userId: data.userId
                        }))
                    }
                })
        };

        return this.prisma.entry.create({
            data: entryData,
            select: createEntrySelect
        });
    }

    async findOwnedDetailById(id: string, userId: string) {
        return this.prisma.entry.findFirst({
            where: { id, userId, ...this.notDeleted },
            select: entryDetailSelect
        });
    }

    hasActiveSearchFilters(filters?: EntrySearchFilterDto): boolean {
        return filters?.hasMedia !== undefined || Object.keys(this.buildSearchFilters(filters)).length > 0;
    }

    private buildSearchFilters(filters?: EntrySearchFilterDto): Prisma.EntryWhereInput {
        const mapped = mapSearch(
            filters,
            [
                { key: 'peopleIds', path: 'people.some.personId' },
                { key: 'placeIds', path: 'places.some.placeId' }
            ],
            ['type', 'hasMedia'],
            undefined,
            [],
            EntrySearchFilterDto
        );

        const extra: Prisma.EntryWhereInput[] = [];

        if (filters?.type === EntrySearchContentType.Voice) {
            extra.push({ voice: { isNot: null } });
        }

        if (filters?.type === EntrySearchContentType.Text) {
            extra.push({
                voice: null,
                AND: [{ text: { not: null } }, { NOT: { text: '' } }]
            });
        }

        const andParts: Prisma.EntryWhereInput[] = [];

        if (mapped.AND && Array.isArray(mapped.AND)) {
            andParts.push(...mapped.AND);
        } else if (Object.keys(mapped).length > 0) {
            andParts.push(mapped);
        }

        andParts.push(...extra);

        if (andParts.length === 0) {
            return {};
        }

        return { AND: andParts };
    }

    private buildSearchWhere(userId: string, dto: EntrySearchDto): Prisma.EntryWhereInput {
        return {
            userId,
            ...this.notDeleted,
            ...this.buildSearchFilters(dto.filters)
        };
    }

    async search(userId: string, dto: EntrySearchDto) {
        const orderBy = mapSort(dto.sorts);
        const defaultOrder = [{ createdAt: (dto.sorts?.createdAt ?? SortTypes.DESC).toLowerCase() as 'asc' | 'desc' }];

        return this.prisma.entry.findMany({
            where: this.buildSearchWhere(userId, dto),
            select: searchEntrySelect,
            orderBy: orderBy.length > 0 ? orderBy : defaultOrder,
            ...mapPagination(dto.pagination)
        });
    }

    async count(userId: string, dto: EntrySearchDto) {
        return this.prisma.entry.count({
            where: this.buildSearchWhere(userId, dto)
        });
    }

    async findSearchFilterCandidates(userId: string, dto: EntrySearchDto) {
        return this.prisma.entry.findMany({
            where: this.buildSearchWhere(userId, dto),
            select: {
                id: true,
                _count: {
                    select: {
                        media: true
                    }
                }
            }
        });
    }

    async searchAll(userId: string, dto: EntrySearchDto) {
        const orderBy = mapSort(dto.sorts);
        const defaultOrder = [{ createdAt: (dto.sorts?.createdAt ?? SortTypes.DESC).toLowerCase() as 'asc' | 'desc' }];

        return this.prisma.entry.findMany({
            where: this.buildSearchWhere(userId, dto),
            select: searchEntrySelect,
            orderBy: orderBy.length > 0 ? orderBy : defaultOrder
        });
    }

    async findOwnedForMediaAttach(id: string, userId: string) {
        return this.prisma.entry.findFirst({
            where: {
                id,
                userId,
                ...this.notDeleted
            },
            select: {
                id: true,
                isReady: true,
                _count: {
                    select: { media: true }
                }
            }
        });
    }

    async existsEntryMediaByFileId(entryId: string, fileId: string) {
        const row = await this.prisma.entryMedia.findFirst({
            where: { entryId, fileId },
            select: { id: true }
        });

        return row != null;
    }

    async createEntryMedia(entryId: string, fileId: string, type: FileType, description: string | null) {
        return this.prisma.entryMedia.create({
            data: {
                entryId,
                fileId,
                type,
                description
            },
            select: {
                id: true,
                description: true,
                fileId: true,
                createdAt: true,
                updatedAt: true,
                file: {
                    select: { key: true }
                }
            }
        });
    }

    private ownedEntryMediaWhere(entryId: string, mediaId: string, userId: string): Prisma.EntryMediaWhereInput {
        return {
            id: mediaId,
            entryId,
            entry: {
                userId,
                ...this.notDeleted
            }
        };
    }

    async findOwnedEntryMediaForDetach(
        entryId: string,
        mediaId: string,
        userId: string
    ): Promise<DetachedEntryMedia | null> {
        const media = await this.prisma.entryMedia.findFirst({
            where: this.ownedEntryMediaWhere(entryId, mediaId, userId),
            select: {
                type: true,
                firstFrame: {
                    select: {
                        id: true,
                        key: true
                    }
                }
            }
        });

        if (!media) {
            return null;
        }

        return {
            type: media.type,
            firstFrame: media.firstFrame
        };
    }

    async deleteOwnedEntryMedia(entryId: string, mediaId: string, userId: string): Promise<boolean> {
        const result = await this.prisma.entryMedia.deleteMany({
            where: this.ownedEntryMediaWhere(entryId, mediaId, userId)
        });

        return result.count > 0;
    }
}
