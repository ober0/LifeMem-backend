import { Injectable } from '@nestjs/common';

import type { AiTokenUsage } from '../ai/ai.types';
import { PrismaService } from '../prisma/prisma.service';

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
