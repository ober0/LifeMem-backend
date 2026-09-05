import { Injectable } from '@nestjs/common';
import { EntryProcessingType } from '@prisma/client';

import { apiError } from '../../common/helpers/errors';
import type { AiTokenUsage } from '../ai/ai.types';
import { DelayedJob } from '../delayed-worker/delayed-worker.constants';
import { PrismaService } from '../prisma/prisma.service';

const delayedJobToProcessingType = {
    [DelayedJob.EntryVision]: EntryProcessingType.Vision
} as const;

type UsageTrackedDelayedJob = keyof typeof delayedJobToProcessingType;

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
}
