import { Inject, Injectable, Logger } from '@nestjs/common';
import { EntryProcessingStatus, EntryProcessingType, Prisma } from '@prisma/client';
import type Redis from 'ioredis';

import { appConstants } from '../../common/config/app.constants';
import { apiError } from '../../common/helpers/errors';
import { EntryPipelines, EntryPipelinesEnum } from '../../common/pipelines';
import type { PipelineContext, PipelineStep } from '../../common/pipelines/types';
import { BullMqQueue } from '../bullmq/bullmq.constants';
import { type DelayedJobPayloads, type EntryJobName } from '../delayed-worker/delayed-worker.constants';
import { DelayedWorkerService } from '../delayed-worker/delayed-worker.service';
import { REDIS_CLIENT } from '../redis/redis.constants';
import { EntryProcessingRepository } from './entry-processing.repository';

export type PipelineJobPayloads = {
    [K in EntryJobName]?: Omit<DelayedJobPayloads[K], 'jobId'>;
};

type CreateJobOptions = {
    ignoreDuplicate?: boolean;
};

@Injectable()
export class EntryProcessingService {
    constructor(
        private readonly repository: EntryProcessingRepository,
        private readonly delayedWorker: DelayedWorkerService,
        @Inject(REDIS_CLIENT) private readonly redis: Redis
    ) {}

    private logger: Logger = new Logger(EntryProcessingService.name);

    private jobMap = new Map<EntryJobName, EntryProcessingType>(
        Object.values(EntryPipelines).flatMap((pipeline) =>
            (Object.entries(pipeline) as [EntryJobName, PipelineStep][]).map(([key, step]) => [key, step.type])
        )
    );

    async activatePipeline(pipelineName: EntryPipelinesEnum, ctx: PipelineContext, payloads: PipelineJobPayloads) {
        const pipeline = EntryPipelines[pipelineName];

        const tasks = (Object.entries(pipeline) as [EntryJobName, PipelineStep][]).filter(([key, step]) => {
            if (step.requires(ctx).length > 0) {
                return false;
            }

            if (step.when && !step.when(ctx)) {
                return false;
            }

            return payloads[key] != null;
        });

        await Promise.all(
            tasks.map(async ([key]) => {
                const data = payloads[key]!;

                await this.createJob(data.entryId, key, data as Omit<DelayedJobPayloads[typeof key], 'jobId'>);
            })
        );

        const entryId = Object.values(payloads).find((payload) => payload != null)?.entryId;
        if (entryId) {
            await this.tryMarkEntryReady(entryId, pipelineName, ctx);
        }
    }

    async markJobCancelled(jobId: string) {
        await this.repository.updateJobStatus(jobId, EntryProcessingStatus.Cancelled);
        await this.redis.publish(appConstants.entryProcessing.jobCancel.channel(jobId), '1');
    }

    async cancelActiveJob(entryId: string, type: EntryProcessingType) {
        const job = await this.repository.findActiveJob(entryId, type);

        if (job) {
            await this.markJobCancelled(job.id);
        }
    }

    async createJob<K extends EntryJobName>(
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

        const job = await this.repository.createJob(entryId, type).catch((e) => {
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
}
