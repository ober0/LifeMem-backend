import { Injectable } from '@nestjs/common';

import type { AiTokenUsage } from '../ai/ai.types';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EntryVisionRepository {
    constructor(private readonly prisma: PrismaService) {}

    async getImages(entryId: string, ids?: string[]) {
        return this.prisma.entryImage.findMany({
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
                }
            }
        });
    }

    async updateAiTranscription(imageId: string, aiTranscription: string) {
        return this.prisma.entryImage.update({
            where: { id: imageId },
            data: { aiTranscription },
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
