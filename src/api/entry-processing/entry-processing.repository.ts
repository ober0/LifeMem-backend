import { Injectable } from '@nestjs/common';
import { EntryProcessingStatus, EntryProcessingType } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EntryProcessingRepository {
    constructor(private readonly prisma: PrismaService) {}

    private readonly activeStatuses = [EntryProcessingStatus.Pending, EntryProcessingStatus.Running] as const;

    async findActiveJob(entryId: string, type: EntryProcessingType) {
        return this.prisma.entryProcessingJob.findFirst({
            where: {
                entryId,
                type,
                status: { in: [...this.activeStatuses] }
            },
            select: {
                id: true,
                type: true,
                status: true
            }
        });
    }

    async createJob(entryId: string, type: EntryProcessingType, userId?: string | null) {
        return this.prisma.entryProcessingJob.create({
            data: {
                entryId,
                type,
                ...(userId && { userId })
            }
        });
    }

    async findJobsByEntryId(entryId: string) {
        return this.prisma.entryProcessingJob.findMany({
            where: { entryId },
            select: {
                id: true,
                type: true,
                status: true
            },
            orderBy: { createdAt: 'asc' }
        });
    }

    async updateJobStatus(jobId: string, status: EntryProcessingStatus) {
        return this.prisma.entryProcessingJob.update({
            where: { id: jobId },
            data: { status }
        });
    }

    async markEntryReady(entryId: string) {
        return this.prisma.entry.update({
            where: {
                id: entryId
            },
            data: {
                isReady: true
            }
        });
    }
}
