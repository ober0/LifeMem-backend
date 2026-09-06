import { Injectable } from '@nestjs/common';
import { EntryProcessingType } from '@prisma/client';

import { apiError } from '../../common/helpers/errors';
import type { AiTokenUsage } from '../ai/ai.types';
import { DelayedJob } from '../delayed-worker/delayed-worker.constants';
import { PrismaService } from '../prisma/prisma.service';

const delayedJobToProcessingType = {
    [DelayedJob.EntryStt]: EntryProcessingType.Stt
} as const;

type UsageTrackedDelayedJob = keyof typeof delayedJobToProcessingType;

@Injectable()
export class EntrySttRepository {
    constructor(private readonly prisma: PrismaService) {}

    async getVoice(entryId: string) {
        return this.prisma.entryVoice.findUnique({
            where: { entryId },
            select: {
                id: true,
                file: {
                    select: {
                        key: true,
                        filename: true,
                        mimeType: true
                    }
                }
            }
        });
    }

    async updateEntryText(entryId: string, text: string) {
        return this.prisma.entry.update({
            where: { id: entryId },
            data: { text },
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
