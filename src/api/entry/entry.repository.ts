import { Injectable } from '@nestjs/common';
import { type Prisma } from '@prisma/client';

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
            where: { id, userId, ...this.notDeleted }
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
            ...(data.images.length > 0 && {
                images: {
                    create: data.images.map((image) => ({
                        description: image.description ?? null,
                        file: {
                            connect: { id: image.fileId }
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

    async findOwnedDetailById(id: string, userId: string) {
        return this.prisma.entry.findFirst({
            where: { id, userId, ...this.notDeleted },
            select: entryDetailSelect
        });
    }

    hasActiveSearchFilters(filters?: EntrySearchFilterDto): boolean {
        return filters?.hasImage !== undefined || Object.keys(this.buildSearchFilters(filters)).length > 0;
    }

    private buildSearchFilters(filters?: EntrySearchFilterDto): Prisma.EntryWhereInput {
        const mapped = mapSearch(
            filters,
            [
                { key: 'peopleIds', path: 'people.some.personId' },
                { key: 'placeIds', path: 'places.some.placeId' }
            ],
            ['type', 'hasImage'],
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
                        images: true
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
}
