import { Injectable } from '@nestjs/common';
import { AscStatus, type Prisma } from '@prisma/client';

import { mapPagination } from '../../common/helpers/map.pagination';
import { mapSort } from '../../common/helpers/map.sort';
import { SortTypes } from '../../common/types/search/sort-types.dto';
import type { AiTokenUsage } from '../ai/ai.types';
import { PrismaService } from '../prisma/prisma.service';
import type { EntryAskHistorySearchDto } from './dto/entry-ask-history-search.dto';
import type { EntryRagSourceDto } from './dto/entry-rag-response.dto';

const TEXT_SNIPPET_LENGTH = 100;

export type CreateAscInput = {
    status: AscStatus;
    userId: string;
    question: string;
    result?: string | null;
    sourceCount?: number | null;
    timeMs?: number | null;
    modelId?: string | null;
    usage?: AiTokenUsage | null;
    entryIds?: string[];
};

export type EntryAskHistoryRow = {
    id: string;
    question: string | null;
    answer: string | null;
    createdAt: Date;
    entryIds: string[];
};

@Injectable()
export class EntryRagRepository {
    constructor(private readonly prisma: PrismaService) {}

    async findSourcesByIds(userId: string, ids: string[]): Promise<EntryRagSourceDto[]> {
        if (ids.length === 0) {
            return [];
        }

        const rows = await this.prisma.entry.findMany({
            where: {
                id: { in: ids },
                userId,
                deletedAt: null
            },
            select: {
                id: true,
                title: true,
                text: true,
                formattedText: true,
                voice: { select: { id: true } },
                createdAt: true,
                _count: {
                    select: {
                        media: true,
                        people: true,
                        places: true
                    }
                }
            }
        });

        return rows.map((row) => ({
            id: row.id,
            title: row.title,
            textSnippet: this.toSnippet(row.text ?? row.formattedText),
            mediaCount: row._count.media,
            isHasVoice: row.voice != null,
            peopleCount: row._count.people,
            placesCount: row._count.places,
            createdAt: row.createdAt
        }));
    }

    private buildHistoryWhere(userId: string, dto: EntryAskHistorySearchDto): Prisma.AscWhereInput {
        const query = dto.query?.trim();

        return {
            userId,
            ...(query
                ? {
                      asc: {
                          contains: query,
                          mode: 'insensitive'
                      }
                  }
                : {})
        };
    }

    private buildHistoryOrderBy(dto: EntryAskHistorySearchDto): Prisma.AscOrderByWithRelationInput[] {
        const mapped = mapSort(dto.sorts);

        if (mapped.length === 0) {
            return [{ createdAt: 'asc' }, { id: 'asc' }];
        }

        const createdAtSort = (dto.sorts?.createdAt ?? SortTypes.ASC).toLowerCase() as 'asc' | 'desc';

        return [{ createdAt: createdAtSort }, { id: 'asc' }];
    }

    async searchHistory(userId: string, dto: EntryAskHistorySearchDto): Promise<EntryAskHistoryRow[]> {
        const rows = await this.prisma.asc.findMany({
            where: this.buildHistoryWhere(userId, dto),
            select: {
                id: true,
                asc: true,
                result: true,
                createdAt: true,
                entries: {
                    select: { entryId: true },
                    orderBy: { position: 'asc' }
                }
            },
            orderBy: this.buildHistoryOrderBy(dto),
            ...mapPagination(dto.pagination)
        });

        return rows.map((row) => ({
            id: row.id,
            question: row.asc,
            answer: row.result,
            createdAt: row.createdAt,
            entryIds: row.entries.map((link) => link.entryId)
        }));
    }

    async countHistory(userId: string, dto: EntryAskHistorySearchDto) {
        return this.prisma.asc.count({
            where: this.buildHistoryWhere(userId, dto)
        });
    }

    async createAsc(data: CreateAscInput) {
        const usageCreate = this.toUsageCreate(data.modelId, data.usage);

        const entryIds = data.entryIds ?? [];

        return this.prisma.asc.create({
            data: {
                status: data.status,
                userId: data.userId,
                asc: data.question,
                result: data.result ?? null,
                sourceCount: data.sourceCount ?? (entryIds.length > 0 ? entryIds.length : null),
                timeMs: data.timeMs ?? null,
                ...(entryIds.length > 0 && {
                    entries: {
                        create: entryIds.map((entryId, position) => ({
                            entryId,
                            position
                        }))
                    }
                }),
                ...(usageCreate ? { usage: { create: usageCreate } } : {})
            }
        });
    }

    private toUsageCreate(
        modelId: string | null | undefined,
        usage: AiTokenUsage | null | undefined
    ): Prisma.AscUsageCreateWithoutAscInput | null {
        if (!usage) {
            return null;
        }

        const hasTokens = usage.inputTokens > 0 || usage.outputTokens > 0 || usage.totalTokens > 0;
        const hasPrice = usage.price != null && usage.price > 0;

        if (!hasTokens && !hasPrice) {
            return null;
        }

        return {
            ...(modelId ? { model: { connect: { id: modelId } } } : {}),
            inputTokens: usage.inputTokens,
            outputTokens: usage.outputTokens,
            price: usage.price ?? null,
            provider: usage.provider ?? null
        };
    }

    private toSnippet(text: string | null): string | null {
        if (!text) {
            return null;
        }

        const normalized = text.replace(/\s+/g, ' ').trim();
        if (!normalized) {
            return null;
        }

        return `${normalized.slice(0, TEXT_SNIPPET_LENGTH)}...`;
    }
}
