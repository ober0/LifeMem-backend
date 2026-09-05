import { Injectable } from '@nestjs/common';
import { EntryProcessingType, EntryVectorKind } from '@prisma/client';
import { randomUUID } from 'crypto';

import { apiError } from '../../common/helpers/errors';
import type { AiTokenUsage } from '../ai/ai.types';
import { DelayedJob } from '../delayed-worker/delayed-worker.constants';
import { PrismaService } from '../prisma/prisma.service';

const delayedJobToProcessingType = {
    [DelayedJob.EntryEmbedTitle]: EntryProcessingType.EmbedTitle,
    [DelayedJob.EntryEmbedText]: EntryProcessingType.EmbedText,
    [DelayedJob.EntryEmbedImage]: EntryProcessingType.EmbedImage
} as const;

type UsageTrackedDelayedJob = keyof typeof delayedJobToProcessingType;

@Injectable()
export class EntryEmbeddingRepository {
    constructor(private readonly prisma: PrismaService) {}

    async getEntryTitle(entryId: string): Promise<{ id: string; title: string } | null> {
        return this.prisma.entry.findUnique({
            where: { id: entryId },
            select: { id: true, title: true }
        });
    }

    async getEntryText(entryId: string): Promise<{ id: string; text: string | null } | null> {
        return this.prisma.entry.findUnique({
            where: { id: entryId },
            select: { id: true, text: true }
        });
    }

    async updateUsage(
        entryId: string,
        delayedJob: UsageTrackedDelayedJob,
        data: {
            aiModelId: string;
            usage: AiTokenUsage;
        }
    ) {
        const type = delayedJobToProcessingType[delayedJob];

        const job = await this.prisma.entryProcessingJob.findUnique({
            where: {
                entryId_type: { entryId, type }
            },
            select: { id: true }
        });

        if (!job) {
            throw apiError.notFound('entry.not_found');
        }

        return this.prisma.entryProcessingUsage.upsert({
            where: { jobId: job.id },
            create: {
                jobId: job.id,
                aiModelId: data.aiModelId,
                inputTokens: data.usage.inputTokens,
                outputTokens: data.usage.outputTokens,
                provider: data.usage.provider ?? undefined,
                price: data.usage.price ?? undefined,
                timeMs: data.usage.timeMs ?? undefined
            },
            update: {
                aiModelId: data.aiModelId,
                inputTokens: { increment: data.usage.inputTokens },
                outputTokens: { increment: data.usage.outputTokens },
                provider: data.usage.provider ?? undefined,
                price: data.usage.price ? { increment: data.usage.price } : undefined,
                timeMs: data.usage.timeMs ? { increment: data.usage.timeMs } : undefined
            }
        });
    }

    async createEntryVector(data: {
        entryId: string;
        kind: EntryVectorKind;
        aiModelId: string;
        embedding: number[];
        dimensions?: number;
        imageId?: string | null;
        id?: string;
    }): Promise<{ id: string }> {
        if (data.embedding.length === 0 || data.embedding.some((value) => !Number.isFinite(value))) {
            throw apiError.badRequest('entry.invalid_embedding');
        }

        const dimensions = data.dimensions ?? data.embedding.length;
        if (dimensions !== data.embedding.length) {
            throw apiError.badRequest('entry.invalid_embedding_dimensions');
        }

        const vectorLiteral = `[${data.embedding.join(',')}]`;
        const imageId = data.imageId ?? null;

        let targetId = data.id;

        if (!targetId && imageId) {
            const existing = await this.prisma.entryVector.findUnique({
                where: { imageId },
                select: { id: true }
            });
            targetId = existing?.id;
        }

        if (!targetId && !imageId) {
            const existing = await this.prisma.entryVector.findFirst({
                where: {
                    entryId: data.entryId,
                    kind: data.kind,
                    imageId: null
                },
                select: { id: true }
            });
            targetId = existing?.id;
        }

        if (targetId) {
            await this.prisma.$executeRawUnsafe(
                `
                UPDATE "entry_vector"
                SET
                    "entry_id" = $1::uuid,
                    "kind" = $2::"entry_vector_kind",
                    "ai_model_id" = $3::uuid,
                    "image_id" = $4::uuid,
                    "dimensions" = $5,
                    "embedding" = $6::vector,
                    "updated_at" = NOW()
                WHERE "id" = $7::uuid
                `,
                data.entryId,
                data.kind,
                data.aiModelId,
                imageId,
                dimensions,
                vectorLiteral,
                targetId
            );

            return { id: targetId };
        }

        const id = randomUUID();

        await this.prisma.$executeRawUnsafe(
            `
            INSERT INTO "entry_vector" (
                "id",
                "entry_id",
                "kind",
                "ai_model_id",
                "image_id",
                "dimensions",
                "embedding",
                "created_at",
                "updated_at"
            )
            VALUES (
                $1::uuid,
                $2::uuid,
                $3::"entry_vector_kind",
                $4::uuid,
                $5::uuid,
                $6,
                $7::vector,
                NOW(),
                NOW()
            )
            `,
            id,
            data.entryId,
            data.kind,
            data.aiModelId,
            imageId,
            dimensions,
            vectorLiteral
        );

        return { id };
    }
}
