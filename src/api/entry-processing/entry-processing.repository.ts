import { Injectable } from '@nestjs/common';
import { EntryProcessingStatus, EntryProcessingType } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EntryProcessingRepository {
    constructor(private readonly prisma: PrismaService) {}

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
            }
        });
    }

    async updateJobStatus(jobId: string, status: EntryProcessingStatus, errorMessage?: string) {
        return this.prisma.entryProcessingJob.update({
            where: { id: jobId },
            data: {
                status,
                ...(errorMessage !== undefined && { errorMessage })
            }
        });
    }

    async findEntryContext(entryId: string) {
        return this.prisma.entry.findUnique({
            where: { id: entryId },
            select: {
                latitude: true,
                longitude: true,
                locationLabel: true,
                text: true,
                voice: { select: { id: true } },
                _count: { select: { images: true } }
            }
        });
    }
}
