import { Injectable } from '@nestjs/common';
import { AscStatus, type Prisma } from '@prisma/client';

import type { AiTokenUsage } from '../ai/ai.types';
import { PrismaService } from '../prisma/prisma.service';
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

    async createAsc(data: CreateAscInput) {
        const usageCreate = this.toUsageCreate(data.modelId, data.usage);

        return this.prisma.asc.create({
            data: {
                status: data.status,
                userId: data.userId,
                asc: data.question,
                result: data.result ?? null,
                sourceCount: data.sourceCount ?? null,
                timeMs: data.timeMs ?? null,
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
