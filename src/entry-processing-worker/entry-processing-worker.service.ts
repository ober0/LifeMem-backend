import { Injectable, Logger } from '@nestjs/common';
import { EntryProcessingStatus, EntryProcessingType, Prisma } from '@prisma/client';

import { BullMqQueue } from '../api/bullmq/bullmq.constants';
import {
    type baseEntryJobPayload,
    DelayedJob,
    type DelayedJobPayloads,
    type EntryJobName
} from '../api/delayed-worker/delayed-worker.constants';
import { DelayedWorkerService } from '../api/delayed-worker/delayed-worker.service';
import { appConstants } from '../common/config/app.constants';
import { apiError } from '../common/helpers/errors';
import { EntryPipelines, EntryPipelinesEnum } from '../common/pipelines';
import type { PipelineContext, PipelineStep } from '../common/pipelines/types';
import { EntryProcessingWorkerRepository } from './entry-processing-worker.repository';

type CreateJobOptions = {
    ignoreDuplicate?: boolean;
};

@Injectable()
export class EntryProcessingWorkerService {
    constructor(
        private readonly repository: EntryProcessingWorkerRepository,
        private readonly delayedWorker: DelayedWorkerService
    ) {}

    private logger: Logger = new Logger(EntryProcessingWorkerService.name);

    private jobMap = new Map<EntryJobName, EntryProcessingType>(
        Object.values(EntryPipelines).flatMap((pipeline) =>
            (Object.entries(pipeline) as [EntryJobName, PipelineStep][]).map(([key, step]) => [key, step.type])
        )
    );

    async tryMarkJobRunning(jobId: string): Promise<boolean> {
        return this.repository.tryMarkJobRunning(jobId);
    }

    async markJobPending(jobId: string) {
        await this.repository.updateJobStatus(jobId, EntryProcessingStatus.Pending);
    }

    async markJobFailed(jobId: string) {
        await this.repository.updateJobStatus(jobId, EntryProcessingStatus.Failed);
    }

    async appendJobError(jobId: string, message: string) {
        return this.repository.appendJobError(jobId, message);
    }

    get maxJobErrorAttempts() {
        return appConstants.entryProcessing.maxJobErrorAttempts;
    }

    async requeueJob<K extends EntryJobName>(jobName: K, data: DelayedJobPayloads[K]) {
        await this.markJobPending(data.jobId);

        await this.delayedWorker.delayed(jobName, data, { queue: BullMqQueue.Entry }, { attempts: 1 });
    }

    async markJobDone(jobId: string) {
        await this.repository.updateJobStatus(jobId, EntryProcessingStatus.Done);
    }

    async onJobFinished(finishedKey: EntryJobName, data: baseEntryJobPayload) {
        await this.markJobDone(data.jobId);

        const pipeline = EntryPipelines[data.pipeline];
        const jobs = await this.repository.findJobsByEntryId(data.entryId);
        const ctx = await this.buildContextFromEntry(data.entryId);

        const basePayload = {
            pipeline: data.pipeline,
            userId: data.userId,
            entryId: data.entryId
        };

        for (const [key, step] of Object.entries(pipeline) as [EntryJobName, PipelineStep][]) {
            const requires = step.requires(ctx);

            if (!requires.includes(finishedKey)) {
                continue;
            }

            if (step.when && !step.when(ctx)) {
                continue;
            }

            if (this.hasActiveJob(jobs, step.type)) {
                continue;
            }

            const allRequirementsDone = requires.every((requiredKey) => {
                const requiredType = this.jobMap.get(requiredKey);

                if (!requiredType) {
                    return false;
                }

                return jobs.some((job) => job.type === requiredType && job.status === EntryProcessingStatus.Done);
            });

            if (!allRequirementsDone) {
                continue;
            }

            const nextPayload = this.buildNextJobPayload(finishedKey, key, data, basePayload);

            await this.createJob(data.entryId, key, nextPayload as Omit<DelayedJobPayloads[typeof key], 'jobId'>, {
                ignoreDuplicate: true
            });
        }

        await this.tryMarkEntryReady(data.entryId, data.pipeline, ctx);
    }

