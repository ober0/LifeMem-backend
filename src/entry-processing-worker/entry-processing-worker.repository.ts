import { Injectable } from '@nestjs/common';
import { EntryProcessingStatus, EntryProcessingType } from '@prisma/client';

import { PrismaService } from '../api/prisma/prisma.service';

@Injectable()
export class EntryProcessingWorkerRepository {
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

    async createJob(entryId: string, type: EntryProcessingType) {
        return this.prisma.entryProcessingJob.create({
            data: {
                entryId,
                type
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

    async tryMarkJobRunning(jobId: string): Promise<boolean> {
        const result = await this.prisma.entryProcessingJob.updateMany({
            where: {
                id: jobId,
                status: EntryProcessingStatus.Pending
            },
            data: {
                status: EntryProcessingStatus.Running
            }
        });

        return result.count > 0;
    }

    async appendJobError(jobId: string, message: string) {
        const job = await this.prisma.entryProcessingJob.update({
            where: { id: jobId },
            data: {
                errorMessages: { push: message }
            },
            select: {
                errorMessages: true
            }
        });

        return job.errorMessages;
    }

    async findEntryContext(entryId: string) {
        return this.prisma.entry.findUnique({
            where: { id: entryId },
            select: {
                text: true,
                voice: { select: { id: true } },
                jobs: { select: { type: true } },
                _count: { select: { media: true } }
            }
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
