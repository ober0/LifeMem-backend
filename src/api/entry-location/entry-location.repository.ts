import { Injectable } from '@nestjs/common';
import { EntryProcessingType, Prisma } from '@prisma/client';

import { apiError } from '../../common/helpers/errors';
import type { AiTokenUsage } from '../ai/ai.types';
import { DelayedJob } from '../delayed-worker/delayed-worker.constants';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLocationDto } from './types';

const delayedJobToProcessingType = {
    [DelayedJob.EntryLocationAndPeopleDetect]: EntryProcessingType.LocationAndPeopleDetect
} as const;

type UsageTrackedDelayedJob = keyof typeof delayedJobToProcessingType;

@Injectable()
export class EntryLocationRepository {
    constructor(private readonly prisma: PrismaService) {}

    async getEntryText(entryId: string): Promise<{ id: string; text: string | null } | null> {
        return this.prisma.entry.findUnique({
            where: { id: entryId },
            select: { id: true, text: true }
        });
    }

    async findPersonOwned(userId: string, personId: string) {
        return this.prisma.person.findFirst({
            where: { id: personId, userId },
            select: { id: true, name: true }
        });
    }

    async findPlaceOwned(userId: string, placeId: string) {
        return this.prisma.place.findFirst({
            where: { id: placeId, userId },
            select: { id: true, name: true }
        });
    }

    async attachPerson(entryId: string, personId: string) {
        return this.prisma.entryPerson.createMany({
            data: [{ entryId, personId }],
            skipDuplicates: true
        });
    }

    async attachPlace(entryId: string, placeId: string) {
        return this.prisma.entryPlace.createMany({
            data: [{ entryId, placeId }],
            skipDuplicates: true
        });
    }

    async connectOrCreatePerson(userId: string, entryId: string, name: string, autodetected = false) {
        const person = await this.prisma.person.upsert({
            where: {
                userId_name: { userId, name }
            },
            create: { userId, name, autodetected },
            update: {},
            select: { id: true }
        });

        await this.attachPerson(entryId, person.id);
        return person;
    }

    async connectOrCreatePlace(
        userId: string,
        entryId: string,
        data: {
            name: string;
            fullName?: string | null;
            latitude?: number | null;
            longitude?: number | null;
            json?: unknown;
            autodetected?: boolean;
        }
    ) {
        const existing = await this.prisma.place.findUnique({
            where: {
                userId_name: { userId, name: data.name }
            },
            select: { id: true }
        });

        if (existing) {
            await this.attachPlace(entryId, existing.id);
            return existing;
        }

        const place = await this.prisma.place.create({
            data: {
                userId,
                name: data.name,
                fullName: data.fullName ?? null,
                latitude: data.latitude ?? null,
                longitude: data.longitude ?? null,
                autodetected: data.autodetected ?? false,
                ...(data.json != null && { data: data.json as Prisma.InputJsonValue })
            },
            select: { id: true }
        });

        await this.attachPlace(entryId, place.id);
        return place;
    }

    async createLocation(data: CreateLocationDto, userId: string, entryId: string) {
        return this.connectOrCreatePlace(userId, entryId, {
            name: data.shortName,
            fullName: data.fullName,
            latitude: data.latitude,
            longitude: data.longitude,
            json: data.json
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
                price: data.usage.price ?? undefined
            },
            update: {
                aiModelId: data.aiModelId,
                inputTokens: { increment: data.usage.inputTokens },
                outputTokens: { increment: data.usage.outputTokens },
                provider: data.usage.provider ?? undefined,
                price: data.usage.price ? { increment: data.usage.price } : undefined
            }
        });
    }
}
