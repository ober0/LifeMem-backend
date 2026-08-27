import { Injectable, Logger } from '@nestjs/common';
import { EntryProcessingStatus, EntryProcessingType, Prisma } from '@prisma/client';

import { apiError } from '../../common/helpers/errors';
import {
    type baseEntryJobPayload,
    type DelayedJobName,
    type DelayedJobPayloads
} from '../delayed-worker/delayed-worker.constants';
import { DelayedWorkerService } from '../delayed-worker/delayed-worker.service';
import { EntryProcessingRepository } from './entry-processing.repository';
import { EntryPipelines, EntryPipelinesEnum } from './pipelines';
import type { PipelineContext, PipelineStep } from './pipelines/types';

export type PipelineJobPayloads = {
    [K in DelayedJobName]?: Omit<DelayedJobPayloads[K], 'jobId'>;
};

type CreateJobOptions = {
    ignoreDuplicate?: boolean;
};

@Injectable()
export class EntryProcessingService {
    constructor(
        private readonly repository: EntryProcessingRepository,
        private readonly delayedWorker: DelayedWorkerService
    ) {}

    private logger: Logger = new Logger(EntryProcessingService.name);

    private jobMap = new Map<DelayedJobName, EntryProcessingType>(
        Object.values(EntryPipelines).flatMap((pipeline) =>
            (Object.entries(pipeline) as [DelayedJobName, PipelineStep][]).map(([key, step]) => [key, step.type])
        )
    );

    async activatePipeline(pipelineName: EntryPipelinesEnum, ctx: PipelineContext, payloads: PipelineJobPayloads) {
        const pipeline = EntryPipelines[pipelineName];

        const tasks = (Object.entries(pipeline) as [DelayedJobName, PipelineStep][]).filter(([key, step]) => {
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
    }

    async markJobRunning(jobId: string) {
        await this.repository.updateJobStatus(jobId, EntryProcessingStatus.Running);
    }

    async markJobFailed(jobId: string, errorMessage: string) {
        await this.repository.updateJobStatus(jobId, EntryProcessingStatus.Failed, errorMessage);
    }

    async onJobFinished(finishedKey: DelayedJobName, data: baseEntryJobPayload) {
        await this.repository.updateJobStatus(data.jobId, EntryProcessingStatus.Done);

        const pipeline = EntryPipelines[data.pipeline];
        const jobs = await this.repository.findJobsByEntryId(data.entryId);
        const ctx = await this.buildContextFromEntry(data.entryId);

        const basePayload = {
            pipeline: data.pipeline,
            userId: data.userId,
            entryId: data.entryId
        };

        for (const [key, step] of Object.entries(pipeline) as [DelayedJobName, PipelineStep][]) {
            const requires = step.requires(ctx);

            if (!requires.includes(finishedKey)) {
                continue;
            }

            if (step.when && !step.when(ctx)) {
                continue;
            }

            if (jobs.some((job) => job.type === step.type)) {
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

            await this.createJob(data.entryId, key, basePayload as Omit<DelayedJobPayloads[typeof key], 'jobId'>, {
                ignoreDuplicate: true
            });
        }
    }

    async createJob<K extends DelayedJobName>(
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
            { queue: 'entry' }
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
            hasImage: entry._count.images > 0
        };
    }
}
