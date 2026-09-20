import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import type { AiTokenUsage } from '../ai/ai.types';
import { PrismaService } from '../prisma/prisma.service';
import type { EntryImageVisionMetadata } from './entry-vision.types';

@Injectable()
export class EntryVisionRepository {
    constructor(private readonly prisma: PrismaService) {}

    async getMedia(entryId: string, ids?: string[]) {
        return this.prisma.entryMedia.findMany({
            where: {
                entryId,
                ...(ids && {
                    id: {
                        in: ids
                    }
                })
            },
            select: {
                id: true,
                file: {
                    select: {
                        key: true
                    }
                },
                type: true
            }
        });
    }

    async updateVisionResult(
        mediaId: string,
        data: {
            aiTranscription: string;
            aiMetadata: EntryImageVisionMetadata | null;
        }
    ) {
        return this.prisma.entryMedia.update({
            where: { id: mediaId },
            data: {
                aiTranscription: data.aiTranscription,
                aiMetadata: data.aiMetadata === null ? Prisma.DbNull : (data.aiMetadata as Prisma.InputJsonValue)
            },
            select: { id: true }
        });
    }

    async updateUsage(
        jobId: string,
        data: {
            aiModelId: string;
            usage: AiTokenUsage;
        }
    ) {
        return this.prisma.entryProcessingUsage.upsert({
            where: { jobId },
            create: {
                jobId,
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
}