    private buildNextJobPayload(
        finishedKey: EntryJobName,
        nextKey: EntryJobName,
        finishedData: baseEntryJobPayload,
        basePayload: Omit<baseEntryJobPayload, 'jobId'>
    ): Omit<DelayedJobPayloads[EntryJobName], 'jobId'> {
        if (
            finishedKey === DelayedJob.EntryVision &&
            nextKey === DelayedJob.EntryEmbedImage &&
            'entryMediaIds' in finishedData &&
            Array.isArray(finishedData.entryMediaIds) &&
            finishedData.entryMediaIds.length > 0
        ) {
            return {
                ...basePayload,
                entryMediaIds: finishedData.entryMediaIds
            } as Omit<DelayedJobPayloads[typeof DelayedJob.EntryEmbedImage], 'jobId'>;
        }

        return basePayload as Omit<DelayedJobPayloads[EntryJobName], 'jobId'>;
    }

    private async createJob<K extends EntryJobName>(
        entryId: string,
        key: K,
        data: Omit<DelayedJobPayloads[K], 'jobId'>,
        options?: CreateJobOptions
    ) {
        const type = this.jobMap.get(key);

        if (!type) {
            this.logger.fatal(`Ошибка при обработке, не найден тип ${key}`);
            throw apiError.internal('entry.invalid_job_type');
        }

        const activeJob = await this.repository.findActiveJob(entryId, type);
        if (activeJob) {
            if (options?.ignoreDuplicate) {
                return;
            }

            this.logger.fatal(`Ошибка при обработке, активный job ${key}`);
            throw apiError.internal('entry.duplicate_job');
        }

        const job = await this.repository.createJob(entryId, type, data.userId).catch((e) => {
            if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
                if (options?.ignoreDuplicate) {
                    return null;
                }

                this.logger.fatal(`Ошибка при обработке, дубликат ${key}`);
                throw apiError.internal('entry.duplicate_job');
            }

            throw apiError.internal('common.unknown');
        });

        if (!job) {
            return;
        }

        this.logger.log(`creating job ${key} for entry`);

        await this.delayedWorker.delayed(
            key,
            {
                ...data,
                jobId: job.id
            } as DelayedJobPayloads[K],
            { queue: BullMqQueue.Entry },
            { attempts: 1 }
        );
    }

    private async tryMarkEntryReady(entryId: string, pipelineName: EntryPipelinesEnum, ctx: PipelineContext) {
        const pipeline = EntryPipelines[pipelineName];
        const jobs = await this.repository.findJobsByEntryId(entryId);

        if (!this.isPipelineComplete(pipeline, ctx, jobs)) {
            return;
        }

        await this.repository.markEntryReady(entryId);
    }

    private isPipelineComplete(
        pipeline: (typeof EntryPipelines)[EntryPipelinesEnum],
        ctx: PipelineContext,
        jobs: Array<{ type: EntryProcessingType; status: EntryProcessingStatus }>
    ): boolean {
        const hasActive = jobs.some(
            (job) => job.status === EntryProcessingStatus.Pending || job.status === EntryProcessingStatus.Running
        );

        if (hasActive) {
            return false;
        }

        const expectedTypes = (Object.values(pipeline) as PipelineStep[])
            .filter((step) => !step.when || step.when(ctx))
            .map((step) => step.type);

        return expectedTypes.every((type) =>
            jobs.some((job) => job.type === type && job.status === EntryProcessingStatus.Done)
        );
    }

    private async buildContextFromEntry(entryId: string): Promise<PipelineContext> {
        const entry = await this.repository.findEntryContext(entryId);

        if (!entry) {
            throw apiError.notFound('entry.not_found');
        }

        return {
            hasCoords: entry.jobs.some((job) => job.type === EntryProcessingType.LocationConnect),
            hasVoice: entry.voice != null,
            hasText: Boolean(entry.text?.trim()),
            hasMedia: entry._count.media > 0,
            hasVideoInMedia: entry.hasVideo
        };
    }

    private hasActiveJob(
        jobs: Array<{ type: EntryProcessingType; status: EntryProcessingStatus }>,
        type: EntryProcessingType
    ) {
        return jobs.some(
            (job) =>
                job.type === type &&
                (job.status === EntryProcessingStatus.Pending || job.status === EntryProcessingStatus.Running)
        );
    }
}
